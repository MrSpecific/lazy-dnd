import { notFound } from 'next/navigation';
import { Box, Card, Flex, Heading, Section, Text } from '@radix-ui/themes';
import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';

const formatName = (person: { name: string | null; email: string | null }) =>
  person.name || person.email || 'Unknown';

export default async function CampaignPage({ params }: { params: { id: string } }) {
  const user = await stackServerApp.getUser({ or: 'redirect' });
  const { id } = params;

  const campaign = await prisma.campaign.findFirst({
    where: {
      id,
      OR: [{ ownerId: user.id }, { dms: { some: { id: user.id } } }],
    },
    select: {
      id: true,
      name: true,
      description: true,
      ownerId: true,
      dms: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      players: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!campaign) {
    notFound();
  }

  return (
    <Section pt="0">
      <Box mb="4">
        <Heading size="6">{campaign.name}</Heading>
        {campaign.description && (
          <Text size="2" color="gray">
            {campaign.description}
          </Text>
        )}
      </Box>

      <Flex gap="4" wrap="wrap">
        <Card style={{ flex: '1 1 280px' }}>
          <Heading size="4" mb="2">
            Dungeon Masters
          </Heading>
          {campaign.dms.length ? (
            <Flex gap="2" wrap="wrap">
              {campaign.dms.map((dm) => (
                <Text key={dm.id} size="2">
                  {formatName(dm)}
                  {dm.id === campaign.ownerId ? ' (Owner)' : ''}
                </Text>
              ))}
            </Flex>
          ) : (
            <Text size="2" color="gray">
              No DMs assigned yet.
            </Text>
          )}
        </Card>

        <Card style={{ flex: '1 1 280px' }}>
          <Heading size="4" mb="2">
            Players
          </Heading>
          {campaign.players.length ? (
            <Flex gap="2" wrap="wrap">
              {campaign.players.map((player) => (
                <Text key={player.id} size="2">
                  {formatName(player)}
                </Text>
              ))}
            </Flex>
          ) : (
            <Text size="2" color="gray">
              No players yet.
            </Text>
          )}
        </Card>
      </Flex>
    </Section>
  );
}
