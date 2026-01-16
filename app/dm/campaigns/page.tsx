import { notFound } from 'next/navigation';
import { Box, Card, Flex, Heading, Section, Text } from '@radix-ui/themes';
import { PlusCircle } from 'lucide-react';
import { stackServerApp } from '@/stack/server';
import { getNpcs } from '@/data/npc/getNpcs';
import { NpcList } from '@/components/npc/NpcList';
import { ButtonLink } from '@/components/common/Link';

export default async function () {
  const user = await stackServerApp.getUser({ or: 'return-null' });
  if (!user) {
    notFound();
  }

  const npcs = await getNpcs(user.id);

  return (
    <Section pt="0">
      <Box mb="5">
        <Heading size="6">Campaigns</Heading>
      </Box>

      <Box mb="6">
        <Flex align="center" justify="between" mb="2">
          <Heading size="4">Campaigns</Heading>
          <ButtonLink href="/dm/campaigns/new" size="1">
            <PlusCircle size="1em" /> Start new
          </ButtonLink>
        </Flex>
        <Card>
          <Text color="gray" size="2">
            No campaigns yet. Start one to invite players and track sessions.
          </Text>
        </Card>
      </Box>
    </Section>
  );
}
