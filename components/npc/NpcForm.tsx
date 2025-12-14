'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Flex, Select, TextArea, Text } from '@radix-ui/themes';
import { Form, FormInput } from '@/components/form';
import { CharacterClassSelect } from '@/components/character/CharacterClassSelect';
import { RaceSelect } from '@/components/character/RaceSelect';
import { GenderSelect } from '@/components/character/GenderSelect';
import { AlignmentSelect } from '@/components/character/AlignmentSelect';
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
      <AlignmentSelect />
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
