'use client';

import { Button, DropdownMenu } from '@radix-ui/themes';
import { useCallback, useEffect } from 'react';
import { useUser, UserAvatar } from '@stackframe/stack';
import { useRouter } from 'next/navigation';
import { QuickNpcDialog } from '@/components/dm/QuickNpcDialog';

type QuickActionsProps = {
  isDm?: boolean;
};

const characterRoute = '/player/character/new';
const npcRoute = '/dm/npc/new';

export const QuickActions = ({ isDm = false }: QuickActionsProps) => {
  const router = useRouter();
  const user = useUser();

  if (!user) {
    return null;
  }

  const navigate = useCallback(
    (path: string) => {
      router.push(path);
    },
    [router]
  );

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const metaPressed = event.metaKey || event.ctrlKey;
      if (!metaPressed) return;

      const key = event.key.toLowerCase();

      if (key === 'e') {
        event.preventDefault();
        navigate(characterRoute);
      }

      if (isDm && key === 'd') {
        event.preventDefault();
        navigate(npcRoute);
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [isDm, navigate]);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variant="soft" size="3">
          Actions
          <DropdownMenu.TriggerIcon />
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content>
        <DropdownMenu.Item onSelect={() => navigate(characterRoute)} shortcut="⌘ E">
          New Character
        </DropdownMenu.Item>
        {isDm && (
          <>
            <DropdownMenu.Item onSelect={() => navigate(npcRoute)} shortcut="⌘ D">
              New NPC
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item onSelect={(e) => e.preventDefault()}>
              <QuickNpcDialog />
            </DropdownMenu.Item>
          </>
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
