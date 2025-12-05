import { Button, TextField } from '@radix-ui/themes';
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
      {/* <RxForm.Message /> */}
      {/* <RxForm.ValidityState>
        {(validity) => (
          <RxForm.Control asChild>
            <TextField.Input variant="primary" state={getTextFieldInputState(validity)} />
          </RxForm.Control>
        )}
      </RxForm.ValidityState> */}
      <SubmitButton>{submitText}</SubmitButton>
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
