'use server';

import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';
import { Alignment, Gender } from '@prisma/client';

export type UpdateCharacterState =
  | { status: 'idle'; message?: string }
  | { status: 'success'; message?: string; name: string; raceId: string | null; gender: Gender | null; alignment: Alignment | null }
  | { status: 'error'; message: string };

const normalize = (value: FormDataEntryValue | null) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

export async function updateCharacter(
  _prev: UpdateCharacterState,
  formData: FormData,
): Promise<UpdateCharacterState> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return { status: 'error', message: 'Unauthorized' };

    const characterId = normalize(formData.get('characterId'));
    const name = normalize(formData.get('name'));
    const raceId = normalize(formData.get('race')) || null;
    const genderRaw = normalize(formData.get('gender')) || null;
    const alignmentRaw = normalize(formData.get('alignment')) || null;

    if (!characterId) return { status: 'error', message: 'Character id is required.' };
    if (!name) return { status: 'error', message: 'Name is required.' };

    const character = await prisma.character.findUnique({
      where: { id: characterId },
      select: { userId: true },
    });
    if (!character || character.userId !== user.id) {
      return { status: 'error', message: 'Character not found.' };
    }

    const gender = genderRaw && genderRaw in Gender ? (genderRaw as Gender) : null;
    const alignment = alignmentRaw && alignmentRaw in Alignment ? (alignmentRaw as Alignment) : null;

    const updated = await prisma.character.update({
      where: { id: characterId },
      data: {
        name,
        raceId,
        gender,
        alignment,
      },
      select: {
        name: true,
        raceId: true,
        gender: true,
        alignment: true,
      },
    });

    return { status: 'success', ...updated };
  } catch (error) {
    console.error('failed to update character', error);
    const message = error instanceof Error ? error.message : 'Failed to update character.';
    return { status: 'error', message };
  }
}
