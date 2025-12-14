'use server';

import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';
import { Alignment, Gender } from '@prisma/client';

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
    const genderRaw = normalizeString(formData.get('gender')) || null;
    const alignmentRaw = normalizeString(formData.get('alignment')) || null;

    if (!name) return { status: 'error', message: 'Name is required.' };

    const gender = genderRaw && genderRaw in Gender ? (genderRaw as Gender) : null;
    const alignment = alignmentRaw && alignmentRaw in Alignment ? (alignmentRaw as Alignment) : null;

    const character = await prisma.character.create({
      data: {
        name,
        // Placeholder age until more details are collected later in the flow.
        age: 0,
        userId: user.id,
        raceId,
        gender,
        alignment,
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
