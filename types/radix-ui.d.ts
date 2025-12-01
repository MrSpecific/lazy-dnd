import type {
  BoxProps,
  BadgeProps,
  ButtonProps,
  CheckboxProps,
  FormMessageProps,
  SelectProps,
  FlexProps,
  TableProps,
  InputProps,
  TextProps,
} from '@radix-ui/themes';

export {};

declare global {
  type RadixBoxMargin = Pick<BoxProps, 'm' | 'mt' | 'mr' | 'mb' | 'ml' | 'mx' | 'my'>;
  type RadixColor = BadgeProps['color'];
  type RadixBadgeSize = BadgeProps['size'];
  type RadixBadgeVariant = BadgeProps['variant'];
  type RadixButtonSize = ButtonProps['size'];
  type RadixButtonVariant = ButtonProps['variant'];
  type RadixButtonRadius = ButtonProps['radius'];
  type RadixDirection = FlexProps['direction'];
  type RadixFlexJustify = FlexProps['justify'];
  type CheckedState = CheckboxProps['checked'];
  type CheckboxSize = FormMessageProps['size'];
  type FormMessageMatch = FormMessageProps['match'];
  type SelectProps = SelectProps;
  type RadixTableProps = TableProps;
  type RadixInputSize = InputProps['size'];
  type RadixTextSize = TextProps['size'];
}
