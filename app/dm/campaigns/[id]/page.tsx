import { notFound } from 'next/navigation';
import { Box, Card, Flex, Heading, Section, Text } from '@radix-ui/themes';
import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';
import { CampaignDetailsForm } from '@/components/dm/CampaignDetailsForm';
import { QuickEncounterForm } from '@/components/dm/QuickEncounterForm';
import { Markdown } from '@/components/common/Markdown';

const formatName = (person: { name: string | null; email: string | null }) =>
  person.name || person.email || 'Unknown';
const formatSessionDate = (date: Date) =>
  date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

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
      notes: true,
      dmNotes: true,
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

  const encounters = await prisma.encounter.findMany({
    where: { session: { campaignId: campaign.id } },
    orderBy: [{ session: { date: 'desc' } }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      description: true,
      notes: true,
      dmNotes: true,
      loot: true,
      difficulty: true,
      session: { select: { date: true } },
    },
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
          <CampaignDetailsForm
            campaignId={campaign.id}
            description={campaign.description}
            notes={campaign.notes}
            dmNotes={campaign.dmNotes}
          />
        </Card>
      </Box>

      <Box mb="5">
        <Card>
          <Heading size="4" mb="2">
            Quick encounter
          </Heading>
          <QuickEncounterForm campaignId={campaign.id} />
        </Card>
      </Box>

      <Box mb="5">
        <Card>
          <Flex align="center" justify="between" mb="2">
            <Heading size="4">Encounters</Heading>
            <Text size="1" color="gray">
              {encounters.length} total
            </Text>
          </Flex>
          {encounters.length ? (
            <Flex direction="column" gap="4">
              {encounters.map((encounter) => (
                <Box key={encounter.id}>
                  <Flex align="center" justify="between" mb="1">
                    <Heading size="3">{encounter.name}</Heading>
                    {encounter.difficulty && (
                      <Text size="1" color="gray">
                        {encounter.difficulty}
                      </Text>
                    )}
                  </Flex>
                  {encounter.session?.date && (
                    <Text size="1" color="gray" mb="2">
                      Session {formatSessionDate(encounter.session.date)}
                    </Text>
                  )}
                  {encounter.description && <Markdown>{encounter.description}</Markdown>}
                  {encounter.notes && (
                    <Box mt="2">
                      <Text size="1" color="gray">
                        Notes
                      </Text>
                      <Markdown>{encounter.notes}</Markdown>
                    </Box>
                  )}
                  {encounter.dmNotes && (
                    <Box mt="2">
                      <Text size="1" color="gray">
                        DM notes
                      </Text>
                      <Markdown>{encounter.dmNotes}</Markdown>
                    </Box>
                  )}
                  {encounter.loot && (
                    <Box mt="2">
                      <Text size="1" color="gray">
                        Loot
                      </Text>
                      <Markdown>{encounter.loot}</Markdown>
                    </Box>
                  )}
                </Box>
              ))}
            </Flex>
          ) : (
            <Text size="2" color="gray">
              No encounters yet. Generate one to get started.
            </Text>
          )}
        </Card>
      </Box>

      <Flex gap="4" wrap="wrap" mb="4">
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
