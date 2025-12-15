import { stackServerApp } from '@/stack/server';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const PlayerLayout = async ({ children }: { children: React.ReactNode }) => {
  await stackServerApp.getUser({ or: 'redirect' });

  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
};

export default PlayerLayout;
