import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const HandlerLayout = async ({ children }: { children: React.ReactNode }) => {
  // Handler routes are used by Stack for auth flows; they must stay unguarded to avoid redirect loops.
  return (
    <>
      <Header showUserCard={false} />
      <main>{children}</main>
    </>
  );
};

export default HandlerLayout;
