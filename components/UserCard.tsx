'use client';
import { Card, Flex } from '@radix-ui/themes';
import { useUser, UserAvatar } from '@stackframe/stack';
import { Link } from './common/Link';

export const UserCard = () => {
  const user = useUser();

  if (!user) {
    return (
      <Card>
        <Flex gap="2" align="center">
          <UserAvatar />
          You are not logged in
        </Flex>
        <Flex gap="2" justify="end">
          <Link href="/handler/sign-in" size="1">
            Log In
          </Link>
          <Link href="/handler/sign-up" size="1">
            Sign Up
          </Link>
        </Flex>
      </Card>
    );
  }

  return (
    <Card>
      <Flex gap="2" align="center" mb="1">
        <UserAvatar user={user} />
        {user.displayName ?? 'anon'}
      </Flex>
      <Flex gap="2" justify="end">
        <Link href="/handler/account-settings" size="1">
          Settings
        </Link>
        <Link href="/handler/sign-out" size="1">
          Log Out
        </Link>
      </Flex>
    </Card>
  );
};
