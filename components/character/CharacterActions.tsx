'use client';

import { useState } from 'react';
import { Button, Card, Dialog, Flex, Heading, Text, TextField } from '@radix-ui/themes';
import { BedDouble, Sunrise } from 'lucide-react';
import { useCharacterContext } from '@/components/character/CharacterContext';

export const CharacterActions = ({ level, hitDie }: { level: number; hitDie: number }) => {
  const { triggerRest } = useCharacterContext();
  const [shortRestOpen, setShortRestOpen] = useState(false);
  const [hitDice, setHitDice] = useState('1');

  const maxDice = Math.max(level, 1);

  const handleShortRest = () => {
    const parsed = Math.floor(Number(hitDice));
    const spend = Number.isFinite(parsed) ? Math.max(0, Math.min(parsed, maxDice)) : 0;
    if (spend <= 0) return;
    triggerRest('short', { hitDice: spend });
    setShortRestOpen(false);
  };

  return (
    <Card>
      <Flex justify="between" align="center" mb="2" wrap="wrap" gap="2">
        <Flex gap="2" align="center">
          <Heading size="5">Actions</Heading>
        </Flex>
        <Flex gap="2" align="center" wrap="wrap">
          <Dialog.Root open={shortRestOpen} onOpenChange={setShortRestOpen}>
            <Dialog.Trigger>
              <Button variant="surface" size="2">
                <BedDouble size="1em" /> Short Rest
              </Button>
            </Dialog.Trigger>
            <Dialog.Content maxWidth="420px">
              <Dialog.Title>Short Rest</Dialog.Title>
              <Dialog.Description size="2" mb="3">
                Spend hit dice to heal. You can spend up to {maxDice} (d{hitDie}).
              </Dialog.Description>
              <Flex direction="column" gap="3">
                <TextField.Root
                  type="number"
                  min={1}
                  max={maxDice}
                  value={hitDice}
                  onChange={(e) => setHitDice(e.target.value)}
                />
                <Flex justify="end" gap="2">
                  <Dialog.Close>
                    <Button variant="soft" color="gray">
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Button onClick={handleShortRest}>Rest</Button>
                </Flex>
              </Flex>
            </Dialog.Content>
          </Dialog.Root>
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
