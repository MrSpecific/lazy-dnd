'use client';

import { useActionState, useEffect, useMemo, useState, useTransition } from 'react';
import { Box, Button, Flex, Heading, Text } from '@radix-ui/themes';
import { Shield } from 'lucide-react';
import { ArmorTable, type ArmorRow } from '@/components/character/ArmorTable';
import { ArmorPickerDialog } from '@/components/character/ArmorPickerDialog';
import { ArmorEditDialog } from '@/components/character/ArmorEditDialog';
import {
  addExistingArmor,
  removeArmor,
  type AddArmorState,
  type ArmorCatalogItem,
} from '@/data/character/armor';

type ArmorSectionProps = {
  characterId: string;
  initialArmor: ArmorRow[];
  catalog: ArmorCatalogItem[];
};

export const ArmorSection = ({ characterId, initialArmor, catalog }: ArmorSectionProps) => {
  const [armor, setArmor] = useState<ArmorRow[]>(initialArmor);
  const [state, attachAction, pending] = useActionState<AddArmorState, FormData>(addExistingArmor, {
    status: 'idle',
  });
  const [attachTransitionPending, startAttachTransition] = useTransition();
  const [removeTransitionPending, startRemoveTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [editArmor, setEditArmor] = useState<ArmorRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (state.status === 'success' && state.armor) {
      setArmor((prev) => [...prev, state.armor]);
      setPickerOpen(false);
      setLocalError(null);
    } else if (state.status === 'error') {
      setLocalError(state.message);
    }
  }, [state]);

  const armorSorted = useMemo(
    () => [...armor].sort((a, b) => a.name.localeCompare(b.name)),
    [armor]
  );

  const handleRemove = async (armorId: string) => {
    setBusyId(armorId);
    try {
      const result = await removeArmor({ characterId, armorId });
      if (result.status === 'error') {
        setLocalError(result.message);
      } else {
        setLocalError(null);
        setArmor((prev) => prev.filter((item) => item.id !== armorId));
      }
    } catch (error) {
      console.error(error);
      setLocalError('Failed to remove armor.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Box mt="4">
      <Flex justify="between" align="center" mb="2">
        <Flex align="center" gap="1">
          <Shield />
          <Heading size="6">Armor</Heading>
        </Flex>

        <Button variant="surface" size="2" onClick={() => setPickerOpen(true)}>
          Pick Armor
        </Button>
      </Flex>

      <ArmorTable
        armor={armorSorted}
        onEdit={(id) => {
          const found = armor.find((item) => item.id === id) ?? null;
          setEditArmor(found);
        }}
        onRemove={(id) => {
          startRemoveTransition(() => {
            void handleRemove(id);
          });
        }}
        disableActions={pending || attachTransitionPending || removeTransitionPending || !!busyId}
      />

      <ArmorEditDialog
        open={!!editArmor}
        onOpenChange={(isOpen) => {
          if (!isOpen) setEditArmor(null);
        }}
        armor={editArmor}
        onUpdated={(updated) => {
          setArmor((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        }}
      />

      <ArmorPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        catalog={catalog}
        pending={pending || attachTransitionPending || removeTransitionPending}
        error={localError}
        onAttach={(itemId, slot) => {
          const fd = new FormData();
          fd.append('characterId', characterId);
          fd.append('itemId', itemId);
          if (slot) fd.append('slot', slot);
          startAttachTransition(() => attachAction(fd));
        }}
      />
    </Box>
  );
};
