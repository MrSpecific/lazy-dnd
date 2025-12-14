'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Button, Flex, Text, TextField } from '@radix-ui/themes';
import { Form } from 'radix-ui';
import { InputLabel } from '@/components/form/InputLabel';

export type Hints = { hint: string; value: string }[];

export const CharacterNameInput = ({
  name = 'name',
  value,
  label = 'Name',
  size,
  hints,
  onValueChange,
}: {
  name?: string;
  value?: string;
  label?: string;
  size?: RadixInputSize;
  hints?: Hints;
  onValueChange?: (value: string) => void;
}) => {
  const [currentValue, setCurrentValue] = useState(value ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startGenerate] = useTransition();

  useEffect(() => {
    if (value !== undefined) {
      setCurrentValue(value);
    }
  }, [value]);

  const handleChange = (next: string) => {
    setCurrentValue(next);
    onValueChange?.(next);
  };

  const handleGenerate = () => {
    startGenerate(async () => {
      try {
        setError(null);
        const generated = await getCharacterName(hints);
        if (generated) {
          handleChange(generated);
        }
      } catch (generationError) {
        console.error(generationError);
        setError('Unable to generate a name right now.');
      }
    });
  };

  const hasHints = useMemo(() => !!hints && hints.length > 0, [hints]);

  return (
    <Form.Field name={name}>
      <InputLabel label={label} />

      <Flex gap="2" align="center" mt="1">
        <TextField.Root
          name={name}
          size={size}
          value={currentValue}
          onChange={(event) => handleChange(event.target.value)}
          placeholder="Enter a name or generate one"
          disabled={isGenerating}
          style={{ flexGrow: 1 }}
        />
        <Button
          type="button"
          variant="surface"
          onClick={handleGenerate}
          disabled={isGenerating}
          size={size}
        >
          {isGenerating ? 'Generating…' : 'Suggest'}
        </Button>
      </Flex>

      {hasHints && (
        <Text size="1" color="gray" mt="1">
          Uses class/race hints for suggestions.
        </Text>
      )}

      {error && (
        <Text color="red" size="1" mt="1">
          {error}
        </Text>
      )}
    </Form.Field>
  );
};

const CHARACTER_NAME_ENDPOINT = '/api/character-name';

export const getCharacterName = async (hints?: Hints) => {
  const response = await fetch(CHARACTER_NAME_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hints }),
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    throw new Error(`Failed to generate character name (${response.status}): ${message}`);
  }

  const data = (await response.json()) as { name?: string };
  return data.name ?? '';
};

const extractErrorMessage = async (response: Response) => {
  const text = await safeReadBody(response);
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed?.error === 'string') return parsed.error;
    if (typeof parsed?.message === 'string') return parsed.message;
  } catch {
    // ignore parse errors
  }
  return text || '<no body>';
};

const safeReadBody = async (response: Response) => {
  try {
    return await response.text();
  } catch {
    return '<no body>';
  }
};
