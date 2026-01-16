'use client';

import { useActionState, useEffect, useState } from 'react';
import { Box, Button, Flex, Heading, Separator, Text } from '@radix-ui/themes';
import { Form, MarkdownInput } from '@/components/form';
import { Markdown } from '@/components/common/Markdown';
import { updateCampaign, type UpdateCampaignState } from '@/data/campaign/updateCampaign';

type CampaignDetailsFormProps = {
  campaignId: string;
  description: string | null;
  notes: string | null;
  dmNotes: string | null;
};

type EditableMarkdownFieldProps = {
  campaignId: string;
  name: 'description' | 'notes' | 'dmNotes';
  label: string;
  value: string | null;
  tooltip?: string;
  emptyText: string;
  helperText?: string;
};

const EditableMarkdownField = ({
  campaignId,
  name,
  label,
  value,
  tooltip,
  emptyText,
  helperText,
}: EditableMarkdownFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value ?? '');
  const [draft, setDraft] = useState(value ?? '');
  const [lastSubmitted, setLastSubmitted] = useState(value ?? '');
  const [state, formAction, pending] = useActionState<UpdateCampaignState, FormData>(
    updateCampaign,
    { status: 'idle' }
  );

  useEffect(() => {
    const nextValue = value ?? '';
    setCurrentValue(nextValue);
    setDraft(nextValue);
    setLastSubmitted(nextValue);
  }, [value]);

  useEffect(() => {
    if (state.status === 'success') {
      setCurrentValue(lastSubmitted);
      setDraft(lastSubmitted);
      setIsEditing(false);
    }
  }, [state.status, lastSubmitted]);

  const handleCancel = () => {
    setDraft(currentValue);
    setIsEditing(false);
  };

  return (
    <Box>
      {isEditing ? (
        <Form
          action={formAction}
          showActions={false}
          onSubmit={() => {
            const cleaned = draft.trim();
            setLastSubmitted(cleaned);
            setDraft(cleaned);
          }}
        >
          <input type="hidden" name="campaignId" value={campaignId} />
          <MarkdownInput
            name={name}
            label={label}
            value={draft}
            onValueChange={setDraft}
            tooltip={tooltip}
          />
          {helperText && (
            <Text size="1" color="gray">
              {helperText}
            </Text>
          )}
          <Flex justify="end" gap="2" mt="3">
            <Button type="button" variant="soft" color="gray" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : 'Save'}
            </Button>
          </Flex>
          {state.status === 'error' && (
            <Text color="red" size="2" mt="2">
              {state.message ?? 'Failed to update campaign.'}
            </Text>
          )}
        </Form>
      ) : (
        <Box>
          <Flex align="center" justify="between" mb="2">
            <Heading size="2">{label}</Heading>
            <Button type="button" variant="soft" size="1" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          </Flex>
          {currentValue ? (
            <Markdown>{currentValue}</Markdown>
          ) : (
            <Text color="gray" size="2">
              {emptyText}
            </Text>
          )}
          {helperText && (
            <Text size="1" color="gray" mt="2">
              {helperText}
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
};

export const CampaignDetailsForm = ({
  campaignId,
  description,
  notes,
  dmNotes,
}: CampaignDetailsFormProps) => {
  return (
    <Flex direction="column" gap="4">
      <EditableMarkdownField
        campaignId={campaignId}
        name="description"
        label="Description"
        value={description}
        tooltip="What should everyone know about this campaign?"
        emptyText="No description yet."
      />
      <Separator size="4" my="1" />
      <EditableMarkdownField
        campaignId={campaignId}
        name="notes"
        label="Notes"
        value={notes}
        tooltip="Shared notes for the whole table."
        emptyText="No shared notes yet."
      />
      <Separator size="4" my="1" />
      <EditableMarkdownField
        campaignId={campaignId}
        name="dmNotes"
        label="DM notes"
        value={dmNotes}
        tooltip="Private notes for the DM team."
        emptyText="No DM notes yet."
        helperText="DM notes are only visible to DMs."
      />
    </Flex>
  );
};
