'use server';

import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';
import { AbilityType } from '@prisma/client';

export type CharacterSummary = {
  id: string;
  name: string;
  className: string | null;
  raceName: string | null;
  level: number;
  hp: number | null;
  ac: number | null;
  speed: number | null;
  stats?: Partial<Record<AbilityType, number>>;
  weapons?: string[];
  spells?: string[];
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
      abilities: true,
      inventory: {
        include: { item: true },
      },
      spells: {
        include: { spell: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return characters.map((c) => {
    const topClass = c.classLevels[0]?.class;
    const stats = c.abilities.reduce(
      (acc, ability) => {
        acc[ability.ability] = ability.baseScore + ability.bonus + ability.temporary;
        return acc;
      },
      {} as Partial<Record<AbilityType, number>>
    );

    const weapons = c.inventory.filter((ci) => ci.item.type === 'WEAPON').map((ci) => ci.item.name);

    const spells = c.spells.map((cs) => cs.spell.name);

    return {
      id: c.id,
      name: c.name,
      className: topClass?.name ?? null,
      raceName: c.race?.name ?? null,
      level: topClass ? (c.classLevels[0]?.level ?? 1) : 1,
      hp: c.maxHp ?? c.currentHp ?? null,
      ac: c.armorClass ?? null,
      speed: c.speed ?? null,
      stats,
      weapons,
      spells,
    };
  });
}
