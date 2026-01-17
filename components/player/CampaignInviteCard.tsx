'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Flex,
  Heading,
  Text,
  TextField,
} from '@radix-ui/themes';
import { Form, InputLabel } from '@/components/form';
import { createParty, type CreatePartyState } from '@/data/party/createParty';
import {
  declineCampaignInvite,
  type DeclineCampaignInviteState,
} from '@/data/campaign/declineCampaignInvite';
import { Link } from '@/components/common/Link';

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

type CampaignInviteCardProps = {
  invite: CampaignInvite;
  characters: CharacterOption[];
};

const buildCharacterLabel = (character: CharacterOption) => {
  const subtitle = [character.raceName, character.className, `Lv ${character.level}`]
    .filter(Boolean)
    .join(' • ');
  return subtitle;
};

export const CampaignInviteCard = ({ invite, characters }: CampaignInviteCardProps) => {
  const router = useRouter();
  const defaultPartyName = useMemo(() => `${invite.name} Party`, [invite.name]);
  const [partyName, setPartyName] = useState(defaultPartyName);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);

  const [acceptState, acceptAction, acceptPending] = useActionState<CreatePartyState, FormData>(
    createParty,
    { status: 'idle' },
  );
  const [declineState, declineAction, declinePending] = useActionState<
    DeclineCampaignInviteState,
    FormData
  >(declineCampaignInvite, { status: 'idle' });

  useEffect(() => {
    setPartyName(defaultPartyName);
    setSelectedCharacters([]);
  }, [defaultPartyName]);

  useEffect(() => {
    if (acceptState.status === 'success' || declineState.status === 'success') {
      router.refresh();
    }
  }, [acceptState.status, declineState.status, router]);

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Box>
          <Flex align="center" justify="between">
            <Heading size="4">{invite.name}</Heading>
            <Badge color="amber" variant="soft">
              Invite
            </Badge>
          </Flex>
          {invite.ownerName && (
            <Text size="1" color="gray">
              From {invite.ownerName}
            </Text>
          )}
          {invite.description && (
            <Text size="2" color="gray" mt="1">
              {invite.description}
            </Text>
          )}
        </Box>

        <Form action={acceptAction} showActions={false}>
          <input type="hidden" name="campaignId" value={invite.id} />
          <input type="hidden" name="characterIds" value={JSON.stringify(selectedCharacters)} />

          <Flex direction="column" gap="2">
            <Box>
              <InputLabel label="Party name" />
              <TextField.Root
                name="partyName"
                value={partyName}
                onChange={(event) => setPartyName(event.target.value)}
                placeholder="The Steel Hearts"
              />
            </Box>

            <Box>
              <InputLabel label="Choose characters" />
              {characters.length ? (
                <Flex direction="column" gap="2">
                  {characters.map((character) => {
                    const label = buildCharacterLabel(character);
                    const inputId = `party-character-${character.id}`;
                    const isChecked = selectedCharacters.includes(character.id);

                    return (
                      <Flex key={character.id} align="center" gap="2">
                        <Checkbox
                          id={inputId}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            setSelectedCharacters((prev) => {
                              const shouldAdd = checked === true;
                              if (shouldAdd) {
                                return prev.includes(character.id)
                                  ? prev
                                  : [...prev, character.id];
                              }
                              return prev.filter((entry) => entry !== character.id);
                            });
                          }}
                        />
                        <Box>
                          <Text as="label" htmlFor={inputId} size="2">
                            {character.name}
                          </Text>
                          {label && (
                            <Text size="1" color="gray">
                              {label}
                            </Text>
                          )}
                        </Box>
                      </Flex>
                    );
                  })}
                </Flex>
              ) : (
                <Text size="1" color="gray">
                  No characters yet.{' '}
                  <Link href="/player/character/new">Create one</Link> to join the campaign.
                </Text>
              )}
            </Box>

            {acceptState.status === 'error' && (
              <Text color="red" size="2">
                {acceptState.message ?? 'Failed to accept invite.'}
              </Text>
            )}

            <Flex justify="end" gap="2" wrap="wrap">
              <Button
                type="submit"
                disabled={
                  acceptPending ||
                  !partyName.trim() ||
                  selectedCharacters.length === 0 ||
                  !characters.length
                }
              >
                {acceptPending ? 'Accepting…' : 'Accept & create party'}
              </Button>
            </Flex>
          </Flex>
        </Form>

        <Form action={declineAction} showActions={false}>
          <input type="hidden" name="campaignId" value={invite.id} />
          <Flex justify="end" gap="2" wrap="wrap">
            <Button type="submit" variant="soft" color="gray" disabled={declinePending}>
              {declinePending ? 'Declining…' : 'Decline invite'}
            </Button>
          </Flex>
          {declineState.status === 'error' && (
            <Text color="red" size="2" mt="2">
              {declineState.message ?? 'Failed to decline invite.'}
            </Text>
          )}
        </Form>
      </Flex>
    </Card>
  );
};
