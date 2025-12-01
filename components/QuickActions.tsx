import { Button, DropdownMenu } from '@radix-ui/themes';

export const QuickActions = ({ isDm = false }) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variant="soft">
          Quick Actions
          <DropdownMenu.TriggerIcon />
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content>
        <DropdownMenu.Item shortcut="⌘ E">New Character</DropdownMenu.Item>
        {isDm && <DropdownMenu.Item shortcut="⌘ D">New NPC</DropdownMenu.Item>}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
