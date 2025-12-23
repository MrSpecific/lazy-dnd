'use client';

import { useActionState, useEffect, useMemo, useState, useTransition } from 'react';
import { Box, Button, Flex, Heading, Text } from '@radix-ui/themes';
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
};

export const SpellSection = ({
  characterId,
  initialSpells,
  initialSlots,
  catalog,
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

      <SpellSlots characterId={characterId} initialSlots={slots} onUpdated={setSlots} />

      <Box mt="4">
        {spellsByLevel.length === 0 ? (
          <Text color="gray" size="2">
            No spells yet. Add cantrips and choose prepared spells to see them here.
          </Text>
        ) : (
          spellsByLevel.map(({ level, spells: rows }) => (
            <Box key={level} mb="4">
              <Flex align="center" gap="2" mb="2">
                <Heading size="4">
                  {level === 0 ? 'Cantrips' : `Level ${level} spells`}
                </Heading>
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
