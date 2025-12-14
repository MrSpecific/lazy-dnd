'use client';

import { useEffect, useState } from 'react';
import { Form } from 'radix-ui';
import { Flex, Select } from '@radix-ui/themes';
import { Gender } from '@prisma/client';
import { InputLabel } from '@/components/form/InputLabel';
import { RandomButton } from '@/components/common/RandomButton';

type GenderSelectProps = {
  name?: string;
  label?: string;
  size?: RadixInputSize;
  value?: Gender | '';
  defaultValue?: Gender | '';
  required?: boolean;
  onValueChange?: (value: Gender) => void;
};

const genderOptions: { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'NON_BINARY', label: 'Non-binary' },
  { value: 'OTHER', label: 'Other' },
];

export const GenderSelect = ({
  name = 'gender',
  label = 'Gender',
  size = '3',
  value,
  defaultValue,
  required = false,
  onValueChange,
}: GenderSelectProps) => {
  const [selected, setSelected] = useState<string>(value ?? defaultValue ?? '');

  useEffect(() => {
    if (value !== undefined) {
      setSelected(value ?? '');
    }
  }, [value]);

  const handleValueChange = (nextValue: string) => {
    setSelected(nextValue);
    if (nextValue) {
      onValueChange?.(nextValue as Gender);
    }
  };

  const selectRandom = () => {
    const random = genderOptions[Math.floor(Math.random() * genderOptions.length)];
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
          <Select.Trigger placeholder="Select gender (optional)" style={{ flexGrow: 1 }} />
          <Select.Content>
            {genderOptions.map((option) => (
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
