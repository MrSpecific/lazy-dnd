'use client';

import { useActionState, useEffect, useState } from 'react';
import { Alignment, Gender } from '@prisma/client';
import { Box, Button, Card, Flex, Select, Text } from '@radix-ui/themes';
import { Form, FormInput } from '@/components/form';
import { RaceSelect } from '@/components/character/RaceSelect';
import { InputLabel } from '@/components/form/InputLabel';
import { updateCharacter, type UpdateCharacterState } from '@/data/character/updateCharacter';

type CharacterInfoEditorProps = {
  characterId: string;
  initialName: string;
  initialRaceId: string | null;
  initialGender: Gender | null;
  initialAlignment: Alignment | null;
  className?: string | null;
  raceName?: string | null;
};

export const CharacterInfoEditor = ({
  characterId,
  initialName,
  initialRaceId,
  initialGender,
  initialAlignment,
  className,
  raceName,
}: CharacterInfoEditorProps) => {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<UpdateCharacterState, FormData>(updateCharacter, {
    status: 'idle',
  });
  const [localName, setLocalName] = useState(initialName);
  const [localGender, setLocalGender] = useState<Gender | ''>(initialGender ?? '');
  const [localAlignment, setLocalAlignment] = useState<Alignment | ''>(initialAlignment ?? '');

  useEffect(() => {
    if (state.status === 'success') {
      setEditing(false);
      setLocalName(state.name);
      setLocalGender((state.gender as Gender | null) ?? '');
      setLocalAlignment((state.alignment as Alignment | null) ?? '');
    }
  }, [state]);

  return (
    <Card>
      <Flex justify="between" align="center" mb="2">
        <div>
          <Text weight="bold">{localName}</Text>
          <Text color="gray" size="2" ml="2">
            {className ?? 'Unclassed'} {raceName ?? ''}
          </Text>
        </div>
        <Button variant="surface" onClick={() => setEditing((prev) => !prev)}>
          {editing ? 'Cancel' : 'Edit'}
        </Button>
      </Flex>

      {!editing ? (
        <Box>
          <Text size="2" color="gray">
            Gender: {localGender || 'Unspecified'}
          </Text>
          <Text size="2" color="gray">
            Alignment: {localAlignment || 'Unspecified'}
          </Text>
        </Box>
      ) : (
        <Form action={formAction} submitText={pending ? 'Saving…' : 'Save'} submitDisabled={pending}>
          <input type="hidden" name="characterId" value={characterId} />
          <FormInput name="name" label="Name" value={localName} onChange={(e) => setLocalName(e.target.value)} required />
          <RaceSelect name="race" label="Race" defaultValue={initialRaceId ?? undefined} />
          <div>
            <InputLabel label="Gender" />
            <Select.Root name="gender" value={localGender || undefined} onValueChange={(value) => setLocalGender(value as Gender)}>
              <Select.Trigger placeholder="Select gender (optional)" />
              <Select.Content>
                <Select.Item value="MALE">Male</Select.Item>
                <Select.Item value="FEMALE">Female</Select.Item>
                <Select.Item value="NON_BINARY">Non-binary</Select.Item>
                <Select.Item value="OTHER">Other</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>
          <div>
            <InputLabel label="Alignment" />
            <Text color="amber" size="1">
              Changing alignment can affect gameplay; confirm with your DM.
            </Text>
            <Select.Root
              name="alignment"
              value={localAlignment || undefined}
              onValueChange={(value) => setLocalAlignment(value as Alignment)}
            >
              <Select.Trigger placeholder="Select alignment (optional)" />
              <Select.Content>
                <Select.Item value="LAWFUL_GOOD">Lawful Good</Select.Item>
                <Select.Item value="NEUTRAL_GOOD">Neutral Good</Select.Item>
                <Select.Item value="CHAOTIC_GOOD">Chaotic Good</Select.Item>
                <Select.Item value="LAWFUL_NEUTRAL">Lawful Neutral</Select.Item>
                <Select.Item value="TRUE_NEUTRAL">True Neutral</Select.Item>
                <Select.Item value="CHAOTIC_NEUTRAL">Chaotic Neutral</Select.Item>
                <Select.Item value="LAWFUL_EVIL">Lawful Evil</Select.Item>
                <Select.Item value="NEUTRAL_EVIL">Neutral Evil</Select.Item>
                <Select.Item value="CHAOTIC_EVIL">Chaotic Evil</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>

          {state.status === 'error' && (
            <Text color="red" size="2" mt="2">
              {state.message ?? 'Failed to update character.'}
            </Text>
          )}
        </Form>
      )}
    </Card>
  );
};
