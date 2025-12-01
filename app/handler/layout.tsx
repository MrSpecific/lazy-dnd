const HandlerLayout = async ({ children }: { children: React.ReactNode }) => {
  // Handler routes are used by Stack for auth flows; they must stay unguarded to avoid redirect loops.
  return <main>{children}</main>;
};

export default HandlerLayout;
