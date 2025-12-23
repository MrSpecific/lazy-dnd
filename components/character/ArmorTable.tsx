'use client';

import { AlertDialog, Badge, Button, Flex, Table, Text } from '@radix-ui/themes';
import { ArmorEntry } from '@/data/character/armor';

export type ArmorRow = ArmorEntry;

export const ArmorTable = ({
  armor,
  onEdit,
  onRemove,
  disableActions = false,
}: {
  armor: ArmorRow[];
  onEdit?: (id: string) => void;
  onRemove?: (id: string) => void;
  disableActions?: boolean;
}) => {
  if (!armor.length) {
    return (
      <Text color="gray" size="2">
        No armor added yet.
      </Text>
    );
  }

  const showActions = Boolean(onEdit || onRemove);

  return (
    <Table.Root variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell align="center">AC</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell align="center">Weight</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell align="center">Equipped</Table.ColumnHeaderCell>
          {showActions && <Table.ColumnHeaderCell align="center">Actions</Table.ColumnHeaderCell>}
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
            {showActions && (
              <Table.Cell align="center">
                <Flex justify="center" gap="2" wrap="wrap">
                  {onEdit && (
                    <Button
                      type="button"
                      size="1"
                      variant="surface"
                      onClick={() => onEdit(row.id)}
                      disabled={disableActions}
                    >
                      Edit
                    </Button>
                  )}
                  {onRemove && (
                    <AlertDialog.Root>
                      <AlertDialog.Trigger>
                        <Button type="button" size="1" color="red" variant="soft">
                          Remove
                        </Button>
                      </AlertDialog.Trigger>
                      <AlertDialog.Content maxWidth="420px">
                        <AlertDialog.Title>Remove armor</AlertDialog.Title>
                        <AlertDialog.Description size="2">
                          This removes the armor from the character.
                        </AlertDialog.Description>
                        <Flex justify="end" gap="2" mt="3">
                          <AlertDialog.Cancel>
                            <Button type="button" variant="soft" color="gray">
                              Cancel
                            </Button>
                          </AlertDialog.Cancel>
                          <AlertDialog.Action>
                            <Button
                              type="button"
                              color="red"
                              onClick={() => onRemove(row.id)}
                              disabled={disableActions}
                            >
                              Remove
                            </Button>
                          </AlertDialog.Action>
                        </Flex>
                      </AlertDialog.Content>
                    </AlertDialog.Root>
                  )}
                </Flex>
              </Table.Cell>
            )}
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
};
