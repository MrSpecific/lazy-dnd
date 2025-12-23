'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { Box, Button, Card, Flex, Grid, Heading, Text, TextField } from '@radix-ui/themes';
import { Sparkles } from 'lucide-react';
import { SpellSlotRow, UpdateSpellSlotState, updateSpellSlots } from '@/data/character/spells';

type SpellSlotsProps = {
  characterId: string;
  initialSlots: SpellSlotRow[];
  onUpdated?: (slots: SpellSlotRow[]) => void;
};

export const SpellSlots = ({ characterId, initialSlots, onUpdated }: SpellSlotsProps) => {
  const [state, formAction, pending] = useActionState<UpdateSpellSlotState, FormData>(
    updateSpellSlots,
    { status: 'idle', slots: initialSlots }
  );
  const [slots, setSlots] = useState<Record<number, SpellSlotRow>>(() =>
    toSlotRecord(initialSlots)
  );

  useEffect(() => {
    setSlots(toSlotRecord(initialSlots));
  }, [initialSlots]);

  useEffect(() => {
    if (state.status === 'success' && state.slots) {
      setSlots(toSlotRecord(state.slots));
      onUpdated?.(state.slots);
    }
  }, [state, onUpdated]);

  const levels = useMemo(() => Array.from({ length: 9 }).map((_, idx) => idx + 1), []);

  const updateLocal = (level: number, field: keyof SpellSlotRow, value: number) => {
    setSlots((prev) => {
      const current = prev[level] ?? { spellLevel: level, maxSlots: 0, currentSlots: 0 };
      const next =
        field === 'maxSlots'
          ? { ...current, maxSlots: Math.max(0, value), currentSlots: Math.min(current.currentSlots, Math.max(0, value)) }
          : { ...current, currentSlots: Math.max(0, Math.min(value, current.maxSlots)) };
      return { ...prev, [level]: next };
    });
  };

  const renderRow = (level: number) => {
    const slot = slots[level] ?? { spellLevel: level, maxSlots: 0, currentSlots: 0 };
    return (
      <form key={level} action={formAction}>
        <input type="hidden" name="characterId" value={characterId} />
        <input type="hidden" name="spellLevel" value={level} />
        <Grid columns={{ initial: '1', md: '5' }} gap="2" align="center" mb="2">
          <Heading size="3">Level {level}</Heading>
          <Box>
            <Text size="2" color="gray">
              Max slots
            </Text>
            <TextField.Root
              name="maxSlots"
              inputMode="numeric"
              value={slot.maxSlots}
              onChange={(e) => updateLocal(level, 'maxSlots', Number(e.target.value) || 0)}
            />
          </Box>
          <Box>
            <Text size="2" color="gray">
              Remaining
            </Text>
            <TextField.Root
              name="currentSlots"
              inputMode="numeric"
              value={slot.currentSlots}
              onChange={(e) => updateLocal(level, 'currentSlots', Number(e.target.value) || 0)}
            />
          </Box>
          <Flex gap="2" align="center" justify="start">
            <Button
              type="button"
              size="1"
              variant="soft"
              onClick={() => updateLocal(level, 'currentSlots', Math.max(0, slot.currentSlots - 1))}
              disabled={pending}
            >
              Use 1
            </Button>
            <Button
              type="button"
              size="1"
              variant="soft"
              onClick={() =>
                updateLocal(level, 'currentSlots', Math.min(slot.maxSlots, slot.currentSlots + 1))
              }
              disabled={pending}
            >
              Restore 1
            </Button>
          </Flex>
          <Flex justify="end" align="center" gap="2">
            <Button type="submit" size="1" disabled={pending}>
              {pending ? 'Saving…' : 'Save'}
            </Button>
          </Flex>
        </Grid>
      </form>
    );
  };

  return (
    <Card>
      <Flex justify="between" align="center" mb="2">
        <Flex gap="2" align="center">
          <Sparkles />
          <Heading size="5">Spell Slots</Heading>
        </Flex>
        <Text color="gray" size="2">
          Track 1st–9th level spell slots.
        </Text>
      </Flex>
      <Text color="gray" size="2" mb="3">
        In 5e, cantrips (level 0) do not use slots. Leveled spells expend slots of that level or
        higher; long rests reset remaining slots to your max.
      </Text>
      {levels.map((lvl) => renderRow(lvl))}
      {state.status === 'error' && (
        <Text color="red" size="2" mt="2">
          {state.message ?? 'Failed to update spell slots.'}
        </Text>
      )}
    </Card>
  );
};

const toSlotRecord = (rows: SpellSlotRow[]): Record<number, SpellSlotRow> => {
  return rows.reduce<Record<number, SpellSlotRow>>((acc, row) => {
    acc[row.spellLevel] = row;
    return acc;
  }, {});
};
