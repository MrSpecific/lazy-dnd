'use client';

import { useState } from 'react';
import { Badge, Box, Button, Flex, IconButton, Text, TextField } from '@radix-ui/themes';
import { Cross2Icon, PlusIcon } from '@radix-ui/react-icons';
import { useUser } from '@stackframe/stack';
import { Form, FormInput, InputLabel, MarkdownInput } from '@/components/form';

const splitPlayers = (value: string) =>
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

export const CampaignForm = () => {
  const user = useUser();
  const [playerInput, setPlayerInput] = useState('');
  const [players, setPlayers] = useState<string[]>([]);

  const handleAddPlayers = (value: string) => {
    const nextPlayers = splitPlayers(value);
    if (!nextPlayers.length) return;

    setPlayers((prev) => {
      const existing = new Set(prev.map((player) => player.toLowerCase()));
      const merged = [...prev];
      nextPlayers.forEach((player) => {
        if (!existing.has(player.toLowerCase())) merged.push(player);
      });
      return merged;
    });
    setPlayerInput('');
  };

  const handleRemovePlayer = (player: string) => {
    setPlayers((prev) => prev.filter((entry) => entry !== player));
  };

  return (
    <Form
      submitText="Create campaign"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <Flex direction="column" gap="4" mb="4">
        <FormInput
          name="name"
          label="Campaign Name"
          placeholder="Shadows over Stormpeak"
          required
        />
        <MarkdownInput
          name="description"
          label="Description"
          tooltip="What is this campaign about?"
        />

        <Box>
          <InputLabel label="Dungeon Master" />
          <Flex align="center" gap="2" mt="1">
            <Badge color="green" variant="soft">
              Default
            </Badge>
            <Text size="2">{user?.displayName ?? 'You'}</Text>
          </Flex>
          <Text size="1" color="gray" mt="1">
            You are set as the default DM for this campaign.
          </Text>
        </Box>

        <Box>
          <InputLabel
            label="Players"
            tooltip="Add players by email or username."
            htmlFor="playersInput"
          />
          <Flex gap="2" align="center" mt="1" wrap="wrap">
            <TextField.Root
              name="playersInput"
              value={playerInput}
              placeholder="mara@example.com, thorin"
              onChange={(event) => setPlayerInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleAddPlayers(playerInput);
                }
              }}
              style={{ minWidth: '220px', flexGrow: 1 }}
            />
            <Button
              type="button"
              variant="soft"
              onClick={() => handleAddPlayers(playerInput)}
              disabled={!playerInput.trim()}
            >
              <Flex align="center" gap="1">
                <PlusIcon />
                Add player
              </Flex>
            </Button>
          </Flex>
          <input type="hidden" name="players" value={JSON.stringify(players)} />
        </Box>

        <Box>
          {players.length ? (
            <Flex gap="2" mt="2" wrap="wrap">
              {players.map((player) => (
                <Badge key={player} color="gray" variant="soft">
                  <Flex align="center" gap="1">
                    <Text size="1">{player}</Text>
                    <IconButton
                      type="button"
                      size="1"
                      variant="soft"
                      color="gray"
                      aria-label={`Remove ${player}`}
                      onClick={() => handleRemovePlayer(player)}
                    >
                      <Cross2Icon />
                    </IconButton>
                  </Flex>
                </Badge>
              ))}
            </Flex>
          ) : (
            <Text size="1" color="gray" mt="2">
              No players added yet.
            </Text>
          )}
        </Box>
      </Flex>
    </Form>
  );
};
