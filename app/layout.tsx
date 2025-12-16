import { Inter, Pirata_One, New_Rocker } from 'next/font/google';
import { StackProvider, StackTheme } from '@stackframe/stack';
import { stackServerApp } from '@/stack/server';
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import './globals.css';

const inter = Inter({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-inter',
});

const pirata = Pirata_One({
  display: 'swap',
  subsets: ['latin'],
  weight: '400',
  variable: '--font-pirata-one',
});

const newRocker = New_Rocker({
  display: 'swap',
  subsets: ['latin'],
  weight: '400',
  variable: '--font-new-rocker',
});

export const metadata = {
  title: 'Lazy D&D',
  description: 'Spin up characters, stats, and gear quickly with Lazy D&D.',
};

export default function ({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${pirata.variable} ${newRocker.variable}`}>
        <StackProvider app={stackServerApp}>
          <StackTheme>
            <Theme accentColor="green" radius="large" scaling="110%" appearance="inherit">
              {children}
            </Theme>
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
