'use client';

import { Card, Flex, Heading, Text } from '@radix-ui/themes';
import { CharacterSummary } from '@/data/character/getCharacters';
import { Link } from '@/components/common/Link';

export type CharacterCardDetail = 'low' | 'medium' | 'high';

type CharacterCardProps = {
  character: CharacterSummary;
  detail?: CharacterCardDetail;
};

export const CharacterCard = ({ character, detail = 'low' }: CharacterCardProps) => {
  const subtitleParts = [character.className, character.raceName].filter(Boolean).join(' • ');
  const vitals: {
    label: string;
    value: number | string | null;
  }[] = [];

  if (character.hp !== null) {
    vitals.push({ label: 'HP', value: character.hp });
  }
  if (character.ac !== null) {
    vitals.push({ label: 'AC', value: character.ac });
  }
  if (character.speed !== null) {
    vitals.push({ label: 'Speed', value: character.speed });
  }

  return (
    <Link href={`/player/character/${character.id}`}>
      <Card asChild variant="classic" style={{ cursor: 'pointer' }}>
        <Flex direction="column" gap="1">
          <Heading size={detail === 'low' ? '3' : detail === 'medium' ? '4' : '6'}>
            {character.name}
          </Heading>
          <Text as="div" color="gray" size="2">
            {subtitleParts || 'Unclassed'} • Level {character.level}
          </Text>

          {detail !== 'low' && (
            <Flex gap="2" align="center" wrap="wrap" mt="1">
              {vitals.map((v, index) => (
                <>
                  <Vital key={`${character.id}-${v.label}`} label={v.label} value={v.value} />
                  {index < vitals.length - 1 && (
                    <span key={`separator-${character.id}-${v.label}`}> • </span>
                  )}
                </>
              ))}
            </Flex>
          )}

          {detail === 'medium' && character.stats && (
            <Text as="div" size="2" mt="2">
              STR {character.stats.STR ?? '—'} • DEX {character.stats.DEX ?? '—'} • CON{' '}
              {character.stats.CON ?? '—'} • INT {character.stats.INT ?? '—'} • WIS{' '}
              {character.stats.WIS ?? '—'} • CHA {character.stats.CHA ?? '—'}
            </Text>
          )}

          {detail === 'high' && (
            <Flex direction="column" gap="1">
              {character.stats && (
                <Text color="gray" size="1">
                  STR {character.stats.STR ?? '—'} • DEX {character.stats.DEX ?? '—'} • CON{' '}
                  {character.stats.CON ?? '—'} • INT {character.stats.INT ?? '—'} • WIS{' '}
                  {character.stats.WIS ?? '—'} • CHA {character.stats.CHA ?? '—'}
                </Text>
              )}
              {character.weapons?.length ? (
                <Text color="gray" size="1">
                  Weapons: {character.weapons.join(', ')}
                </Text>
              ) : null}
              {character.spells?.length ? (
                <Text color="gray" size="1">
                  Spells: {character.spells.join(', ')}
                </Text>
              ) : null}
            </Flex>
          )}
        </Flex>
      </Card>
    </Link>
  );
};

const Vital = ({ label, value }: { label: string; value: number | string | null }) => {
  return (
    <Flex gap="1" align="center">
      <Text size="2" color="gray">
        {label}:
      </Text>
      <Text size="2">{value ?? '—'}</Text>
    </Flex>
  );
};
