import { Grid, Flex, Box, Heading } from '@radix-ui/themes';
import { UserCard } from './UserCard';
import Link from './common/Link';

export const Header = () => {
  return (
    <header>
      <Grid align="center" columns="auto 1fr">
        <Box>
          <Heading>
            <Link href="/">Lazy DnD</Link>
          </Heading>
        </Box>
        <Flex justify="end">
          <UserCard />
        </Flex>
      </Grid>
    </header>
  );
};
