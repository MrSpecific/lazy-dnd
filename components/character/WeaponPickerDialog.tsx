'use client';

import { useEffect, useState } from 'react';
import { EquipmentSlot } from '@prisma/client';
import {
  Badge,
  Box,
  Button,
  Dialog,
  Flex,
  Heading,
  ScrollArea,
  Select,
  Table,
  Text,
} from '@radix-ui/themes';
import { WeaponCatalogItem } from '@/data/character/weapons';

type WeaponPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalog: WeaponCatalogItem[];
  onAttach: (itemId: string, slot: EquipmentSlot | null) => void;
  pending?: boolean;
  error?: string | null;
};

const SLOT_OPTIONS: { value: EquipmentSlot; label: string }[] = [
  { value: 'MAIN_HAND', label: 'Main hand' },
  { value: 'OFF_HAND', label: 'Off hand' },
  { value: 'TWO_HANDED', label: 'Two handed' },
];

export const WeaponPickerDialog = ({
  open,
  onOpenChange,
  catalog,
  onAttach,
  pending = false,
  error,
}: WeaponPickerDialogProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [slot, setSlot] = useState<EquipmentSlot>('MAIN_HAND');

  useEffect(() => {
    if (!open) {
      setSelectedId(null);
      setSlot('MAIN_HAND');
    }
  }, [open]);

  const selected = catalog.find((item) => item.id === selectedId);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="800px">
        <Dialog.Title>Pick a weapon</Dialog.Title>
        <Dialog.Description size="2" mb="3">
          Choose from existing weapons in the database and add it to your character.
        </Dialog.Description>

        <ScrollArea type="auto" style={{ maxHeight: 400 }}>
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Weapon</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">Weight</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">Select</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {catalog.map((item) => (
                <Table.Row key={item.id}>
                  <Table.RowHeaderCell>{item.name}</Table.RowHeaderCell>
                  <Table.Cell>
                    <Text color="gray">{item.description || '—'}</Text>
                  </Table.Cell>
                  <Table.Cell align="center">{item.weight ? `${item.weight} lb` : '—'}</Table.Cell>
                  <Table.Cell align="center">
                    <Button
                      size="1"
                      variant={selectedId === item.id ? 'solid' : 'surface'}
                      onClick={() => setSelectedId(item.id)}
                    >
                      {selectedId === item.id ? 'Selected' : 'Select'}
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </ScrollArea>

        <Box mt="3">
          <Flex align="center" gap="2">
            <Text>Equip to:</Text>
            <Select.Root value={slot} onValueChange={(val) => setSlot(val as EquipmentSlot)}>
              <Select.Trigger />
              <Select.Content>
                {SLOT_OPTIONS.map((opt) => (
                  <Select.Item key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            {selected && (
              <Badge color="gray" variant="soft">
                {selected.name}
              </Badge>
            )}
            <Button
              disabled={!selected || pending}
              onClick={() => {
                if (!selected) return;
                onAttach(selected.id, slot);
              }}
            >
              {pending ? 'Adding…' : 'Add to character'}
            </Button>
          </Flex>
          {error && (
            <Text color="red" size="2" mt="2">
              {error}
            </Text>
          )}
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
};
