'use client';

import { Box, Grid, Heading, Text } from '@radix-ui/themes';
import { NpcSummary } from '@/data/npc/getNpcs';
import { NpcCard, type NpcCardDetail } from '@/components/npc/NpcCard';
import Link from '../common/Link';

type NpcListProps = {
  npcs: NpcSummary[];
  detail?: NpcCardDetail;
};

export const NpcList = ({ npcs, detail = 'low' }: NpcListProps) => {
  if (!npcs.length) {
    return (
      <Text color="gray" size="2">
        You don&apos;t have any NPCs yet.
      </Text>
    );
  }

  return (
    <Box>
      <Link href="/dm/npcs">
        <Heading size="5" mb="3">
          Your NPCs
        </Heading>
      </Link>
      <Grid columns={{ initial: '1', sm: '2', md: detail === 'low' ? '4' : '3' }} gap="3">
        {npcs.map((npc) => (
          <NpcCard key={npc.id} npc={npc} detail={detail} />
        ))}
      </Grid>
    </Box>
  );
};
