'use client';

import { useEffect, useState } from 'react';
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
  const [flashLoading, setFlashLoading] = useState(false);

  useEffect(() => {
    if (!flashLoading) return;
    const timer = setTimeout(() => setFlashLoading(false), 180);
    return () => clearTimeout(timer);
  }, [flashLoading]);

  const handleClick = () => {
    if (disabled || loading) return;
    setFlashLoading(true);
    onClick?.();
  };

  const showLoading = loading || flashLoading;

  return (
    <IconButton
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled || showLoading}
      aria-label={label}
    >
      {showLoading ? <Loader2 className="animate-spin" size={16} /> : <Dices size={16} />}
    </IconButton>
  );
};
