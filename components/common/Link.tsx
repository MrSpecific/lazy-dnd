import NextLink, { type LinkProps } from 'next/link';
import { Link as RadixLink, type LinkProps as RadixLinkProps } from '@radix-ui/themes';

export type LinkHref = Pick<LinkProps, 'href'>['href'];

export const Link = ({
  children,
  href,
  ...props
}: Omit<RadixLinkProps, 'href'> & Pick<LinkProps, 'href'>) => {
  return (
    <RadixLink asChild {...props}>
      <NextLink href={href}>{children}</NextLink>
    </RadixLink>
  );
};

export default Link;
