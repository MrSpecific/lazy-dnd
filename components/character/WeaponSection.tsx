'use client';

import { useActionState, useEffect, useMemo, useState, useTransition } from 'react';
import { Box, Button, Flex, Heading, Text } from '@radix-ui/themes';
import { BowArrow } from 'lucide-react';
import { WeaponForm } from '@/components/character/WeaponForm';
import { WeaponTable, type WeaponRow } from '@/components/character/WeaponTable';
import { WeaponPickerDialog } from '@/components/character/WeaponPickerDialog';
import {
  addExistingWeapon,
  addWeapon,
  removeWeapon,
  type AddWeaponState,
  type WeaponCatalogItem,
} from '@/data/character/weapons';
import { WeaponEditDialog } from '@/components/character/WeaponEditDialog';

type WeaponSectionProps = {
  characterId: string;
  initialWeapons: WeaponRow[];
  catalog: WeaponCatalogItem[];
};

export const WeaponSection = ({ characterId, initialWeapons, catalog }: WeaponSectionProps) => {
  const [weapons, setWeapons] = useState<WeaponRow[]>(initialWeapons);
  const [editing, setEditing] = useState(initialWeapons.length === 0);
  const [state, formAction, pending] = useActionState<AddWeaponState, FormData>(addWeapon, {
    status: 'idle',
  });
  const [attachState, attachAction, attachPending] = useActionState<AddWeaponState, FormData>(
    addExistingWeapon,
    {
      status: 'idle',
    }
  );
  const [attachTransitionPending, startAttachTransition] = useTransition();
  const [removeTransitionPending, startRemoveTransition] = useTransition();
  const [localError, setLocalError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [editWeapon, setEditWeapon] = useState<WeaponRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (state.status === 'success' && state.weapon) {
      setWeapons((prev) => [...prev, state.weapon]);
      setEditing(false);
      setLocalError(null);
    } else if (state.status === 'error') {
      setLocalError(state.message);
    }
  }, [state]);

  useEffect(() => {
    if (attachState.status === 'success' && attachState.weapon) {
      setWeapons((prev) => [...prev, attachState.weapon]);
      setPickerOpen(false);
      setLocalError(null);
    } else if (attachState.status === 'error') {
      setLocalError(attachState.message);
    }
  }, [attachState]);

  const weaponsSorted = useMemo(
    () => [...weapons].sort((a, b) => a.name.localeCompare(b.name)),
    [weapons]
  );

  const handleRemove = async (weaponId: string) => {
    setBusyId(weaponId);
    try {
      const result = await removeWeapon({ characterId, weaponId });
      if (result.status === 'error') {
        setLocalError(result.message);
      } else {
        setLocalError(null);
        setWeapons((prev) => prev.filter((w) => w.id !== weaponId));
      }
    } catch (error) {
      console.error(error);
      setLocalError('Failed to remove weapon.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Box mt="4">
      <Flex justify="between" align="center" mb="2">
        <Flex gap="1" align="center">
          <BowArrow size="1.3em" />
          <Heading size="6">Weapons</Heading>
        </Flex>

        <Flex gap="2">
          <Button variant="surface" size="2" onClick={() => setPickerOpen(true)}>
            From Catalog
          </Button>
          <Button variant="surface" size="2" onClick={() => setAddFormOpen(true)}>
            New Weapon
          </Button>
        </Flex>
      </Flex>

      <WeaponTable
        weapons={weaponsSorted}
        onEdit={(id) => {
          const found = weapons.find((w) => w.id === id) ?? null;
          setEditWeapon(found);
        }}
        onRemove={(id) => {
          startRemoveTransition(() => {
            void handleRemove(id);
          });
        }}
        disableActions={
          pending ||
          attachPending ||
          attachTransitionPending ||
          removeTransitionPending ||
          !!busyId
        }
      />

      <WeaponForm
        open={addFormOpen}
        onOpenChange={setAddFormOpen}
        pending={pending}
        action={formAction}
        characterId={characterId}
      />

      <WeaponEditDialog
        open={!!editWeapon}
        onOpenChange={(isOpen) => {
          if (!isOpen) setEditWeapon(null);
        }}
        weapon={editWeapon}
        onUpdated={(weapon) => {
          setWeapons((prev) => prev.map((w) => (w.id === weapon.id ? weapon : w)));
        }}
      />

      <WeaponPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        catalog={catalog}
        pending={attachPending || attachTransitionPending || removeTransitionPending}
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
