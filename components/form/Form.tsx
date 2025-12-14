import { Button, Flex } from '@radix-ui/themes';
import { Form as RxForm } from 'radix-ui';

type FormProps = {
  action?: FormAction;
  actionSize?: RadixButtonSize;
  children: React.ReactNode;
  submitText?: string;
  allowCancel?: boolean;
  cancelText?: string;
  cancelAction?: () => void;
  submitDisabled?: boolean;
};

export const Form = ({
  action,
  actionSize,
  children,
  submitText = 'Submit',
  allowCancel = false,
  cancelText = 'Cancel',
  cancelAction,
  submitDisabled,
}: FormProps) => {
  return (
    <RxForm.Root action={action}>
      {children}

      <Flex justify="end" mt="4" gap="2">
        {allowCancel && (
          <Button color="gray" onClick={cancelAction} size={actionSize}>
            {cancelText}
          </Button>
        )}
        <SubmitButton size={actionSize} disabled={submitDisabled}>
          {submitText}
        </SubmitButton>
      </Flex>
    </RxForm.Root>
  );
};

export const SubmitButton = ({
  children,
  size,
  disabled,
}: {
  children: React.ReactNode;
  size?: RadixButtonSize;
  disabled?: boolean;
}) => {
  return (
    <RxForm.Submit asChild>
      <Button size={size} disabled={disabled}>
        {children}
      </Button>
    </RxForm.Submit>
  );
};
