'use client';

import { useActionState, useEffect, useMemo, useState, useTransition } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Text,
  TextField,
  AlertDialog,
  IconButton,
} from '@radix-ui/themes';
import {
  Heart,
  HeartCrack,
  HeartMinus,
  HeartPlus,
  Sparkles,
  RefreshCcw,
  Skull,
} from 'lucide-react';
import { updateHitPoints, type UpdateHpState } from '@/data/character/updateHitPoints';
import { RandomButton } from '@/components/common/RandomButton';
import { useCharacterContext } from '@/components/character/CharacterContext';

type HitPointsProps = {
  characterId: string;
  level: number;
  hitDie: number;
  conScore: number | null;
  initialBaseHp: number | null;
  initialMaxHp: number | null;
  initialCurrentHp: number | null;
  initialTempHp: number | null;
};

const clampNonNegative = (value: number) => Math.max(0, value);

export const HitPoints = ({
  characterId,
  level,
  hitDie,
  conScore,
  initialBaseHp,
  initialMaxHp,
  initialCurrentHp,
  initialTempHp,
}: HitPointsProps) => {
  const { restSignal } = useCharacterContext();
  const [state, formAction, pending] = useActionState<UpdateHpState, FormData>(updateHitPoints, {
    status: 'idle',
  });
  const [transitionPending, startTransition] = useTransition();
  const [baseHp, setBaseHp] = useState<number | ''>(initialBaseHp ?? initialMaxHp ?? '');
  const [maxHp, setMaxHp] = useState<number | ''>(initialMaxHp ?? initialBaseHp ?? '');
  const [currentHp, setCurrentHp] = useState<number | ''>(initialCurrentHp ?? '');
  const [tempHp, setTempHp] = useState<number | ''>(initialTempHp ?? '');
  const [editing, setEditing] = useState(!initialMaxHp && !initialCurrentHp);

  useEffect(() => {
    if (state.status === 'success') {
      setBaseHp(state.baseHp ?? '');
      setMaxHp(state.maxHp ?? '');
      setCurrentHp(state.currentHp ?? '');
      setTempHp(state.tempHp ?? '');
    }
  }, [state]);

  const conMod = useMemo(() => {
    if (conScore == null) return null;
    return Math.floor((conScore - 10) / 2);
  }, [conScore]);

  const handleAdjustCurrent = (delta: number) => {
    setCurrentHp((prev) => {
      const base = typeof prev === 'number' ? prev : 0;
      const next = base + delta;
      return clampNonNegative(next);
    });
  };

  const handleSetCurrent = (value: number) => {
    setCurrentHp(clampNonNegative(value));
  };

  const submitUpdate = (next?: {
    baseHp?: number | '';
    maxHp?: number | '';
    currentHp?: number | '';
    tempHp?: number | '';
  }) => {
    const form = new FormData();
    form.set('characterId', characterId);
    form.set('mode', 'update');
    const nextBase = next?.baseHp ?? baseHp;
    const nextMax = next?.maxHp ?? maxHp;
    const nextCurrent = next?.currentHp ?? currentHp;
    const nextTemp = next?.tempHp ?? tempHp;
    if (nextBase !== '') form.set('baseHp', String(nextBase));
    if (nextMax !== '') form.set('maxHp', String(nextMax));
    if (nextCurrent !== '') form.set('currentHp', String(nextCurrent));
    if (nextTemp !== '') form.set('tempHp', String(nextTemp));
    startTransition(() => formAction(form));
  };

  const applyRest = (type: 'short' | 'long', hitDiceToSpend?: number) => {
    const maxValue = typeof maxHp === 'number' ? maxHp : null;
    if (!maxValue) return;

    let nextCurrent = typeof currentHp === 'number' ? currentHp : 0;
    let nextTemp = 0;

    if (type === 'short') {
      const availableHd = Math.max(level, 1);
      const toSpend = Math.max(
        0,
        Math.min(availableHd, Number.isFinite(hitDiceToSpend) ? hitDiceToSpend : 0)
      );
      if (toSpend <= 0) return;

      let healed = 0;
      for (let i = 0; i < toSpend; i += 1) {
        const roll = 1 + Math.floor(Math.random() * hitDie);
        healed += roll + (conMod ?? 0);
      }
      healed = Math.max(0, healed);
      nextCurrent = Math.min(nextCurrent + healed, maxValue);
    } else {
      nextCurrent = maxValue;
    }

    setTempHp(nextTemp);
    setCurrentHp(nextCurrent);
    submitUpdate({ currentHp: nextCurrent, tempHp: nextTemp });
  };

  useEffect(() => {
    if (!restSignal) return;
    applyRest(restSignal.type, restSignal.hitDice);
  }, [restSignal]);

  const submitWithMode = (mode: 'compute' | 'update' | 'reset') => {
    const form = new FormData();
    form.set('characterId', characterId);
    form.set('mode', mode);

    if (mode === 'update') {
      if (baseHp !== '') form.set('baseHp', String(baseHp));
      if (maxHp !== '') form.set('maxHp', String(maxHp));
      if (currentHp !== '') form.set('currentHp', String(currentHp));
      if (tempHp !== '') form.set('tempHp', String(tempHp));
    }
    if (mode === 'compute') {
      if (conMod != null) {
        form.set('conMod', String(conMod));
      }
      form.set('level', String(level));
      form.set('hitDie', String(hitDie));
    }
    if (mode === 'reset') {
      // No additional fields needed
    }
    startTransition(() => formAction(form));
  };

  const hpBadgeColor =
    typeof currentHp === 'number' && typeof maxHp === 'number'
      ? currentHp <= 0
        ? 'red'
        : currentHp <= maxHp * 0.25
          ? 'amber'
          : currentHp > maxHp
            ? 'mint'
            : 'green'
      : 'gray';
  const aboveMax = typeof currentHp === 'number' && typeof maxHp === 'number' && currentHp > maxHp;
  const hpIsZero = typeof currentHp === 'number' && currentHp <= 0;

  const adjustButtonSize: RadixButtonSize = '2';

  return (
    <Card>
      <Flex
        justify="between"
        align="start"
        mb="3"
        direction={{ initial: editing ? 'column' : 'row', md: 'row' }}
        gap="2"
      >
        <Box>
          <Flex gap="2" align="center" mb="1">
            <HeartIcon
              current={typeof currentHp === 'number' ? currentHp : 0}
              max={typeof maxHp === 'number' ? maxHp : 1}
            />
            <Heading size="5">Hit Points</Heading>
          </Flex>
          <Text color="gray" size="1" style={{ display: 'block' }}>
            Level {level} • d{hitDie}
            {conMod != null ? ` • CON mod ${conMod >= 0 ? `+${conMod}` : conMod}` : ''}
          </Text>
        </Box>

        <Flex gap="2">
          {editing && (
            <>
              <Button
                variant="soft"
                size="1"
                onClick={() => submitWithMode('compute')}
                disabled={pending || transitionPending}
              >
                Set from character
              </Button>
              <Button
                variant="solid"
                size="1"
                onClick={() => submitWithMode('update')}
                disabled={pending || transitionPending}
              >
                Update from sheet
              </Button>
            </>
          )}

          <Button
            variant="surface"
            size="1"
            onClick={() => setEditing((prev) => !prev)}
            disabled={pending || transitionPending}
            color={editing ? 'orange' : undefined}
          >
            {editing ? 'Cancel' : 'Edit'}
          </Button>
        </Flex>
      </Flex>

      {editing ? (
        <>
          <Grid columns={{ initial: '1', sm: '2' }} gap="3">
            <StatField label="Base HP" value={baseHp} onChange={setBaseHp} pending={pending} />
            <StatField label="Max HP" value={maxHp} onChange={setMaxHp} pending={pending} />
            <StatField
              label="Current HP"
              value={currentHp}
              onChange={setCurrentHp}
              pending={pending}
            >
              <Flex gap="1">
                <Button
                  variant="soft"
                  size={adjustButtonSize}
                  onClick={() => handleAdjustCurrent(-5)}
                  disabled={pending || transitionPending}
                >
                  -5
                </Button>
                <Button
                  variant="soft"
                  size={adjustButtonSize}
                  onClick={() => handleAdjustCurrent(-1)}
                  disabled={pending || transitionPending}
                >
                  -1
                </Button>
                <Button
                  variant="soft"
                  size={adjustButtonSize}
                  onClick={() => handleAdjustCurrent(+1)}
                  disabled={pending || transitionPending}
                  style={{ fontWeight: 'bold' }}
                >
                  +1
                </Button>
                <Button
                  variant="soft"
                  size={adjustButtonSize}
                  onClick={() => handleAdjustCurrent(+5)}
                  disabled={pending || transitionPending}
                  style={{ fontWeight: 'bold' }}
                >
                  +5
                </Button>
              </Flex>
            </StatField>
            <StatField label="Temp HP" value={tempHp} onChange={setTempHp} pending={pending}>
              <RandomButton
                size="1"
                variant="soft"
                onClick={() => setTempHp(Math.max(0, Math.floor(Math.random() * 10) + 1))}
                label="Roll temp HP"
              />
            </StatField>
          </Grid>

          <Flex justify="end" align="center" mt="3">
            <Badge color={hpBadgeColor} size="3" variant="soft">
              {aboveMax && <Sparkles />}
              {typeof currentHp === 'number' && typeof maxHp === 'number'
                ? `${currentHp} / ${maxHp} HP`
                : 'HP pending'}
              {typeof tempHp === 'number' && tempHp > 0 ? ` (+${tempHp} temp)` : ''}
            </Badge>
          </Flex>
        </>
      ) : (
        <>
          <StaticStat label="Current HP" value={currentHp} size="3">
            <Flex gap="1" justify="end" flexGrow="1">
              <Button
                variant="soft"
                size={adjustButtonSize}
                onClick={() => handleAdjustCurrent(-5)}
                disabled={pending || transitionPending}
              >
                -5
              </Button>
              <Button
                variant="soft"
                size={adjustButtonSize}
                onClick={() => handleAdjustCurrent(-1)}
                disabled={pending || transitionPending}
              >
                -1
              </Button>
              <Button
                variant="soft"
                size={adjustButtonSize}
                onClick={() => handleAdjustCurrent(+1)}
                disabled={pending || transitionPending}
                style={{ fontWeight: 'bold' }}
              >
                +1
              </Button>
              <Button
                variant="soft"
                size={adjustButtonSize}
                onClick={() => handleAdjustCurrent(+5)}
                disabled={pending || transitionPending}
                style={{ fontWeight: 'bold' }}
              >
                +5
              </Button>
              <AlertDialog.Root>
                <AlertDialog.Trigger>
                  <IconButton color="gray" aria-label="Reset" variant="soft">
                    <RefreshCcw />
                  </IconButton>
                </AlertDialog.Trigger>
                <AlertDialog.Content maxWidth="450px">
                  <AlertDialog.Title>Reset Current HP</AlertDialog.Title>
                  <AlertDialog.Description size="2">
                    This will set your current HP to your max HP.
                  </AlertDialog.Description>

                  <Flex gap="3" mt="4" justify="end">
                    <AlertDialog.Cancel>
                      <Button variant="soft" color="gray">
                        Cancel
                      </Button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action>
                      <Button
                        variant="solid"
                        color="orange"
                        onClick={() => handleSetCurrent(parseInt((maxHp as string) ?? '0'))}
                      >
                        Reset
                      </Button>
                    </AlertDialog.Action>
                  </Flex>
                </AlertDialog.Content>
              </AlertDialog.Root>
            </Flex>
          </StaticStat>

          <Grid columns={{ initial: '3', sm: '3' }} gap="3" mt="4">
            <StaticStat label="Base HP" value={baseHp} />
            <StaticStat label="Max HP" value={maxHp} />
            <StaticStat label="Temp HP" value={tempHp} />
          </Grid>

          <Flex justify="end" align="center" mt="3">
            <Badge color={hpBadgeColor} size="3" variant="soft">
              {hpIsZero && <Skull />}
              {aboveMax && <Sparkles />}
              <Text size="5">
                {typeof currentHp === 'number' && typeof maxHp === 'number'
                  ? `${currentHp} / ${maxHp} HP`
                  : 'HP pending'}
                {typeof tempHp === 'number' && tempHp > 0 ? ` (+${tempHp} temp)` : ''}
              </Text>
            </Badge>
          </Flex>
        </>
      )}

      {state.status === 'error' && (
        <Text color="red" size="2" mt="2">
          {state.message ?? 'Failed to update hit points.'}
        </Text>
      )}
    </Card>
  );
};

const StatField = ({
  label,
  value,
  onChange,
  pending,
  children,
}: {
  label: string;
  value: number | '';
  onChange: (value: number | '') => void;
  pending: boolean;
  children?: React.ReactNode;
}) => {
  return (
    <Box>
      <Text weight="bold">{label}</Text>
      <Flex gap="2" align="center" mt="1">
        <TextField.Root
          type="number"
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val === '' ? '' : Number(val));
          }}
          style={{ width: '100%' }}
          disabled={pending}
        />
        {children}
      </Flex>
    </Box>
  );
};

const StaticStat = ({
  label,
  value,
  size = '2',
  children,
}: {
  label: string;
  value: number | '';
  size?: RadixTextSize;
  children?: React.ReactNode;
}) => {
  return (
    <Box>
      <Text size={size} color="gray">
        {label}
      </Text>
      <Flex gap="4" align="center" mt="1">
        <Text weight="bold" size="7">
          {value === '' ? '—' : value}
        </Text>
        {children}
      </Flex>
    </Box>
  );
};

const HeartIcon = ({ current, max }: { current: number; max: number }) => {
  const ratio = current / max;

  if (ratio <= 0.1) {
    return <HeartCrack size="1.3em" style={{ color: 'var(--red-a12)' }} />;
  }

  if (ratio < 0.5) {
    return <HeartMinus size="1.3em" style={{ color: 'var(--red-a12)' }} />;
  }

  if (ratio > 1) {
    return <HeartPlus size="1.3em" style={{ color: 'var(--red-a10)' }} />;
  }

  return <Heart size="1.3em" style={{ color: 'var(--red-a11)' }} />;
};
