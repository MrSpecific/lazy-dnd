'use client';

import { useEffect, useState } from 'react';
import { SpellKnowledgeType } from '@prisma/client';
import {
  Badge,
  Box,
  Button,
  Dialog,
  Flex,
  IconButton,
  ScrollArea,
  Select,
  Table,
  Text,
  TextField,
} from '@radix-ui/themes';
import { CircleXIcon, Sparkles } from 'lucide-react';
import { SpellCatalogItem, searchSpells } from '@/data/character/spells';

type SpellPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalog: SpellCatalogItem[];
  onAttach: (spellId: string, knowledge: SpellKnowledgeType) => void;
  pending?: boolean;
  error?: string | null;
};

export const SpellPickerDialog = ({
  open,
  onOpenChange,
  catalog,
  onAttach,
  pending = false,
  error,
}: SpellPickerDialogProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [knowledge, setKnowledge] = useState<SpellKnowledgeType>(SpellKnowledgeType.KNOWN);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<SpellCatalogItem[]>(catalog);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSelectedId(null);
      setKnowledge(SpellKnowledgeType.KNOWN);
      setSearch('');
      setItems(catalog);
      setLocalError(null);
    }
  }, [open, catalog]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const fetchItems = async () => {
      try {
        setLoading(true);
        const data = await searchSpells(search);
        if (cancelled) return;
        setItems(data);
        if (data.length === 1) setSelectedId(data[0].id);
      } catch (err) {
        console.error(err);
        if (!cancelled) setLocalError('Failed to search spells.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timer = setTimeout(fetchItems, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, open]);

  const selected = items.find((item) => item.id === selectedId);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="900px">
        <Flex justify="between" align="center" mb="3">
          <Dialog.Title>Pick a spell</Dialog.Title>
          <Dialog.Close>
            <IconButton variant="soft" size="2" aria-label="Close" radius="full" color="gray">
              <CircleXIcon />
            </IconButton>
          </Dialog.Close>
        </Flex>
        <Dialog.Description size="2" mb="3">
          Choose spells from the catalog. Cantrips (level 0) never consume slots; level 1–9 spells
          do.
        </Dialog.Description>

        <Flex mb="2" align="center" gap="2">
          <TextField.Root
            placeholder="Search spells by name or description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%' }}
          />
          {loading && <Text color="gray">Loading…</Text>}
        </Flex>

        <ScrollArea type="auto" style={{ maxHeight: 420 }}>
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Spell</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">Level</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">School</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">Tags</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">Select</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {items.map((item) => (
                <Table.Row key={item.id}>
                  <Table.RowHeaderCell>
                    <Flex gap="2" align="center">
                      <Sparkles size="1em" />
                      {item.name}
                    </Flex>
                  </Table.RowHeaderCell>
                  <Table.Cell align="center">{item.level === 0 ? 'Cantrip' : item.level}</Table.Cell>
                  <Table.Cell align="center">{formatSchool(item.school)}</Table.Cell>
                  <Table.Cell>
                    <Text color="gray">{item.description || '—'}</Text>
                  </Table.Cell>
                  <Table.Cell align="center">
                    <Flex gap="1" justify="center" wrap="wrap">
                      {item.isRitual && (
                        <Badge color="purple" variant="soft">
                          Ritual
                        </Badge>
                      )}
                      {item.isConcentration && (
                        <Badge color="amber" variant="soft">
                          Concentration
                        </Badge>
                      )}
                    </Flex>
                  </Table.Cell>
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
                Add as:
              </Text>
              <Select.Root value={knowledge} onValueChange={(val) => setKnowledge(val as SpellKnowledgeType)}>
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value={SpellKnowledgeType.KNOWN}>Known spell</Select.Item>
                  <Select.Item value={SpellKnowledgeType.PREPARED}>Prepared spell</Select.Item>
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
                <Button variant="soft" size="2" color="gray" disabled={pending}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                disabled={!selected || pending}
                onClick={() => {
                  if (!selected) return;
                  onAttach(selected.id, knowledge);
                }}
              >
                {pending ? 'Adding…' : 'Add spell'}
              </Button>
            </Flex>
          </Flex>
          {(error || localError) && (
            <Text color="red" size="2" mt="2">
              {error || localError}
            </Text>
          )}
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
};

const formatSchool = (school: string) => school.charAt(0) + school.slice(1).toLowerCase();
