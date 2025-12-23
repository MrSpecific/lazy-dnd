import { Tooltip, Text } from '@radix-ui/themes';
import { QuestionMarkCircledIcon } from '@radix-ui/react-icons';

type LabelOrChildren =
  | {
      label: string;
      children?: React.ReactNode;
    }
  | {
      label?: string;
      children: React.ReactNode;
    };

export const InputLabel = ({
  label,
  size = '1',
  htmlFor,
  required = false,
  tooltip,
  style,
  children,
}: {
  size?: RadixTextSize;
  htmlFor?: string;
  required?: boolean;
  tooltip?: string;
  style?: React.CSSProperties;
} & LabelOrChildren) => {
  return (
    <Text as="label" size={size} htmlFor={htmlFor} style={style}>
      {!label ? children : label}
      {required && (
        <Text as="span" color="plum">
          *
        </Text>
      )}
      {label && children}
      &nbsp;
      {tooltip && (
        <Tooltip content={tooltip}>
          <QuestionMarkCircledIcon />
        </Tooltip>
      )}
    </Text>
  );
};
