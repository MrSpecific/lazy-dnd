export const dynamic = 'force-dynamic';

export const fetchCache = 'force-no-store';

import Footer from '@/components/footer';
import { UserCard } from '@/components/UserCard';
import { getPost, getRandomUser } from '@/lib/prisma/api';
import { Box, Card, Heading } from '@radix-ui/themes';
import { Header } from '@/components/Header';
import { Metadata } from 'next';
import { Suspense } from 'react';

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
  const promises = await Promise.all([getPost(1), getRandomUser()]);
  const [post] = promises[0];
  const user = promises[1];

  return (
    <>
      <Header />
      <Box>
        <Card>
          {/* <Suspense fallback={<PostPlaceholder />}>
          <Post user={user} post={post} />
          </Suspense> */}
          {/* <Footer /> */}
        </Card>
      </Box>
    </>
  );
}
