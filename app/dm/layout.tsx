import { stackServerApp } from '@/stack/server'
import { Header } from '@/components/Header'

const DMLayout = async ({ children }: { children: React.ReactNode }) => {
  await stackServerApp.getUser({ or: 'redirect' })

  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  )
}

export default DMLayout
