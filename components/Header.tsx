import { Grid, Flex, Box, Heading } from '@radix-ui/themes';
import { UserCard } from './UserCard';
import Link from './common/Link';
import { QuickActions } from './QuickActions';
import SiteLogo from '@/components/svg/lazy-dnd-icon.svg';

export const Header = ({ showUserCard = true }) => {
  return (
    <header>
      <Grid align="center" columns={{ initial: '1', md: 'auto 1fr' }} pb="2">
        <Link href="/">
          <Flex
            align="center"
            gap="2"
            justify={{ initial: 'center', md: 'start' }}
            pb={{ initial: '2', md: '0' }}
          >
            <SiteLogo width={40} height={40} style={{ fill: 'var(--green-a12)' }} />
            <Heading weight="bold" style={{ fontWeight: 800 }}>
              Lazy DnD
            </Heading>
          </Flex>
        </Link>
        {showUserCard && (
          <Flex justify={{ initial: 'between', md: 'end' }} gap="2" align="start">
            <QuickActions isDm={true} />
            <UserCard />
          </Flex>
        )}
      </Grid>
    </header>
  );
};
