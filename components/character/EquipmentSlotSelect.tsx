'use client';

import { useMemo } from 'react';
import { EquipmentSlot } from '@prisma/client';
import { Select, Box } from '@radix-ui/themes';
import { armorSlotOptions, slotOptions, weaponSlotOptions } from '@/lib/helpers/equipmentSlots';
import { FormField } from '@/components/form';
import { InputLabel } from '@/components/form/InputLabel';

type EquipmentSlotSelectProps = {
  name?: string;
  label?: string;
  value?: EquipmentSlot | null;
  defaultValue?: EquipmentSlot | null;
  onValueChange?: (value: EquipmentSlot) => void;
  size?: RadixInputSize;
  slotType?: 'all' | 'weapons' | 'armor';
  required?: boolean;
};

export const EquipmentSlotSelect = ({
  name = 'slot',
  label = 'Equipment Slot',
  value,
  defaultValue,
  onValueChange,
  size = '2',
  slotType = 'all',
  required = false,
}: EquipmentSlotSelectProps) => {
  const options = useMemo(() => {
    if (slotType === 'weapons') return weaponSlotOptions;
    if (slotType === 'armor') return armorSlotOptions;
    return slotOptions;
  }, [slotType]);

  return (
    <FormField name={name}>
      <Box>
        <InputLabel label={label} htmlFor={name} required={required} />
      </Box>
      <Select.Root
        name={name}
        value={value ?? undefined}
        defaultValue={defaultValue ?? undefined}
        onValueChange={(val) => onValueChange?.(val as EquipmentSlot)}
        size={size}
      >
        <Select.Trigger placeholder="Select slot" style={{ width: '100%' }} />
        <Select.Content>
          {options.map((option) => (
            <Select.Item key={option.value} value={option.value}>
              {option.label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </FormField>
  );
};
