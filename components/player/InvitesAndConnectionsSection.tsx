import { Box, Card, Flex, Heading, Text } from '@radix-ui/themes';
import { CampaignInviteCard } from '@/components/player/CampaignInviteCard';
import { FriendRequestForm } from '@/components/player/FriendRequestForm';

type CharacterOption = {
  id: string;
  name: string;
  className: string | null;
  raceName: string | null;
  level: number;
};

type CampaignInvite = {
  id: string;
  name: string;
  description: string | null;
  ownerName: string | null;
};

type InvitesAndConnectionsSectionProps = {
  heading?: string;
  subheading?: string;
  invitesHeading?: string;
  pendingInvites: CampaignInvite[];
  characters: CharacterOption[];
};

export const InvitesAndConnectionsSection = ({
  heading = 'Invites & Connections',
  subheading = 'Manage campaign invites and friend requests.',
  invitesHeading = 'Campaign invites',
  pendingInvites,
  characters,
}: InvitesAndConnectionsSectionProps) => {
  return (
    <Box>
      <Box mb="4">
        <Heading size="5">{heading}</Heading>
        <Text size="2" color="gray">
          {subheading}
        </Text>
      </Box>

      <Box mb="4">
        <Flex align="center" justify="between" mb="2">
          <Heading size="4">{invitesHeading}</Heading>
          <Text size="1" color="gray">
            {pendingInvites.length} pending
          </Text>
        </Flex>
        {pendingInvites.length ? (
          <Flex direction="column" gap="3">
            {pendingInvites.map((invite) => (
              <CampaignInviteCard
                key={invite.id}
                invite={invite}
                characters={characters}
              />
            ))}
          </Flex>
        ) : (
          <Card>
            <Text size="2" color="gray">
              No pending campaign invites right now.
            </Text>
          </Card>
        )}
      </Box>

      <FriendRequestForm />
    </Box>
  );
};
