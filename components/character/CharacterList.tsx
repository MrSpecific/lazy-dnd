'use client';

import { Grid, Heading, Text } from '@radix-ui/themes';
import { CharacterSummary } from '@/data/character/getCharacters';
import { CharacterCard } from '@/components/character/CharacterCard';

type CharacterListProps = {
  characters: CharacterSummary[];
};

export const CharacterList = ({ characters }: CharacterListProps) => {
  if (!characters.length) {
    return (
      <Text color="gray" size="2">
        You don&apos;t have any characters yet.
      </Text>
    );
  }

  return (
    <div>
      <Heading size="4" mb="3">
        Your characters
      </Heading>
      <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="3">
        {characters.map((character) => (
          <CharacterCard key={character.id} character={character} />
        ))}
      </Grid>
    </div>
  );
};
