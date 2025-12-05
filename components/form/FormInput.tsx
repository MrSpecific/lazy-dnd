import { Form } from 'radix-ui';
import { InputLabel } from './InputLabel';
import { TextField } from '@radix-ui/themes';

type FormInputProps = RadixInputProps & {
  label?: string;
  tooltip?: string;
};

export const FormInput = ({ name, label, tooltip, ...props }: FormInputProps) => {
  return (
    <Form.Field name={name}>
      <InputLabel label={label} required tooltip={tooltip} />
      <TextField.Root {...props}></TextField.Root>
    </Form.Field>
  );
};
