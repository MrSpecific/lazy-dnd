import { Form, FormInput } from '@/components/form';
import { CharacterClassSelect } from '@/components/character/CharacterClassSelect';

export const QuickCharacterForm = ({ size = '3' }: { size?: RadixInputSize }) => {
  return (
    <Form action="/api/characters" submitText="Next...">
      <CharacterClassSelect name="class" label="Class" size={size} />
      <FormInput name="name" label="Name" size={size} />
    </Form>
  );
};
