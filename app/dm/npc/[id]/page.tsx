import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Box, Heading, Section, Text } from '@radix-ui/themes';
import { stackServerApp } from '@/stack/server';
import { Alignment, Gender } from '@prisma/client';

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
      <Heading>{npc.name}</Heading>
      <Text color="gray" size="3">
        {npc.title ?? 'NPC'} • {npc.class?.name ?? 'Unclassed'} {npc.race?.name ?? ''}
      </Text>
      <Text color="gray" size="2">
        {npc.gender ?? 'Unspecified'} • {npc.alignment ?? 'No alignment'}
      </Text>
      {npc.description && (
        <Box mt="3">
          <Text>{npc.description}</Text>
        </Box>
      )}
      {npc.statBlock && (
        <Box mt="4">
          <Heading size="3" mb="2">
            Stat Block
          </Heading>
          <Text>AC: {npc.statBlock.armorClass ?? '—'}</Text>
          <Text>HP: {npc.statBlock.maxHp ?? '—'}</Text>
          <Text>Speed: {npc.statBlock.speed ? `${npc.statBlock.speed} ft` : '—'}</Text>
          <Box mt="2">
            <Text weight="bold">Abilities</Text>
            <Text color="gray" size="2">
              STR {npc.statBlock.strength ?? '—'} • DEX {npc.statBlock.dexterity ?? '—'} • CON{' '}
              {npc.statBlock.constitution ?? '—'} • INT {npc.statBlock.intelligence ?? '—'} • WIS{' '}
              {npc.statBlock.wisdom ?? '—'} • CHA {npc.statBlock.charisma ?? '—'}
            </Text>
          </Box>
        </Box>
      )}
    </Section>
  );
}
