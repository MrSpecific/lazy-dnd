'use client';

import { useState } from 'react';
import { Box, Button, Dialog, Flex, Text, TextArea, Code, Spinner } from '@radix-ui/themes';

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

export const QuickNpcDialog = () => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [npc, setNpc] = useState<GeneratedNpc | null>(null);

  const generateNpc = async () => {
    try {
      setError(null);
      setLoading(true);
      setNpc(null);
      const res = await fetch('/api/npcs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }
      const data = (await res.json()) as { npc: GeneratedNpc };
      setNpc(data.npc);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to generate NPC.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button variant="soft" size="2">
          Quick NPC
        </Button>
      </Dialog.Trigger>
      <Dialog.Content maxWidth="640px">
        <Dialog.Title>Generate a quick NPC</Dialog.Title>
        <Dialog.Description size="2" mb="3">
          Describe the NPC and we&apos;ll draft a name, stats, and gear using Gemini.
        </Dialog.Description>

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
          <Button onClick={generateNpc} disabled={!description.trim() || loading}>
            {loading ? (
              <Flex align="center" gap="2">
                <Spinner /> Generating…
              </Flex>
            ) : (
              'Generate'
            )}
          </Button>
        </Flex>

        {npc && (
          <Box mt="3" p="3" style={{ background: 'var(--gray-2)', borderRadius: 8 }}>
            <Text weight="bold">{npc.name ?? 'Unnamed NPC'}</Text>
            <Text color="gray" size="2">
              {[npc.title, npc.class, npc.race].filter(Boolean).join(' • ') || 'Details pending'}
            </Text>
            {npc.description && (
              <Text size="2" mt="2" as="p">
                {npc.description}
              </Text>
            )}
            <Box mt="2">
              <Code>{JSON.stringify(npc, null, 2)}</Code>
            </Box>
          </Box>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
};
