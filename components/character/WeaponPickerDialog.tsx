'use client';

import { useEffect, useState } from 'react';
import { EquipmentSlot } from '@prisma/client';
import { CircleXIcon } from 'lucide-react';
import {
  Badge,
  Box,
  Button,
  Dialog,
  Flex,
  Heading,
  IconButton,
  ScrollArea,
  Select,
  Table,
  Text,
  TextField,
} from '@radix-ui/themes';
import { WeaponCatalogItem, searchWeapons } from '@/data/character/weapons';

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
  { value: 'BACK', label: 'Back' },
  { value: 'OTHER', label: 'Other' },
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
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<WeaponCatalogItem[]>(catalog);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSelectedId(null);
      setSlot('MAIN_HAND');
      setLocalError(null);
      setItems(catalog);
      setSearch('');
    }
  }, [open, catalog]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const fetchItems = async () => {
      try {
        setLoading(true);
        setLocalError(null);
        const data = await searchWeapons(search);
        if (!cancelled) {
          setItems(data);
          if (data.length === 1) setSelectedId(data[0].id);
        }
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setLocalError('Failed to load weapons.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timer = setTimeout(fetchItems, 200); // small debounce for search
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, search]);

  const selected = items.find((item) => item.id === selectedId);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="800px">
        <Flex justify="between" align="center" mb="3">
          <Dialog.Title>Pick a weapon</Dialog.Title>
          <Dialog.Close>
            <IconButton variant="soft" size="2" aria-label="Close" radius="full" color="gray">
              <CircleXIcon />
            </IconButton>
          </Dialog.Close>
        </Flex>
        <Dialog.Description size="2" mb="3">
          Choose from existing weapons in the database and add it to your character's inventory.
        </Dialog.Description>

        <Flex mb="2" align="center" gap="2">
          <TextField.Root
            placeholder="Search weapons"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%' }}
          />
          {loading && <Text color="gray">Loading…</Text>}
        </Flex>

        <ScrollArea type="auto" style={{ maxHeight: 400 }}>
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Weapon</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">Damage</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">Weight</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">Select</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {items.map((item) => (
                <Table.Row key={item.id}>
                  <Table.RowHeaderCell>{item.name}</Table.RowHeaderCell>
                  <Table.Cell>
                    <Text color="gray">{item.description || '—'}</Text>
                  </Table.Cell>
                  <Table.Cell align="center">{item.damage || '—'}</Table.Cell>
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

        <Box mt="4">
          <Flex align="center" gap="2" justify="between">
            <Flex align="center" gap="2">
              <Text size="2" weight="bold">
                Equip to:
              </Text>
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
                <Button variant="soft" size="2" color="gray">
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
          {localError && (
            <Text color="red" size="2" mt="2">
              {localError}
            </Text>
          )}
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
};
