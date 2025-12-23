'use client';

import { Button, Card, Flex, Heading, Text } from '@radix-ui/themes';
import { BedDouble, Sunrise } from 'lucide-react';
import { useCharacterContext } from '@/components/character/CharacterContext';

export const CharacterActions = () => {
  const { triggerRest } = useCharacterContext();

  return (
    <Card>
      <Flex justify="between" align="center" mb="2" wrap="wrap" gap="2">
        <Flex gap="2" align="center">
          <Heading size="5">Actions</Heading>
        </Flex>
        <Flex gap="2" align="center" wrap="wrap">
          <Button variant="surface" size="2" onClick={() => triggerRest('short')}>
            <BedDouble size="1em" /> Short Rest
          </Button>
          <Button variant="surface" size="2" onClick={() => triggerRest('long')}>
            <Sunrise size="1em" /> Long Rest
          </Button>
        </Flex>
      </Flex>
      <Text color="gray" size="2">
        Use rests to recover hit points and reset spell slots. Long rests reset remaining slots to
        max.
      </Text>
    </Card>
  );
};
