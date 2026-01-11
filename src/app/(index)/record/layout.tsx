export default function HomeLayout({
  children,
  submit,
  list,
}: Readonly<{
  children: React.ReactNode;
  submit: React.ReactNode;
  list: React.ReactNode;
}>) {
  return (
    <>
      {submit}
      {list}
      {children}
    </>
  );
}
