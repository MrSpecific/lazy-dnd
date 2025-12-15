import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Box, Heading, Section, Text } from '@radix-ui/themes';
import { AbilityTable } from '@/components/character/AbilityTable';
import { WeaponSection } from '@/components/character/WeaponSection';
import { getCharacterAbilities } from '@/data/character/abilities';
import { getCharacterWeapons, getWeaponCatalog } from '@/data/character/weapons';
import { stackServerApp } from '@/stack/server';
import { CharacterInfoEditor } from '@/components/character/CharacterInfoEditor';
import { HitPoints } from '@/components/character/HitPoints';
import { Gender } from '@prisma/client';

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
  const catalog = await getWeaponCatalog();
  const con = abilities.find((a) => a.ability === 'CON');
  const conScore = con ? con.baseScore + con.bonus + con.temporary : null;
  const level = character.classLevels.reduce((sum, cl) => sum + (cl.level ?? 0), 0) || 1;
  const hitDie = primaryClass?.hitDie ?? 8;

  return (
    <Section>
      <CharacterInfoEditor
        characterId={character.id}
        initialName={character.name}
        initialRaceId={character.raceId}
        initialGender={character.gender as Gender}
        initialAlignment={character.alignment}
        className={primaryClass?.name ?? null}
        raceName={character.race?.name ?? null}
      />
      <Box mt="4">
        <HitPoints
          characterId={character.id}
          level={level}
          hitDie={hitDie}
          conScore={conScore}
          initialBaseHp={character.baseHp}
          initialMaxHp={character.maxHp}
          initialCurrentHp={character.currentHp}
          initialTempHp={character.tempHp}
        />
      </Box>
      <Box mt="4">
        <AbilityTable characterId={character.id} abilities={abilities} />
      </Box>
      <Box mt="4">
        <WeaponSection characterId={character.id} initialWeapons={weapons} catalog={catalog} />
      </Box>
    </Section>
  );
}
