'use client';

import { useMemo, useState } from 'react';
import { Form } from '@/components/form';
import { CharacterClassSelect } from '@/components/character/CharacterClassSelect';
import { RaceSelect } from '@/components/character/RaceSelect';
import { CharacterNameInput, type Hints } from '@/components/character/CharacterNameInput';

export const QuickCharacterForm = ({ size = '3' }: { size?: RadixInputSize }) => {
  const [characterClass, setCharacterClass] = useState('');
  const [race, setRace] = useState('');

  const nameHints = useMemo<Hints>(() => {
    const hints: Hints = [];
    if (characterClass) hints.push({ hint: 'Class', value: characterClass });
    if (race) hints.push({ hint: 'Race', value: race });
    return hints;
  }, [characterClass, race]);

  return (
    <Form action="/api/characters" submitText="Next...">
      <CharacterClassSelect
        name="class"
        label="Class"
        size={size}
        onValueChange={(next) => setCharacterClass(next)}
      />
      <RaceSelect name="race" label="Race" size={size} onValueChange={(next) => setRace(next)} />
      <CharacterNameInput name="name" label="Name" size={size} hints={nameHints} />
    </Form>
  );
};
