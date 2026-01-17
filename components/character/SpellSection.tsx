'use client';

import { useActionState, useEffect, useMemo, useState, useTransition } from 'react';
import { Box, Button, Flex, Heading, Text } from '@radix-ui/themes';
import { AbilityType } from '@prisma/client';
import { BookOpenCheck, PlusCircle } from 'lucide-react';
import {
  SpellRow,
  SpellSlotRow,
  SpellCatalogItem,
  AddSpellState,
  UpdateSpellState,
  addSpell,
  addExistingSpell,
  toggleSpellPrepared,
  removeSpell,
  updateSpellNotes,
} from '@/data/character/spells';
import type { CharacterAbilityRow } from '@/data/character/abilities';
import { SpellTable } from '@/components/character/SpellTable';
import { SpellForm } from '@/components/character/SpellForm';
import { SpellPickerDialog } from '@/components/character/SpellPickerDialog';
import { SpellNotesDialog } from '@/components/character/SpellNotesDialog';
import { SpellSlots } from '@/components/character/SpellSlots';

type SpellSectionProps = {
  characterId: string;
  initialSpells: SpellRow[];
  initialSlots: SpellSlotRow[];
  catalog: SpellCatalogItem[];
  className?: string | null;
  level?: number;
  abilities?: CharacterAbilityRow[];
};

export const SpellSection = ({
  characterId,
  initialSpells,
  initialSlots,
  catalog,
  className,
  level,
  abilities,
}: SpellSectionProps) => {
  const [spells, setSpells] = useState<SpellRow[]>(initialSpells);
  const [slots, setSlots] = useState<SpellSlotRow[]>(initialSlots);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [notesFor, setNotesFor] = useState<SpellRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [state, addAction, pendingAdd] = useActionState<AddSpellState, FormData>(addSpell, {
    status: 'idle',
  });
  const [attachState, attachAction, pendingAttach] = useActionState<AddSpellState, FormData>(
    addExistingSpell,
    { status: 'idle' }
  );
  const [noteState, noteAction, notePending] = useActionState<UpdateSpellState, FormData>(
    updateSpellNotes,
    { status: 'idle' }
  );
  const [attachPending, startAttachTransition] = useTransition();

  const spellcastingSummary = useMemo(
    () => getSpellcastingSummary({ className, level, abilities }),
    [className, level, abilities]
  );

  useEffect(() => {
    if (state.status === 'success') {
      setSpells((prev) => upsertSpell(prev, state.spell));
      setAddOpen(false);
      setLocalError(null);
    } else if (state.status === 'error') {
      setLocalError(state.message);
    }
  }, [state]);

  useEffect(() => {
    if (attachState.status === 'success') {
      setSpells((prev) => upsertSpell(prev, attachState.spell));
      setPickerOpen(false);
      setLocalError(null);
    } else if (attachState.status === 'error') {
      setLocalError(attachState.message);
    }
  }, [attachState]);

  useEffect(() => {
    if (noteState.status === 'success' && noteState.spell) {
      setSpells((prev) => upsertSpell(prev, noteState.spell!));
      setNotesFor(null);
      setLocalError(null);
    } else if (noteState.status === 'error') {
      setLocalError(noteState.message);
    }
  }, [noteState]);

  const handlePreparedToggle = async (spellId: string, prepared: boolean) => {
    setBusyId(spellId);
    try {
      const result = await toggleSpellPrepared({ characterId, spellId, prepared });
      if (result.status === 'success' && result.spell) {
        setSpells((prev) => upsertSpell(prev, result.spell!));
        setLocalError(null);
      } else if (result.status === 'error') {
        setLocalError(result.message);
      }
    } catch (error) {
      console.error(error);
      setLocalError('Failed to update prepared spells.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (spellId: string) => {
    setBusyId(spellId);
    try {
      const result = await removeSpell({ characterId, spellId });
      if (result.status === 'error') {
        setLocalError(result.message);
      } else {
        setLocalError(null);
        setSpells((prev) => prev.filter((s) => s.spellId !== spellId));
      }
    } catch (error) {
      console.error(error);
      setLocalError('Failed to remove spell.');
    } finally {
      setBusyId(null);
    }
  };

  const spellsByLevel = useMemo(() => groupSpellsByLevel(spells), [spells]);

  return (
    <Box mt="4">
      <Flex justify="between" align="center" mb="2">
        <Flex gap="2" align="center">
          <BookOpenCheck />
          <Heading size="6">Spells</Heading>
        </Flex>
        <Flex gap="2">
          <Button variant="surface" size="2" onClick={() => setPickerOpen(true)}>
            From Catalog
          </Button>
          <Button variant="surface" size="2" onClick={() => setAddOpen(true)}>
            <PlusCircle size="1em" /> New Spell
          </Button>
        </Flex>
      </Flex>
      <Text color="gray" size="2" mb="3">
        5e spellcasting: cantrips (level 0) are always available, leveled spells use slots, and
        prepared casters choose which leveled spells are ready each day. Mark rituals and
        concentration to keep play tidy.
      </Text>
      {spellcastingSummary && (
        <Text color="gray" size="2" mb="3">
          {spellcastingSummary}
        </Text>
      )}

      <Box mt="4">
        {spellsByLevel.length === 0 ? (
          <Text as="div" color="gray" size="2" mb="6">
            No spells yet. Add cantrips and choose prepared spells to see them here.
          </Text>
        ) : (
          spellsByLevel.map(({ level, spells: rows }) => (
            <Box key={level} mb="4">
              <Flex align="center" gap="2" mb="2">
                <Heading size="4">{level === 0 ? 'Cantrips' : `Level ${level} spells`}</Heading>
                <Text color="gray" size="2">
                  {rows.length} {rows.length === 1 ? 'spell' : 'spells'}
                </Text>
              </Flex>
              <SpellTable
                spells={rows}
                onTogglePrepared={handlePreparedToggle}
                onEditNotes={(id) => {
                  const found = spells.find((s) => s.spellId === id) ?? null;
                  setNotesFor(found);
                }}
                onRemove={handleRemove}
                busyId={busyId}
              />
            </Box>
          ))
        )}
      </Box>

      <SpellSlots characterId={characterId} initialSlots={slots} onUpdated={setSlots} />

      <SpellForm
        open={addOpen}
        onOpenChange={setAddOpen}
        pending={pendingAdd}
        action={addAction}
        characterId={characterId}
      />

      <SpellPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        catalog={catalog}
        pending={pendingAttach || attachPending}
        error={localError}
        onAttach={(spellId, knowledge) => {
          const fd = new FormData();
          fd.append('characterId', characterId);
          fd.append('spellId', spellId);
          fd.append('knowledge', knowledge);
          startAttachTransition(() => attachAction(fd));
        }}
      />

      <SpellNotesDialog
        open={!!notesFor}
        onOpenChange={(open) => {
          if (!open) setNotesFor(null);
        }}
        spell={notesFor}
        pending={notePending}
        action={noteAction}
        characterId={characterId}
      />

      {(localError || state.status === 'error' || attachState.status === 'error') && (
        <Text color="red" size="2" mt="2">
          {localError ??
            (state.status === 'error' ? state.message : null) ??
            (attachState.status === 'error' ? attachState.message : null)}
        </Text>
      )}
    </Box>
  );
};

const upsertSpell = (list: SpellRow[], updated: SpellRow) => {
  const filtered = list.filter((s) => s.spellId !== updated.spellId);
  return [...filtered, updated].sort((a, b) =>
    a.level === b.level ? a.name.localeCompare(b.name) : a.level - b.level
  );
};

const groupSpellsByLevel = (rows: SpellRow[]) => {
  const map = new Map<number, SpellRow[]>();
  rows.forEach((row) => {
    const existing = map.get(row.level) ?? [];
    existing.push(row);
    map.set(row.level, existing);
  });

  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([level, spells]) => ({
      level,
      spells: spells.sort((a, b) => a.name.localeCompare(b.name)),
    }));
};

type SpellcastingSummaryInput = {
  className?: string | null;
  level?: number;
  abilities?: CharacterAbilityRow[];
};

const SPELL_LEVEL_LABELS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];

const FULL_CASTER_SLOTS: number[][] = [
  [2, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 1, 0, 0, 0, 0, 0],
  [4, 3, 3, 2, 0, 0, 0, 0, 0],
  [4, 3, 3, 3, 1, 0, 0, 0, 0],
  [4, 3, 3, 3, 2, 0, 0, 0, 0],
  [4, 3, 3, 3, 2, 1, 0, 0, 0],
  [4, 3, 3, 3, 2, 1, 0, 0, 0],
  [4, 3, 3, 3, 2, 1, 1, 0, 0],
  [4, 3, 3, 3, 2, 1, 1, 0, 0],
  [4, 3, 3, 3, 2, 1, 1, 1, 0],
  [4, 3, 3, 3, 2, 1, 1, 1, 0],
  [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1],
];

const HALF_CASTER_SLOTS: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 1, 0, 0, 0, 0, 0],
  [4, 3, 3, 1, 0, 0, 0, 0, 0],
  [4, 3, 3, 2, 0, 0, 0, 0, 0],
  [4, 3, 3, 2, 0, 0, 0, 0, 0],
  [4, 3, 3, 3, 1, 0, 0, 0, 0],
  [4, 3, 3, 3, 1, 0, 0, 0, 0],
  [4, 3, 3, 3, 2, 0, 0, 0, 0],
  [4, 3, 3, 3, 2, 0, 0, 0, 0],
];

const THIRD_CASTER_SLOTS: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  [4, 3, 3, 1, 0, 0, 0, 0, 0],
  [4, 3, 3, 1, 0, 0, 0, 0, 0],
];

const WARLOCK_PACT_SLOTS = [
  { slots: 1, slotLevel: 1 },
  { slots: 2, slotLevel: 1 },
  { slots: 2, slotLevel: 2 },
  { slots: 2, slotLevel: 2 },
  { slots: 2, slotLevel: 3 },
  { slots: 2, slotLevel: 3 },
  { slots: 2, slotLevel: 4 },
  { slots: 2, slotLevel: 4 },
  { slots: 2, slotLevel: 5 },
  { slots: 2, slotLevel: 5 },
  { slots: 3, slotLevel: 5 },
  { slots: 3, slotLevel: 5 },
  { slots: 3, slotLevel: 5 },
  { slots: 3, slotLevel: 5 },
  { slots: 3, slotLevel: 5 },
  { slots: 3, slotLevel: 5 },
  { slots: 4, slotLevel: 5 },
  { slots: 4, slotLevel: 5 },
  { slots: 4, slotLevel: 5 },
  { slots: 4, slotLevel: 5 },
];

const BARD_SPELLS_KNOWN = [
  4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22,
];
const SORCERER_SPELLS_KNOWN = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15,
];
const WARLOCK_SPELLS_KNOWN = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15,
];
const RANGER_SPELLS_KNOWN = [
  0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11,
];

const BARD_CANTRIPS = [
  2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
];
const CLERIC_CANTRIPS = [
  3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
];
const DRUID_CANTRIPS = [
  2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
];
const SORCERER_CANTRIPS = [
  4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
];
const WARLOCK_CANTRIPS = [
  2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
];
const WIZARD_CANTRIPS = [
  3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
];
const ARTIFICER_CANTRIPS = [
  2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4,
];

const getSpellcastingSummary = ({
  className,
  level,
  abilities,
}: SpellcastingSummaryInput): string | null => {
  if (!className || !level) return null;

  const normalized = className.trim().toLowerCase();
  const boundedLevel = clamp(level, 1, 20);

  const isEldritchKnight = normalized.includes('eldritch knight');
  const isArcaneTrickster = normalized.includes('arcane trickster');

  let slotSummary: string | null = null;
  let spellSummary: string | null = null;

  if (normalized.includes('warlock')) {
    const pact = WARLOCK_PACT_SLOTS[boundedLevel - 1];
    if (pact) {
      slotSummary = `Pact slots ${pact.slots} at ${SPELL_LEVEL_LABELS[pact.slotLevel - 1]} level`;
    }
    spellSummary = buildKnownSummary({
      spellsKnown: WARLOCK_SPELLS_KNOWN[boundedLevel - 1],
      cantrips: WARLOCK_CANTRIPS[boundedLevel - 1],
    });
  } else if (normalized.includes('bard')) {
    slotSummary = formatSlotSummary(FULL_CASTER_SLOTS[boundedLevel - 1]);
    spellSummary = buildKnownSummary({
      spellsKnown: BARD_SPELLS_KNOWN[boundedLevel - 1],
      cantrips: BARD_CANTRIPS[boundedLevel - 1],
    });
  } else if (normalized.includes('sorcerer')) {
    slotSummary = formatSlotSummary(FULL_CASTER_SLOTS[boundedLevel - 1]);
    spellSummary = buildKnownSummary({
      spellsKnown: SORCERER_SPELLS_KNOWN[boundedLevel - 1],
      cantrips: SORCERER_CANTRIPS[boundedLevel - 1],
    });
  } else if (normalized.includes('cleric')) {
    slotSummary = formatSlotSummary(FULL_CASTER_SLOTS[boundedLevel - 1]);
    spellSummary = buildPreparedSummary({
      base: boundedLevel,
      ability: AbilityType.WIS,
      abilities,
      cantrips: CLERIC_CANTRIPS[boundedLevel - 1],
    });
  } else if (normalized.includes('druid')) {
    slotSummary = formatSlotSummary(FULL_CASTER_SLOTS[boundedLevel - 1]);
    spellSummary = buildPreparedSummary({
      base: boundedLevel,
      ability: AbilityType.WIS,
      abilities,
      cantrips: DRUID_CANTRIPS[boundedLevel - 1],
    });
  } else if (normalized.includes('wizard')) {
    slotSummary = formatSlotSummary(FULL_CASTER_SLOTS[boundedLevel - 1]);
    spellSummary = buildPreparedSummary({
      base: boundedLevel,
      ability: AbilityType.INT,
      abilities,
      cantrips: WIZARD_CANTRIPS[boundedLevel - 1],
      extra: 'Spellbook 6 + 2 per level (minimum)',
    });
  } else if (normalized.includes('paladin')) {
    slotSummary = formatSlotSummary(HALF_CASTER_SLOTS[boundedLevel - 1]);
    spellSummary = buildPreparedSummary({
      base: Math.floor(boundedLevel / 2),
      ability: AbilityType.CHA,
      abilities,
      cantrips: 0,
    });
  } else if (normalized.includes('ranger')) {
    slotSummary = formatSlotSummary(HALF_CASTER_SLOTS[boundedLevel - 1]);
    spellSummary = buildKnownSummary({
      spellsKnown: RANGER_SPELLS_KNOWN[boundedLevel - 1],
      cantrips: 0,
    });
  } else if (normalized.includes('artificer')) {
    const artificerIndex = Math.min(boundedLevel + 1, 20) - 1;
    slotSummary = formatSlotSummary(HALF_CASTER_SLOTS[artificerIndex]);
    spellSummary = buildPreparedSummary({
      base: Math.floor(boundedLevel / 2),
      ability: AbilityType.INT,
      abilities,
      cantrips: ARTIFICER_CANTRIPS[boundedLevel - 1],
    });
  } else if (isEldritchKnight || isArcaneTrickster) {
    slotSummary = formatSlotSummary(THIRD_CASTER_SLOTS[boundedLevel - 1]);
    spellSummary = 'Third-caster progression (subclass based).';
  } else if (
    normalized.includes('barbarian') ||
    normalized.includes('fighter') ||
    normalized.includes('monk') ||
    normalized.includes('rogue')
  ) {
    slotSummary = 'Slots none (unless subclass grants spellcasting).';
  }

  const segments = [slotSummary, spellSummary].filter(Boolean);
  if (!segments.length) return null;
  return `Expected for ${className} level ${boundedLevel}: ${segments.join('; ')}`;
};

const buildKnownSummary = ({
  spellsKnown,
  cantrips,
}: {
  spellsKnown?: number;
  cantrips?: number;
}) => {
  const parts: string[] = [];
  if (typeof spellsKnown === 'number') {
    parts.push(`Spells known ${spellsKnown}`);
  }
  if (typeof cantrips === 'number' && cantrips > 0) {
    parts.push(`Cantrips ${cantrips}`);
  }
  return parts.length ? parts.join(', ') : null;
};

const buildPreparedSummary = ({
  base,
  ability,
  abilities,
  cantrips,
  extra,
}: {
  base: number;
  ability: AbilityType;
  abilities?: CharacterAbilityRow[];
  cantrips?: number;
  extra?: string;
}) => {
  const mod = getAbilityMod(abilities, ability);
  const parts: string[] = [];
  if (mod != null) {
    parts.push(`Prepared ${base + mod} (${base} + ${ability} mod)`);
  } else {
    parts.push(`Prepared ${base} + ${ability} mod`);
  }
  if (typeof cantrips === 'number' && cantrips > 0) {
    parts.push(`Cantrips ${cantrips}`);
  }
  if (extra) {
    parts.push(extra);
  }
  return parts.join(', ');
};

const formatSlotSummary = (slots: number[]) => {
  let lastIndex = -1;
  for (let i = slots.length - 1; i >= 0; i -= 1) {
    if (slots[i] > 0) {
      lastIndex = i;
      break;
    }
  }
  if (lastIndex < 0) {
    return 'Slots none';
  }
  const counts = slots.slice(0, lastIndex + 1).join('/');
  const range =
    lastIndex === 0 ? SPELL_LEVEL_LABELS[0] : `${SPELL_LEVEL_LABELS[0]}-${SPELL_LEVEL_LABELS[lastIndex]}`;
  return `Slots ${counts} (${range})`;
};

const getAbilityMod = (abilities: CharacterAbilityRow[] | undefined, ability: AbilityType) => {
  if (!abilities) return null;
  const row = abilities.find((a) => a.ability === ability);
  if (!row) return null;
  const score = row.baseScore + row.bonus + row.temporary;
  return Math.floor((score - 10) / 2);
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
