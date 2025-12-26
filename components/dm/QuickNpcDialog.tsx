'use client';

import { useRef, useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Dialog, Flex, Text, TextArea, Spinner } from '@radix-ui/themes';
import { useSaveShortcut } from '@/lib/hooks/useSaveShortcut';
import { generateNpc, type GenerateNpcState } from '@/data/npc/generateNpc';
import { useActionState } from 'react';

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
  const [error, setError] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<GenerateNpcState, FormData>(generateNpc, {
    status: 'idle',
  });
  const [transitionPending, startTransition] = useTransition();

  const resolvedOpen = controlledOpen ?? internalOpen;
  const handleOpenChange = (isOpen: boolean) => {
    if (controlledOnOpenChange) controlledOnOpenChange(isOpen);
    if (controlledOpen === undefined) setInternalOpen(isOpen);
  };

  useSaveShortcut({ formRef, saveShortcut: true, saveOnEnter: true, saveOnCmdEnter: true });

  useEffect(() => {
    if (state.status === 'success' && state.id) {
      handleOpenChange(false);
      router.push(`/dm/npc/${state.id}`);
    } else if (state.status === 'error') {
      setError(state.message ?? 'Failed to generate NPC.');
    }
  }, [state, router]);

  const handleGenerate = () => {
    if (!description.trim()) return;
    setError(null);
    const fd = new FormData();
    fd.append('description', description.trim());
    startTransition(() => formAction(fd));
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

        <form
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerate();
          }}
        >
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
            <Button type="submit" disabled={!description.trim() || pending || transitionPending}>
              {pending || transitionPending ? (
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
