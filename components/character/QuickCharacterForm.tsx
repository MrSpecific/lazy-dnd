'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { Text } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';
import { Form, FormField } from '@/components/form';
import { CharacterClassSelect } from '@/components/character/CharacterClassSelect';
import { RaceSelect } from '@/components/character/RaceSelect';
import { GenderSelect } from '@/components/character/GenderSelect';
import { AlignmentSelect } from '@/components/character/AlignmentSelect';
import { CharacterNameInput, type Hints } from '@/components/character/CharacterNameInput';
import { createCharacter, type CreateCharacterState } from '@/data/character/createCharacter';
import { Alignment, Gender } from '@prisma/client';

export const QuickCharacterForm = ({ size = '3' }: { size?: RadixInputSize }) => {
  const [characterClass, setCharacterClass] = useState('');
  const [race, setRace] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [alignment, setAlignment] = useState<Alignment | ''>('');
  const router = useRouter();

  const [state, formAction, pending] = useActionState<CreateCharacterState, FormData>(
    createCharacter,
    { status: 'idle' }
  );

  useEffect(() => {
    if (state.status === 'success' && state.id) {
      router.push(`/player/character/${state.id}`);
    }
  }, [state, router]);

  const nameHints = useMemo<Hints>(() => {
    const hints: Hints = [];
    if (characterClass) hints.push({ hint: 'Class', value: characterClass });
    if (race) hints.push({ hint: 'Race', value: race });
    if (gender) hints.push({ hint: 'Gender', value: gender });
    if (alignment) hints.push({ hint: 'Alignment', value: alignment });
    return hints;
  }, [characterClass, race, gender, alignment]);

  return (
    <Form
      action={formAction}
      submitText={pending ? 'Saving…' : 'Next...'}
      actionSize={size}
      submitDisabled={pending}
    >
      <CharacterClassSelect
        name="class"
        label="Class"
        size={size}
        onValueChange={(next) => setCharacterClass(next)}
      />
      <RaceSelect name="race" label="Race" size={size} onValueChange={(next) => setRace(next)} />
      <GenderSelect size={size} value={gender} onValueChange={(value) => setGender(value)} />
      <AlignmentSelect size={size} value={alignment} onValueChange={(value) => setAlignment(value)} />
      <CharacterNameInput name="name" label="Name" size={size} hints={nameHints} required />

      {state.status === 'error' && (
        <Text color="red" size="1" mt="2">
          {state.message ?? 'Something went wrong.'}
        </Text>
      )}
    </Form>
  );
};
