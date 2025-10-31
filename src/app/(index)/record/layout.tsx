export default function HomeLayout({
  children,
  submit,
}: Readonly<{
  children: React.ReactNode;
  submit: React.ReactNode;
}>) {
  return (
    <>
      {submit}
      {children}
    </>
  );
}
