'use server';

import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';

export type DeclineCampaignInviteState =
  | { status: 'idle'; message?: string }
  | { status: 'success'; message?: string }
  | { status: 'error'; message: string };

const normalizeString = (value: FormDataEntryValue | null) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

export async function declineCampaignInvite(
  _prevState: DeclineCampaignInviteState,
  formData: FormData,
): Promise<DeclineCampaignInviteState> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return { status: 'error', message: 'Unauthorized' };

    const campaignId = normalizeString(formData.get('campaignId'));
    if (!campaignId) return { status: 'error', message: 'Campaign id is required.' };

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        players: { some: { id: user.id } },
      },
      select: { id: true },
    });

    if (!campaign) {
      return { status: 'error', message: 'Invite not found.' };
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { players: { disconnect: { id: user.id } } },
    });

    return { status: 'success' };
  } catch (error) {
    console.error('failed to decline invite', error);
    const message = error instanceof Error ? error.message : 'Failed to decline invite.';
    return { status: 'error', message };
  }
}
