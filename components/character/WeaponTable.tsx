'use client';

import { useMemo } from 'react';
import { EquipmentSlot } from '@prisma/client';
import { AlertDialog, Badge, Box, Button, Flex, Table, Text } from '@radix-ui/themes';
import { WeaponEditDialog } from '@/components/character/WeaponEditDialog';

export type WeaponRow = {
  id: string;
  name: string;
  baseName?: string | null;
  description: string | null;
  weight: number | null;
  slot: EquipmentSlot | null;
  equipped: boolean;
  customName?: string | null;
  customDescription?: string | null;
  notes?: string | null;
  condition?: string | null;
};

type WeaponTableProps = {
  weapons: WeaponRow[];
  onEdit?: (id: string) => void;
  onRemove?: (id: string) => void;
  disableActions?: boolean;
};

export const WeaponTable = ({ weapons, onEdit, onRemove, disableActions = false }: WeaponTableProps) => {
  const hasWeapons = weapons.length > 0;
  const showActions = Boolean(onEdit || onRemove);
  const sorted = useMemo(
    () => [...weapons].sort((a, b) => a.name.localeCompare(b.name)),
    [weapons]
  );

  return (
    <Table.Root variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell align="center">Slot</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell align="center">Weight</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell align="center">Status</Table.ColumnHeaderCell>
          {showActions && <Table.ColumnHeaderCell align="center">Actions</Table.ColumnHeaderCell>}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {hasWeapons ? (
          sorted.map((weapon) => (
            <Table.Row key={weapon.id}>
              <Table.RowHeaderCell>
                <Box>
                  <Text weight="bold" as="div">
                    {weapon.name}
                  </Text>
                  {weapon.customName && weapon.baseName && (
                    <Text size="1" color="gray">
                      {weapon.baseName}
                    </Text>
                  )}
                </Box>
              </Table.RowHeaderCell>
              <Table.Cell>
                <Text color="gray">{weapon.description || '—'}</Text>
              </Table.Cell>
              <Table.Cell align="center">{slotLabel(weapon.slot)}</Table.Cell>
              <Table.Cell align="center">{weapon.weight ? `${weapon.weight} lb` : '—'}</Table.Cell>
              <Table.Cell align="center">
                <Badge color={weapon.equipped ? 'green' : 'gray'} variant="soft">
                  {weapon.equipped ? 'Equipped' : 'Stowed'}
                </Badge>
              </Table.Cell>
              {showActions && (
                <Table.Cell align="center">
                  <Flex justify="center" gap="2" wrap="wrap">
                    {onEdit && (
                      <Button
                        variant="surface"
                        size="1"
                        onClick={() => onEdit?.(weapon.id)}
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
                          <AlertDialog.Title>Remove weapon</AlertDialog.Title>
                          <AlertDialog.Description size="2">
                            This removes the weapon from the character.
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
                                onClick={() => onRemove(weapon.id)}
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
          ))
        ) : (
          <Table.Row>
            <Table.Cell colSpan={showActions ? 6 : 5}>
              <Flex justify="center" py="4">
                <Text color="gray">No weapons added yet.</Text>
              </Flex>
            </Table.Cell>
          </Table.Row>
        )}
      </Table.Body>
    </Table.Root>
  );
};

const slotLabel = (slot: EquipmentSlot | null) => {
  switch (slot) {
    case 'MAIN_HAND':
      return 'Main hand';
    case 'OFF_HAND':
      return 'Off hand';
    case 'TWO_HANDED':
      return 'Two handed';
    default:
      return '—';
  }
};
