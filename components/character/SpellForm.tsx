'use client';

import { useMemo } from 'react';
import { SpellKnowledgeType, SpellSchool } from '@prisma/client';
import { Button, Dialog, Flex, Grid, Select, Text, TextArea } from '@radix-ui/themes';
import { Form, FormInput, FormField } from '@/components/form';

type SpellFormProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  pending?: boolean;
  action?: FormAction;
  characterId: string;
};

export const SpellForm = ({
  open = false,
  onOpenChange,
  pending = false,
  action,
  characterId,
}: SpellFormProps) => {
  const schoolOptions = useMemo(() => Object.values(SpellSchool), []);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="820px">
        <Dialog.Title>Add a spell</Dialog.Title>
        <Dialog.Description size="2" mb="3">
          Cantrips are level 0. Prepared casters choose daily; known casters keep a fixed list. Mark
          concentration/ritual if applicable.
        </Dialog.Description>

        <Form action={action} showActions={false}>
          <input type="hidden" name="characterId" value={characterId} />
          <Grid gap="2" columns={{ initial: '1', md: '2' }}>
            <FormInput name="name" label="Name" placeholder="Spell name" required />
            <FormInput
              name="level"
              label="Level (0-9)"
              placeholder="0 for cantrip"
              inputMode="numeric"
              defaultValue="0"
            />
            <SelectField name="school" label="School" options={schoolOptions} defaultValue="EVOCATION" />
            <SelectField
              name="knowledge"
              label="Add as"
              options={[SpellKnowledgeType.KNOWN, SpellKnowledgeType.PREPARED]}
              defaultValue={SpellKnowledgeType.KNOWN}
            />
            <FormInput name="castingTime" label="Casting time" placeholder="1 action" />
            <FormInput name="range" label="Range" placeholder="60 feet" />
            <FormInput name="components" label="Components" placeholder="V, S, M" />
            <FormInput name="duration" label="Duration" placeholder="Instantaneous" />
          </Grid>

          <Text weight="bold" size="2" mt="2">
            Description
          </Text>
          <TextArea name="description" placeholder="Rules text, scaling, damage, etc." rows={4} mt="1" />

          <Flex gap="2" mt="2">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" name="isRitual" /> <Text size="2">Ritual</Text>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" name="isConcentration" /> <Text size="2">Concentration</Text>
            </label>
          </Flex>

          <Flex gap="2" mt="4" justify="end">
            <Dialog.Close>
              <Button type="button" variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Dialog.Close>
              <Button type="submit" disabled={pending}>
                {pending ? 'Adding…' : 'Add spell'}
              </Button>
            </Dialog.Close>
          </Flex>
        </Form>
      </Dialog.Content>
    </Dialog.Root>
  );
};

const SelectField = ({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  options: string[];
  defaultValue?: string;
}) => {
  return (
    <FormField name={name}>
      <Text as="label" size="2">
        {label}
      </Text>
      <Select.Root name={name} defaultValue={defaultValue}>
        <Select.Trigger />
        <Select.Content>
          {options.map((opt) => (
            <Select.Item key={opt} value={opt}>
              {formatOption(opt)}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </FormField>
  );
};

const formatOption = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();
