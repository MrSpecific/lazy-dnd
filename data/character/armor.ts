'use server';

import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';
import { EquipmentSlot } from '@prisma/client';

export type ArmorEntry = {
  id: string;
  name: string;
  baseName?: string | null;
  description: string | null;
  weight: number | null;
  slot: EquipmentSlot | null;
  equipped: boolean;
  armorClass: number | null;
  customName?: string | null;
  customDescription?: string | null;
  notes?: string | null;
  condition?: string | null;
};

export type ArmorCatalogItem = {
  id: string;
  name: string;
  description: string | null;
  weight: number | null;
  armorClass: number | null;
};

export type AddArmorState =
  | { status: 'idle'; message?: string }
  | { status: 'success'; message?: string; armor: ArmorEntry }
  | { status: 'error'; message: string };

export type UpdateArmorState =
  | { status: 'idle'; message?: string }
  | { status: 'success'; armor: ArmorEntry }
  | { status: 'error'; message: string };

export type RemoveArmorState =
  | { status: 'idle'; message?: string }
  | { status: 'success'; armorId: string }
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

export async function getCharacterArmor(
  characterId: string,
  userId?: string
): Promise<ArmorEntry[]> {
  const resolvedUserId = userId ?? (await stackServerApp.getUser())?.id;
  if (!resolvedUserId) throw new Error('Unauthorized');

  await ensureCharacterAccess(characterId, resolvedUserId);

  const items = await prisma.characterItem.findMany({
    where: {
      characterId,
      slot: { in: ['HEAD', 'CHEST', 'HANDS', 'FEET', 'BACK', 'NECK', 'FINGER', 'OTHER'] },
    },
    include: { item: true },
    orderBy: { item: { name: 'asc' } },
  });

  return items.map((ci) => ({
    id: ci.id,
    name: ci.customName ?? ci.item?.name ?? 'Armor Name',
    baseName: ci.item?.name ?? null,
    description: ci.customDescription ?? ci.item?.description ?? 'No description.',
    weight: ci.item?.weight ?? null,
    slot: ci.slot,
    equipped: ci.equipped,
    armorClass: ci.item?.armorClass ?? null,
    customName: ci.customName,
    customDescription: ci.customDescription,
    notes: ci.notes,
    condition: ci.condition,
  }));
}

export async function getArmorCatalog(userId?: string): Promise<ArmorCatalogItem[]> {
  const resolvedUserId = userId ?? (await stackServerApp.getUser())?.id;
  if (!resolvedUserId) throw new Error('Unauthorized');

  const items = await prisma.item.findMany({
    where: { isConsumable: false, type: 'ARMOR' },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      weight: true,
      armorClass: true,
    },
  });

  return items;
}

export async function addExistingArmor(
  _prev: AddArmorState,
  formData: FormData
): Promise<AddArmorState> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return { status: 'error', message: 'Unauthorized' };

    const characterId = formData.get('characterId');
    const itemId = formData.get('itemId');
    const slot = formData.get('slot');

    if (!characterId || typeof characterId !== 'string') {
      return { status: 'error', message: 'Character id is required.' };
    }
    if (!itemId || typeof itemId !== 'string') {
      return { status: 'error', message: 'Armor selection is required.' };
    }

    await ensureCharacterAccess(characterId, user.id);

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) return { status: 'error', message: 'Armor not found.' };

    const slotValue = typeof slot === 'string' && slot ? (slot as EquipmentSlot) : null;

    const characterItem = await prisma.characterItem.create({
      data: {
        characterId,
        itemId,
        slot: slotValue,
        equipped: false,
      },
    });

    return {
      status: 'success',
      armor: {
        id: characterItem.id,
        name: item.name,
        baseName: item.name,
        description: item.description,
        weight: item.weight,
        slot: characterItem.slot,
        equipped: characterItem.equipped,
        armorClass: item.armorClass ?? null,
        customName: characterItem.customName,
        customDescription: characterItem.customDescription,
        notes: characterItem.notes,
        condition: characterItem.condition,
      },
    };
  } catch (error) {
    console.error('failed to attach armor', error);
    const message = error instanceof Error ? error.message : 'Failed to add armor.';
    return { status: 'error', message };
  }
}

export async function updateArmor(
  _prev: UpdateArmorState,
  formData: FormData
): Promise<UpdateArmorState> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return { status: 'error', message: 'Unauthorized' };

    const characterItemId = formData.get('characterItemId');
    if (!characterItemId || typeof characterItemId !== 'string') {
      return { status: 'error', message: 'Character item id is required.' };
    }

    const equipped = formData.get('equipped') === 'true';
    const slotRaw = formData.get('slot');
    const slot =
      typeof slotRaw === 'string' &&
      ['HEAD', 'CHEST', 'HANDS', 'FEET', 'BACK', 'NECK', 'FINGER', 'OTHER'].includes(slotRaw)
        ? (slotRaw as EquipmentSlot)
        : null;
    const customName = (formData.get('customName') as string | null)?.trim() || null;
    const customDescription = (formData.get('customDescription') as string | null)?.trim() || null;
    const notes = (formData.get('notes') as string | null)?.trim() || null;
    const condition = (formData.get('condition') as string | null)?.trim() || null;

    const existing = await prisma.characterItem.findUnique({
      where: { id: characterItemId },
      include: { character: true, item: true },
    });

    if (!existing || existing.character.userId !== user.id) {
      return { status: 'error', message: 'Armor not found.' };
    }

    const updated = await prisma.characterItem.update({
      where: { id: characterItemId },
      data: {
        equipped,
        slot,
        customName,
        customDescription,
        notes,
        condition,
      },
      include: { item: true },
    });

    return {
      status: 'success',
      armor: {
        id: updated.id,
        name: updated.customName ?? updated.item?.name ?? 'Armor Name',
        baseName: updated.item?.name ?? null,
        description: updated.customDescription ?? updated.item?.description ?? 'No description.',
        weight: updated.item?.weight ?? null,
        slot: updated.slot,
        equipped: updated.equipped,
        armorClass: updated.item?.armorClass ?? null,
        customName: updated.customName,
        customDescription: updated.customDescription,
        notes: updated.notes,
        condition: updated.condition,
      },
    };
  } catch (error) {
    console.error('failed to update armor', error);
    const message = error instanceof Error ? error.message : 'Failed to update armor.';
    return { status: 'error', message };
  }
}

export async function removeArmor(params: {
  characterId: string;
  armorId: string;
}): Promise<RemoveArmorState> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return { status: 'error', message: 'Unauthorized' };

    const { characterId, armorId } = params;
    await ensureCharacterAccess(characterId, user.id);

    const existing = await prisma.characterItem.findUnique({
      where: { id: armorId },
      select: { id: true, characterId: true },
    });

    if (!existing || existing.characterId !== characterId) {
      return { status: 'error', message: 'Armor not found.' };
    }

    await prisma.characterItem.delete({ where: { id: armorId } });

    return { status: 'success', armorId };
  } catch (error) {
    console.error('failed to remove armor', error);
    const message = error instanceof Error ? error.message : 'Failed to remove armor.';
    return { status: 'error', message };
  }
}
