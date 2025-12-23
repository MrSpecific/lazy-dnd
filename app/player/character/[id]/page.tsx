import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Box, Grid, Section } from '@radix-ui/themes';
import { AbilityTable } from '@/components/character/AbilityTable';
import { WeaponSection } from '@/components/character/WeaponSection';
import { getCharacterAbilities } from '@/data/character/abilities';
import { getCharacterWeapons, getWeaponCatalog } from '@/data/character/weapons';
import { getCharacterArmor, getArmorCatalog } from '@/data/character/armor';
import { stackServerApp } from '@/stack/server';
import { CharacterInfoEditor } from '@/components/character/CharacterInfoEditor';
import { HitPoints } from '@/components/character/HitPoints';
import { Gender } from '@prisma/client';
import { ArmorClass } from '@/components/character/ArmorClass';
import { ArmorSection } from '@/components/character/ArmorSection';
import { SpellSection } from '@/components/character/SpellSection';
import {
  getCharacterSpellSlots,
  getCharacterSpells,
  getSpellCatalog,
} from '@/data/character/spells';

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
  const armor = await getCharacterArmor(character.id);
  const armorCatalog = await getArmorCatalog();
  const spells = await getCharacterSpells(character.id);
  const spellCatalog = await getSpellCatalog();
  const spellSlots = await getCharacterSpellSlots(character.id);
  const con = abilities.find((a) => a.ability === 'CON');
  const conScore = con ? con.baseScore + con.bonus + con.temporary : null;
  const level = character.classLevels.reduce((sum, cl) => sum + (cl.level ?? 0), 0) || 1;
  const hitDie = primaryClass?.hitDie ?? 8;
  const sectionGap: RadixMargin['mt'] = '6';

  return (
    <Section pt="0">
      <CharacterInfoEditor
        characterId={character.id}
        initialName={character.name}
        level={level}
        initialRaceId={character.raceId}
        initialGender={character.gender as Gender}
        initialAlignment={character.alignment}
        className={primaryClass?.name ?? null}
        raceName={character.race?.name ?? null}
      />

      <Grid mt={sectionGap} columns={{ initial: '1', md: '2' }} gap="4">
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
        <ArmorClass
          characterId={character.id}
          initialArmorClass={character.armorClass}
          initialSpeed={character.speed}
        />
      </Grid>

      <Box mt={sectionGap}>
        <AbilityTable characterId={character.id} abilities={abilities} />
      </Box>

      {/* Weapons */}
      <Box mt={sectionGap}>
        <WeaponSection characterId={character.id} initialWeapons={weapons} catalog={catalog} />
      </Box>

      {/* Armor */}
      <Box mt={sectionGap}>
        <ArmorSection characterId={character.id} initialArmor={armor} catalog={armorCatalog} />
      </Box>

      {/* Spells */}
      <Box mt={sectionGap}>
        <SpellSection
          characterId={character.id}
          initialSpells={spells}
          catalog={spellCatalog}
          initialSlots={spellSlots}
        />
      </Box>

      {/* Items */}
      <Box mt={sectionGap}></Box>
    </Section>
  );
}
