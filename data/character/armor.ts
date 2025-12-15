'use server';

import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';
import { EquipmentSlot } from '@prisma/client';

export type ArmorEntry = {
  id: string;
  name: string;
  description: string | null;
  weight: number | null;
  slot: EquipmentSlot | null;
  equipped: boolean;
  armorClass: number | null;
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

const ensureCharacterAccess = async (characterId: string, userId: string) => {
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    select: { userId: true },
  });

  if (!character || character.userId !== userId) {
    throw new Error('Character not found or access denied');
  }
};

export async function getCharacterArmor(characterId: string): Promise<ArmorEntry[]> {
  const user = await stackServerApp.getUser();
  if (!user) throw new Error('Unauthorized');

  await ensureCharacterAccess(characterId, user.id);

  const items = await prisma.characterItem.findMany({
    where: { characterId, slot: { in: ['HEAD', 'CHEST', 'HANDS', 'FEET', 'BACK', 'NECK', 'FINGER', 'OTHER'] } },
    include: { item: true },
    orderBy: { item: { name: 'asc' } },
  });

  return items.map((ci) => ({
    id: ci.id,
    name: ci.item.name,
    description: ci.item.description,
    weight: ci.item.weight,
    slot: ci.slot,
    equipped: ci.equipped,
    armorClass: ci.item.armorClass ?? null,
  }));
}

export async function getArmorCatalog(): Promise<ArmorCatalogItem[]> {
  const user = await stackServerApp.getUser();
  if (!user) throw new Error('Unauthorized');

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
  formData: FormData,
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

    const slotValue =
      typeof slot === 'string' && slot ? (slot as EquipmentSlot) : null;

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
        description: item.description,
        weight: item.weight,
        slot: characterItem.slot,
        equipped: characterItem.equipped,
        armorClass: item.armorClass ?? null,
      },
    };
  } catch (error) {
    console.error('failed to attach armor', error);
    const message = error instanceof Error ? error.message : 'Failed to add armor.';
    return { status: 'error', message };
  }
}
