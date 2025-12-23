'use client';

import { Dialog, Flex, Text, TextArea, Button } from '@radix-ui/themes';
import { Form } from '@/components/form';
import { SpellRow } from '@/data/character/spells';

type SpellNotesDialogProps = {
  open: boolean;
  spell: SpellRow | null;
  onOpenChange: (open: boolean) => void;
  action?: FormAction;
  pending?: boolean;
  characterId: string;
};

export const SpellNotesDialog = ({
  open,
  spell,
  onOpenChange,
  action,
  pending,
  characterId,
}: SpellNotesDialogProps) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="640px">
        <Dialog.Title>Notes for {spell?.name}</Dialog.Title>
        <Dialog.Description size="2" mb="2">
          Track prepared lists, upcasting details, or reminders for this spell.
        </Dialog.Description>

        <Form action={action} showActions={false}>
          <input type="hidden" name="characterId" value={characterId} />
          <input type="hidden" name="spellId" value={spell?.spellId ?? ''} />
          <input type="hidden" name="knowledge" value={spell?.prepared ? 'PREPARED' : 'KNOWN'} />
          <TextArea
            name="notes"
            defaultValue={spell?.notes ?? ''}
            rows={5}
            placeholder="Components on hand? What it looks like? When to prepare?"
          />

          <Flex justify="end" gap="2" mt="3">
            <Dialog.Close>
              <Button type="button" variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Dialog.Close>
              <Button type="submit" disabled={pending}>
                {pending ? 'Saving…' : 'Save notes'}
              </Button>
            </Dialog.Close>
          </Flex>
        </Form>
      </Dialog.Content>
    </Dialog.Root>
  );
};
