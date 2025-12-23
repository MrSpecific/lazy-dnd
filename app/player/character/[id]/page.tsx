import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Box, Grid, Section, Separator } from '@radix-ui/themes';
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
  const [abilities, weapons, catalog, armor, armorCatalog, spells, spellCatalog, spellSlots] =
    await Promise.all([
      getCharacterAbilities(character.id, user.id),
      getCharacterWeapons(character.id, user.id),
      getWeaponCatalog(user.id),
      getCharacterArmor(character.id, user.id),
      getArmorCatalog(user.id),
      getCharacterSpells(character.id, user.id),
      getSpellCatalog(user.id),
      getCharacterSpellSlots(character.id, user.id),
    ]);
  const con = abilities.find((a) => a.ability === 'CON');
  const conScore = con ? con.baseScore + con.bonus + con.temporary : null;
  const level = character.classLevels.reduce((sum, cl) => sum + (cl.level ?? 0), 0) || 1;
  const hitDie = primaryClass?.hitDie ?? 8;
  const sectionGap: RadixMargin['mt'] = '6';

  return (
    <Section pt="0">
      <Grid gap="4">
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

        <Box>
          <AbilityTable characterId={character.id} abilities={abilities} />
        </Box>

        <Separator size="4" mt="4" />

        {/* Weapons */}
        <Box>
          <WeaponSection characterId={character.id} initialWeapons={weapons} catalog={catalog} />
        </Box>

        {/* Armor */}
        <Box>
          <ArmorSection characterId={character.id} initialArmor={armor} catalog={armorCatalog} />
        </Box>

        {/* Spells */}
        <Box>
          <SpellSection
            characterId={character.id}
            initialSpells={spells}
            catalog={spellCatalog}
            initialSlots={spellSlots}
          />
        </Box>

        {/* Items */}
        <Box></Box>
      </Grid>
    </Section>
  );
}
