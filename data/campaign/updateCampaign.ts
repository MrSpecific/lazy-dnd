'use server';

import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';

export type UpdateCampaignState =
  | { status: 'idle'; message?: string }
  | { status: 'success'; message?: string }
  | { status: 'error'; message: string };

const normalizeString = (value: FormDataEntryValue | null) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

export async function updateCampaign(
  _prevState: UpdateCampaignState,
  formData: FormData,
): Promise<UpdateCampaignState> {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return { status: 'error', message: 'Unauthorized' };

    const campaignId = normalizeString(formData.get('campaignId'));
    if (!campaignId) {
      return { status: 'error', message: 'Campaign id is required.' };
    }

    const data: { description?: string | null; notes?: string | null; dmNotes?: string | null } =
      {};

    if (formData.has('description')) {
      data.description = normalizeString(formData.get('description')) || null;
    }
    if (formData.has('notes')) {
      data.notes = normalizeString(formData.get('notes')) || null;
    }
    if (formData.has('dmNotes')) {
      data.dmNotes = normalizeString(formData.get('dmNotes')) || null;
    }

    if (!Object.keys(data).length) {
      return { status: 'error', message: 'No updates provided.' };
    }

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        OR: [{ ownerId: user.id }, { dms: { some: { id: user.id } } }],
      },
      select: { id: true },
    });

    if (!campaign) {
      return { status: 'error', message: 'Campaign not found.' };
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data,
    });

    return { status: 'success' };
  } catch (error) {
    console.error('failed to update campaign', error);
    const message = error instanceof Error ? error.message : 'Failed to update campaign.';
    return { status: 'error', message };
  }
}
