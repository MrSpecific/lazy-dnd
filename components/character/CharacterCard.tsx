'use client';

import { Card, Flex, Heading, Text } from '@radix-ui/themes';
import { CharacterSummary } from '@/data/character/getCharacters';
import { Link } from '@/components/common/Link';

type CharacterCardProps = {
  character: CharacterSummary;
};

export const CharacterCard = ({ character }: CharacterCardProps) => {
  const subtitleParts = [character.className, character.raceName].filter(Boolean).join(' • ');

  return (
    <Link href={`/player/character/${character.id}`}>
      <Card asChild variant="classic" style={{ cursor: 'pointer' }}>
        <Flex direction="column" gap="1">
          <Heading size="3">{character.name}</Heading>
          <Text color="gray" size="2">
            {subtitleParts || 'Unclassed'} • Level {character.level}
          </Text>
        </Flex>
      </Card>
    </Link>
  );
};
