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

      const equippedArmor = character.inventory
        .filter((ci) => ci.equipped && ci.item.type === 'ARMOR' && ci.item.armorClass != null)
        .sort((a, b) => (b.item.armorClass ?? 0) - (a.item.armorClass ?? 0))[0];

      const shieldBonus =
        character.inventory
          .filter(
            (ci) =>
              ci.equipped &&
              ci.item.type === 'ARMOR' &&
              (ci.item?.name?.toLowerCase().includes('shield') || ci.slot === 'OFF_HAND') &&
              ci.item.armorClass != null
          )
          .reduce((max, ci) => Math.max(max, ci.item.armorClass ?? 0), 0) || 0;

      const baseArmor =
        equippedArmor?.item.armorClass != null
          ? (equippedArmor.item.armorClass as number) + Math.max(dexMod, 0)
          : 10 + dexMod;

      const computedAc = baseArmor + shieldBonus;
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
