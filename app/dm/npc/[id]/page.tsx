import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Box, Heading, Section, Text } from '@radix-ui/themes';
import { stackServerApp } from '@/stack/server';

export default async function NpcPage({ params }: { params: { id: string } }) {
  const user = await stackServerApp.getUser({ or: 'redirect' });
  const { id } = params;

  const npc = await prisma.npc.findUnique({
    where: { id, createdById: user.id },
    include: {
      race: true,
      class: true,
    },
  });

  if (!npc) notFound();

  return (
    <Section>
      <Heading>{npc.name}</Heading>
      <Text color="gray" size="3">
        {npc.title ?? 'NPC'} • {npc.class?.name ?? 'Unclassed'} {npc.race?.name ?? ''}
      </Text>
      {npc.description && (
        <Box mt="3">
          <Text>{npc.description}</Text>
        </Box>
      )}
    </Section>
  );
}
