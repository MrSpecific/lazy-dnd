import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Box, Heading, Section, Text } from '@radix-ui/themes';
import { AbilityTable } from '@/components/character/AbilityTable';
import { WeaponSection } from '@/components/character/WeaponSection';
import { getCharacterAbilities } from '@/data/character/abilities';
import { getCharacterWeapons } from '@/data/character/weapons';
import { stackServerApp } from '@/stack/server';

export default async function CharacterPage({ params }: { params: { id: string } }) {
  const user = await stackServerApp.getUser({ or: 'redirect' });
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const character = await prisma.character.findUnique({
    where: { id, userId: user.id },
    include: {
      race: true,
      classLevels: {
        include: { class: true },
        orderBy: { level: 'desc' },
        take: 1,
      },
    },
  });

  if (!character) {
    notFound();
  }

  const primaryClass = character.classLevels[0]?.class;
  const abilities = await getCharacterAbilities(character.id);
  const weapons = await getCharacterWeapons(character.id);

  return (
    <Section>
      <Heading>{character.name}</Heading>
      <Box mt="2">
        <Text size="3">
          {primaryClass ? primaryClass.name : 'Unclassed'} {character.race?.name ?? ''}
        </Text>
      </Box>
      <Box mt="4">
        <AbilityTable characterId={character.id} abilities={abilities} />
      </Box>
      <Box mt="4">
        <WeaponSection characterId={character.id} initialWeapons={weapons} />
      </Box>
    </Section>
  );
}
