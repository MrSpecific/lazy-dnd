import { notFound } from 'next/navigation';
import { Section, Heading, Box, Text } from '@radix-ui/themes';
import { stackServerApp } from '@/stack/server';
import { getNpcs } from '@/data/npc/getNpcs';
import { NpcList } from '@/components/npc/NpcList';

export default async function NpcsPage() {
  const user = await stackServerApp.getUser({ or: 'return-null' });
  if (!user) {
    notFound();
  }

  const npcs = await getNpcs();

  return (
    <Section pt="0">
      {npcs.length ? (
        <NpcList npcs={npcs} />
      ) : (
        <Box>
          <Text color="gray">You don&apos;t have any NPCs yet.</Text>
        </Box>
      )}
    </Section>
  );
}
