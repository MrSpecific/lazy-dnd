import { Form, FormInput } from '@/components/form';

export const CharacterForm = ({ size = '3' }: { size?: RadixInputSize }) => {
  return (
    <Form action="/api/characters">
      <FormInput name="name" label="Name" size={size} />
      <FormInput name="class" label="Class" size={size} />
    </Form>
  );
};
