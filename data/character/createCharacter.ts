'use server';

import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';

export type CreateCharacterState =
  | { status: 'idle'; message?: string; id?: string }
  | { status: 'success'; id: string; message?: string }
  | { status: 'error'; message: string; id?: string };

const normalizeString = (value: FormDataEntryValue | null) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

export async function createCharacter(
  _prevState: CreateCharacterState,
  formData: FormData,
): Promise<CreateCharacterState> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return { status: 'error', message: 'Unauthorized' };

    const name = normalizeString(formData.get('name'));
    const classId = normalizeString(formData.get('class')) || null;
    const raceId = normalizeString(formData.get('race')) || null;

    if (!name) return { status: 'error', message: 'Name is required.' };

    const character = await prisma.character.create({
      data: {
        name,
        // Placeholder age until more details are collected later in the flow.
        age: 0,
        userId: user.id,
        raceId,
      },
    });

    if (classId) {
      await prisma.characterClassLevel.create({
        data: {
          characterId: character.id,
          classId,
          level: 1,
        },
      });
    }

    return { status: 'success', id: character.id };
  } catch (error) {
    console.error('failed to create character', error);
    const message = error instanceof Error ? error.message : 'Failed to create character.';
    return { status: 'error', message };
  }
}
