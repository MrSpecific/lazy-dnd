'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { Box, Button, Flex, Heading, Text } from '@radix-ui/themes';
import { WeaponForm } from '@/components/character/WeaponForm';
import { WeaponTable, type WeaponRow } from '@/components/character/WeaponTable';
import { WeaponPickerDialog } from '@/components/character/WeaponPickerDialog';
import { addExistingWeapon, addWeapon, type AddWeaponState, type WeaponCatalogItem } from '@/data/character/weapons';

type WeaponSectionProps = {
  characterId: string;
  initialWeapons: WeaponRow[];
  catalog: WeaponCatalogItem[];
};

export const WeaponSection = ({ characterId, initialWeapons, catalog }: WeaponSectionProps) => {
  const [weapons, setWeapons] = useState<WeaponRow[]>(initialWeapons);
  const [editing, setEditing] = useState(initialWeapons.length === 0);
  const [state, formAction, pending] = useActionState<AddWeaponState, FormData>(addWeapon, { status: 'idle' });
  const [attachState, attachAction, attachPending] = useActionState<AddWeaponState, FormData>(addExistingWeapon, {
    status: 'idle',
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

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

  const weaponsSorted = useMemo(() => [...weapons].sort((a, b) => a.name.localeCompare(b.name)), [weapons]);

  return (
    <Box mt="4">
      <Flex justify="between" align="center" mb="2">
        <Heading size="4">Weapons</Heading>
        {!editing && (
          <Flex gap="2">
            <Button variant="surface" size="2" onClick={() => setPickerOpen(true)}>
              Pick weapon
            </Button>
            <Button variant="surface" size="2" onClick={() => setEditing(true)}>
              Add weapon
            </Button>
          </Flex>
        )}
      </Flex>

      <WeaponTable weapons={weaponsSorted} onEdit={() => setEditing(true)} />

      {editing && (
        <Box mt="3">
          <Heading size="3" mb="2">
            Add a weapon
          </Heading>
          <WeaponForm pending={pending} action={formAction} characterId={characterId} />
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

      <WeaponPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        catalog={catalog}
        pending={attachPending}
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
