export const dynamic = 'force-dynamic';

export const fetchCache = 'force-no-store';

import Footer from '@/components/footer';
import { UserCard } from '@/components/UserCard';
import { getPost, getRandomUser } from '@/lib/prisma/api';
import { Box, Card, Container, Heading, ThemePanel } from '@radix-ui/themes';
import { Header } from '@/components/Header';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { stackServerApp } from '@/stack/server';
import { getCharacters } from '@/data/character/getCharacters';
import { CharacterList } from '@/components/character/CharacterList';
import Illustration from '@/components/svg/lazy-dragon.svg';

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
  const characters = user ? await getCharacters() : [];

  return (
    <>
      {/* <ThemePanel /> */}
      <Header />
      <Box>
        <Card>
          <Heading size="5" mb="4" align="center">
            Welcome to Lazy DnD
          </Heading>

          <Container size="2">
            <Illustration width="100%" height="auto" />
          </Container>
          {user ? (
            <CharacterList characters={characters} />
          ) : (
            <Box>
              <Heading size="4">Sign in to manage your characters</Heading>
              <UserCard />
            </Box>
          )}
        </Card>
      </Box>
    </>
  );
}
