import React from 'react';
import MarkdownComponent from 'react-markdown';
import { Code } from '@radix-ui/themes';
import { Link } from '@/components/common/Link';

interface MarkdownProps {
  children?: string;
}

export const Markdown: React.FC<MarkdownProps> = ({ children }) => (
  <MarkdownComponent
    components={{
      a: ({ children, href, target }) => (
        <Link href={href as string} target={target}>
          {children}
        </Link>
      ),
      code: ({ children, color, ...props }) => {
        console.log('code', props);
        return (
          <Code color={(color as RadixColor) ?? 'gray'} {...props}>
            {children}
          </Code>
        );
      },
    }}
  >
    {children}
  </MarkdownComponent>
);

export default Markdown;
