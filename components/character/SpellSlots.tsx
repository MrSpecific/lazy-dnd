'use client';

import { useActionState, useEffect, useMemo, useState, useTransition } from 'react';
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
  const [transitionPending, startTransition] = useTransition();
  const [slots, setSlots] = useState<Record<number, SpellSlotRow>>(() =>
    toSlotRecord(initialSlots)
  );
  const [savingLevel, setSavingLevel] = useState<number | null>(null);

  useEffect(() => {
    setSlots(toSlotRecord(initialSlots));
  }, [initialSlots]);

  useEffect(() => {
    if (state.status === 'success' && state.slots) {
      setSlots(toSlotRecord(state.slots));
      onUpdated?.(state.slots);
    }
  }, [state, onUpdated]);

  useEffect(() => {
    if (!transitionPending) {
      setSavingLevel(null);
    }
  }, [transitionPending]);

  const levels = useMemo(() => Array.from({ length: 9 }).map((_, idx) => idx + 1), []);

  const updateLocal = (level: number, field: keyof SpellSlotRow, value: number) => {
    setSlots((prev) => {
      const current = prev[level] ?? { spellLevel: level, maxSlots: 0, currentSlots: 0 };
      if (field === 'maxSlots') {
        const nextMax = Math.max(0, value);
        const currentWasMaxed = current.currentSlots === current.maxSlots;
        const nextCurrent = currentWasMaxed
          ? nextMax
          : Math.min(current.currentSlots, nextMax);
        return { ...prev, [level]: { ...current, maxSlots: nextMax, currentSlots: nextCurrent } };
      }
      const nextCurrent = Math.max(0, Math.min(value, current.maxSlots));
      return { ...prev, [level]: { ...current, currentSlots: nextCurrent } };
    });
  };

  const submitSlot = (level: number, nextSlot?: SpellSlotRow) => {
    const slot = nextSlot ?? slots[level] ?? { spellLevel: level, maxSlots: 0, currentSlots: 0 };
    const form = new FormData();
    form.set('characterId', characterId);
    form.set('spellLevel', String(level));
    form.set('maxSlots', String(slot.maxSlots));
    form.set('currentSlots', String(slot.currentSlots));
    setSavingLevel(level);
    startTransition(() => formAction(form));
  };

  const adjustAndSubmit = (level: number, updater: (current: SpellSlotRow) => SpellSlotRow) => {
    const current = slots[level] ?? { spellLevel: level, maxSlots: 0, currentSlots: 0 };
    const next = updater(current);
    setSlots((prev) => ({ ...prev, [level]: next }));
    submitSlot(level, next);
  };

  const renderRow = (level: number) => {
    const slot = slots[level] ?? { spellLevel: level, maxSlots: 0, currentSlots: 0 };
    const rowPending = pending || transitionPending;
    const controlsDisabled = rowPending || slot.maxSlots <= 0;
    return (
      <Box key={level}>
        <Grid columns={{ initial: '1', md: '5' }} gap="2" align="center" mb="2">
          <Heading size="3">Level {level}</Heading>
          <Box>
            <Text size="2" color="gray">
              Max slots
            </Text>
            <TextField.Root
              type="number"
              min={0}
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
              type="number"
              min={0}
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
              onClick={() =>
                adjustAndSubmit(level, (current) => ({
                  ...current,
                  currentSlots: Math.max(0, current.currentSlots - 1),
                }))
              }
              disabled={controlsDisabled}
            >
              Use 1
            </Button>
            <Button
              type="button"
              size="1"
              variant="soft"
              onClick={() =>
                adjustAndSubmit(level, (current) => ({
                  ...current,
                  currentSlots: Math.min(current.maxSlots, current.currentSlots + 1),
                }))
              }
              disabled={controlsDisabled}
            >
              Restore 1
            </Button>
          </Flex>
          <Flex justify="end" align="center" gap="2">
            <Button
              type="button"
              size="1"
              disabled={rowPending}
              onClick={() => submitSlot(level)}
            >
              {savingLevel === level && rowPending ? 'Saving…' : 'Save'}
            </Button>
          </Flex>
        </Grid>
      </Box>
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
        In 5e, cantrips (level 0) do not use slots. Remaining stays in sync when it matches max;
        use/restore saves immediately, and Save commits manual edits.
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
