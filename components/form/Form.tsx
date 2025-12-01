import { TextField } from '@radix-ui/themes';
import { Form as RxForm } from 'radix-ui';

export const Form = ({ children }: { children: React.ReactNode }) => {
  return (
    <RxForm.Root>
      {children}
      <RxForm.Message />
      {/* <RxForm.ValidityState>
        {(validity) => (
          <RxForm.Control asChild>
            <TextField.Input variant="primary" state={getTextFieldInputState(validity)} />
          </RxForm.Control>
        )}
      </RxForm.ValidityState> */}
      <RxForm.Submit />
    </RxForm.Root>
  );
};
