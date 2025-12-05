import { Form, FormInput } from '@/components/form';

export const CharacterForm = () => {
  return (
    <Form action="/api/characters">
      <FormInput name="name" label="Name" />
      <FormInput name="class" label="Class" />
      <FormInput name="level" label="Level" type="number" />
    </Form>
  );
};
