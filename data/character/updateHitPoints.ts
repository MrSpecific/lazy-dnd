'use server';

import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';
import { AbilityType } from '@prisma/client';

export type UpdateHpState =
  | { status: 'idle'; message?: string }
  | {
      status: 'success';
      baseHp: number | null;
      maxHp: number | null;
      currentHp: number | null;
      tempHp: number | null;
      message?: string;
    }
  | { status: 'error'; message: string };

const parseIntOrNull = (value: FormDataEntryValue | null) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? Math.round(num) : null;
};

const scoreToMod = (score: number | null | undefined) =>
  score == null ? 0 : Math.floor((score - 10) / 2);

const computeHp = (hitDie: number, level: number, conMod: number) => {
  if (level <= 0) return 0;
  const firstLevel = hitDie + conMod;
  if (level === 1) return firstLevel;
  const perLevel = Math.floor(hitDie / 2) + 1 + conMod;
  return firstLevel + perLevel * (level - 1);
};

export async function updateHitPoints(
  _prev: UpdateHpState,
  formData: FormData
): Promise<UpdateHpState> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return { status: 'error', message: 'Unauthorized' };

    const characterId = (formData.get('characterId') as string | null) ?? '';
    if (!characterId) return { status: 'error', message: 'Character id is required.' };

    const mode = ((formData.get('mode') as string | null) ?? '').toLowerCase();

    const character = await prisma.character.findUnique({
      where: { id: characterId, userId: user.id },
      include: {
        classLevels: {
          include: { class: true },
        },
        abilities: true,
      },
    });
    if (!character) return { status: 'error', message: 'Character not found.' };

    const existing = {
      baseHp: character.baseHp ?? null,
      maxHp: character.maxHp ?? null,
      currentHp: character.currentHp ?? null,
      tempHp: character.tempHp ?? null,
    };

    const con = character.abilities.find((a) => a.ability === AbilityType.CON);
    const conScore = con ? con.baseScore + con.bonus + con.temporary : null;
    const conMod = scoreToMod(conScore);
    const level = character.classLevels.reduce((sum, cl) => sum + (cl.level ?? 0), 0) || 1;
    const primaryClass = character.classLevels[0]?.class;
    const hitDie = primaryClass?.hitDie ?? 8;

    let baseHp = existing.baseHp;
    let maxHp = existing.maxHp;
    let currentHp = existing.currentHp;
    let tempHp = existing.tempHp;

    if (mode === 'compute') {
      const computed = computeHp(hitDie, level, conMod);
      baseHp = computed;
      maxHp = computed;
      if (currentHp == null) currentHp = computed;
      if (tempHp == null) tempHp = 0;
    } else {
      baseHp = parseIntOrNull(formData.get('baseHp')) ?? existing.baseHp;
      maxHp = parseIntOrNull(formData.get('maxHp')) ?? existing.maxHp;
      currentHp = parseIntOrNull(formData.get('currentHp')) ?? existing.currentHp;
      tempHp = parseIntOrNull(formData.get('tempHp')) ?? existing.tempHp;
    }

    const updated = await prisma.character.update({
      where: { id: characterId },
      data: {
        // baseHp is not persisted yet; use maxHp/current/temp for storage
        maxHp,
        currentHp,
        tempHp,
      },
      select: {
        maxHp: true,
        currentHp: true,
        tempHp: true,
      },
    });

    return {
      status: 'success',
      baseHp,
      maxHp: updated.maxHp,
      currentHp: updated.currentHp,
      tempHp: updated.tempHp,
    };
  } catch (error) {
    console.error('failed to update hit points', error);
    const message = error instanceof Error ? error.message : 'Failed to update hit points.';
    return { status: 'error', message };
  }
}
