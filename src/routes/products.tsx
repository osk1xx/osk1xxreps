import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { listApprovedProducts, CATEGORIES } from "@/lib/products.functions";
import { getAppSettings } from "@/lib/settings.functions";
import { useLang, t, useCurrency, formatPrice } from "@/lib/i18n";
import { toAgentLink, DEFAULT_AGENT_CONFIG, type AgentConfig } from "@/lib/agent-link";
import { Loader2, ShoppingBag, Camera, ImageOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/products")({
  component: ProductsPage,
  head: () => ({
    meta: [
      { title: "Products — osk1xx reps" },
      { name: "description", content: "Curated reps catalog from trusted Chinese sellers." },
    ],
  }),
});

type Product = {
  id: string;
  category: string;
  name: string;
  source_url: string;
  image_url: string | null;
  price_cny: number | null;
  badge: "best" | "budget" | null;
};

function ProductsPage() {
  const [lang] = useLang();
  const [cur] = useCurrency();
  const tr = t[lang].products;
  const list = useServerFn(listApprovedProducts);
  const getSettings = useServerFn(getAppSettings);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Product[]>([]);
  const [cat, setCat] = useState<string>("");
  const [q, setQ] = useState("");
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await getSettings().catch(() => ({ disable_products: false, critical_alert: false }));
      if (cancelled) return;
      if (s.disable_products || s.critical_alert) {
        setBlocked(true);
        setLoading(false);
        return;
      }
      try {
        const r = await list({ data: { category: cat || undefined } });
        if (!cancelled) setItems(r.products as Product[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [cat, list, getSettings]);

  if (blocked) {
    return (
      <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">{tr.maintenance}</h1>
          <div className="mx-auto mt-6 h-1 w-20 rounded-full bg-primary shadow-[var(--shadow-glow)]" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 pt-12 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{tr.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{tr.sub}</p>
        </div>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {items.length} {tr.total}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => setCat("")}
          className={`rounded-full border px-3 py-1 text-xs transition ${cat === "" ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
        >
          {tr.all}
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full border px-3 py-1 text-xs transition ${cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={lang === "pl" ? "Szukaj produktu…" : "Search products…"}
          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : items.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase())).length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {tr.empty}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase())).map((p) => {
              const agentUrl = toAgentLink(p.source_url);
              return (
              <a
                key={p.id}
                href={agentUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  navigator.clipboard?.writeText(agentUrl).catch(() => {});
                  toast.success("Link copied");
                }}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/60 hover:shadow-[var(--shadow-glow)]"
              >
                <div className="relative aspect-square overflow-hidden bg-background">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground"><ImageOff className="h-6 w-6" /></div>
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-background/80 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur">
                    {p.category}
                  </span>
                  {p.badge === "best" && (
                    <span className="absolute right-2 top-2 rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                      Best Batch
                    </span>
                  )}
                  {p.badge === "budget" && (
                    <span className="absolute right-2 top-2 rounded-md bg-yellow-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black shadow-lg">
                      Budget Batch
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3">
                  <span className="line-clamp-2 text-sm font-medium">{p.name}</span>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex flex-col leading-tight">
                      <span className="text-sm font-bold text-primary">
                        {formatPrice(p.price_cny, "CNY")}
                      </span>
                      {cur !== "CNY" && (
                        <span className="text-[11px] text-muted-foreground">
                          ≈ {formatPrice(p.price_cny, cur)}
                        </span>
                      )}
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </a>
            );})}
          </div>
        )}
      </div>
    </main>
  );
}
