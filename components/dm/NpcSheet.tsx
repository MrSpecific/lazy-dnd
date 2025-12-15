'use client';

import { ChangeEvent, useMemo } from 'react';
import { useActionState, useEffect, useState } from 'react';
import { Alignment, Gender } from '@prisma/client';
import { Box, Button, Card, Flex, Grid, Heading, Text, TextField } from '@radix-ui/themes';
import { RaceSelect } from '@/components/character/RaceSelect';
import { CharacterClassSelect } from '@/components/character/CharacterClassSelect';
import { GenderSelect } from '@/components/character/GenderSelect';
import { AlignmentSelect } from '@/components/character/AlignmentSelect';
import { Form, FormInput } from '@/components/form';
import { updateNpc, type UpdateNpcState, type NpcResponse } from '@/data/npc/updateNpc';
import { CharacterNameInput, type Hints as NameHints } from '@/components/character/CharacterNameInput';

type NpcSheetProps = {
  npc: NpcResponse;
  className?: string | null;
  raceName?: string | null;
};

export const NpcSheet = ({ npc, className, raceName }: NpcSheetProps) => {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<UpdateNpcState, FormData>(updateNpc, {
    status: 'idle',
  });

  const [view, setView] = useState<NpcResponse>(npc);
  const [draft, setDraft] = useState<NpcResponse>(npc);

  useEffect(() => {
    if (state.status === 'success') {
      setView(state.npc);
      setDraft(state.npc);
      setEditing(false);
    }
  }, [state]);

  const emptyStatBlock = useMemo(
    () => ({
      armorClass: null,
      maxHp: null,
      speed: null,
      strength: null,
      dexterity: null,
      constitution: null,
      intelligence: null,
      wisdom: null,
      charisma: null,
    }),
    []
  );

  const updateStatBlock = (
    key: keyof NonNullable<NpcResponse['statBlock']>,
    value: string | number | null
  ) => {
    setDraft((prev) => {
      const sb = prev.statBlock ?? emptyStatBlock;
      const numValue =
        typeof value === 'number'
          ? value
          : value === null
            ? null
            : value === ''
              ? null
              : Number.isFinite(Number(value))
                ? Number(value)
                : null;
      return {
        ...prev,
        statBlock: {
          ...sb,
          [key]: numValue,
        },
      };
    });
  };

  const toggleEdit = () => {
    if (editing) {
      setDraft(view);
      setEditing(false);
    } else {
      setDraft(view);
      setEditing(true);
    }
  };

  const statBlock = view.statBlock;
  const nameHints: NameHints = [
    ...(className ? [{ hint: 'Class', value: className }] : []),
    ...(raceName ? [{ hint: 'Race', value: raceName }] : []),
  ];

  return (
    <Card>
      <Flex justify="between" align="start" mb="3">
        <Box>
          <Heading>{view.name}</Heading>
          <Text color="gray" size="2">
            {view.title ?? 'NPC'} • {className ?? 'Unclassed'} {raceName ?? ''}
          </Text>
          <Text color="gray" size="2">
            {view.gender ?? 'Unspecified'} • {view.alignment ?? 'No alignment'}
          </Text>
        </Box>
        <Button variant="surface" size="1" onClick={toggleEdit}>
          {editing ? 'Cancel' : 'Edit'}
        </Button>
      </Flex>

      {!editing ? (
        <Box>
          {view.description && (
            <Text as="p" mt="2">
              {view.description}
            </Text>
          )}
          {statBlock && (
            <Box mt="3">
              <Heading size="4" mb="2">
                Stat Block
              </Heading>
              <Grid columns={{ initial: '1', sm: '3' }} gap="2">
                <StatTile label="AC" value={statBlock.armorClass} />
                <StatTile label="HP" value={statBlock.maxHp} />
                <StatTile label="Speed" value={statBlock.speed} suffix="ft" />
              </Grid>
              <Box mt="2">
                <Text color="gray" size="2">
                  STR {statBlock.strength ?? '—'} • DEX {statBlock.dexterity ?? '—'} • CON{' '}
                  {statBlock.constitution ?? '—'} • INT {statBlock.intelligence ?? '—'} • WIS{' '}
                  {statBlock.wisdom ?? '—'} • CHA {statBlock.charisma ?? '—'}
                </Text>
              </Box>
            </Box>
          )}
        </Box>
      ) : (
        <Form action={formAction} submitText={pending ? 'Saving…' : 'Save'} submitDisabled={pending}>
          <input type="hidden" name="npcId" value={npc.id} />
          <CharacterNameInput
            name="name"
            label="Name"
            value={draft.name}
            onValueChange={(val) => setDraft({ ...draft, name: val })}
            hints={nameHints}
            required
          />
          <FormInput
            name="title"
            label="Title"
            value={draft.title ?? ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, title: e.target.value })}
          />
          <RaceSelect
            name="race"
            label="Race"
            defaultValue={draft.raceId ?? undefined}
            onValueChange={(val) => setDraft({ ...draft, raceId: val })}
          />
          <CharacterClassSelect
            name="class"
            label="Class"
            defaultValue={draft.classId ?? undefined}
            onValueChange={(val) => setDraft({ ...draft, classId: val })}
          />
          <GenderSelect value={draft.gender ?? ''} onValueChange={(val) => setDraft({ ...draft, gender: val })} />
          <AlignmentSelect
            value={draft.alignment ?? ''}
            onValueChange={(val) => setDraft({ ...draft, alignment: val })}
            size="3"
          />
          <FormInput
            name="description"
            label="Description"
            value={draft.description ?? ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, description: e.target.value })}
          />

          <Heading size="4" mt="3">
            Stat Block
          </Heading>
          <Grid columns={{ initial: '1', sm: '3' }} gap="2">
            <FormInput
              name="ac"
              label="Armor Class"
              inputMode="numeric"
              value={draft.statBlock?.armorClass ?? ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateStatBlock('armorClass', e.target.value)}
            />
            <FormInput
              name="maxHp"
              label="Hit Points"
              inputMode="numeric"
              value={draft.statBlock?.maxHp ?? ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateStatBlock('maxHp', e.target.value)}
            />
            <FormInput
              name="speed"
              label="Speed"
              inputMode="numeric"
              value={draft.statBlock?.speed ?? ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateStatBlock('speed', e.target.value)}
            />
          </Grid>

          <Heading size="4" mt="3">
            Abilities
          </Heading>
          <Grid columns={{ initial: '2', sm: '3' }} gap="2">
            {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map(
              (ability) => (
                <FormInput
                  key={ability}
                  name={ability}
                  label={ability.toUpperCase()}
                  inputMode="numeric"
                  value={(draft.statBlock as any)?.[ability] ?? ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => updateStatBlock(ability, e.target.value)}
                />
              )
            )}
          </Grid>

          {state.status === 'error' && (
            <Text color="red" size="2" mt="2">
              {state.message ?? 'Failed to update NPC.'}
            </Text>
          )}
        </Form>
      )}
    </Card>
  );
};

const StatTile = ({ label, value, suffix }: { label: string; value: number | null; suffix?: string }) => (
  <Box p="2" style={{ border: '1px solid var(--gray-4)', borderRadius: 8 }}>
    <Text color="gray" size="1">
      {label}
    </Text>
    <Heading size="4">
      {value ?? '—'}
      {suffix ? ` ${suffix}` : ''}
    </Heading>
  </Box>
);
