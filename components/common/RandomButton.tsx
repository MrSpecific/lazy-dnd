'use client';

import { Loader2, Dices } from 'lucide-react';
import { IconButton } from '@radix-ui/themes';

type RandomButtonProps = {
  onClick?: () => void;
  label?: string;
  size?: RadixButtonSize;
  variant?: 'ghost' | 'soft' | 'solid' | 'surface' | undefined;
  disabled?: boolean;
  loading?: boolean;
};

export const RandomButton = ({
  onClick,
  label = 'Random',
  size = '2',
  variant = 'surface',
  disabled = false,
  loading = false,
}: RandomButtonProps) => {
  return (
    <IconButton
      type="button"
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={label}
    >
      {loading ? <Loader2 className="animate-spin" size={16} /> : <Dices size={16} />}
    </IconButton>
  );
};
