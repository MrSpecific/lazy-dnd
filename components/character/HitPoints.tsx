'use client';

import { useActionState, useEffect, useMemo, useState, useTransition } from 'react';
import { Badge, Box, Button, Card, Flex, Grid, Text, TextField } from '@radix-ui/themes';
import { updateHitPoints, type UpdateHpState } from '@/data/character/updateHitPoints';
import { RandomButton } from '@/components/common/RandomButton';

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

  const handleRest = (type: 'short' | 'long') => {
    setTempHp(0);

    if (type === 'short') {
      const availableHd = Math.max(level, 1);
      const toSpendRaw = prompt(
        `Short Rest: Spend how many hit dice? You can spend up to ${availableHd} (d${hitDie}).`,
        '1'
      );
      const toSpend = Math.max(
        0,
        Math.min(availableHd, Number.isFinite(Number(toSpendRaw)) ? Number(toSpendRaw) : 0)
      );
      if (toSpend <= 0 || typeof maxHp !== 'number') return;

      let healed = 0;
      for (let i = 0; i < toSpend; i += 1) {
        const roll = 1 + Math.floor(Math.random() * hitDie);
        healed += roll + (conMod ?? 0);
      }
      healed = Math.max(0, healed);
      setCurrentHp((prev) => {
        const base = typeof prev === 'number' ? prev : 0;
        return Math.min(base + healed, maxHp as number);
      });
      return;
    }

    if (type === 'long' && typeof maxHp === 'number') {
      setCurrentHp(maxHp);
    }
  };

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
          : 'green'
      : 'gray';

  const adjustButtonSize: RadixButtonSize = '2';

  return (
    <Card>
      <Flex
        justify="between"
        align="start"
        mb="3"
        direction={{ initial: 'column', md: 'row' }}
        gap="2"
      >
        <Box>
          <Text weight="bold">Hit Points</Text>
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

          <Flex justify="between" align="center" mt="3" wrap="wrap" gap="2">
            <Flex gap="2" align="center">
              <Button
                variant="surface"
                size="2"
                onClick={() => handleRest('short')}
                disabled={pending || transitionPending}
              >
                Short Rest
              </Button>
              <Button
                variant="surface"
                size="2"
                onClick={() => handleRest('long')}
                disabled={pending || transitionPending}
              >
                Long Rest
              </Button>
            </Flex>
            <Badge color={hpBadgeColor} size="3" variant="soft">
              {typeof currentHp === 'number' && typeof maxHp === 'number'
                ? `${currentHp} / ${maxHp} HP`
                : 'HP pending'}
              {typeof tempHp === 'number' && tempHp > 0 ? ` (+${tempHp} temp)` : ''}
            </Badge>
          </Flex>
        </>
      ) : (
        <>
          <Grid columns={{ initial: '1', sm: '2' }} gap="3">
            <StaticStat label="Base HP" value={baseHp} />
            <StaticStat label="Max HP" value={maxHp} />
            <StaticStat label="Current HP" value={currentHp}>
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
            </StaticStat>
            <StaticStat label="Temp HP" value={tempHp} />
          </Grid>

          <Flex justify="between" align="center" mt="3" wrap="wrap" gap="2">
            <Flex gap="2" align="center">
              <Button
                variant="surface"
                size="2"
                onClick={() => handleRest('short')}
                disabled={pending || transitionPending}
              >
                Short Rest
              </Button>
              <Button
                variant="surface"
                size="2"
                onClick={() => handleRest('long')}
                disabled={pending || transitionPending}
              >
                Long Rest
              </Button>
            </Flex>
            <Badge color={hpBadgeColor} size="3" variant="soft">
              {typeof currentHp === 'number' && typeof maxHp === 'number'
                ? `${currentHp} / ${maxHp} HP`
                : 'HP pending'}
              {typeof tempHp === 'number' && tempHp > 0 ? ` (+${tempHp} temp)` : ''}
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
  children,
}: {
  label: string;
  value: number | '';
  children?: React.ReactNode;
}) => {
  return (
    <Box>
      <Text weight="bold">{label}</Text>
      <Flex gap="2" align="center" mt="1">
        <TextField.Root value={value === '' ? '—' : value} readOnly />
        {children}
      </Flex>
    </Box>
  );
};
