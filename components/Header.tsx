import { Grid, Flex, Box, Heading } from '@radix-ui/themes';
import { UserCard } from './UserCard';
import Link from './common/Link';
import { QuickActions } from './QuickActions';

export const Header = () => {
  return (
    <header>
      <Grid align="center" columns="auto 1fr" pb="2">
        <Box>
          <Heading>
            <Link href="/">Lazy DnD</Link>
          </Heading>
        </Box>
        <Flex justify="end" gap="2" align="start">
          <QuickActions isDm={true} />
          <UserCard />
        </Flex>
      </Grid>
    </header>
  );
};
