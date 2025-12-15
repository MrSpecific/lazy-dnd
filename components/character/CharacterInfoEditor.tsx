'use client';

import { ChangeEvent, useActionState, useEffect, useState } from 'react';
import { Alignment, Gender } from '@prisma/client';
import { Box, Button, Card, Flex, Text } from '@radix-ui/themes';
import { Form, FormInput } from '@/components/form';
import { RaceSelect } from '@/components/character/RaceSelect';
import { AlignmentSelect } from '@/components/character/AlignmentSelect';
import { GenderSelect } from '@/components/character/GenderSelect';
import { updateCharacter, type UpdateCharacterState } from '@/data/character/updateCharacter';
import { getAlignmentMeta } from '@/lib/helpers/alignment';
import { getGenderMeta } from '@/lib/helpers/gender';

type CharacterInfoEditorProps = {
  characterId: string;
  initialName: string;
  level: number;
  initialRaceId: string | null;
  initialGender: Gender | null;
  initialAlignment: Alignment | null;
  className?: string | null;
  raceName?: string | null;
};

export const CharacterInfoEditor = ({
  characterId,
  initialName,
  level,
  initialRaceId,
  initialGender,
  initialAlignment,
  className,
  raceName,
}: CharacterInfoEditorProps) => {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<UpdateCharacterState, FormData>(
    updateCharacter,
    {
      status: 'idle',
    }
  );
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

  const alignmentDisplay = getAlignmentMeta(localAlignment || null);
  const genderDisplay = getGenderMeta(localGender || null);

  return (
    <Card>
      <Flex justify="between" align="center" mb="2">
        <div>
          <Text weight="bold">{localName}</Text>
          <Text color="gray" size="2" ml="2">
            Level {level} • {className ?? 'Unclassed'} {raceName ?? ''}
          </Text>
        </div>
        <Button variant="surface" onClick={() => setEditing((prev) => !prev)}>
          {editing ? 'Cancel' : 'Edit'}
        </Button>
      </Flex>

      {!editing ? (
        <Box>
          <Text as="div" size="2" color="gray">
            Gender:{' '}
            {genderDisplay ? (
              <Text weight="bold" color={genderDisplay.color}>
                {genderDisplay.label}
              </Text>
            ) : (
              'Unspecified'
            )}
          </Text>
          <Text as="div" size="2" color="gray">
            Alignment:&nbsp;
            <Text weight="bold" color={alignmentDisplay?.color}>
              {alignmentDisplay ? alignmentDisplay.label : 'Unspecified'}
            </Text>
          </Text>
        </Box>
      ) : (
        <Form
          action={formAction}
          submitText={pending ? 'Saving…' : 'Save'}
          submitDisabled={pending}
        >
          <input type="hidden" name="characterId" value={characterId} />
          <FormInput
            name="name"
            label="Name"
            value={localName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setLocalName(e.target.value)}
            required
            size="3"
          />
          <RaceSelect name="race" label="Race" defaultValue={initialRaceId ?? undefined} />
          <GenderSelect value={localGender} onValueChange={(value) => setLocalGender(value)} />
          <Box>
            <AlignmentSelect
              value={localAlignment}
              onValueChange={(value) => setLocalAlignment(value)}
              size="3"
            />
            <Text color="amber" size="1">
              Changing alignment can affect gameplay; confirm with your DM.
            </Text>
          </Box>

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
