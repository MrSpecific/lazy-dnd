import { notFound } from 'next/navigation';
import { Box, Card, Flex, Grid, Heading, Section, Text } from '@radix-ui/themes';
import { stackServerApp } from '@/stack/server';
import { getCampaigns } from '@/data/campaign/getCampaigns';
import { Link } from '@/components/common/Link';

export default async function () {
  const user = await stackServerApp.getUser({ or: 'return-null' });
  if (!user) {
    notFound();
  }

  const campaigns = await getCampaigns(user.id, 'player');

  return (
    <Section pt="0">
      <Box mb="5">
        <Heading size="6">My campaigns</Heading>
        <Text size="2" color="gray">
          Campaigns where you&apos;re playing with a party.
        </Text>
      </Box>

      {campaigns.length ? (
        <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="3">
          {campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/player/campaigns/${campaign.id}`}>
              <Card>
                <Heading size="3">{campaign.name}</Heading>
                {campaign.description && (
                  <Text color="gray" size="2">
                    {campaign.description}
                  </Text>
                )}
              </Card>
            </Link>
          ))}
        </Grid>
      ) : (
        <Card>
          <Text color="gray" size="2">
            You&apos;re not in any campaigns yet.
          </Text>
        </Card>
      )}
    </Section>
  );
}
