import NextLink, { type LinkProps } from 'next/link';
import {
  Link as RadixLink,
  Button,
  IconButton,
  type LinkProps as RadixLinkProps,
  type ButtonProps,
  type IconButtonProps,
} from '@radix-ui/themes';

export type LinkHref = Pick<LinkProps, 'href'>['href'];
export type LinkTarget = Pick<RadixLinkProps, 'target'>;

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

export const ButtonLink = ({
  href,
  children,
  target,
  ...props
}: { href: string; children: React.ReactNode } & ButtonProps & LinkTarget) => {
  return (
    <Button {...props} asChild>
      <Link href={href} target={target}>
        {children}
      </Link>
    </Button>
  );
};

export const IconButtonLink = ({
  href,
  children,
  target,
  ...props
}: { href: string; children: React.ReactNode } & IconButtonProps & LinkTarget) => {
  return (
    <IconButton {...props} asChild>
      <Link href={href} target={target}>
        {children}
      </Link>
    </IconButton>
  );
};

export default Link;
