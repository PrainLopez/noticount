import AccountInput from "@/src/app/_components/account-input";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-start w-full min-h-screen font-medium font-">
      <main className="flex flex-col content-center items-start justify-start w-full max-w-3xl p-4 gap-4">
        <h1 className="font-mono text-4xl font-bold tracking-tight p-2">Noticount</h1>
        <AccountInput />
      </main>
    </div>
  );
}
