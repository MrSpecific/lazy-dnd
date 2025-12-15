'use client';
import { Box, Card, Flex } from '@radix-ui/themes';
import { useUser, UserAvatar } from '@stackframe/stack';
import { Link } from './common/Link';

export const UserCard = () => {
  const user = useUser();

  if (!user) {
    return (
      <Card>
        <Flex gap="2" align="center">
          <UserAvatar />
          <Box>
            You are not logged in
            <Flex gap="2" justify="end">
              <Link href="/handler/sign-in" size="1">
                Log In
              </Link>
              <Link href="/handler/sign-up" size="1">
                Sign Up
              </Link>
            </Flex>
          </Box>
        </Flex>
      </Card>
    );
  }

  return (
    <Card>
      <Flex gap="2" align="center">
        <UserAvatar user={user} />
        <Box>
          <Box display={{ initial: 'none', md: 'block' }}>{user.displayName ?? 'anon'}</Box>
          <Flex gap="2" justify="end" direction={{ initial: 'column-reverse', md: 'row' }}>
            <Link href="/handler/account-settings" size="1">
              Settings
            </Link>
            <Link href="/handler/sign-out" size="1">
              Log Out
            </Link>
          </Flex>
        </Box>
      </Flex>
    </Card>
  );
};
