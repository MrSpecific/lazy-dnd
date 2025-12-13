import { Form, FormInput } from '@/components/form';
import { CharacterClassSelect } from '@/components/character/CharacterClassSelect';
import { RaceSelect } from '@/components/character/RaceSelect';
import { CharacterNameInput } from '@/components/character/CharacterNameInput';

export const QuickCharacterForm = ({ size = '3' }: { size?: RadixInputSize }) => {
  return (
    <Form action="/api/characters" submitText="Next...">
      <CharacterClassSelect name="class" label="Class" size={size} />
      <RaceSelect name="race" label="Race" size={size} />
      <CharacterNameInput name="name" label="Name" size={size} />
    </Form>
  );
};
