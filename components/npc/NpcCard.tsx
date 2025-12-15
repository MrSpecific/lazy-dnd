'use client';

import { Card, Flex, Heading, Text } from '@radix-ui/themes';
import { NpcSummary } from '@/data/npc/getNpcs';
import { Link } from '@/components/common/Link';

export type NpcCardDetail = 'low' | 'medium' | 'high';

type NpcCardProps = {
  npc: NpcSummary;
  detail?: NpcCardDetail;
};

export const NpcCard = ({ npc, detail = 'low' }: NpcCardProps) => {
  const subtitle = [npc.title, npc.className, npc.raceName].filter(Boolean).join(' • ');

  return (
    <Link href={`/dm/npc/${npc.id}`}>
      <Card>
        <Flex direction="column" gap="1">
          <Heading size="3">{npc.name}</Heading>
          {subtitle && (
            <Text color="gray" size="2">
              {subtitle}
            </Text>
          )}
        </Flex>
      </Card>
    </Link>
  );
};
