'use client';

import { ChangeEvent, useEffect, useState, useTransition } from 'react';
import { EquipmentSlot } from '@prisma/client';
import { Box, Button, Dialog, Flex, Heading, Select, Text, TextArea, TextField } from '@radix-ui/themes';
import { EquipmentSlotSelect } from '@/components/character/EquipmentSlotSelect';
import { type ArmorEntry, type UpdateArmorState, updateArmor } from '@/data/character/armor';
import { useActionState } from 'react';
import { Form } from '../form';
import { FormInput } from '@/components/form/FormInput';

type ArmorEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  armor: ArmorEntry | null;
  onUpdated: (armor: ArmorEntry) => void;
};

export const ArmorEditDialog = ({
  open,
  onOpenChange,
  armor,
  onUpdated,
}: ArmorEditDialogProps) => {
  const [draft, setDraft] = useState<ArmorEntry | null>(armor);
  const [state, formAction, pending] = useActionState<UpdateArmorState, FormData>(updateArmor, {
    status: 'idle',
  });
  const [transitionPending, startTransition] = useTransition();

  useEffect(() => {
    setDraft(armor);
  }, [armor]);

  useEffect(() => {
    if (state.status === 'success' && state.armor) {
      onUpdated(state.armor);
      onOpenChange(false);
    }
  }, [state, onUpdated, onOpenChange]);

  if (!draft || !armor) return null;

  const handleText =
    (key: keyof ArmorEntry) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setDraft({ ...draft, [key]: e.target.value });
    };

  const handleSubmit = () => {
    const fd = new FormData();
    fd.set('characterItemId', armor.id);
    if (draft.slot) fd.set('slot', draft.slot);
    fd.set('equipped', draft.equipped ? 'true' : 'false');
    fd.set('customName', draft.customName ?? '');
    fd.set('customDescription', draft.customDescription ?? '');
    fd.set('notes', draft.notes ?? '');
    fd.set('condition', draft.condition ?? '');
    startTransition(() => formAction(fd));
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="640px">
        <Dialog.Title>Edit armor</Dialog.Title>
        <Dialog.Description size="2" mb="3">
          Update how this armor is stored and displayed on your sheet.
        </Dialog.Description>

        <Form showActions={false}>
          <Box mb="3">
            <Heading size="4">{armor.name}</Heading>
            <Text color="gray" size="2">
              {armor.description || 'No description'}
            </Text>
          </Box>

          <Flex direction="column" gap="2">
            <Text weight="bold">Status</Text>
            <Select.Root
              value={draft.equipped ? 'equipped' : 'stowed'}
              onValueChange={(val) => setDraft({ ...draft, equipped: val === 'equipped' })}
            >
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="equipped">Equipped</Select.Item>
                <Select.Item value="stowed">Stowed</Select.Item>
              </Select.Content>
            </Select.Root>
          </Flex>

          <Box mt="3">
            <Text weight="bold">Slot</Text>
            <EquipmentSlotSelect
              value={draft.slot ?? undefined}
              onValueChange={(val: EquipmentSlot) => setDraft({ ...draft, slot: val })}
              slotType="armor"
            />
          </Box>

          <Flex direction="column" gap="2" mt="3">
            <FormInput
              label="Custom name"
              value={draft.customName ?? ''}
              onChange={handleText('customName')}
              placeholder="Custom name"
            />
            <TextArea
              value={draft.customDescription ?? ''}
              onChange={handleText('customDescription')}
              placeholder="Custom description/notes"
            />
            <TextArea
              value={draft.notes ?? ''}
              onChange={handleText('notes')}
              placeholder="Extra notes"
            />
            <TextField.Root
              value={draft.condition ?? ''}
              onChange={handleText('condition')}
              placeholder="Condition (e.g., Worn, Broken)"
            />
          </Flex>

          {state.status === 'error' && (
            <Text color="red" size="2" mt="2">
              {state.message ?? 'Failed to update armor.'}
            </Text>
          )}

          <Flex justify="end" gap="2" mt="3">
            <Dialog.Close>
              <Button type="button" variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button onClick={handleSubmit} disabled={pending || transitionPending}>
              {pending || transitionPending ? 'Saving…' : 'Save'}
            </Button>
          </Flex>
        </Form>
      </Dialog.Content>
    </Dialog.Root>
  );
};
