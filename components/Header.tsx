import { Grid, Flex, Box, Heading } from '@radix-ui/themes';
import { UserCard } from './UserCard';
import Link from './common/Link';
import { QuickActions } from './QuickActions';
import SiteLogo from '@/components/svg/lazy-dnd-icon.svg';

export const Header = () => {
  return (
    <header>
      <Grid align="center" columns="auto 1fr" pb="2">
        <Flex align="center" gap="2">
          <SiteLogo width={40} height={40} />
          <Heading>
            <Link href="/">Lazy DnD</Link>
          </Heading>
        </Flex>
        <Flex justify="end" gap="2" align="start">
          <QuickActions isDm={true} />
          <UserCard />
        </Flex>
      </Grid>
    </header>
  );
};
