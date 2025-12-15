'use client';

import { Badge, Table, Text } from '@radix-ui/themes';
import { ArmorEntry } from '@/data/character/armor';

export type ArmorRow = ArmorEntry;

export const ArmorTable = ({ armor }: { armor: ArmorRow[] }) => {
  if (!armor.length) {
    return (
      <Text color="gray" size="2">
        No armor added yet.
      </Text>
    );
  }

  return (
    <Table.Root variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell align="center">AC</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell align="center">Weight</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell align="center">Equipped</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {armor.map((row) => (
          <Table.Row key={row.id}>
            <Table.RowHeaderCell>{row.name}</Table.RowHeaderCell>
            <Table.Cell>
              <Text color="gray">{row.description || '—'}</Text>
            </Table.Cell>
            <Table.Cell align="center">{row.armorClass ?? '—'}</Table.Cell>
            <Table.Cell align="center">{row.weight ? `${row.weight} lb` : '—'}</Table.Cell>
            <Table.Cell align="center">
              <Badge color={row.equipped ? 'green' : 'gray'} variant="soft">
                {row.equipped ? 'Equipped' : 'Bag'}
              </Badge>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
};
