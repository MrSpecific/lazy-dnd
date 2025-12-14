'use server';

import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';

export type CreateNpcState =
  | { status: 'idle'; message?: string }
  | { status: 'success'; id: string; message?: string }
  | { status: 'error'; message: string };

const normalize = (value: FormDataEntryValue | null) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

export async function createNpc(_prev: CreateNpcState, formData: FormData): Promise<CreateNpcState> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return { status: 'error', message: 'Unauthorized' };

    const name = normalize(formData.get('name'));
    const title = normalize(formData.get('title')) || null;
    const description = normalize(formData.get('description')) || null;
    const raceId = normalize(formData.get('race')) || null;
    const classId = normalize(formData.get('class')) || null;

    if (!name) return { status: 'error', message: 'Name is required.' };

    const npc = await prisma.npc.create({
      data: {
        name,
        title,
        description,
        raceId,
        classId,
        createdById: user.id,
      },
      select: { id: true },
    });

    return { status: 'success', id: npc.id };
  } catch (error) {
    console.error('failed to create npc', error);
    const message = error instanceof Error ? error.message : 'Failed to create NPC.';
    return { status: 'error', message };
  }
}
