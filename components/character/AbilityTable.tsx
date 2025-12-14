'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { AbilityType } from '@prisma/client';
import { Badge, Button, Flex, Table, Text, TextField } from '@radix-ui/themes';
import { abilityLabel, ABILITY_TYPES } from '@/lib/abilities';
import { saveCharacterAbilities, type SaveAbilitiesState } from '@/data/character/abilities';

type AbilityTableProps = {
  characterId: string;
  abilities: {
    ability: AbilityType;
    baseScore: number;
    bonus: number;
    temporary: number;
  }[];
};

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
const POINT_BUY_BUDGET = 27;

export const AbilityTable = ({ characterId, abilities }: AbilityTableProps) => {
  const initialScores = useMemo(() => {
    const map: Record<AbilityType, number> = {
      STR: 8,
      DEX: 8,
      CON: 8,
      INT: 8,
      WIS: 8,
      CHA: 8,
    };

    abilities.forEach((row) => {
      map[row.ability] = row.baseScore + row.bonus + row.temporary;
    });

    return map;
  }, [abilities]);

  const [scores, setScores] = useState<Record<AbilityType, number>>(initialScores);
  const [state, formAction, pending] = useActionState<SaveAbilitiesState, FormData>(
    saveCharacterAbilities,
    {
      status: 'idle',
    }
  );

  useEffect(() => {
    setScores(initialScores);
  }, [initialScores]);

  const handleScoreChange = (ability: AbilityType, value: number) => {
    setScores((prev) => ({ ...prev, [ability]: clamp(value, 1, 30) }));
  };

  const applyStandardArray = () => {
    const next: Record<AbilityType, number> = { ...scores };
    ABILITY_TYPES.forEach((ability, index) => {
      next[ability] = STANDARD_ARRAY[index] ?? 8;
    });
    setScores(next);
  };

  const resetToBase = () => {
    const next: Record<AbilityType, number> = { ...scores };
    ABILITY_TYPES.forEach((ability) => {
      next[ability] = 8;
    });
    setScores(next);
  };

  const rollAll = () => {
    const next: Record<AbilityType, number> = { ...scores };
    ABILITY_TYPES.forEach((ability) => {
      next[ability] = roll4d6DropLowest();
    });
    setScores(next);
  };

  const rollSingle = (ability: AbilityType) => {
    setScores((prev) => ({ ...prev, [ability]: roll4d6DropLowest() }));
  };

  const totalPointCost = useMemo(() => {
    return ABILITY_TYPES.reduce((sum, ability) => sum + pointBuyCost(scores[ability] ?? 8), 0);
  }, [scores]);

  const remainingPoints = POINT_BUY_BUDGET - totalPointCost;

  return (
    <form action={formAction}>
      <input type="hidden" name="characterId" value={characterId} />

      <Flex justify="between" align="center" mb="2">
        <Flex gap="2" align="center" wrap="wrap">
          <Button type="button" variant="surface" size="1" onClick={resetToBase}>
            Reset to 8s
          </Button>
          <Button type="button" variant="surface" size="1" onClick={applyStandardArray}>
            Standard Array
          </Button>
          <Button type="button" variant="surface" size="1" onClick={rollAll}>
            Roll All (4d6 drop lowest)
          </Button>
        </Flex>
        <Badge color={remainingPoints >= 0 ? 'green' : 'red'} size="2">
          Point Buy: {remainingPoints} / {POINT_BUY_BUDGET} remaining
        </Badge>
      </Flex>

      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Ability</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell align="center">Score</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell align="center">Modifier</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell align="center">Roll</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {ABILITY_TYPES.map((ability) => {
            const score = scores[ability] ?? 8;
            const modifier = formatModifier(scoreToModifier(score));
            return (
              <Table.Row key={ability}>
                <Table.RowHeaderCell>
                  <Text weight="bold">{ability}</Text>
                  <Text color="gray" size="2" ml="2">
                    {abilityLabel(ability)}
                  </Text>
                </Table.RowHeaderCell>
                <Table.Cell align="center">
                  <Flex gap="2" justify="center" align="center">
                    <Button
                      type="button"
                      variant="soft"
                      size="2"
                      onClick={() => handleScoreChange(ability, score - 1)}
                    >
                      −
                    </Button>
                    <TextField.Root
                      name={`ability-${ability}`}
                      type="number"
                      inputMode="numeric"
                      value={score}
                      min={1}
                      max={30}
                      onChange={(event) => handleScoreChange(ability, Number(event.target.value))}
                      size="2"
                      style={{ width: 96 }}
                    />
                    <Button
                      type="button"
                      variant="soft"
                      size="2"
                      onClick={() => handleScoreChange(ability, score + 1)}
                    >
                      +
                    </Button>
                  </Flex>
                </Table.Cell>
                <Table.Cell align="center">
                  <Badge color="gray" size="3" variant="soft">
                    {modifier}
                  </Badge>
                </Table.Cell>
                <Table.Cell align="center">
                  <Button type="button" variant="soft" size="1" onClick={() => rollSingle(ability)}>
                    🎲 Roll
                  </Button>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>

      <Flex justify="end" gap="3" mt="3" align="center">
        {state.status === 'error' && (
          <Text color="red" size="2">
            {state.message ?? 'Failed to save abilities.'}
          </Text>
        )}
        {state.status === 'success' && (
          <Text color="green" size="2">
            Saved!
          </Text>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save abilities'}
        </Button>
      </Flex>
    </form>
  );
};

const scoreToModifier = (score: number) => Math.floor((score - 10) / 2);

const formatModifier = (mod: number) => (mod >= 0 ? `+${mod}` : `${mod}`);

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const pointBuyCost = (score: number) => {
  const table: Record<number, number> = {
    8: 0,
    9: 1,
    10: 2,
    11: 3,
    12: 4,
    13: 5,
    14: 7,
    15: 9,
  };

  if (score <= 8) return 0;
  if (score >= 15) return table[15];
  return table[score] ?? 0;
};

const roll4d6DropLowest = () => {
  const rolls = Array.from({ length: 4 }, () => 1 + Math.floor(Math.random() * 6));
  rolls.sort((a, b) => a - b);
  return rolls.slice(1).reduce((sum, value) => sum + value, 0);
};
