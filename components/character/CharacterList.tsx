'use client';

import { Grid, Heading, Text, Box } from '@radix-ui/themes';
import { CharacterSummary } from '@/data/character/getCharacters';
import { CharacterCard, type CharacterCardDetail } from '@/components/character/CharacterCard';
import { Link } from '@/components/common/Link';

type CharacterListProps = {
  characters: CharacterSummary[];
  detail?: CharacterCardDetail;
};

export const CharacterList = ({ characters, detail = 'low' }: CharacterListProps) => {
  if (!characters.length) {
    return (
      <Text color="gray" size="2">
        You don&apos;t have any characters yet.
      </Text>
    );
  }

  return (
    <Box>
      <Link href="/player/characters">
        <Heading size="5" mb="3">
          Your characters
        </Heading>
      </Link>

      <Grid columns={{ initial: '1', sm: '2', md: detail === 'low' ? '4' : '3' }} gap="3">
        {characters.map((character) => (
          <CharacterCard key={character.id} character={character} detail={detail} />
        ))}
      </Grid>
    </Box>
  );
};
