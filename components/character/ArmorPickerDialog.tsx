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
  TextField,
} from '@radix-ui/themes';
import { Shield } from 'lucide-react';
import { ArmorCatalogItem } from '@/data/character/armor';

type ArmorPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalog: ArmorCatalogItem[];
  onAttach: (itemId: string, slot: EquipmentSlot | null) => void;
  pending?: boolean;
  error?: string | null;
};

const SLOT_OPTIONS: { value: EquipmentSlot; label: string }[] = [
  { value: 'HEAD', label: 'Head' },
  { value: 'CHEST', label: 'Chest' },
  { value: 'HANDS', label: 'Hands' },
  { value: 'FEET', label: 'Feet' },
  { value: 'BACK', label: 'Back' },
  { value: 'NECK', label: 'Neck' },
  { value: 'FINGER', label: 'Finger' },
  { value: 'OTHER', label: 'Other' },
];

export const ArmorPickerDialog = ({
  open,
  onOpenChange,
  catalog,
  onAttach,
  pending = false,
  error,
}: ArmorPickerDialogProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [slot, setSlot] = useState<EquipmentSlot>('CHEST');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<ArmorCatalogItem[]>(catalog);

  useEffect(() => {
    if (!open) {
      setSelectedId(null);
      setSlot('CHEST');
      setSearch('');
      setItems(catalog);
    }
  }, [open, catalog]);

  const filtered = items.filter((item) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(term) ||
      (item.description ?? '').toLowerCase().includes(term)
    );
  });

  const selected = filtered.find((item) => item.id === selectedId);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="800px">
        <Dialog.Title>Pick armor</Dialog.Title>
        <Dialog.Description size="2" mb="3">
          Choose from existing armor in the database and add it to your character.
        </Dialog.Description>

        <Flex mb="2" align="center" gap="2">
          <TextField.Root
            placeholder="Search armor"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%' }}
          />
        </Flex>

        <ScrollArea type="auto" style={{ maxHeight: 400 }}>
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Armor</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">AC</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">Weight</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">Select</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filtered.map((item) => (
                <Table.Row key={item.id}>
                  <Table.RowHeaderCell>{item.name}</Table.RowHeaderCell>
                  <Table.Cell>
                    <Text color="gray">{item.description || '—'}</Text>
                  </Table.Cell>
                  <Table.Cell align="center">{item.armorClass ?? '—'}</Table.Cell>
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
          <Flex align="center" gap="2" justify="between">
            <Flex align="center" gap="1">
              <Text size="2">Equip to:</Text>
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
            </Flex>

            <Flex align="center" gap="2">
              <Dialog.Close>
                <Button variant="soft" disabled={pending} color="gray">
                  Cancel
                </Button>
              </Dialog.Close>
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
