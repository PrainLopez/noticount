export default function HomeLayout({
  children,
  submit,
  usage,
  list,
}: Readonly<{
  children: React.ReactNode;
  submit: React.ReactNode;
  usage: React.ReactNode;
  list: React.ReactNode;
}>) {
  return (
    <>
      {submit}
      {usage}
      {list}
      {children}
    </>
  );
}
