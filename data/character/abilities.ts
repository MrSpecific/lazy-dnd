'use server';

import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';
import { AbilityType } from '@prisma/client';
import { ABILITY_TYPES } from '@/lib/helpers/abilities';

export type CharacterAbilityRow = {
  ability: AbilityType;
  baseScore: number;
  bonus: number;
  temporary: number;
};

export type SaveAbilitiesState =
  | { status: 'idle'; message?: string }
  | { status: 'success'; message?: string }
  | { status: 'error'; message: string };

export async function getCharacterAbilities(characterId: string) {
  const user = await stackServerApp.getUser();
  if (!user) throw new Error('Unauthorized');

  const character = await prisma.character.findUnique({
    where: { id: characterId },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!character || character.userId !== user.id) {
    throw new Error('Character not found or access denied');
  }

  const abilities = await prisma.characterAbility.findMany({
    where: { characterId },
  });

  const abilityMap: Record<AbilityType, CharacterAbilityRow> = Object.fromEntries(
    ABILITY_TYPES.map((ability) => [
      ability,
      {
        ability,
        baseScore: 8,
        bonus: 0,
        temporary: 0,
      },
    ])
  ) as Record<AbilityType, CharacterAbilityRow>;

  abilities.forEach((ability) => {
    abilityMap[ability.ability] = {
      ability: ability.ability,
      baseScore: ability.baseScore,
      bonus: ability.bonus,
      temporary: ability.temporary,
    };
  });

  return Object.values(abilityMap);
}

export async function saveCharacterAbilities(
  _prev: SaveAbilitiesState,
  formData: FormData
): Promise<SaveAbilitiesState> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return { status: 'error', message: 'Unauthorized' };

    const characterId = formData.get('characterId');
    if (!characterId || typeof characterId !== 'string') {
      return { status: 'error', message: 'Character id is required.' };
    }

    const character = await prisma.character.findUnique({
      where: { id: characterId },
      select: { userId: true },
    });
    if (!character || character.userId !== user.id) {
      return { status: 'error', message: 'Character not found.' };
    }

    const updates: { ability: AbilityType; baseScore: number }[] = [];

    for (const ability of ABILITY_TYPES) {
      const raw = formData.get(`ability-${ability}`);
      if (raw == null) continue;

      const parsed = Number(raw);
      if (Number.isNaN(parsed)) continue;

      const score = clamp(Math.round(parsed), 1, 30);
      updates.push({ ability, baseScore: score });
    }

    if (!updates.length) {
      return { status: 'error', message: 'No ability scores provided.' };
    }

    await prisma.$transaction(async (tx) => {
      await Promise.all(
        updates.map((row) =>
          tx.characterAbility.upsert({
            where: {
              characterId_ability: {
                characterId,
                ability: row.ability,
              },
            },
            create: {
              characterId,
              ability: row.ability,
              baseScore: row.baseScore,
              bonus: 0,
              temporary: 0,
            },
            update: {
              baseScore: row.baseScore,
            },
          })
        )
      );
    });

    return { status: 'success' };
  } catch (error) {
    console.error('failed to save abilities', error);
    const message = error instanceof Error ? error.message : 'Failed to save abilities.';
    return { status: 'error', message };
  }
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
