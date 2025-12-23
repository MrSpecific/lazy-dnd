'use server';

import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';

export type NpcSummary = {
  id: string;
  name: string;
  title: string | null;
  raceName: string | null;
  className: string | null;
};

export async function getNpcs(userId?: string): Promise<NpcSummary[]> {
  const resolvedUserId = userId ?? (await stackServerApp.getUser())?.id;
  if (!resolvedUserId) return [];

  const npcs = await prisma.npc.findMany({
    where: { createdById: resolvedUserId },
    include: {
      race: true,
      class: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  return npcs.map((npc) => ({
    id: npc.id,
    name: npc.name,
    title: npc.title ?? null,
    raceName: npc.race?.name ?? null,
    className: npc.class?.name ?? null,
  }));
}
