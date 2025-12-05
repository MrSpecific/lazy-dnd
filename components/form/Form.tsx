import { Button, Flex, TextField } from '@radix-ui/themes';
import { Form as RxForm } from 'radix-ui';

type FormProps = {
  action?: FormAction;
  children: React.ReactNode;
  submitText?: string;
};

export const Form = ({ action, children, submitText = 'Submit' }: FormProps) => {
  return (
    <RxForm.Root action={action}>
      {children}

      <Flex justify="end" mt="4">
        <SubmitButton>{submitText}</SubmitButton>
      </Flex>
    </RxForm.Root>
  );
};

export const SubmitButton = ({ children }: { children: React.ReactNode }) => {
  return (
    <RxForm.Submit asChild>
      <Button>{children}</Button>
    </RxForm.Submit>
  );
};
