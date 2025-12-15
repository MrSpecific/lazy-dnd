import { GitHub, Linkedin, Twitter } from 'react-feather';
import { Link } from '@/components/common/Link';
import { Card, Grid, Box, Text } from '@radix-ui/themes';

export const Footer = () => {
  return (
    <footer>
      <Card>
        <Grid columns={{ initial: '1', md: '3' }} gap="4" p="4" justify="between" align="center">
          <Text as="div" align={{ initial: 'center', md: 'left' }} size="1" color="gray">
            &copy; {new Date().getFullYear()} Lazy DnD. All rights reserved.
          </Text>
          <Text as="div" align="center">
            Built with ❤️ by{' '}
            <Link href="https://willchristenson.com" target="_blank" rel="noopener noreferrer">
              Will Christenson
            </Link>
          </Text>
        </Grid>
      </Card>
    </footer>
  );
};
