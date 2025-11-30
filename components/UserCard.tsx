'use client';
import { Card, Flex } from '@radix-ui/themes';
import { useUser, UserAvatar } from '@stackframe/stack';
import { Link } from './common/Link';

export const UserCard = () => {
  const user = useUser();

  if (!user) {
    return (
      <Card>
        <UserAvatar />
        You are not logged in
        <Flex gap="2">
          <Link href="/handler/sign-in">Log In</Link>
          <Link href="/handler/sign-up">Sign Up</Link>
        </Flex>
      </Card>
    );
  }

  return (
    <Card>
      <UserAvatar />
      {`Hello, ${user.displayName ?? 'anon'}`}
      <Flex gap="2">
        <Link href="/handler/account-settings">Settings</Link>
        <Link href="/handler/sign-out">Log Out</Link>
      </Flex>
    </Card>
  );
};
