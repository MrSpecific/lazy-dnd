'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { Box, Button, Flex, Heading, Text } from '@radix-ui/themes';
import { Shield } from 'lucide-react';
import { ArmorTable, type ArmorRow } from '@/components/character/ArmorTable';
import { ArmorPickerDialog } from '@/components/character/ArmorPickerDialog';
import { ArmorForm } from '@/components/character/ArmorForm';
import {
  addExistingArmor,
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
  const [editing, setEditing] = useState(initialArmor.length === 0);
  const [state, attachAction, pending] = useActionState<AddArmorState, FormData>(addExistingArmor, {
    status: 'idle',
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

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

  return (
    <Box mt="4">
      <Flex justify="between" align="center" mb="2">
        <Flex align="center" gap="1">
          <Shield />
          <Heading size="6">Armor</Heading>
        </Flex>
        {!editing && (
          <Button variant="surface" size="2" onClick={() => setPickerOpen(true)}>
            Pick Armor
          </Button>
        )}
      </Flex>

      <ArmorTable armor={armorSorted} />

      {editing && (
        <Box mt="3">
          <Heading size="3" mb="2">
            Add armor
          </Heading>
          <ArmorForm
            characterId={characterId}
            pending={pending}
            onSubmit={(itemId, slot) => {
              const fd = new FormData();
              fd.append('characterId', characterId);
              fd.append('itemId', itemId);
              if (slot) fd.append('slot', slot);
              attachAction(fd);
            }}
          />
          {state.status === 'error' && (
            <Text color="red" size="2" mt="2">
              {localError ?? state.message}
            </Text>
          )}
          <Button variant="ghost" mt="2" onClick={() => setEditing(false)}>
            Close
          </Button>
        </Box>
      )}

      <ArmorPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        catalog={catalog}
        pending={pending}
        error={localError}
        onAttach={(itemId, slot) => {
          const fd = new FormData();
          fd.append('characterId', characterId);
          fd.append('itemId', itemId);
          if (slot) fd.append('slot', slot);
          attachAction(fd);
        }}
      />
    </Box>
  );
};
