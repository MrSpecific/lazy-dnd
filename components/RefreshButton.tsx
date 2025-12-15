'use client';

import { Button, IconButton } from '@radix-ui/themes';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export const RefreshButton = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <IconButton
      loading={isPending}
      onClick={() => startTransition(() => router.refresh())}
      aria-label="Refresh page"
      variant="soft"
      radius="full"
      color="gray"
    >
      <RefreshCw />
    </IconButton>
  );
};
