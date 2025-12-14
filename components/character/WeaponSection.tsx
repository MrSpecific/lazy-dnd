'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { Box, Button, Flex, Heading, Text } from '@radix-ui/themes';
import { WeaponForm } from '@/components/character/WeaponForm';
import { WeaponTable, type WeaponRow } from '@/components/character/WeaponTable';
import { addWeapon, type AddWeaponState } from '@/data/character/weapons';

type WeaponSectionProps = {
  characterId: string;
  initialWeapons: WeaponRow[];
};

export const WeaponSection = ({ characterId, initialWeapons }: WeaponSectionProps) => {
  const [weapons, setWeapons] = useState<WeaponRow[]>(initialWeapons);
  const [editing, setEditing] = useState(initialWeapons.length === 0);
  const [state, formAction, pending] = useActionState<AddWeaponState, FormData>(addWeapon, { status: 'idle' });
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (state.status === 'success' && state.weapon) {
      setWeapons((prev) => [...prev, state.weapon]);
      setEditing(false);
      setLocalError(null);
    } else if (state.status === 'error') {
      setLocalError(state.message);
    }
  }, [state]);

  const weaponsSorted = useMemo(() => [...weapons].sort((a, b) => a.name.localeCompare(b.name)), [weapons]);

  return (
    <Box mt="4">
      <Flex justify="between" align="center" mb="2">
        <Heading size="4">Weapons</Heading>
        {!editing && (
          <Button variant="surface" size="2" onClick={() => setEditing(true)}>
            Add weapon
          </Button>
        )}
      </Flex>

      <WeaponTable weapons={weaponsSorted} onEdit={() => setEditing(true)} />

      {editing && (
        <Box mt="3">
          <Heading size="3" mb="2">
            Add a weapon
          </Heading>
          <form action={formAction}>
            <input type="hidden" name="characterId" value={characterId} />
            <WeaponForm pending={pending} />
          </form>
          {state.status === 'error' && (
            <Text color="red" size="2" mt="2">
              {localError ?? state.message}
            </Text>
          )}
          <Button variant="ghost" mt="2" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </Box>
      )}
    </Box>
  );
};
