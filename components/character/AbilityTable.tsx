'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { AbilityType } from '@prisma/client';
import { Badge, Button, Flex, Switch, Table, Text, TextField } from '@radix-ui/themes';
import { abilityLabel, ABILITY_TYPES } from '@/lib/helpers/abilities';
import { saveCharacterAbilities, type SaveAbilitiesState } from '@/data/character/abilities';
import { RandomButton } from '@/components/common/RandomButton';

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
const MIN_RULE_SCORE = 3;
const MAX_RULE_SCORE = 20;
const POINT_BUY_MIN = 8;
const POINT_BUY_MAX = 15;

export const AbilityTable = ({ characterId, abilities }: AbilityTableProps) => {
  const hasExistingScores = useMemo(
    () => abilities.some((row) => row.baseScore !== 8 || row.bonus !== 0 || row.temporary !== 0),
    [abilities]
  );
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
  const [editing, setEditing] = useState(!hasExistingScores);
  const [state, formAction, pending] = useActionState<SaveAbilitiesState, FormData>(
    saveCharacterAbilities,
    {
      status: 'idle',
    }
  );
  const [restricted, setRestricted] = useState(true);
  const [restrictionMessage, setRestrictionMessage] = useState<string | null>(null);

  useEffect(() => {
    setScores(initialScores);
  }, [initialScores]);

  const minScore = restricted ? POINT_BUY_MIN : 1;
  const maxScore = restricted ? POINT_BUY_MAX : 30;

  const applyScoreUpdate = (ability: AbilityType, value: number) => {
    const clamped = clamp(value, minScore, maxScore);
    const nextScores = { ...scores, [ability]: clamped };

    if (restricted) {
      const nextCost = ABILITY_TYPES.reduce((sum, a) => sum + pointBuyCost(nextScores[a] ?? 8), 0);
      if (nextCost > POINT_BUY_BUDGET) {
        setRestrictionMessage('Exceeds point buy budget (27).');
        return;
      }
    }

    setRestrictionMessage(null);
    setScores(nextScores);
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

    if (restricted) {
      const nextCost = ABILITY_TYPES.reduce((sum, a) => sum + pointBuyCost(next[a] ?? 8), 0);
      if (nextCost > POINT_BUY_BUDGET) {
        setRestrictionMessage(
          'Rolled values exceed point buy budget (27). Try again or switch to unrestricted.'
        );
        return;
      }
    }

    setRestrictionMessage(null);
    setScores(next);
  };

  const rollSingle = (ability: AbilityType) => {
    const rolled = roll4d6DropLowest();
    const nextScores = { ...scores, [ability]: rolled };

    if (restricted) {
      const nextCost = ABILITY_TYPES.reduce((sum, a) => sum + pointBuyCost(nextScores[a] ?? 8), 0);
      if (nextCost > POINT_BUY_BUDGET) {
        setRestrictionMessage('This roll exceeds the point buy budget (27).');
        return;
      }
    }

    setRestrictionMessage(null);
    setScores(nextScores);
  };

  const totalPointCost = useMemo(() => {
    if (!restricted) return 0;
    return ABILITY_TYPES.reduce((sum, ability) => sum + pointBuyCost(scores[ability] ?? 8), 0);
  }, [scores, restricted]);

  const remainingPoints = restricted ? POINT_BUY_BUDGET - totalPointCost : null;

  useEffect(() => {
    if (state.status === 'success') {
      setEditing(false);
    }
  }, [state]);

  if (!editing) {
    return (
      <>
        <Flex justify="between" align="center" mb="2">
          <Text weight="bold">Abilities</Text>
          <Button variant="surface" onClick={() => setEditing(true)} size="2">
            Edit abilities
          </Button>
        </Flex>
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Ability</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell align="center">Score</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell align="center">Modifier</Table.ColumnHeaderCell>
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
                    <Text weight="bold">{score}</Text>
                  </Table.Cell>
                  <Table.Cell align="center">
                    <Badge color="gray" size="3" variant="soft">
                      {modifier}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </>
    );
  }

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
        {restricted ? (
          <Badge
            color={remainingPoints !== null && remainingPoints >= 0 ? 'green' : 'red'}
            size="2"
          >
            Point Buy: {remainingPoints} / {POINT_BUY_BUDGET} remaining
          </Badge>
        ) : (
          <Badge color="gray" size="2">
            Point Buy: unrestricted
          </Badge>
        )}
        <Flex align="center" gap="2">
          <Switch
            checked={restricted}
            onCheckedChange={(checked) => {
              setRestricted(Boolean(checked));
              setRestrictionMessage(null);
            }}
          />
          <Text size="2" color="gray">
            {restricted ? 'Restricted (5e min/max & point buy)' : 'Unrestricted'}
          </Text>
        </Flex>
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
            const status = score < MIN_RULE_SCORE ? 'low' : score > MAX_RULE_SCORE ? 'high' : 'ok';

            return (
              <Table.Row key={ability}>
                <Table.RowHeaderCell>
                  <Text weight="bold">{ability}</Text>
                  <Text color="gray" size="2" ml="2">
                    {abilityLabel(ability)}
                  </Text>
                </Table.RowHeaderCell>
                <Table.Cell align="center">
                  <Flex direction="column" align="center" gap="1">
                    <Flex gap="2" justify="center" align="center">
                      <Button
                        type="button"
                        variant="soft"
                        size="2"
                        onClick={() => applyScoreUpdate(ability, score - 1)}
                      >
                        −
                      </Button>
                      <TextField.Root
                        name={`ability-${ability}`}
                        type="number"
                        inputMode="numeric"
                        value={score}
                        min={minScore}
                        max={maxScore}
                        onChange={(event) => applyScoreUpdate(ability, Number(event.target.value))}
                        size="2"
                        color={status === 'ok' ? 'gray' : status === 'low' ? 'red' : 'amber'}
                        style={{ width: 96 }}
                      />
                      <Button
                        type="button"
                        variant="soft"
                        size="2"
                        onClick={() => applyScoreUpdate(ability, score + 1)}
                      >
                        +
                      </Button>
                    </Flex>
                    {status !== 'ok' && restricted && (
                      <Text size="1" color={status === 'low' ? 'red' : 'amber'}>
                        {status === 'low'
                          ? `Below min (${MIN_RULE_SCORE})`
                          : `Above max (${MAX_RULE_SCORE})`}
                      </Text>
                    )}
                  </Flex>
                </Table.Cell>
                <Table.Cell align="center">
                  <Badge color="gray" size="3" variant="soft">
                    {modifier}
                  </Badge>
                </Table.Cell>
                <Table.Cell align="center">
                  <RandomButton
                    onClick={() => rollSingle(ability)}
                    size="1"
                    variant="soft"
                    label="Roll"
                  />
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>

      <Flex justify="end" gap="3" mt="3" align="center">
        {restrictionMessage && (
          <Text color="amber" size="2">
            {restrictionMessage}
          </Text>
        )}
        {state.status === 'error' && (
          <Text color="red" size="2">
            {state.message ?? 'Failed to save abilities.'}
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

  if (score < POINT_BUY_MIN) return 0;
  if (score > POINT_BUY_MAX) {
    // Disallow buying above point-buy cap by making cost exceed the budget.
    return POINT_BUY_BUDGET + 1;
  }
  return table[score] ?? 0;
};

const roll4d6DropLowest = () => {
  const rolls = Array.from({ length: 4 }, () => 1 + Math.floor(Math.random() * 6));
  rolls.sort((a, b) => a - b);
  return rolls.slice(1).reduce((sum, value) => sum + value, 0);
};
