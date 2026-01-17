'use server';

import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';

export type CampaignSummary = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  completed: boolean;
  archived: boolean;
  updatedAt: Date;
};

export async function getCampaigns(
  userId?: string,
  scope: 'dm' | 'player' = 'dm',
): Promise<CampaignSummary[]> {
  const resolvedUserId = userId ?? (await stackServerApp.getUser())?.id;
  if (!resolvedUserId) return [];

  const whereClause =
    scope === 'player'
      ? {
          players: { some: { id: resolvedUserId } },
          NOT: { OR: [{ ownerId: resolvedUserId }, { dms: { some: { id: resolvedUserId } } }] },
        }
      : {
          OR: [{ ownerId: resolvedUserId }, { dms: { some: { id: resolvedUserId } } }],
        };

  const campaigns = await prisma.campaign.findMany({
    where: whereClause,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      description: true,
      active: true,
      completed: true,
      archived: true,
      updatedAt: true,
    },
  });

  return campaigns.map((campaign) => ({
    id: campaign.id,
    name: campaign.name,
    description: campaign.description ?? null,
    active: campaign.active,
    completed: campaign.completed,
    archived: campaign.archived,
    updatedAt: campaign.updatedAt,
  }));
}
