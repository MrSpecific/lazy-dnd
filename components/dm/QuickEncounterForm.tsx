'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Flex, Select, Text, TextArea } from '@radix-ui/themes';
import { Form, InputLabel } from '@/components/form';
import { generateEncounter, type GenerateEncounterState } from '@/data/campaign/generateEncounter';

type QuickEncounterFormProps = {
  campaignId: string;
};

export const QuickEncounterForm = ({ campaignId }: QuickEncounterFormProps) => {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [npcMode, setNpcMode] = useState<'inline' | 'separate'>('inline');
  const [state, formAction, pending] = useActionState<GenerateEncounterState, FormData>(
    generateEncounter,
    { status: 'idle' },
  );

  useEffect(() => {
    if (state.status === 'success') {
      setPrompt('');
      router.refresh();
    }
  }, [state.status, router]);

  return (
    <Form action={formAction} showActions={false}>
      <input type="hidden" name="campaignId" value={campaignId} />
      <Box mb="3">
        <InputLabel label="Prompt" tooltip="Describe the encounter you want to generate." />
        <TextArea
          name="prompt"
          placeholder="e.g., A crumbling bridge ambush with goblin sappers and a collapsing span"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={4}
        />
        <Text size="1" color="gray" mt="1">
          Uses your campaign description, notes, and DM notes as context.
        </Text>
      </Box>
      <Box>
        <InputLabel
          label="NPC detail"
          tooltip="Inline adds stat snippets; separate creates full NPC records."
        />
        <Select.Root
          name="npcMode"
          value={npcMode}
          onValueChange={(value) => setNpcMode(value as 'inline' | 'separate')}
        >
          <Select.Trigger placeholder="Choose NPC detail level" />
          <Select.Content>
            <Select.Item value="inline">Inline NPC details</Select.Item>
            <Select.Item value="separate">Generate full NPCs</Select.Item>
          </Select.Content>
        </Select.Root>
        <Text size="1" color="gray" mt="1">
          Adds the encounter to your latest session (or creates one if none exist).
        </Text>
      </Box>
      <Flex justify="end" gap="2" mt="3" align="center">
        {state.status === 'error' && (
          <Text color="red" size="2">
            {state.message ?? 'Failed to generate encounter.'}
          </Text>
        )}
        {state.status === 'success' && (
          <Text color="green" size="2">
            Encounter created.
          </Text>
        )}
        <Button type="submit" disabled={!prompt.trim() || pending}>
          {pending ? 'Generating…' : 'Generate encounter'}
        </Button>
      </Flex>
    </Form>
  );
};
