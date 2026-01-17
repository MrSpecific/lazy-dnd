'use client';

import { useActionState, useEffect, useMemo, useState, useTransition } from 'react';
import { Box, Button, Card, Flex, Grid, Heading, Text, TextField } from '@radix-ui/themes';
import { Sparkles } from 'lucide-react';
import {
  SpellSlotRow,
  UpdateSpellSlotState,
  resetSpellSlots,
  updateSpellSlots,
} from '@/data/character/spells';
import { useCharacterContext } from '@/components/character/CharacterContext';

type SpellSlotsProps = {
  characterId: string;
  initialSlots: SpellSlotRow[];
  onUpdated?: (slots: SpellSlotRow[]) => void;
};

export const SpellSlots = ({ characterId, initialSlots, onUpdated }: SpellSlotsProps) => {
  const { restSignal } = useCharacterContext();
  const [state, formAction, pending] = useActionState<UpdateSpellSlotState, FormData>(
    updateSpellSlots,
    { status: 'idle', slots: initialSlots }
  );
  const [transitionPending, startTransition] = useTransition();
  const [restPending, startRestTransition] = useTransition();
  const [localError, setLocalError] = useState<string | null>(null);
  const [slots, setSlots] = useState<Record<number, SpellSlotDraft>>(() =>
    toDraftRecord(initialSlots)
  );
  const [savedSlots, setSavedSlots] = useState<Record<number, SpellSlotRow>>(() =>
    toSlotRecord(initialSlots)
  );
  const [savingLevel, setSavingLevel] = useState<number | null>(null);

  useEffect(() => {
    const next = toSlotRecord(initialSlots);
    setSlots(toDraftRecord(initialSlots));
    setSavedSlots(next);
  }, [initialSlots]);

  useEffect(() => {
    if (state.status === 'success' && state.slots) {
      const next = toSlotRecord(state.slots);
      setSlots(toDraftRecord(state.slots));
      setSavedSlots(next);
      onUpdated?.(state.slots);
      setLocalError(null);
    } else if (state.status === 'error') {
      setLocalError(state.message);
    }
  }, [state, onUpdated]);

  useEffect(() => {
    if (!restSignal || restSignal.type !== 'long') return;
    startRestTransition(async () => {
      const result = await resetSpellSlots({ characterId });
      if (result.status === 'success' && result.slots) {
        const next = toSlotRecord(result.slots);
        setSlots(toDraftRecord(result.slots));
        setSavedSlots(next);
        onUpdated?.(result.slots);
        setLocalError(null);
      } else if (result.status === 'error') {
        setLocalError(result.message);
      }
    });
  }, [restSignal, characterId, onUpdated]);

  useEffect(() => {
    if (!transitionPending) {
      setSavingLevel(null);
    }
  }, [transitionPending]);

  const levels = useMemo(() => Array.from({ length: 9 }).map((_, idx) => idx + 1), []);

  const updateLocal = (level: number, field: keyof SpellSlotRow, value: number | '') => {
    setSlots((prev) => {
      const current = prev[level] ?? { spellLevel: level, maxSlots: 0, currentSlots: 0 };
      if (value === '') {
        return {
          ...prev,
          [level]: { ...current, [field]: '' },
        };
      }
      if (field === 'maxSlots') {
        const nextMax = Math.max(0, value);
        const currentSlotsValue = toNumber(current.currentSlots);
        const currentMaxValue = toNumber(current.maxSlots);
        const currentWasMaxed = currentSlotsValue === currentMaxValue;
        const nextCurrent = currentWasMaxed
          ? nextMax
          : Math.min(currentSlotsValue, nextMax);
        return {
          ...prev,
          [level]: { ...current, maxSlots: nextMax, currentSlots: nextCurrent },
        };
      }
      const maxValue = toNumber(current.maxSlots);
      const nextCurrent = Math.max(0, Math.min(value, maxValue));
      return { ...prev, [level]: { ...current, currentSlots: nextCurrent } };
    });
  };

  const submitSlot = (level: number, nextSlot?: SpellSlotRow) => {
    const slot = nextSlot ?? slots[level] ?? { spellLevel: level, maxSlots: 0, currentSlots: 0 };
    const form = new FormData();
    form.set('characterId', characterId);
    form.set('spellLevel', String(level));
    form.set('maxSlots', String(toNumber(slot.maxSlots)));
    form.set('currentSlots', String(toNumber(slot.currentSlots)));
    setSavingLevel(level);
    startTransition(() => formAction(form));
  };

  const adjustAndSubmit = (level: number, updater: (current: SpellSlotRow) => SpellSlotRow) => {
    const current = slots[level] ?? { spellLevel: level, maxSlots: 0, currentSlots: 0 };
    const normalized = {
      spellLevel: level,
      maxSlots: toNumber(current.maxSlots),
      currentSlots: toNumber(current.currentSlots),
    };
    const next = updater(normalized);
    setSlots((prev) => ({ ...prev, [level]: next }));
    submitSlot(level, next);
  };

  const renderRow = (level: number) => {
    const slot = slots[level] ?? { spellLevel: level, maxSlots: 0, currentSlots: 0 };
    const saved = savedSlots[level] ?? { spellLevel: level, maxSlots: 0, currentSlots: 0 };
    const rowDirty =
      toNumber(slot.maxSlots) !== saved.maxSlots ||
      toNumber(slot.currentSlots) !== saved.currentSlots;
    const rowPending = pending || transitionPending || restPending;
    const controlsDisabled = rowPending || toNumber(slot.maxSlots) <= 0;
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
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') {
                  updateLocal(level, 'maxSlots', '');
                  return;
                }
                const parsed = Number(raw);
                if (!Number.isNaN(parsed)) {
                  updateLocal(level, 'maxSlots', parsed);
                }
              }}
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
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') {
                  updateLocal(level, 'currentSlots', '');
                  return;
                }
                const parsed = Number(raw);
                if (!Number.isNaN(parsed)) {
                  updateLocal(level, 'currentSlots', parsed);
                }
              }}
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
              disabled={rowPending || !rowDirty}
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
      {(localError || state.status === 'error') && (
        <Text color="red" size="2" mt="2">
          {localError ??
            (state.status === 'error' ? state.message : null) ??
            'Failed to update spell slots.'}
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

type SpellSlotDraft = {
  spellLevel: number;
  maxSlots: number | '';
  currentSlots: number | '';
};

const toDraftRecord = (rows: SpellSlotRow[]): Record<number, SpellSlotDraft> => {
  return rows.reduce<Record<number, SpellSlotDraft>>((acc, row) => {
    acc[row.spellLevel] = {
      spellLevel: row.spellLevel,
      maxSlots: row.maxSlots,
      currentSlots: row.currentSlots,
    };
    return acc;
  }, {});
};

const toNumber = (value: number | '' | null | undefined) => {
  if (value === '' || value == null) return 0;
  return value;
};
