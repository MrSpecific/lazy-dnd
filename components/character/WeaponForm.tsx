'use client';

import { EquipmentSlot } from '@prisma/client';
import { Button, Dialog, Flex, Select, Text, TextField } from '@radix-ui/themes';
import { useState } from 'react';

type WeaponFormProps = {
  pending?: boolean;
  action?: FormAction;
  characterId?: string;
};

const SLOTS: { value: EquipmentSlot; label: string }[] = [
  { value: 'MAIN_HAND', label: 'Main hand' },
  { value: 'OFF_HAND', label: 'Off hand' },
  { value: 'TWO_HANDED', label: 'Two handed' },
];

export const WeaponForm = ({ pending = false, action, characterId }: WeaponFormProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button type="button" variant="surface">
          Add weapon
        </Button>
      </Dialog.Trigger>
      <Dialog.Content maxWidth="720px">
        <Dialog.Title>Add a weapon</Dialog.Title>
        <Dialog.Description size="2" mb="3">
          Enter details for a weapon to add it to your character.
        </Dialog.Description>

        <form action={action}>
          {characterId && <input type="hidden" name="characterId" value={characterId} />}
          <Flex gap="2" wrap="wrap" align="center">
            <TextField.Root name="name" placeholder="Weapon name" required />
            <TextField.Root name="damage" placeholder="Damage (e.g. 1d8 slashing)" />
            <TextField.Root name="properties" placeholder="Properties (e.g. finesse, light)" />
            <TextField.Root name="weight" placeholder="Weight (lbs)" inputMode="decimal" />
            <Select.Root name="slot" defaultValue="MAIN_HAND">
              <Select.Trigger />
              <Select.Content>
                {SLOTS.map((slot) => (
                  <Select.Item key={slot.value} value={slot.value}>
                    {slot.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>
          <Flex gap="2" mt="3" justify="end">
            <Dialog.Close>
              <Button type="button" variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Dialog.Close>
              <Button type="submit" disabled={pending}>
                {pending ? 'Adding…' : 'Add weapon'}
              </Button>
            </Dialog.Close>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
};
