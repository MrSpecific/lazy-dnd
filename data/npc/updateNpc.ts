'use server';

import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';
import { Alignment, Gender } from '@prisma/client';

export type UpdateNpcState =
  | { status: 'idle'; message?: string }
  | { status: 'success'; npc: NpcResponse }
  | { status: 'error'; message: string };

export type NpcResponse = {
  id: string;
  name: string;
  title: string | null;
  description: string | null;
  raceId: string | null;
  classId: string | null;
  gender: Gender | null;
  alignment: Alignment | null;
  statBlock: {
    armorClass: number | null;
    maxHp: number | null;
    speed: number | null;
    strength: number | null;
    dexterity: number | null;
    constitution: number | null;
    intelligence: number | null;
    wisdom: number | null;
    charisma: number | null;
  } | null;
};

const parseIntOrNull = (value: FormDataEntryValue | null) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? Math.round(num) : null;
};

export async function updateNpc(_prev: UpdateNpcState, formData: FormData): Promise<UpdateNpcState> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return { status: 'error', message: 'Unauthorized' };

    const npcId = formData.get('npcId');
    if (!npcId || typeof npcId !== 'string') return { status: 'error', message: 'NPC id is required.' };

    const name = (formData.get('name') as string | null)?.trim() || '';
    if (!name) return { status: 'error', message: 'Name is required.' };

    const title = (formData.get('title') as string | null)?.trim() || null;
    const description = (formData.get('description') as string | null)?.trim() || null;
    const raceId = ((formData.get('race') as string | null)?.trim() || null) || null;
    const classId = ((formData.get('class') as string | null)?.trim() || null) || null;
    const genderRaw = (formData.get('gender') as string | null)?.trim() || null;
    const alignmentRaw = (formData.get('alignment') as string | null)?.trim() || null;

    const gender = genderRaw && genderRaw in Gender ? (genderRaw as Gender) : null;
    const alignment = alignmentRaw && alignmentRaw in Alignment ? (alignmentRaw as Alignment) : null;

    const armorClass = parseIntOrNull(formData.get('ac'));
    const maxHp = parseIntOrNull(formData.get('maxHp'));
    const speed = parseIntOrNull(formData.get('speed'));
    const strength = parseIntOrNull(formData.get('strength'));
    const dexterity = parseIntOrNull(formData.get('dexterity'));
    const constitution = parseIntOrNull(formData.get('constitution'));
    const intelligence = parseIntOrNull(formData.get('intelligence'));
    const wisdom = parseIntOrNull(formData.get('wisdom'));
    const charisma = parseIntOrNull(formData.get('charisma'));

    const npc = await prisma.npc.findUnique({
      where: { id: npcId, createdById: user.id },
      include: { statBlock: true },
    });
    if (!npc) return { status: 'error', message: 'NPC not found.' };

    const statBlockData = {
      armorClass,
      maxHp,
      speed,
      strength,
      dexterity,
      constitution,
      intelligence,
      wisdom,
      charisma,
    };
    const hasStatData = Object.values(statBlockData).some((v) => v !== null);

    const updated = await prisma.npc.update({
      where: { id: npcId },
      data: {
        name,
        title,
        description,
        raceId,
        classId,
        gender,
        alignment,
        ...(hasStatData && {
          statBlock: {
            upsert: {
              create: statBlockData,
              update: statBlockData,
            },
          },
        }),
      },
      include: {
        statBlock: true,
      },
    });

    return {
      status: 'success',
      npc: {
        id: updated.id,
        name: updated.name,
        title: updated.title,
        description: updated.description,
        raceId: updated.raceId,
        classId: updated.classId,
        gender: updated.gender,
        alignment: updated.alignment,
        statBlock: updated.statBlock
          ? {
              armorClass: updated.statBlock.armorClass,
              maxHp: updated.statBlock.maxHp,
              speed: updated.statBlock.speed,
              strength: updated.statBlock.strength,
              dexterity: updated.statBlock.dexterity,
              constitution: updated.statBlock.constitution,
              intelligence: updated.statBlock.intelligence,
              wisdom: updated.statBlock.wisdom,
              charisma: updated.statBlock.charisma,
            }
          : null,
      },
    };
  } catch (error) {
    console.error('failed to update npc', error);
    const message = error instanceof Error ? error.message : 'Failed to update NPC.';
    return { status: 'error', message };
  }
}
