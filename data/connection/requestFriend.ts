'use server';

import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';
import { PlayerConnectionStatus } from '@prisma/client';

export type RequestFriendState =
  | { status: 'idle'; message?: string; addresseeId?: string }
  | { status: 'success'; message?: string; addresseeId: string }
  | { status: 'error'; message: string; addresseeId?: string };

const normalizeString = (value: FormDataEntryValue | null) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

export async function requestFriend(
  _prevState: RequestFriendState,
  formData: FormData,
): Promise<RequestFriendState> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return { status: 'error', message: 'Unauthorized' };

    const addresseeId = normalizeString(formData.get('addresseeId'));
    if (!addresseeId) {
      return { status: 'error', message: 'User id is required.' };
    }

    if (addresseeId === user.id) {
      return { status: 'error', message: 'You cannot friend yourself.' };
    }

    const addressee = await prisma.users_sync.findFirst({
      where: { id: addresseeId, deleted_at: null },
      select: { id: true },
    });

    if (!addressee) {
      return { status: 'error', message: 'User not found.' };
    }

    const existing = await prisma.playerConnection.findFirst({
      where: {
        OR: [
          { requesterId: user.id, addresseeId },
          { requesterId: addresseeId, addresseeId: user.id },
        ],
      },
      select: { status: true },
    });

    if (existing) {
      if (existing.status === PlayerConnectionStatus.ACCEPTED) {
        return { status: 'error', message: 'You are already connected.' };
      }
      if (existing.status === PlayerConnectionStatus.BLOCKED) {
        return { status: 'error', message: 'Unable to send a request.' };
      }
      return { status: 'error', message: 'Request already pending.' };
    }

    await prisma.playerConnection.create({
      data: {
        requesterId: user.id,
        addresseeId,
        status: PlayerConnectionStatus.PENDING,
      },
    });

    return { status: 'success', addresseeId };
  } catch (error) {
    console.error('failed to request friend', error);
    const message = error instanceof Error ? error.message : 'Failed to send request.';
    return { status: 'error', message };
  }
}
