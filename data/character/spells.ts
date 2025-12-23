'use server';

import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';
import { SpellKnowledgeType, SpellSchool } from '@prisma/client';

export type SpellRow = {
  id: string; // spellId for stable keying
  spellId: string;
  name: string;
  level: number;
  school: SpellSchool;
  castingTime: string | null;
  range: string | null;
  components: string | null;
  duration: string | null;
  description: string | null;
  isRitual: boolean;
  isConcentration: boolean;
  known: boolean;
  prepared: boolean;
  knownId: string | null;
  preparedId: string | null;
  notes: string | null;
};

export type SpellSlotRow = {
  spellLevel: number;
  maxSlots: number;
  currentSlots: number;
};

export type SpellCatalogItem = {
  id: string;
  name: string;
  level: number;
  school: SpellSchool;
  castingTime: string | null;
  range: string | null;
  components: string | null;
  duration: string | null;
  description: string | null;
  isRitual: boolean;
  isConcentration: boolean;
};

export type AddSpellState =
  | { status: 'idle'; message?: string }
  | { status: 'success'; spell: SpellRow }
  | { status: 'error'; message: string };

export type UpdateSpellState =
  | { status: 'idle'; message?: string }
  | { status: 'success'; spell: SpellRow | null }
  | { status: 'error'; message: string };

export type UpdateSpellSlotState =
  | { status: 'idle'; slots?: SpellSlotRow[] }
  | { status: 'success'; slots: SpellSlotRow[] }
  | { status: 'error'; message: string };

const ensureCharacterAccess = async (characterId: string, userId: string) => {
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    select: { userId: true },
  });

  if (!character || character.userId !== userId) {
    throw new Error('Character not found or access denied');
  }
};

type SpellRecord = Awaited<ReturnType<typeof prisma.characterSpell.findMany>>[number] & {
  spell: Awaited<ReturnType<typeof prisma.spell.findUnique>>;
};

const mergeSpellRecords = (records: SpellRecord[]): SpellRow[] => {
  const merged = new Map<string, SpellRow>();

  records.forEach((cs) => {
    if (!cs.spell) return;

    const existing = merged.get(cs.spellId);
    const base: SpellRow =
      existing ??
      {
        id: cs.spellId,
        spellId: cs.spellId,
        name: cs.spell.name,
        level: cs.spell.level,
        school: cs.spell.school,
        castingTime: cs.spell.castingTime ?? null,
        range: cs.spell.range ?? null,
        components: cs.spell.components ?? null,
        duration: cs.spell.duration ?? null,
        description: cs.spell.description ?? null,
        isRitual: cs.spell.isRitual,
        isConcentration: cs.spell.isConcentration,
        known: false,
        prepared: false,
        knownId: null,
        preparedId: null,
        notes: null,
      };

    if (cs.knowledge === 'KNOWN') {
      base.known = true;
      base.knownId = cs.id;
      if (!base.notes) base.notes = cs.notes ?? null;
    }
    if (cs.knowledge === 'PREPARED') {
      base.prepared = true;
      base.preparedId = cs.id;
      base.notes = cs.notes ?? base.notes;
    }

    merged.set(cs.spellId, base);
  });

  return Array.from(merged.values()).sort((a, b) => {
    if (a.level === b.level) return a.name.localeCompare(b.name);
    return a.level - b.level;
  });
};

const getSingleSpellRow = async (characterId: string, spellId: string): Promise<SpellRow | null> => {
  const records = await prisma.characterSpell.findMany({
    where: { characterId, spellId },
    include: { spell: true },
  });

  const [first] = mergeSpellRecords(records);
  return first ?? null;
};

export async function getCharacterSpells(
  characterId: string,
  userId?: string
): Promise<SpellRow[]> {
  const resolvedUserId = userId ?? (await stackServerApp.getUser())?.id;
  if (!resolvedUserId) throw new Error('Unauthorized');

  await ensureCharacterAccess(characterId, resolvedUserId);

  const records = await prisma.characterSpell.findMany({
    where: { characterId },
    include: { spell: true },
  });

  return mergeSpellRecords(records);
}

export async function getCharacterSpellSlots(
  characterId: string,
  userId?: string
): Promise<SpellSlotRow[]> {
  const resolvedUserId = userId ?? (await stackServerApp.getUser())?.id;
  if (!resolvedUserId) throw new Error('Unauthorized');

  await ensureCharacterAccess(characterId, resolvedUserId);

  const slots = await prisma.characterSpellSlot.findMany({
    where: { characterId },
    orderBy: { spellLevel: 'asc' },
  });

  const defaultSlots: SpellSlotRow[] = Array.from({ length: 9 }).map((_, index) => ({
    spellLevel: index + 1,
    maxSlots: 0,
    currentSlots: 0,
  }));

  slots.forEach((slot) => {
    if (slot.spellLevel < 1 || slot.spellLevel > 9) return;
    defaultSlots[slot.spellLevel - 1] = {
      spellLevel: slot.spellLevel,
      maxSlots: slot.maxSlots,
      currentSlots: slot.currentSlots,
    };
  });

  return defaultSlots;
}

export async function getSpellCatalog(userId?: string): Promise<SpellCatalogItem[]> {
  const resolvedUserId = userId ?? (await stackServerApp.getUser())?.id;
  if (!resolvedUserId) throw new Error('Unauthorized');

  const spells = await prisma.spell.findMany({
    orderBy: [
      { level: 'asc' },
      { name: 'asc' },
    ],
  });

  return spells.map((spell) => ({
    id: spell.id,
    name: spell.name,
    level: spell.level,
    school: spell.school,
    castingTime: spell.castingTime ?? null,
    range: spell.range ?? null,
    components: spell.components ?? null,
    duration: spell.duration ?? null,
    description: spell.description ?? null,
    isRitual: spell.isRitual,
    isConcentration: spell.isConcentration,
  }));
}

export async function searchSpells(search: string): Promise<SpellCatalogItem[]> {
  const user = await stackServerApp.getUser();
  if (!user) throw new Error('Unauthorized');

  const spells = await prisma.spell.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {},
    orderBy: [
      { level: 'asc' },
      { name: 'asc' },
    ],
    take: 150,
  });

  return spells.map((spell) => ({
    id: spell.id,
    name: spell.name,
    level: spell.level,
    school: spell.school,
    castingTime: spell.castingTime ?? null,
    range: spell.range ?? null,
    components: spell.components ?? null,
    duration: spell.duration ?? null,
    description: spell.description ?? null,
    isRitual: spell.isRitual,
    isConcentration: spell.isConcentration,
  }));
}

export async function addSpell(_prev: AddSpellState, formData: FormData): Promise<AddSpellState> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return { status: 'error', message: 'Unauthorized' };

    const characterId = formData.get('characterId');
    const name = (formData.get('name') as string | null)?.trim();
    const levelRaw = formData.get('level');
    const schoolRaw = formData.get('school');
    const castingTime = (formData.get('castingTime') as string | null)?.trim() || null;
    const range = (formData.get('range') as string | null)?.trim() || null;
    const components = (formData.get('components') as string | null)?.trim() || null;
    const duration = (formData.get('duration') as string | null)?.trim() || null;
    const description = (formData.get('description') as string | null)?.trim() || null;
    const isRitual = formData.get('isRitual') === 'on';
    const isConcentration = formData.get('isConcentration') === 'on';
    const knowledgeRaw = formData.get('knowledge');

    if (!characterId || typeof characterId !== 'string') {
      return { status: 'error', message: 'Character id is required.' };
    }
    await ensureCharacterAccess(characterId, user.id);

    if (!name) return { status: 'error', message: 'Spell name is required.' };

    const level =
      typeof levelRaw === 'string' && levelRaw.trim() !== '' ? Number(levelRaw) : Number(0);
    if (!Number.isFinite(level) || level < 0 || level > 9) {
      return { status: 'error', message: 'Spell level must be between 0 and 9.' };
    }

    const school =
      typeof schoolRaw === 'string' && Object.values(SpellSchool).includes(schoolRaw as SpellSchool)
        ? (schoolRaw as SpellSchool)
        : null;

    if (!school) {
      return { status: 'error', message: 'Spell school is required.' };
    }

    const knowledge =
      knowledgeRaw === 'PREPARED' ? SpellKnowledgeType.PREPARED : SpellKnowledgeType.KNOWN;

    const spell = await prisma.spell.create({
      data: {
        name,
        level,
        school,
        castingTime,
        range,
        components,
        duration,
        description,
        isRitual,
        isConcentration,
      },
    });

    await prisma.characterSpell.create({
      data: {
        characterId,
        spellId: spell.id,
        knowledge,
      },
    });

    if (knowledge === SpellKnowledgeType.PREPARED) {
      await prisma.characterSpell.upsert({
        where: {
          characterId_spellId_knowledge: {
            characterId,
            spellId: spell.id,
            knowledge: SpellKnowledgeType.KNOWN,
          },
        },
        update: {},
        create: {
          characterId,
          spellId: spell.id,
          knowledge: SpellKnowledgeType.KNOWN,
        },
      });
    }

    const row = await getSingleSpellRow(characterId, spell.id);
    if (!row) throw new Error('Failed to load created spell');

    return { status: 'success', spell: row };
  } catch (error) {
    console.error('failed to add spell', error);
    const message = error instanceof Error ? error.message : 'Failed to add spell.';
    return { status: 'error', message };
  }
}

export async function addExistingSpell(
  _prev: AddSpellState,
  formData: FormData
): Promise<AddSpellState> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return { status: 'error', message: 'Unauthorized' };

    const characterId = formData.get('characterId');
    const spellId = formData.get('spellId');
    const knowledgeRaw = formData.get('knowledge');

    if (!characterId || typeof characterId !== 'string') {
      return { status: 'error', message: 'Character id is required.' };
    }
    if (!spellId || typeof spellId !== 'string') {
      return { status: 'error', message: 'Spell selection is required.' };
    }

    await ensureCharacterAccess(characterId, user.id);

    const knowledge =
      knowledgeRaw === 'PREPARED' ? SpellKnowledgeType.PREPARED : SpellKnowledgeType.KNOWN;

    const existing = await prisma.characterSpell.findUnique({
      where: {
        characterId_spellId_knowledge: {
          characterId,
          spellId,
          knowledge,
        },
      },
    });

    if (existing) {
      return { status: 'error', message: 'Spell already added for that list.' };
    }

    await prisma.characterSpell.create({
      data: {
        characterId,
        spellId,
        knowledge,
      },
    });

    if (knowledge === SpellKnowledgeType.PREPARED) {
      await prisma.characterSpell.upsert({
        where: {
          characterId_spellId_knowledge: {
            characterId,
            spellId,
            knowledge: SpellKnowledgeType.KNOWN,
          },
        },
        update: {},
        create: {
          characterId,
          spellId,
          knowledge: SpellKnowledgeType.KNOWN,
        },
      });
    }

    const row = await getSingleSpellRow(characterId, spellId);
    if (!row) throw new Error('Failed to load spell.');

    return { status: 'success', spell: row };
  } catch (error) {
    console.error('failed to attach spell', error);
    const message = error instanceof Error ? error.message : 'Failed to add spell.';
    return { status: 'error', message };
  }
}

export async function toggleSpellPrepared(params: {
  characterId: string;
  spellId: string;
  prepared: boolean;
}): Promise<UpdateSpellState> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return { status: 'error', message: 'Unauthorized' };

    const { characterId, spellId, prepared } = params;
    await ensureCharacterAccess(characterId, user.id);

    if (prepared) {
      await prisma.characterSpell.upsert({
        where: {
          characterId_spellId_knowledge: {
            characterId,
            spellId,
            knowledge: SpellKnowledgeType.PREPARED,
          },
        },
        update: {},
        create: {
          characterId,
          spellId,
          knowledge: SpellKnowledgeType.PREPARED,
        },
      });
      await prisma.characterSpell.upsert({
        where: {
          characterId_spellId_knowledge: {
            characterId,
            spellId,
            knowledge: SpellKnowledgeType.KNOWN,
          },
        },
        update: {},
        create: {
          characterId,
          spellId,
          knowledge: SpellKnowledgeType.KNOWN,
        },
      });
    } else {
      await prisma.characterSpell.upsert({
        where: {
          characterId_spellId_knowledge: {
            characterId,
            spellId,
            knowledge: SpellKnowledgeType.KNOWN,
          },
        },
        update: {},
        create: {
          characterId,
          spellId,
          knowledge: SpellKnowledgeType.KNOWN,
        },
      });
      await prisma.characterSpell.deleteMany({
        where: {
          characterId,
          spellId,
          knowledge: SpellKnowledgeType.PREPARED,
        },
      });
    }

    const row = await getSingleSpellRow(characterId, spellId);
    if (!row) throw new Error('Failed to load spell.');

    return { status: 'success', spell: row };
  } catch (error) {
    console.error('failed to toggle prepared spell', error);
    const message = error instanceof Error ? error.message : 'Failed to update spell.';
    return { status: 'error', message };
  }
}

export async function updateSpellNotes(
  _prev: UpdateSpellState,
  formData: FormData
): Promise<UpdateSpellState> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return { status: 'error', message: 'Unauthorized' };

    const characterId = formData.get('characterId');
    const spellId = formData.get('spellId');
    const notes = (formData.get('notes') as string | null)?.trim() || null;
    const targetKnowledgeRaw = formData.get('knowledge');

    if (!characterId || typeof characterId !== 'string' || !spellId || typeof spellId !== 'string') {
      return { status: 'error', message: 'Invalid spell update.' };
    }

    await ensureCharacterAccess(characterId, user.id);

    const knowledgePriority: SpellKnowledgeType[] =
      targetKnowledgeRaw === 'KNOWN'
        ? [SpellKnowledgeType.KNOWN, SpellKnowledgeType.PREPARED]
        : [SpellKnowledgeType.PREPARED, SpellKnowledgeType.KNOWN];

    const target = await prisma.characterSpell.findFirst({
      where: {
        characterId,
        spellId,
        knowledge: { in: knowledgePriority },
      },
      orderBy: { knowledge: 'desc' },
    });

    if (!target) return { status: 'error', message: 'Spell not found for this character.' };

    await prisma.characterSpell.update({
      where: { id: target.id },
      data: { notes },
    });

    const row = await getSingleSpellRow(characterId, spellId);
    if (!row) throw new Error('Failed to load spell.');

    return { status: 'success', spell: row };
  } catch (error) {
    console.error('failed to update spell notes', error);
    const message = error instanceof Error ? error.message : 'Failed to update spell.';
    return { status: 'error', message };
  }
}

export async function removeSpell(params: {
  characterId: string;
  spellId: string;
}): Promise<UpdateSpellState> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return { status: 'error', message: 'Unauthorized' };

    const { characterId, spellId } = params;
    await ensureCharacterAccess(characterId, user.id);

    const existing = await getSingleSpellRow(characterId, spellId);

    await prisma.characterSpell.deleteMany({
      where: { characterId, spellId },
    });

    if (!existing) {
      return { status: 'success', spell: await getSingleSpellRow(characterId, spellId) };
    }

    return { status: 'success', spell: existing };
  } catch (error) {
    console.error('failed to remove spell', error);
    const message = error instanceof Error ? error.message : 'Failed to remove spell.';
    return { status: 'error', message };
  }
}

export async function updateSpellSlots(
  _prev: UpdateSpellSlotState,
  formData: FormData
): Promise<UpdateSpellSlotState> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return { status: 'error', message: 'Unauthorized' };

    const characterId = formData.get('characterId');
    const levelRaw = formData.get('spellLevel');
    const maxSlotsRaw = formData.get('maxSlots');
    const currentSlotsRaw = formData.get('currentSlots');

    if (!characterId || typeof characterId !== 'string') {
      return { status: 'error', message: 'Character id is required.' };
    }
    const spellLevel = typeof levelRaw === 'string' ? Number(levelRaw) : NaN;
    const maxSlots = typeof maxSlotsRaw === 'string' ? Number(maxSlotsRaw) : NaN;
    const currentSlots = typeof currentSlotsRaw === 'string' ? Number(currentSlotsRaw) : NaN;

    if (!Number.isFinite(spellLevel) || spellLevel < 1 || spellLevel > 9) {
      return { status: 'error', message: 'Spell level must be between 1 and 9.' };
    }
    if (!Number.isFinite(maxSlots) || maxSlots < 0) {
      return { status: 'error', message: 'Max slots must be zero or more.' };
    }
    if (!Number.isFinite(currentSlots) || currentSlots < 0) {
      return { status: 'error', message: 'Remaining slots must be zero or more.' };
    }

    await ensureCharacterAccess(characterId, user.id);

    await prisma.characterSpellSlot.upsert({
      where: {
        characterId_spellLevel: {
          characterId,
          spellLevel,
        },
      },
      update: {
        maxSlots: Math.max(0, Math.floor(maxSlots)),
        currentSlots: Math.max(0, Math.min(Math.floor(currentSlots), Math.floor(maxSlots))),
      },
      create: {
        characterId,
        spellLevel,
        maxSlots: Math.max(0, Math.floor(maxSlots)),
        currentSlots: Math.max(0, Math.min(Math.floor(currentSlots), Math.floor(maxSlots))),
      },
    });

    const slots = await getCharacterSpellSlots(characterId, user.id);
    return { status: 'success', slots };
  } catch (error) {
    console.error('failed to update spell slots', error);
    const message = error instanceof Error ? error.message : 'Failed to update spell slots.';
    return { status: 'error', message };
  }
}
