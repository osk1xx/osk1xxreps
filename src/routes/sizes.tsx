import { createFileRoute } from "@tanstack/react-router";
import { useLang, t } from "@/lib/i18n";

export const Route = createFileRoute("/sizes")({
  component: SizesPage,
  head: () => ({
    meta: [
      { title: "Size Guide — osk1xx reps" },
      { name: "description", content: "Reps sizing cheat sheet for Yeezy, Air Force, Jordan, LV, Balenciaga and more." },
    ],
  }),
});

const RULES = [
  { tag: "+1.5", color: "from-fuchsia-500 to-purple-600", items: ["Yeezy Slides", "Yeezy Runner"] },
  { tag: "+1", color: "from-purple-500 to-indigo-600", items: ["All Yeezys", "Football boots"] },
  { tag: "+0.5", color: "from-indigo-500 to-sky-500", items: ["Air Force 1", "Jordan 1 Low"] },
  { tag: "TTS", color: "from-emerald-500 to-teal-500", items: ["All other shoes"] },
  { tag: "−1", color: "from-amber-500 to-rose-500", items: ["LV Trainer", "Balenciaga Track", "Timberland", "Balenciaga Spike Boots", "Balenciaga Defender"] },
];

function SizesPage() {
  const [lang] = useLang();
  const tr = t[lang].sizes;
  return (
    <main className="mx-auto max-w-3xl px-6 pt-12 pb-24">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{tr.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{tr.sub}</p>

      <div className="mt-8 space-y-3">
        {RULES.map((r) => (
          <div key={r.tag} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
            <div className={`flex h-14 w-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${r.color} text-lg font-bold text-white shadow-[var(--shadow-glow)]`}>
              {r.tag}
            </div>
            <div className="flex flex-wrap gap-2">
              {r.items.map((it) => (
                <span key={it} className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground">{it}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
