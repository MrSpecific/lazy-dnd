'use client';

import { useEffect, useState } from 'react';
import { Form } from 'radix-ui';
import { Flex, Select } from '@radix-ui/themes';
import { Alignment } from '@prisma/client';
import { InputLabel } from '@/components/form/InputLabel';
import { alignmentMeta } from '@/lib/helpers/alignment';
import { RandomButton } from '@/components/common/RandomButton';

type AlignmentSelectProps = {
  name?: string;
  label?: string;
  size?: RadixInputSize;
  value?: Alignment | '';
  defaultValue?: Alignment | '';
  required?: boolean;
  onValueChange?: (value: Alignment) => void;
};

const alignmentOptions = Object.entries(alignmentMeta).map(([value, info]) => ({
  value: value as Alignment,
  label: info.label,
}));

export const AlignmentSelect = ({
  name = 'alignment',
  label = 'Alignment',
  size = '3',
  value,
  defaultValue,
  required = false,
  onValueChange,
}: AlignmentSelectProps) => {
  const [selected, setSelected] = useState<string>(value ?? defaultValue ?? '');

  useEffect(() => {
    if (value !== undefined) {
      setSelected(value ?? '');
    }
  }, [value]);

  const handleValueChange = (nextValue: string) => {
    setSelected(nextValue);
    if (nextValue) {
      onValueChange?.(nextValue as Alignment);
    }
  };

  const selectRandom = () => {
    const random = alignmentOptions[Math.floor(Math.random() * alignmentOptions.length)];
    handleValueChange(random.value);
  };

  return (
    <Form.Field name={name} style={{ width: '100%', flexGrow: 1 }}>
      <InputLabel label={label} htmlFor={name} required={required} />

      <Flex gap="2" align="center" mt="1" width="100%">
        <Select.Root
          name={name}
          value={selected || undefined}
          onValueChange={handleValueChange}
          size={size}
        >
          <Select.Trigger placeholder="Select alignment (optional)" style={{ flexGrow: 1 }} />
          <Select.Content>
            {alignmentOptions.map((option) => (
              <Select.Item key={option.value} value={option.value}>
                {option.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>

        <RandomButton onClick={selectRandom} size={size} />
      </Flex>
    </Form.Field>
  );
};
