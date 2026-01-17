import { notFound } from 'next/navigation';
import { Box, Card, Flex, Grid, Heading, Section, Text } from '@radix-ui/themes';
import { PlusCircle } from 'lucide-react';
import { stackServerApp } from '@/stack/server';
import { getCampaigns } from '@/data/campaign/getCampaigns';
import { ButtonLink, Link } from '@/components/common/Link';

export default async function () {
  const user = await stackServerApp.getUser({ or: 'return-null' });
  if (!user) {
    notFound();
  }

  const campaigns = await getCampaigns(user.id, 'dm');

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
        {campaigns.length ? (
          <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="3">
            {campaigns.map((campaign) => (
              <Link key={campaign.id} href={`/dm/campaigns/${campaign.id}`}>
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
              No campaigns yet. Start one to invite players and track sessions.
            </Text>
          </Card>
        )}
      </Box>
    </Section>
  );
}
