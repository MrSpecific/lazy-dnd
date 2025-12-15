export const dynamic = 'force-dynamic';

export const fetchCache = 'force-no-store';

import { Footer } from '@/components/Footer';
import Post from '@/components/post';
import PostPlaceholder from '@/components/post-placeholder';
import { UserCard } from '@/components/UserCard';
import { getPost, getRandomUser } from '@/lib/prisma/api';
import { Box, Card, Heading } from '@radix-ui/themes';
import { Metadata } from 'next';
import { Suspense } from 'react';

const btoa = (str: string) => Buffer.from(str).toString('base64');

const config = {
  url: 'https://ably-livesync-neon.vercel.app',
  title: 'Real-time comments with Ably LiveSync and Postgres',
  description:
    'A demo of how Ably LiveSync can be combined with a Serverless Postgres to power real-time comments.',
};

export const metadata: Metadata = {
  title: config.title,
  description: config.description,
  openGraph: {
    url: config.url,
    title: config.title,
    description: config.description,
    images: `https://neon.tech/docs/og?title=${btoa(config.title)}&breadcrumb=${btoa('Ably')}`,
  },
  twitter: {
    title: config.title,
    card: 'summary_large_image',
    description: config.description,
    images: `https://neon.tech/docs/og?title=${btoa(config.title)}&breadcrumb=${btoa('Ably')}`,
  },
};

export default async function () {
  const promises = await Promise.all([getPost(1), getRandomUser()]);
  const [post] = promises[0];
  const user = promises[1];

  return (
    <Box>
      <UserCard />
      <Card>
        <Heading>Ably Postgres LiveSync (powered by Neon)</Heading>
        <Suspense fallback={<PostPlaceholder />}>
          <Post user={user} post={post} />
        </Suspense>
        <Footer />
      </Card>
    </Box>
  );
}
