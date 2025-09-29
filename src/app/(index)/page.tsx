import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AccountInput from "@/src/app/_components/account-input";

export default function Home() {
  return (
    <div className="font-sans flex flex-row content-center items-center justify-center">
      <main className="flex flex-col content-center items-start justify-start w-full max-w-3xl p-4 gap-4">
        <h1 className="font-mono text-4xl font-bold tracking-tight p-2">Noticount</h1>
        <Card className="rounded-lg w-full">
          <CardContent>
            <AccountInput />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
