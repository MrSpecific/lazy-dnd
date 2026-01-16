import { Box, Heading, Section, Text, Container } from '@radix-ui/themes';
import { CampaignForm } from '@/components/dm/CampaignForm';

export default async function () {
  return (
    <Section>
      <Section size="1">
        <Container>
          <Box mb="4">
            <Heading size="5">Start a new campaign</Heading>
            <Text size="2" color="gray">
              Set the basics, invite players, and jump into your story.
            </Text>
          </Box>
          <CampaignForm />
        </Container>
      </Section>
    </Section>
  );
}
