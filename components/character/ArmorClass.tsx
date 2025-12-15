'use client';

import { useActionState, useState, ChangeEvent, useTransition } from 'react';
import { Box, Button, Card, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import { Form, FormInput } from '@/components/form';
import { updateArmorClass, type UpdateArmorClassState } from '@/data/character/updateArmorClass';

type ArmorClassProps = {
  characterId: string;
  initialArmorClass: number | null;
  initialSpeed: number | null;
};

export const ArmorClass = ({ characterId, initialArmorClass, initialSpeed }: ArmorClassProps) => {
  const [state, formAction, pending] = useActionState<UpdateArmorClassState, FormData>(
    updateArmorClass,
    { status: 'idle' }
  );
  const [transitionPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(!initialArmorClass);
  const [ac, setAc] = useState<number | ''>(initialArmorClass ?? '');
  const [speed, setSpeed] = useState<number | ''>(initialSpeed ?? '');

  const acDisplay = state.status === 'success' ? state.armorClass : ac;
  const speedDisplay = state.status === 'success' ? state.speed : speed;

  const handleCancel = () => {
    setEditing(false);
    setAc(initialArmorClass ?? '');
    setSpeed(initialSpeed ?? '');
  };

  const handleNumberChange =
    (setter: (val: number | '') => void) => (e: ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setter(val === '' ? '' : Number(val));
    };

  const computeFromCharacter = () => {
    const fd = new FormData();
    fd.set('characterId', characterId);
    fd.set('mode', 'compute');
    startTransition(() => formAction(fd));
  };

  return (
    <Card>
      <Flex justify="between" align="center" mb="2">
        <Heading size="5">Armor Class</Heading>
        <Button variant="surface" size="1" onClick={() => setEditing((prev) => !prev)}>
          {editing ? 'Cancel' : 'Edit'}
        </Button>
      </Flex>

      {!editing ? (
        <Grid columns={{ initial: '2' }} gap="3">
          <StatTile label="AC" value={acDisplay} />
          <StatTile label="Speed" value={speedDisplay} suffix="ft" />
        </Grid>
      ) : (
        <Form action={formAction} submitText={pending ? 'Saving…' : 'Save'} submitDisabled={pending}>
          <input type="hidden" name="characterId" value={characterId} />
          <Grid columns={{ initial: '1', sm: '2' }} gap="2">
            <FormInput
              name="armorClass"
              label="Armor Class"
              inputMode="numeric"
              value={ac}
              onChange={handleNumberChange(setAc)}
              required
            />
            <FormInput
              name="speed"
              label="Speed"
              inputMode="numeric"
              value={speed}
              onChange={handleNumberChange(setSpeed)}
            />
          </Grid>
          <Flex gap="2" mt="2">
            <Button type="button" variant="soft" size="1" onClick={computeFromCharacter} disabled={transitionPending}>
              Set from character
            </Button>
          </Flex>
          {state.status === 'error' && (
            <Text color="red" size="2" mt="2">
              {state.message ?? 'Failed to update armor class.'}
            </Text>
          )}
        </Form>
      )}
    </Card>
  );
};

const StatTile = ({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number | string | null | undefined;
  suffix?: string;
}) => {
  return (
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
};
