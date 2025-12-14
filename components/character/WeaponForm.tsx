'use client';

import { EquipmentSlot } from '@prisma/client';
import { Button, Flex, Select, TextField } from '@radix-ui/themes';

type WeaponFormProps = {
  pending?: boolean;
};

const SLOTS: { value: EquipmentSlot; label: string }[] = [
  { value: 'MAIN_HAND', label: 'Main hand' },
  { value: 'OFF_HAND', label: 'Off hand' },
  { value: 'TWO_HANDED', label: 'Two handed' },
];

export const WeaponForm = ({ pending = false }: WeaponFormProps) => {
  return (
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
      <Button type="submit" disabled={pending}>
        {pending ? 'Adding…' : 'Add weapon'}
      </Button>
    </Flex>
  );
};
