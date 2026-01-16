'use client';

import { useActionState } from 'react';
import { Box, Flex, Text } from '@radix-ui/themes';
import { Form, MarkdownInput } from '@/components/form';
import { updateCampaign, type UpdateCampaignState } from '@/data/campaign/updateCampaign';

type CampaignDetailsFormProps = {
  campaignId: string;
  description: string | null;
  notes: string | null;
  dmNotes: string | null;
};

export const CampaignDetailsForm = ({
  campaignId,
  description,
  notes,
  dmNotes,
}: CampaignDetailsFormProps) => {
  const [state, formAction, pending] = useActionState<UpdateCampaignState, FormData>(
    updateCampaign,
    { status: 'idle' },
  );

  return (
    <Form
      action={formAction}
      submitText={pending ? 'Saving…' : 'Save changes'}
      submitDisabled={pending}
    >
      <input type="hidden" name="campaignId" value={campaignId} />
      <Flex direction="column" gap="3">
        <MarkdownInput
          name="description"
          label="Description"
          defaultValue={description ?? ''}
          tooltip="What should everyone know about this campaign?"
        />
        <MarkdownInput
          name="notes"
          label="Notes"
          defaultValue={notes ?? ''}
          tooltip="Shared notes for the whole table."
        />
        <Box>
          <MarkdownInput
            name="dmNotes"
            label="DM notes"
            defaultValue={dmNotes ?? ''}
            tooltip="Private notes for the DM team."
          />
          <Text size="1" color="gray">
            DM notes are only visible to DMs.
          </Text>
        </Box>
        {state.status === 'error' && (
          <Text color="red" size="2">
            {state.message ?? 'Failed to update campaign.'}
          </Text>
        )}
        {state.status === 'success' && (
          <Text color="green" size="2">
            Saved.
          </Text>
        )}
      </Flex>
    </Form>
  );
};
