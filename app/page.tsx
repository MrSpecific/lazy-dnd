export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { Box, Card, Container, Flex, Heading, ThemePanel, Text } from '@radix-ui/themes';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Metadata } from 'next';
import { stackServerApp } from '@/stack/server';
import { getCharacters } from '@/data/character/getCharacters';
import { CharacterList } from '@/components/character/CharacterList';
import { getNpcs } from '@/data/npc/getNpcs';
import { NpcList } from '@/components/npc/NpcList';
import { Link } from '@/components/common/Link';
import Illustration from '@/components/svg/lazy-dragon.svg';
import prisma from '@/lib/prisma';
import { InvitesAndConnectionsSection } from '@/components/player/InvitesAndConnectionsSection';

const btoa = (str: string) => Buffer.from(str).toString('base64');

const config = {
  url: 'https://ably-livesync-neon.vercel.app',
  title: 'Lazy DnD',
  description: 'DnD for lazy people.',
};

export const metadata: Metadata = {
  title: config.title,
  description: config.description,
  openGraph: {
    url: config.url,
    title: config.title,
    description: config.description,
    // images: `https://neon.tech/docs/og?title=${btoa(config.title)}&breadcrumb=${btoa('Ably')}`,
  },
  twitter: {
    title: config.title,
    card: 'summary_large_image',
    description: config.description,
    // images: `https://neon.tech/docs/og?title=${btoa(config.title)}&breadcrumb=${btoa('Ably')}`,
  },
};

export default async function () {
  const user = await stackServerApp.getUser({ or: 'return-null' });
  const characters = user ? await getCharacters(user.id) : [];
  const npcs = user ? await getNpcs(user.id) : [];

  const [invitedCampaigns, parties] = user
    ? await Promise.all([
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
          select: { id: true, campaigns: { select: { id: true } } },
        }),
      ])
    : [[], []];

  const partyCampaignIds = new Set(parties.flatMap((party) => party.campaigns.map((c) => c.id)));
  const pendingInvites = invitedCampaigns.filter((campaign) => !partyCampaignIds.has(campaign.id));

  return (
    <>
      {/* <ThemePanel /> */}
      <Header showUserCard={!!user} />

      <Box>
        <Card>
          {user ? (
            <>
              <Box mb="6">
                <InvitesAndConnectionsSection
                  pendingInvites={pendingInvites.map((invite) => ({
                    id: invite.id,
                    name: invite.name,
                    description: invite.description ?? null,
                    ownerName: invite.owner?.name ?? invite.owner?.email ?? null,
                  }))}
                  characters={characters.map((character) => ({
                    id: character.id,
                    name: character.name,
                    className: character.className,
                    raceName: character.raceName,
                    level: character.level,
                  }))}
                />
              </Box>
              <CharacterList characters={characters} />
              {npcs?.length > 0 && (
                <Box mt="6">
                  <NpcList npcs={npcs} />
                </Box>
              )}
            </>
          ) : (
            <Container size="1" mt="6" mb="4">
              <Heading size="5" mb="4" align="center" style={{ color: 'var(--green-a12)' }}>
                Welcome to Lazy DnD. <br /> Pull up a chair and let&apos;s get started!
              </Heading>
              <Flex gap="2" justify="center" align="center">
                <Link href="/handler/sign-in" size="3">
                  Log In
                </Link>
                <Text size="1" color="gray">
                  or
                </Text>
                <Link href="/handler/sign-up" size="3">
                  Sign Up
                </Link>
              </Flex>
            </Container>
          )}

          <Container size="2" mt="6" mb="4">
            <Illustration width="100%" height="auto" style={{ fill: '#010101' }} />
          </Container>
        </Card>
      </Box>

      <Footer />
    </>
  );
}
