import { Header } from '@/components/Header'

const PlayerLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <Header />
    <main>{children}</main>
  </>
)

export default PlayerLayout
