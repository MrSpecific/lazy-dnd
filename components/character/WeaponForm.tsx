'use client';

import { useState } from 'react';
import { Button, Dialog, Flex, Grid } from '@radix-ui/themes';
import { Form } from '@/components/form';
import { FormInput } from '@/components/form';
import { EquipmentSlotSelect } from '@/components/character/EquipmentSlotSelect';

type WeaponFormProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  pending?: boolean;
  action?: FormAction;
  characterId?: string;
};

export const WeaponForm = ({
  open = false,
  onOpenChange,
  pending = false,
  action,
  characterId,
}: WeaponFormProps) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="720px">
        <Dialog.Title>Add a weapon</Dialog.Title>
        <Dialog.Description size="2" mb="3">
          Enter details for a weapon to add it to your character.
        </Dialog.Description>

        <Form action={action} showActions={false}>
          {characterId && <input type="hidden" name="characterId" value={characterId} />}
          <Grid gap="2" columns={{ initial: '1', md: '2' }}>
            <FormInput name="name" label="Name" placeholder="Weapon name" required />
            <FormInput name="damage" label="Damage" placeholder="Damage (e.g. 1d8 slashing)" />
            <FormInput
              name="properties"
              label="Properties"
              placeholder="Properties (e.g. finesse, light)"
            />
            <FormInput
              name="weight"
              label="Weight"
              placeholder="Weight (lbs)"
              inputMode="decimal"
            />
            <EquipmentSlotSelect name="slot" defaultValue="MAIN_HAND" slotType="weapons" />
          </Grid>

          <Flex gap="2" mt="3" justify="end">
            <Dialog.Close>
              <Button type="button" variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Dialog.Close>
              <Button type="submit" disabled={pending}>
                {pending ? 'Adding…' : 'Add weapon'}
              </Button>
            </Dialog.Close>
          </Flex>
        </Form>
      </Dialog.Content>
    </Dialog.Root>
  );
};
