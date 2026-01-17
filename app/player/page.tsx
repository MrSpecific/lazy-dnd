import { notFound } from 'next/navigation';
import { Box, Card, Flex, Grid, Heading, Section, Text } from '@radix-ui/themes';
import prisma from '@/lib/prisma';
import { stackServerApp } from '@/stack/server';
import { getCharacters } from '@/data/character/getCharacters';
import { InvitesAndConnectionsSection } from '@/components/player/InvitesAndConnectionsSection';

export default async function () {
  const user = await stackServerApp.getUser({ or: 'return-null' });
  if (!user) {
    notFound();
  }

  const [characters, invitedCampaigns, parties] = await Promise.all([
    getCharacters(user.id),
    prisma.campaign.findMany({
      where: {
        players: { some: { id: user.id } },
        NOT: { OR: [{ ownerId: user.id }, { dms: { some: { id: user.id } } }] },
      },
      select: {
        id: true,
        name: true,
        description: true,
        owner: { select: { name: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.playerParty.findMany({
      where: { ownerId: user.id },
      select: {
        id: true,
        name: true,
        description: true,
        campaigns: { select: { id: true, name: true } },
        characters: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  const partyCampaignIds = new Set(parties.flatMap((party) => party.campaigns.map((c) => c.id)));
  const pendingInvites = invitedCampaigns.filter((campaign) => !partyCampaignIds.has(campaign.id));

  const characterOptions = characters.map((character) => ({
    id: character.id,
    name: character.name,
    className: character.className,
    raceName: character.raceName,
    level: character.level,
  }));

  return (
    <Section pt="0">
      <Box mb="5">
        <Heading size="6">Player hub</Heading>
        <Text size="2" color="gray">
          Manage campaign invites and build parties from your characters.
        </Text>
      </Box>

      <Box mb="6">
        <InvitesAndConnectionsSection
          heading="Invites & Connections"
          subheading="Manage campaign invites and send friend requests."
          pendingInvites={pendingInvites.map((invite) => ({
            id: invite.id,
            name: invite.name,
            description: invite.description ?? null,
            ownerName: invite.owner?.name ?? invite.owner?.email ?? null,
          }))}
          characters={characterOptions}
        />
      </Box>

      <Box>
        <Heading size="4" mb="2">
          Your parties
        </Heading>
        {parties.length ? (
          <Grid columns={{ initial: '1', md: '2' }} gap="3">
            {parties.map((party) => (
              <Card key={party.id}>
                <Flex direction="column" gap="2">
                  <Heading size="4">{party.name}</Heading>
                  {party.description && (
                    <Text size="2" color="gray">
                      {party.description}
                    </Text>
                  )}
                  <Text size="1" color="gray">
                    {party.characters.length} character{party.characters.length === 1 ? '' : 's'}
                  </Text>
                  {party.campaigns.length ? (
                    <Text size="1" color="gray">
                      Campaigns: {party.campaigns.map((campaign) => campaign.name).join(', ')}
                    </Text>
                  ) : (
                    <Text size="1" color="gray">
                      Not linked to a campaign yet.
                    </Text>
                  )}
                </Flex>
              </Card>
            ))}
          </Grid>
        ) : (
          <Card>
            <Text size="2" color="gray">
              No parties yet. Accept a campaign invite to create one.
            </Text>
          </Card>
        )}
      </Box>
    </Section>
  );
}
