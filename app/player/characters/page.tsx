import { notFound } from 'next/navigation';
import { Box, Heading, Section, Text } from '@radix-ui/themes';
import { stackServerApp } from '@/stack/server';
import { getCharacters } from '@/data/character/getCharacters';
import { CharacterList } from '@/components/character/CharacterList';

export default async function CharactersPage() {
  const user = await stackServerApp.getUser({ or: 'return-null' });
  if (!user) {
    notFound();
  }

  const characters = await getCharacters(user.id);

  return (
    <Section pt="0">
      <CharacterList characters={characters} detail="medium" />
    </Section>
  );
}
