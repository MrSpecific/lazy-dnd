import { Form, FormInput } from '@/components/form';

export const QuickCharacterForm = () => {
  return (
    <Form action="/api/characters">
      <FormInput name="name" label="Name" />
      <FormInput name="class" label="Class" />
    </Form>
  );
};
