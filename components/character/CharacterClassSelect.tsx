'use client';

import { useEffect, useMemo, useState } from 'react';
import { Flex, Select, Text } from '@radix-ui/themes';
import { Form } from 'radix-ui';
import { InputLabel } from '@/components/form/InputLabel';
import {
  getCharacterClasses,
  type GetCharacterClassesReturn,
} from '@/data/character/getCharacterClasses';
import { RandomButton } from '@/components/common/RandomButton';

type CharacterClassSelectProps = {
  name?: string;
  label?: string;
  size?: RadixInputSize;
  value?: string;
  defaultValue?: string;
  required?: boolean;
  onValueChange?: (value: string) => void;
};

export const CharacterClassSelect = ({
  name = 'class',
  label = 'Class',
  size = '3',
  value,
  defaultValue,
  required = false,
  onValueChange,
}: CharacterClassSelectProps) => {
  const [classes, setClasses] = useState<GetCharacterClassesReturn>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string>(value ?? defaultValue ?? '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchClasses = async () => {
      try {
        setLoading(true);
        const payload = await getCharacterClasses();
        if (!cancelled) {
          setClasses(payload ?? []);
        }
      } catch (fetchError) {
        console.error(fetchError);
        if (!cancelled) {
          setError('Unable to load character classes.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchClasses();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (value !== undefined) {
      setSelected(value);
    }
  }, [value]);

  const options = useMemo(() => {
    if (selected && !classes.find((item) => item.id === selected)) {
      return [...classes, { id: selected, name: selected, description: null }];
    }

    return classes;
  }, [classes, selected]);

  const handleValueChange = (nextValue: string) => {
    setSelected(nextValue);
    onValueChange?.(nextValue);
  };

  const selectRandom = () => {
    if (!options.length) return;
    const random = options[Math.floor(Math.random() * options.length)];
    handleValueChange(random.id);
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
          disabled={loading || !!error}
        >
          <Select.Trigger
            placeholder={loading ? 'Loading classes…' : 'Select a class'}
            style={{ flexGrow: 1 }}
          />
          <Select.Content>
            {options.map((characterClass) => (
              <Select.Item
                key={characterClass.id}
                value={characterClass.id}
                textValue={characterClass.name}
              >
                {characterClass.name}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>

        <RandomButton onClick={selectRandom} disabled={!options.length || loading} size={size} />
      </Flex>

      {error && (
        <Text color="red" size="1" mt="1">
          {error}
        </Text>
      )}
    </Form.Field>
  );
};
