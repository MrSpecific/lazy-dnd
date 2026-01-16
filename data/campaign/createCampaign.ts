'use server';

import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';

export type CreateCampaignState =
  | { status: 'idle'; message?: string; id?: string }
  | { status: 'success'; id: string; message?: string }
  | { status: 'error'; message: string; id?: string };

const normalizeString = (value: FormDataEntryValue | null) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const parsePlayers = (value: string) => {
  if (!value) return [] as string[];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((entry) => typeof entry === 'string').map((entry) => entry.trim());
    }
  } catch {
    // Fall back to comma-separated input.
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

export async function createCampaign(
  _prevState: CreateCampaignState,
  formData: FormData,
): Promise<CreateCampaignState> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return { status: 'error', message: 'Unauthorized' };

    const name = normalizeString(formData.get('name'));
    const description = normalizeString(formData.get('description')) || null;
    const playersRaw = normalizeString(formData.get('players'));

    if (!name) return { status: 'error', message: 'Campaign name is required.' };

    const playerInputs = Array.from(
      new Set(
        parsePlayers(playersRaw)
          .map((entry) => entry.trim())
          .filter(Boolean),
      ),
    );

    const playerMatches =
      playerInputs.length > 0
        ? await prisma.users_sync.findMany({
            where: {
              OR: playerInputs.flatMap((entry) => [
                { email: { equals: entry, mode: 'insensitive' } },
                { name: { equals: entry, mode: 'insensitive' } },
              ]),
            },
            select: { id: true },
          })
        : [];

    const playerIds = playerMatches.map((match) => match.id).filter((id) => id !== user.id);

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        ownerId: user.id,
        dms: {
          connect: { id: user.id },
        },
        ...(playerIds.length
          ? {
              players: {
                connect: playerIds.map((id) => ({ id })),
              },
            }
          : {}),
      },
      select: { id: true },
    });

    return { status: 'success', id: campaign.id };
  } catch (error) {
    console.error('failed to create campaign', error);
    const message = error instanceof Error ? error.message : 'Failed to create campaign.';
    return { status: 'error', message };
  }
}
