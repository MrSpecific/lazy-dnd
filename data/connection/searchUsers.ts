'use server';

import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';
import { PlayerConnectionStatus } from '@prisma/client';

export type UserSearchResult = {
  id: string;
  name: string | null;
  email: string | null;
  connectionStatus: PlayerConnectionStatus | null;
  connectionDirection: 'outgoing' | 'incoming' | null;
};

export type SearchUsersState =
  | { status: 'idle'; message?: string; results: UserSearchResult[] }
  | { status: 'success'; message?: string; results: UserSearchResult[] }
  | { status: 'error'; message: string; results: UserSearchResult[] };

const normalizeString = (value: FormDataEntryValue | null) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

export async function searchUsers(
  _prevState: SearchUsersState,
  formData: FormData,
): Promise<SearchUsersState> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return { status: 'error', message: 'Unauthorized', results: [] };

    const query = normalizeString(formData.get('query'));
    if (query.length < 2) {
      return { status: 'error', message: 'Enter at least 2 characters.', results: [] };
    }

    const users = await prisma.users_sync.findMany({
      where: {
        id: { not: user.id },
        deleted_at: null,
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
      take: 10,
    });

    if (!users.length) {
      return { status: 'success', results: [] };
    }

    const ids = users.map((candidate) => candidate.id);
    const connections = await prisma.playerConnection.findMany({
      where: {
        OR: [
          { requesterId: user.id, addresseeId: { in: ids } },
          { addresseeId: user.id, requesterId: { in: ids } },
        ],
      },
      select: {
        requesterId: true,
        addresseeId: true,
        status: true,
      },
    });

    const connectionMap = new Map<
      string,
      { status: PlayerConnectionStatus; direction: 'outgoing' | 'incoming' }
    >();
    connections.forEach((connection) => {
      const direction = connection.requesterId === user.id ? 'outgoing' : 'incoming';
      const otherId = direction === 'outgoing' ? connection.addresseeId : connection.requesterId;
      connectionMap.set(otherId, { status: connection.status, direction });
    });

    const results = users.map((candidate) => {
      const connection = connectionMap.get(candidate.id);
      return {
        id: candidate.id,
        name: candidate.name ?? null,
        email: candidate.email ?? null,
        connectionStatus: connection?.status ?? null,
        connectionDirection: connection?.direction ?? null,
      };
    });

    return { status: 'success', results };
  } catch (error) {
    console.error('failed to search users', error);
    const message = error instanceof Error ? error.message : 'Failed to search users.';
    return { status: 'error', message, results: [] };
  }
}
