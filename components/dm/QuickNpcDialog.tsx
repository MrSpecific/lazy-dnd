'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Dialog, Flex, Text, TextArea, Spinner } from '@radix-ui/themes';
import { useSaveShortcut } from '@/lib/hooks/useSaveShortcut';

type GeneratedNpc = {
  name?: string;
  gender?: string;
  race?: string;
  class?: string;
  alignment?: string;
  title?: string;
  description?: string;
  stats?: Record<string, number>;
  hp?: number;
  ac?: number;
  speed?: number;
  inventory?: string[];
  [key: string]: unknown;
};

export const QuickNpcDialog = ({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  showTrigger = true,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}) => {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedOpen = controlledOpen ?? internalOpen;
  const handleOpenChange = (isOpen: boolean) => {
    if (controlledOnOpenChange) controlledOnOpenChange(isOpen);
    if (controlledOpen === undefined) setInternalOpen(isOpen);
  };

  useSaveShortcut({ formRef, saveShortcut: true, saveOnEnter: true, saveOnCmdEnter: true });

  const generateNpc = async () => {
    console.log('Generating NPC with description:', description);
    try {
      setError(null);
      setLoading(true);
      const res = await fetch('/api/npcs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }
      const data = (await res.json()) as { npc?: GeneratedNpc; id?: string };
      if (!data.id) {
        throw new Error('Failed to save NPC.');
      }
      handleOpenChange(false);
      router.push(`/dm/npc/${data.id}`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to generate NPC.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={resolvedOpen} onOpenChange={handleOpenChange}>
      {showTrigger && (
        <Dialog.Trigger>
          <Button variant="soft" size="2">
            Quick NPC
          </Button>
        </Dialog.Trigger>
      )}
      <Dialog.Content maxWidth="640px">
        <Dialog.Title>Generate a quick NPC</Dialog.Title>
        <Dialog.Description size="2" mb="3">
          Describe the NPC and we&apos;ll draft a name, stats, and gear using Gemini.
        </Dialog.Description>

        <form ref={formRef} onSubmit={generateNpc}>
          <Box mb="3">
            <TextArea
              placeholder="e.g., Gruff dwarven blacksmith with a secret past"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                // Stop menu-level keyboard handlers from swallowing the space key.
                e.stopPropagation();
              }}
            />
          </Box>

          <Flex gap="2" justify="end" align="center">
            {error && (
              <Text color="red" size="2">
                {error}
              </Text>
            )}
            <Button type="submit" disabled={!description.trim() || loading}>
              {loading ? (
                <Flex align="center" gap="2">
                  <Spinner /> Generating…
                </Flex>
              ) : (
                'Generate'
              )}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
};
