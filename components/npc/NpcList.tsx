'use client';

import { Box, Grid, Heading, Text } from '@radix-ui/themes';
import { NpcSummary } from '@/data/npc/getNpcs';
import { NpcCard } from '@/components/npc/NpcCard';

type NpcListProps = {
  npcs: NpcSummary[];
};

export const NpcList = ({ npcs }: NpcListProps) => {
  if (!npcs.length) {
    return (
      <Text color="gray" size="2">
        You don&apos;t have any NPCs yet.
      </Text>
    );
  }

  return (
    <Box>
      <Heading size="4" mb="3">
        Your NPCs
      </Heading>
      <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="3">
        {npcs.map((npc) => (
          <NpcCard key={npc.id} npc={npc} />
        ))}
      </Grid>
    </Box>
  );
};
