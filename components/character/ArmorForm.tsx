'use client';

import { useState } from 'react';
import { EquipmentSlot } from '@prisma/client';
import { Button, Dialog, Flex, Select } from '@radix-ui/themes';
import { ArmorCatalogItem } from '@/data/character/armor';
import { EquipmentSlotSelect } from '@/components/character/EquipmentSlotSelect';
import { Form } from '../form';

type ArmorFormProps = {
  characterId: string;
  catalog?: ArmorCatalogItem[];
  pending?: boolean;
  onSubmit: (itemId: string, slot: EquipmentSlot | null) => void;
};

export const ArmorForm = ({ catalog = [], pending = false, onSubmit }: ArmorFormProps) => {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [slot, setSlot] = useState<EquipmentSlot | null>('CHEST');

  const handleSubmit = () => {
    if (!selectedId) return;
    onSubmit(selectedId, slot);
    setOpen(false);
    setSelectedId(null);
    setSlot('CHEST');
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button type="button" variant="surface">
          Add armor
        </Button>
      </Dialog.Trigger>
      <Dialog.Content maxWidth="600px">
        <Flex direction="column" gap="3">
          <Select.Root value={selectedId ?? undefined} onValueChange={(val) => setSelectedId(val)}>
            <Select.Trigger placeholder="Select armor" />
            <Select.Content>
              {catalog.map((item) => (
                <Select.Item key={item.id} value={item.id}>
                  {item.name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>

          <Form>
            <EquipmentSlotSelect
              value={slot}
              onValueChange={(val) => setSlot(val)}
              slotType="armor"
            />
          </Form>

          <Flex justify="end" gap="2">
            <Dialog.Close>
              <Button type="button" variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Dialog.Close>
              <Button type="button" onClick={handleSubmit} disabled={!selectedId || pending}>
                {pending ? 'Adding…' : 'Add armor'}
              </Button>
            </Dialog.Close>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};
