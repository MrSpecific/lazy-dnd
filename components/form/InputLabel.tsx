import { Tooltip, Text } from '@radix-ui/themes';
import { QuestionMarkCircledIcon } from '@radix-ui/react-icons';

export const InputLabel = ({
  label,
  size = '1',
  htmlFor,
  required = false,
  tooltip,
  children,
}: {
  label: string;
  size?: RadixTextSize;
  htmlFor?: string;
  required?: boolean;
  tooltip?: string;
  children?: React.ReactNode;
}) => {
  return (
    <Text as="label" size={size} htmlFor={htmlFor}>
      {label}
      {required && (
        <Text as="span" color="plum">
          *
        </Text>
      )}
      {children}
      &nbsp;
      {tooltip && (
        <Tooltip content={tooltip}>
          <QuestionMarkCircledIcon />
        </Tooltip>
      )}
    </Text>
  );
};
