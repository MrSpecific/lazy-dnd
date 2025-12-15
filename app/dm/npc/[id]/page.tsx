import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Section } from '@radix-ui/themes';
import { stackServerApp } from '@/stack/server';
import { NpcSheet } from '@/components/dm/NpcSheet';

export default async function NpcPage({ params }: { params: { id: string } }) {
  const user = await stackServerApp.getUser({ or: 'redirect' });
  const { id } = await params;

  const npc = await prisma.npc.findUnique({
    where: { id, createdById: user.id },
    include: {
      race: true,
      class: true,
      statBlock: true,
    },
  });

  if (!npc) notFound();

  return (
    <Section>
      <NpcSheet
        npc={{
          id: npc.id,
          name: npc.name,
          title: npc.title,
          description: npc.description,
          raceId: npc.raceId,
          classId: npc.classId,
          gender: npc.gender,
          alignment: npc.alignment,
          statBlock: npc.statBlock
            ? {
                armorClass: npc.statBlock.armorClass,
                maxHp: npc.statBlock.maxHp,
                speed: npc.statBlock.speed,
                strength: npc.statBlock.strength,
                dexterity: npc.statBlock.dexterity,
                constitution: npc.statBlock.constitution,
                intelligence: npc.statBlock.intelligence,
                wisdom: npc.statBlock.wisdom,
                charisma: npc.statBlock.charisma,
              }
            : null,
        }}
        className={npc.class?.name ?? null}
        raceName={npc.race?.name ?? null}
      />
    </Section>
  );
}
