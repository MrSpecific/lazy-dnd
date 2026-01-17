'use server';

import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';

export type UpdateArmorClassState =
  | { status: 'idle'; message?: string }
  | { status: 'success'; armorClass: number | null; speed: number | null }
  | { status: 'error'; message: string };

const parseIntOrNull = (value: FormDataEntryValue | null) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? Math.round(num) : null;
};

export async function updateArmorClass(
  _prev: UpdateArmorClassState,
  formData: FormData
): Promise<UpdateArmorClassState> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return { status: 'error', message: 'Unauthorized' };

    const characterId = formData.get('characterId');
    if (!characterId || typeof characterId !== 'string') {
      return { status: 'error', message: 'Character id is required.' };
    }

    const mode = ((formData.get('mode') as string | null) ?? '').toLowerCase();

    const character = await prisma.character.findUnique({
      where: { id: characterId, userId: user.id },
      include: {
        abilities: true,
        inventory: { include: { item: true } },
      },
    });
    if (!character) return { status: 'error', message: 'Character not found.' };

    if (mode === 'compute') {
      const dex = character.abilities.find((a) => a.ability === 'DEX');
      const dexScore =
        dex?.baseScore !== undefined ? dex.baseScore + dex.bonus + dex.temporary : null;
      const dexMod = dexScore != null ? Math.floor((dexScore - 10) / 2) : 0;

      const parseArmorClassFromDescription = (description: string | null) => {
        if (!description) return null;
        const acMatch = description.match(/\b(?:ac|armor class)\s*[:=]?\s*(\d{1,2})\b/i);
        return acMatch ? Number(acMatch[1]) : null;
      };

      const equippedArmorValues = character.inventory
        .filter((ci) => ci.equipped)
        .map((ci) => {
          const armorClass =
            ci.item?.armorClass ?? parseArmorClassFromDescription(ci.item?.description ?? null);
          return typeof armorClass === 'number' && Number.isFinite(armorClass) ? armorClass : null;
        })
        .filter((value): value is number => value != null);

      const baseCandidates = equippedArmorValues.filter((value) => value >= 10);
      const baseArmor = baseCandidates.length ? Math.max(...baseCandidates) : 10;
      const bonusArmor = equippedArmorValues.filter((value) =>
        baseCandidates.length ? value < 10 : value > 0
      );
      const totalArmorBonus = bonusArmor.reduce((sum, value) => sum + value, 0);

      const computedAc = baseArmor + dexMod + totalArmorBonus;
      const computedSpeed = character.speed ?? 30;

      return { status: 'success', armorClass: computedAc, speed: computedSpeed };
    }

    const armorClass = parseIntOrNull(formData.get('armorClass'));
    if (armorClass === null) return { status: 'error', message: 'Armor Class is required.' };

    const speed = parseIntOrNull(formData.get('speed'));

    const updated = await prisma.character.update({
      where: { id: characterId },
      data: { armorClass, speed },
      select: { armorClass: true, speed: true },
    });

    return { status: 'success', armorClass: updated.armorClass, speed: updated.speed };
  } catch (error) {
    console.error('failed to update armor class', error);
    const message = error instanceof Error ? error.message : 'Failed to update armor class.';
    return { status: 'error', message };
  }
}
