import { Link } from '@/components/common/Link';
import { Flex } from '@radix-ui/themes';
import { Coffee } from 'lucide-react';

export const BuyMeACoffee = () => {
  return (
    <Link
      href={
        process.env.NEXT_PUBLIC_BUY_ME_A_COFFEE_LINK ||
        'https://www.buymeacoffee.com/willchristenson'
      }
      target="_blank"
      rel="noopener noreferrer"
      size="1"
    >
      <Flex display="inline-flex" align="center" gap="1">
        <Coffee size="1em" /> Buy Me A Coffee
      </Flex>
    </Link>
  );
};
