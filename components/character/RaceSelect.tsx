'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Flex, Select, Text } from '@radix-ui/themes';
import { Form } from 'radix-ui';
import { InputLabel } from '@/components/form/InputLabel';
import { getRaces, type GetRacesReturn } from '@/data/character/getRaces';

type RaceSelectProps = {
  name?: string;
  label?: string;
  size?: RadixInputSize;
  value?: string;
  defaultValue?: string;
  required?: boolean;
  onValueChange?: (value: string) => void;
};

export const RaceSelect = ({
  name = 'race',
  label = 'Race',
  size = '3',
  value,
  defaultValue,
  required = false,
  onValueChange,
}: RaceSelectProps) => {
  const [races, setRaces] = useState<GetRacesReturn>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string>(value ?? defaultValue ?? '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchRaces = async () => {
      try {
        setLoading(true);
        const payload = await getRaces();
        if (!cancelled) {
          setRaces(payload ?? []);
        }
      } catch (fetchError) {
        console.error(fetchError);
        if (!cancelled) {
          setError('Unable to load races.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchRaces();

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
    if (selected && !races.find((item) => item.id === selected)) {
      return [...races, { id: selected, name: selected, description: null }];
    }

    return races;
  }, [races, selected]);

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
    <Form.Field name={name}>
      <InputLabel label={label} htmlFor={name} required={required} />

      <Flex gap="2" align="center" mt="1">
        <Select.Root
          name={name}
          value={selected || undefined}
          onValueChange={handleValueChange}
          size={size}
          disabled={loading || !!error}
        >
          <Select.Trigger
            placeholder={loading ? 'Loading races…' : 'Select a race'}
            style={{ flexGrow: 1 }}
          />
          <Select.Content>
            {options.map((race) => (
              <Select.Item key={race.id} value={race.id} textValue={race.name}>
                {race.name}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>

        <Button
          type="button"
          variant="surface"
          onClick={selectRandom}
          disabled={!options.length || loading}
          size={size}
        >
          Random
        </Button>
      </Flex>

      {error && (
        <Text color="red" size="1" mt="1">
          {error}
        </Text>
      )}
    </Form.Field>
  );
};
