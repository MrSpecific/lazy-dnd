'use server';

import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';
import { EquipmentSlot, ItemRarity } from '@prisma/client';

export type WeaponEntry = {
  id: string;
  name: string;
  description: string | null;
  weight: number | null;
  slot: EquipmentSlot | null;
  equipped: boolean;
};

export type WeaponCatalogItem = {
  id: string;
  name: string;
  description: string | null;
  weight: number | null;
};

export type AddWeaponState =
  | { status: 'idle'; message?: string }
  | { status: 'success'; message?: string; weapon: WeaponEntry }
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

export async function getCharacterWeapons(characterId: string): Promise<WeaponEntry[]> {
  const user = await stackServerApp.getUser();
  if (!user) throw new Error('Unauthorized');

  await ensureCharacterAccess(characterId, user.id);

  const items = await prisma.characterItem.findMany({
    where: { characterId, slot: { in: ['MAIN_HAND', 'OFF_HAND', 'TWO_HANDED'] } },
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
  }));
}

export async function getWeaponCatalog(): Promise<WeaponCatalogItem[]> {
  const user = await stackServerApp.getUser();
  if (!user) throw new Error('Unauthorized');

  const items = await prisma.item.findMany({
    where: { isConsumable: false },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      weight: true,
    },
  });

  return items;
}

export async function addWeapon(
  _prev: AddWeaponState,
  formData: FormData,
): Promise<AddWeaponState> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return { status: 'error', message: 'Unauthorized' };

    const characterId = formData.get('characterId');
    const name = formData.get('name');
    const damage = formData.get('damage');
    const properties = formData.get('properties');
    const weight = formData.get('weight');
    const slot = formData.get('slot');

    if (!characterId || typeof characterId !== 'string') {
      return { status: 'error', message: 'Character id is required.' };
    }

    await ensureCharacterAccess(characterId, user.id);

    if (!name || typeof name !== 'string' || !name.trim()) {
      return { status: 'error', message: 'Weapon name is required.' };
    }

    const descriptionParts: string[] = [];
    if (damage && typeof damage === 'string' && damage.trim()) descriptionParts.push(`Damage: ${damage.trim()}`);
    if (properties && typeof properties === 'string' && properties.trim()) descriptionParts.push(properties.trim());

    const description = descriptionParts.length ? descriptionParts.join(' | ') : null;
    const parsedWeight = typeof weight === 'string' && weight.trim() ? Number(weight) : null;
    const slotValue =
      typeof slot === 'string' && ['MAIN_HAND', 'OFF_HAND', 'TWO_HANDED'].includes(slot) ? (slot as EquipmentSlot) : null;

    const item = await prisma.item.create({
      data: {
        name: name.trim(),
        description,
        weight: Number.isNaN(parsedWeight) ? null : parsedWeight,
        rarity: ItemRarity.COMMON,
        isConsumable: false,
      },
    });

    const characterItem = await prisma.characterItem.create({
      data: {
        characterId,
        itemId: item.id,
        slot: slotValue,
        equipped: false,
      },
    });

    return {
      status: 'success',
      weapon: {
        id: characterItem.id,
        name: item.name,
        description: item.description,
        weight: item.weight,
        slot: characterItem.slot,
        equipped: characterItem.equipped,
      },
    };
  } catch (error) {
    console.error('failed to add weapon', error);
    const message = error instanceof Error ? error.message : 'Failed to add weapon.';
    return { status: 'error', message };
  }
}

export async function addExistingWeapon(
  _prev: AddWeaponState,
  formData: FormData,
): Promise<AddWeaponState> {
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
      return { status: 'error', message: 'Weapon selection is required.' };
    }

    await ensureCharacterAccess(characterId, user.id);

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) return { status: 'error', message: 'Weapon not found.' };

    const slotValue =
      typeof slot === 'string' && ['MAIN_HAND', 'OFF_HAND', 'TWO_HANDED'].includes(slot) ? (slot as EquipmentSlot) : null;

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
      weapon: {
        id: characterItem.id,
        name: item.name,
        description: item.description,
        weight: item.weight,
        slot: characterItem.slot,
        equipped: characterItem.equipped,
      },
    };
  } catch (error) {
    console.error('failed to attach weapon', error);
    const message = error instanceof Error ? error.message : 'Failed to add weapon.';
    return { status: 'error', message };
  }
}
