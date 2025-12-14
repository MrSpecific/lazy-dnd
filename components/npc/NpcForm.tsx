'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Flex, Select, TextArea, Text } from '@radix-ui/themes';
import { Form, FormInput } from '@/components/form';
import { CharacterClassSelect } from '@/components/character/CharacterClassSelect';
import { RaceSelect } from '@/components/character/RaceSelect';
import { GenderSelect } from '@/components/character/GenderSelect';
import { createNpc, type CreateNpcState } from '@/data/npc/createNpc';
import { InputLabel } from '@/components/form/InputLabel';
import { Alignment, Gender } from '@prisma/client';

export const NpcForm = () => {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<CreateNpcState, FormData>(createNpc, {
    status: 'idle',
  });

  useEffect(() => {
    if (state.status === 'success' && state.id) {
      router.push(`/dm/npc/${state.id}`);
    }
  }, [state, router]);

  return (
    <Form
      action={formAction}
      submitText={pending ? 'Saving…' : 'Create NPC'}
      submitDisabled={pending}
    >
      <FormInput name="name" label="Name" required />
      <FormInput name="title" label="Title" tooltip="e.g. Captain of the Guard" />
      <RaceSelect name="race" label="Race" />
      <CharacterClassSelect name="class" label="Class" />
      <GenderSelect />
      <div>
        <InputLabel label="Alignment" />
        <Select.Root name="alignment">
          <Select.Trigger placeholder="Select alignment (optional)" />
          <Select.Content>
            <Select.Item value="LAWFUL_GOOD">Lawful Good</Select.Item>
            <Select.Item value="NEUTRAL_GOOD">Neutral Good</Select.Item>
            <Select.Item value="CHAOTIC_GOOD">Chaotic Good</Select.Item>
            <Select.Item value="LAWFUL_NEUTRAL">Lawful Neutral</Select.Item>
            <Select.Item value="TRUE_NEUTRAL">True Neutral</Select.Item>
            <Select.Item value="CHAOTIC_NEUTRAL">Chaotic Neutral</Select.Item>
            <Select.Item value="LAWFUL_EVIL">Lawful Evil</Select.Item>
            <Select.Item value="NEUTRAL_EVIL">Neutral Evil</Select.Item>
            <Select.Item value="CHAOTIC_EVIL">Chaotic Evil</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
      <div>
        <InputLabel label="Description" />
        <TextArea name="description" placeholder="Who are they? What do they want?" />
      </div>

      {state.status === 'error' && (
        <Text color="red" size="2" mt="2">
          {state.message ?? 'Failed to create NPC.'}
        </Text>
      )}
    </Form>
  );
};
