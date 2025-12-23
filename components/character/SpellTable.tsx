'use client';

import { useMemo } from 'react';
import { Badge, Button, Flex, Table, Text } from '@radix-ui/themes';
import { Sparkles, NotebookPen, Trash2 } from 'lucide-react';
import { SpellRow } from '@/data/character/spells';
import Markdown from '../common/Markdown';

type SpellTableProps = {
  spells: SpellRow[];
  onTogglePrepared?: (spellId: string, prepared: boolean) => void;
  onEditNotes?: (spellId: string) => void;
  onRemove?: (spellId: string) => void;
  busyId?: string | null;
};

export const SpellTable = ({
  spells,
  onTogglePrepared,
  onEditNotes,
  onRemove,
  busyId,
}: SpellTableProps) => {
  const hasActions = Boolean(onTogglePrepared || onEditNotes || onRemove);
  const sorted = useMemo(
    () =>
      [...spells].sort((a, b) =>
        a.level === b.level ? a.name.localeCompare(b.name) : a.level - b.level
      ),
    [spells]
  );

  return (
    <Table.Root variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Spell</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell align="center">Level</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell align="center">School</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell align="center">Casting</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell align="center">Range</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell align="center">Components</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell align="center">Status</Table.ColumnHeaderCell>
          {(onTogglePrepared || onEditNotes || onRemove) && (
            <Table.ColumnHeaderCell align="center">Actions</Table.ColumnHeaderCell>
          )}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {sorted.length === 0 ? (
          <Table.Row>
            <Table.Cell colSpan={hasActions ? 8 : 7}>
              <Flex justify="center" py="4">
                <Text color="gray">
                  No spells yet. Add cantrips and prepared spells to get started.
                </Text>
              </Flex>
            </Table.Cell>
          </Table.Row>
        ) : (
          sorted.map((spell) => (
            <Table.Row key={spell.id}>
              <Table.RowHeaderCell>
                <Flex direction="column" gap="1">
                  <Flex gap="2" align="center">
                    <Sparkles size="1em" />
                    <Text weight="bold">{spell.name}</Text>
                  </Flex>
                  <Text color="gray" size="2">
                    <Markdown>{spell.description || '—'}</Markdown>
                  </Text>
                </Flex>
              </Table.RowHeaderCell>
              <Table.Cell align="center">{spell.level === 0 ? 'Cantrip' : spell.level}</Table.Cell>
              <Table.Cell align="center">{formatSchool(spell.school)}</Table.Cell>
              <Table.Cell align="center">{spell.castingTime || '—'}</Table.Cell>
              <Table.Cell align="center">{spell.range || '—'}</Table.Cell>
              <Table.Cell align="center">{spell.components || '—'}</Table.Cell>
              <Table.Cell align="center">
                <Flex direction="column" gap="1" align="center">
                  <Flex gap="1" wrap="wrap" justify="center">
                    {spell.known && (
                      <Badge color="blue" variant="soft">
                        Known
                      </Badge>
                    )}
                    {spell.prepared && (
                      <Badge color="green" variant="soft">
                        Prepared
                      </Badge>
                    )}
                    {spell.isRitual && (
                      <Badge color="purple" variant="soft">
                        Ritual
                      </Badge>
                    )}
                    {spell.isConcentration && (
                      <Badge color="amber" variant="soft">
                        Concentration
                      </Badge>
                    )}
                    {spell.notes && (
                      <Badge color="gray" variant="soft">
                        Notes
                      </Badge>
                    )}
                  </Flex>
                  {spell.prepared && spell.level > 0 && (
                    <Text color="gray" size="1">
                      Prepared spells expend slots of their level or higher.
                    </Text>
                  )}
                </Flex>
              </Table.Cell>
              {(onTogglePrepared || onEditNotes || onRemove) && (
                <Table.Cell align="center">
                  <Flex gap="2" justify="center" wrap="wrap">
                    {onTogglePrepared && spell.level > 0 && (
                      <Button
                        size="1"
                        variant="surface"
                        onClick={() => onTogglePrepared(spell.spellId, !spell.prepared)}
                        disabled={busyId === spell.spellId}
                      >
                        {spell.prepared ? 'Unprepare' : 'Prepare'}
                      </Button>
                    )}
                    {onEditNotes && (
                      <Button
                        size="1"
                        variant="soft"
                        onClick={() => onEditNotes(spell.spellId)}
                        disabled={busyId === spell.spellId}
                      >
                        <NotebookPen size="1em" /> Notes
                      </Button>
                    )}
                    {onRemove && (
                      <Button
                        size="1"
                        variant="ghost"
                        color="red"
                        onClick={() => onRemove(spell.spellId)}
                        disabled={busyId === spell.spellId}
                      >
                        <Trash2 size="1em" /> Remove
                      </Button>
                    )}
                  </Flex>
                </Table.Cell>
              )}
            </Table.Row>
          ))
        )}
      </Table.Body>
    </Table.Root>
  );
};

const formatSchool = (school: string) => {
  const lower = school.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};
