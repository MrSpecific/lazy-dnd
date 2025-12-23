'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, DropdownMenu, Flex, Box } from '@radix-ui/themes';
import { useUser, UserAvatar } from '@stackframe/stack';
import { useRouter } from 'next/navigation';
import { QuickNpcDialog } from '@/components/dm/QuickNpcDialog';
import { RefreshButton } from './RefreshButton';

type QuickActionsProps = {
  isDm?: boolean;
};

const characterRoute = '/player/character/new';
const npcRoute = '/dm/npc/new';

export const QuickActions = ({ isDm = false }: QuickActionsProps) => {
  const user = useUser();
  const router = useRouter();

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
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [navigate]);

  if (!user) {
    return null;
  }

  return (
    <Flex gap="2" align="center">
      <RefreshButton />
      <DmActions />
      <PlayerActions />
    </Flex>
  );
};

export const DmActions = () => {
  const router = useRouter();
  const [quickNpcOpen, setQuickNpcOpen] = useState(false);

  const navigate = useCallback(
    (path: string) => {
      router.push(path);
    },
    [router]
  );

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <Button variant="soft" size="3">
            DM
            <DropdownMenu.TriggerIcon />
          </Button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content>
          <DropdownMenu.Item onSelect={() => setQuickNpcOpen(true)}>Quick NPC</DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            onSelect={() => navigate(npcRoute)}
            // shortcut="⌘ D"
          >
            New NPC
          </DropdownMenu.Item>
          <DropdownMenu.Item onSelect={() => navigate('/dm/npcs')}>My NPCs</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      <QuickNpcDialog showTrigger={false} open={quickNpcOpen} onOpenChange={setQuickNpcOpen} />
    </>
  );
};

export const PlayerActions = () => {
  const router = useRouter();

  const navigate = useCallback(
    (path: string) => {
      router.push(path);
    },
    [router]
  );

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variant="soft" size="3">
          Player
          <DropdownMenu.TriggerIcon />
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content>
        <DropdownMenu.Item
          onSelect={() => navigate(characterRoute)}
          // shortcut="⌘ E"
        >
          New Character
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item onSelect={() => navigate('/player/characters')}>
          My Characters
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
