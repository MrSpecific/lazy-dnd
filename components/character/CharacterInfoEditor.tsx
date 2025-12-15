'use client';

import { ChangeEvent, useActionState, useEffect, useState } from 'react';
import { Alignment, Gender } from '@prisma/client';
import { Box, Button, Card, Flex, Heading, Text } from '@radix-ui/themes';
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
  const [viewName, setViewName] = useState(initialName);
  const [viewGender, setViewGender] = useState<Gender | ''>(initialGender ?? '');
  const [viewAlignment, setViewAlignment] = useState<Alignment | ''>(initialAlignment ?? '');
  const [draftName, setDraftName] = useState(initialName);
  const [draftGender, setDraftGender] = useState<Gender | ''>(initialGender ?? '');
  const [draftAlignment, setDraftAlignment] = useState<Alignment | ''>(initialAlignment ?? '');

  useEffect(() => {
    if (state.status === 'success') {
      setEditing(false);
      setViewName(state.name);
      setViewGender((state.gender as Gender | null) ?? '');
      setViewAlignment((state.alignment as Alignment | null) ?? '');
      setDraftName(state.name);
      setDraftGender((state.gender as Gender | null) ?? '');
      setDraftAlignment((state.alignment as Alignment | null) ?? '');
    }
  }, [state]);

  const alignmentDisplay = getAlignmentMeta(viewAlignment || null);
  const genderDisplay = getGenderMeta(viewGender || null);

  const startEditing = () => {
    setDraftName(viewName);
    setDraftGender(viewGender || '');
    setDraftAlignment(viewAlignment || '');
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraftName(viewName);
    setDraftGender(viewGender || '');
    setDraftAlignment(viewAlignment || '');
    setEditing(false);
  };

  return (
    <Card>
      <Flex justify="between" align="start" mb="2">
        <Box>
          <Heading size="6">{viewName}</Heading>
          <Text color="gray" size="2">
            Level {level} • {className ?? 'Unclassed'} {raceName ?? ''}
          </Text>
        </Box>
        <Button variant="surface" onClick={editing ? cancelEditing : startEditing} size="1">
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
            value={draftName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDraftName(e.target.value)}
            required
            size="3"
          />
          <RaceSelect name="race" label="Race" defaultValue={initialRaceId ?? undefined} />
          <GenderSelect value={draftGender} onValueChange={(value) => setDraftGender(value)} />
          <Box>
            <AlignmentSelect
              value={draftAlignment}
              onValueChange={(value) => setDraftAlignment(value)}
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
