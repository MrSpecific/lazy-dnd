import { Inter } from 'next/font/google'
import { StackProvider, StackTheme } from '@stackframe/stack'
import { stackServerApp } from '@/stack/server'
import { Theme } from '@radix-ui/themes'
import '@radix-ui/themes/styles.css'
import './globals.css'

const inter = Inter({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-inter',
})

export default function ({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={[inter.variable, 'bg-black flex flex-col items-center justify-center'].join(' ')}>
        <StackProvider app={stackServerApp}>
          <StackTheme>
            <Theme>{children}</Theme>
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  )
}
