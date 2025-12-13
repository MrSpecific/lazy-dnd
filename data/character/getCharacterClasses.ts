'use server';
import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';

export async function getCharacterClasses() {
  const user = await stackServerApp.getUser();
  if (!user) {
    throw new Error('User must be authenticated to fetch character classes');
  }

  const classes = await prisma.characterClass.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  return classes;
}

export type GetCharacterClassesReturn = PrismaReturnType<typeof getCharacterClasses>;
