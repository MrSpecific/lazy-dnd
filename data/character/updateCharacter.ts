'use server';

import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';
import { Alignment, Gender } from '@prisma/client';

export type UpdateCharacterState =
  | { status: 'idle'; message?: string }
  | {
      status: 'success';
      message?: string;
      name: string;
      raceId: string | null;
      gender: Gender | null;
      alignment: Alignment | null;
    }
  | { status: 'error'; message: string };

const normalize = (value: FormDataEntryValue | null) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

export async function updateCharacter(
  _prev: UpdateCharacterState,
  formData: FormData
): Promise<UpdateCharacterState> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return { status: 'error', message: 'Unauthorized' };

    // Safety net: ensure enums exist in the database (some envs may be missing the enum types)
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE n.nspname = 'public' AND t.typname = 'Gender'
        ) THEN
          CREATE TYPE "public"."Gender" AS ENUM ('MALE','FEMALE','NON_BINARY','OTHER');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE n.nspname = 'public' AND t.typname = 'Alignment'
        ) THEN
          CREATE TYPE "public"."Alignment" AS ENUM (
            'LAWFUL_GOOD','NEUTRAL_GOOD','CHAOTIC_GOOD',
            'LAWFUL_NEUTRAL','TRUE_NEUTRAL','CHAOTIC_NEUTRAL',
            'LAWFUL_EVIL','NEUTRAL_EVIL','CHAOTIC_EVIL'
          );
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'Character' AND column_name = 'gender' AND udt_name = 'Gender'
        ) THEN
          ALTER TABLE "public"."Character"
          ALTER COLUMN "gender" TYPE "public"."Gender"
          USING "gender"::text::"public"."Gender";
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'Character' AND column_name = 'alignment' AND udt_name = 'Alignment'
        ) THEN
          ALTER TABLE "public"."Character"
          ALTER COLUMN "alignment" TYPE "public"."Alignment"
          USING "alignment"::text::"public"."Alignment";
        END IF;
      END $$;
    `);

    const characterId = normalize(formData.get('characterId'));
    const name = normalize(formData.get('name'));
    const raceId = normalize(formData.get('race')) || null;
    const genderRaw = normalize(formData.get('gender')) || null;
    const alignmentRaw = normalize(formData.get('alignment')) || null;

    if (!characterId) return { status: 'error', message: 'Character id is required.' };
    // if (!name) return { status: 'error', message: 'Name is required.' };

    const character = await prisma.character.findUnique({
      where: { id: characterId },
      select: { userId: true, name: true, raceId: true, gender: true, alignment: true },
    });
    if (!character || character.userId !== user.id) {
      return { status: 'error', message: 'Character not found.' };
    }

    const nameToSave = name || character.name;
    if (!nameToSave?.trim()) {
      return { status: 'error', message: 'Name is required.' };
    }

    const gender = genderRaw && genderRaw in Gender ? (genderRaw as Gender) : null;
    const alignment =
      alignmentRaw && alignmentRaw in Alignment ? (alignmentRaw as Alignment) : null;

    const updated = await prisma.character.update({
      where: { id: characterId },
      data: {
        name: nameToSave,
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
