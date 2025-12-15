import { Button, Flex } from '@radix-ui/themes';
import { Form as RxForm } from 'radix-ui';
import type { FormEvent } from 'react';

type FormProps = {
  action?: FormAction;
  actionSize?: RadixButtonSize;
  showActions?: boolean;
  children: React.ReactNode;
  submitText?: string;
  allowCancel?: boolean;
  cancelText?: string;
  cancelAction?: () => void;
  submitDisabled?: boolean;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
};

export const Form = ({
  action,
  actionSize,
  showActions = true,
  children,
  submitText = 'Submit',
  allowCancel = false,
  cancelText = 'Cancel',
  cancelAction,
  submitDisabled,
  onSubmit,
}: FormProps) => {
  return (
    <RxForm.Root action={action} onSubmit={onSubmit}>
      {children}

      {showActions && (
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
      )}
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

export const FormField = RxForm.Field;
