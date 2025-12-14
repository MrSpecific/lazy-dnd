'use server';

import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';

export type CharacterSummary = {
  id: string;
  name: string;
  className: string | null;
  raceName: string | null;
  level: number;
};

export async function getCharacters(): Promise<CharacterSummary[]> {
  const user = await stackServerApp.getUser();
  if (!user) return [];

  const characters = await prisma.character.findMany({
    where: { userId: user.id },
    include: {
      race: true,
      classLevels: {
        include: { class: true },
        orderBy: { level: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return characters.map((c) => {
    const topClass = c.classLevels[0]?.class;
    return {
      id: c.id,
      name: c.name,
      className: topClass?.name ?? null,
      raceName: c.race?.name ?? null,
      level: topClass ? c.classLevels[0]?.level ?? 1 : 1,
    };
  });
}
