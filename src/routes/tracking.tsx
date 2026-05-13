import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Truck } from "lucide-react";
import { useLang, t } from "@/lib/i18n";

export const Route = createFileRoute("/tracking")({
  component: TrackingPage,
  head: () => ({
    meta: [
      { title: "Tracking — osk1xx reps" },
      { name: "description", content: "Track your parcel with 17track in one click." },
    ],
  }),
});

function TrackingPage() {
  const [lang] = useLang();
  const tr = t[lang].tracking;
  const [num, setNum] = useState("");
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = num.trim();
    if (!n) return;
    window.location.href = `https://t.17track.net/pl#nums=${encodeURIComponent(n)}`;
  };
  return (
    <main className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-xl flex-col items-center px-6 pt-16 text-center">
      <Truck className="mb-4 h-10 w-10 text-primary" />
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{tr.title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{tr.sub}</p>
      <form onSubmit={onSubmit} className="mt-8 flex w-full flex-col gap-2 sm:flex-row">
        <Input value={num} onChange={(e) => setNum(e.target.value)} placeholder={tr.placeholder} className="h-12" />
        <Button type="submit" className="h-12 px-6">{tr.submit}</Button>
      </form>
    </main>
  );
}
