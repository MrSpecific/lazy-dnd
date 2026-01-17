'use server';

import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';

export type CreatePartyState =
  | { status: 'idle'; message?: string; id?: string }
  | { status: 'success'; id: string; message?: string }
  | { status: 'error'; message: string };

const normalizeString = (value: FormDataEntryValue | null) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const parseCharacterIds = (value: FormDataEntryValue | null) => {
  if (typeof value !== 'string') return [] as string[];
  const trimmed = value.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.filter((entry) => typeof entry === 'string').map((entry) => entry.trim());
    }
  } catch {
    // Fall back to comma-separated list.
  }
  return trimmed
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

export async function createParty(
  _prevState: CreatePartyState,
  formData: FormData,
): Promise<CreatePartyState> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return { status: 'error', message: 'Unauthorized' };

    const campaignId = normalizeString(formData.get('campaignId'));
    const name = normalizeString(formData.get('partyName'));
    const description = normalizeString(formData.get('description')) || null;
    const characterIds = Array.from(new Set(parseCharacterIds(formData.get('characterIds'))));

    if (!campaignId) return { status: 'error', message: 'Campaign id is required.' };
    if (!name) return { status: 'error', message: 'Party name is required.' };
    if (!characterIds.length) {
      return { status: 'error', message: 'Choose at least one character.' };
    }

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        players: { some: { id: user.id } },
      },
      select: { id: true },
    });

    if (!campaign) {
      return { status: 'error', message: 'Campaign invite not found.' };
    }

    const ownedCharacters = await prisma.character.findMany({
      where: { id: { in: characterIds }, userId: user.id },
      select: { id: true },
    });

    if (!ownedCharacters.length) {
      return { status: 'error', message: 'No valid characters selected.' };
    }

    const party = await prisma.playerParty.create({
      data: {
        name,
        description,
        ownerId: user.id,
        campaigns: { connect: { id: campaignId } },
        characters: { connect: ownedCharacters.map((character) => ({ id: character.id })) },
      },
      select: { id: true },
    });

    return { status: 'success', id: party.id };
  } catch (error) {
    console.error('failed to create party', error);
    const message = error instanceof Error ? error.message : 'Failed to create party.';
    return { status: 'error', message };
  }
}
