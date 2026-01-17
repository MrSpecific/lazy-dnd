import { notFound } from 'next/navigation';
import { Box, Card, Flex, Heading, Section, Text } from '@radix-ui/themes';
import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';
import { Markdown } from '@/components/common/Markdown';

const formatName = (person: { name: string | null; email: string | null }) =>
  person.name || person.email || 'Unknown';

export default async function CampaignPage({ params }: { params: { id: string } }) {
  const user = await stackServerApp.getUser({ or: 'redirect' });
  const { id } = params;

  const campaign = await prisma.campaign.findFirst({
    where: {
      id,
      players: { some: { id: user.id } },
    },
    select: {
      id: true,
      name: true,
      description: true,
      notes: true,
      dms: {
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

  const parties = await prisma.playerParty.findMany({
    where: {
      ownerId: user.id,
      campaigns: { some: { id: campaign.id } },
    },
    select: {
      id: true,
      name: true,
      description: true,
      characters: { select: { id: true, name: true } },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <Section pt="0">
      <Box mb="4">
        <Heading size="6">{campaign.name}</Heading>
      </Box>

      <Box mb="5">
        <Card>
          <Heading size="4" mb="2">
            Campaign details
          </Heading>
          {campaign.description ? (
            <Box mb="3">
              <Text size="1" color="gray">
                Description
              </Text>
              <Markdown>{campaign.description}</Markdown>
            </Box>
          ) : (
            <Text size="2" color="gray" mb="3">
              No description yet.
            </Text>
          )}
          {campaign.notes ? (
            <Box>
              <Text size="1" color="gray">
                Notes
              </Text>
              <Markdown>{campaign.notes}</Markdown>
            </Box>
          ) : (
            <Text size="2" color="gray">
              No notes yet.
            </Text>
          )}
        </Card>
      </Box>

      <Flex gap="4" wrap="wrap" mb="5">
        <Card style={{ flex: '1 1 280px' }}>
          <Heading size="4" mb="2">
            Dungeon Masters
          </Heading>
          {campaign.dms.length ? (
            <Flex gap="2" wrap="wrap">
              {campaign.dms.map((dm) => (
                <Text key={dm.id} size="2">
                  {formatName(dm)}
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
            Your parties
          </Heading>
          {parties.length ? (
            <Flex direction="column" gap="3">
              {parties.map((party) => (
                <Box key={party.id}>
                  <Heading size="3">{party.name}</Heading>
                  {party.description && (
                    <Text size="2" color="gray">
                      {party.description}
                    </Text>
                  )}
                  <Text size="1" color="gray">
                    {party.characters.length} character{party.characters.length === 1 ? '' : 's'}
                  </Text>
                </Box>
              ))}
            </Flex>
          ) : (
            <Text size="2" color="gray">
              No parties linked to this campaign yet.
            </Text>
          )}
        </Card>
      </Flex>
    </Section>
  );
}
