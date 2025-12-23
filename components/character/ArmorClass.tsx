'use client';

import { useActionState, useState, ChangeEvent, useTransition, useEffect } from 'react';
import { Box, Button, Card, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import { Shield } from 'lucide-react';
import { Form, FormInput } from '@/components/form';
import { updateArmorClass, type UpdateArmorClassState } from '@/data/character/updateArmorClass';
import { useCharacterContext } from '@/components/character/CharacterContext';

type ArmorClassProps = {
  characterId: string;
  initialArmorClass: number | null;
  initialSpeed: number | null;
};

export const ArmorClass = ({ characterId, initialArmorClass, initialSpeed }: ArmorClassProps) => {
  const { armorUpdateToken } = useCharacterContext();
  const [state, formAction, pending] = useActionState<UpdateArmorClassState, FormData>(
    updateArmorClass,
    { status: 'idle' }
  );
  const [transitionPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(!initialArmorClass);
  const [ac, setAc] = useState<number | ''>(initialArmorClass ?? '');
  const [speed, setSpeed] = useState<number | ''>(initialSpeed ?? '');
  const [lastMode, setLastMode] = useState<'update' | 'compute'>('update');

  useEffect(() => {
    if (state.status === 'success') {
      if (state.armorClass !== undefined) setAc(state.armorClass ?? '');
      if (state.speed !== undefined) setSpeed(state.speed ?? '');
      if (lastMode === 'update') {
        setEditing(false);
      }
    }
  }, [state, lastMode]);

  useEffect(() => {
    if (armorUpdateToken > 0) {
      computeFromCharacter();
    }
  }, [armorUpdateToken]);

  const handleNumberChange =
    (setter: (val: number | '') => void) => (e: ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setter(val === '' ? '' : Number(val));
    };

  const computeFromCharacter = () => {
    const fd = new FormData();
    fd.set('characterId', characterId);
    fd.set('mode', 'compute');
    setLastMode('compute');
    startTransition(() => formAction(fd));
  };

  return (
    <Card>
      <Flex justify="between" align="center" mb="2">
        <Flex align="center" gap="2">
          <Shield />
          <Heading size="5">Armor Class</Heading>
        </Flex>
        <Button variant="surface" size="1" onClick={() => setEditing((prev) => !prev)}>
          {editing ? 'Cancel' : 'Edit'}
        </Button>
      </Flex>

      {!editing ? (
        <Grid columns={{ initial: '2' }} gap="3">
          <StatTile label="AC" value={ac} />
          <StatTile label="Speed" value={speed} suffix="ft" />
        </Grid>
      ) : (
        <Form
          action={formAction}
          submitText={pending ? 'Saving…' : 'Save'}
          submitDisabled={pending}
          onSubmit={() => setLastMode('update')}
        >
          <input type="hidden" name="characterId" value={characterId} />
          <input type="hidden" name="mode" value="update" />
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
            <Button
              type="button"
              variant="soft"
              size="1"
              onClick={computeFromCharacter}
              disabled={transitionPending}
            >
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
