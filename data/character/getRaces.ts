'use server';
import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';

export async function getRaces() {
  const user = await stackServerApp.getUser();
  if (!user) {
    throw new Error('User must be authenticated to fetch races');
  }

  const races = await prisma.race.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  return races;
}

export type GetRacesReturn = PrismaReturnType<typeof getRaces>;
