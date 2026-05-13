import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useLang, t } from "@/lib/i18n";
import { ArrowRight, Search, Package, Truck } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "osk1xx reps — FIND. CHECK. WEAR." },
      { name: "description", content: "Streetwear & reps platform. QC finder, curated catalog, tracking, sizing — all in one." },
    ],
  }),
});

function Landing() {
  const [lang] = useLang();
  const tr = t[lang].home;
  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10" style={{ background: "var(--gradient-radial)" }} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(var(--hairline) 1px, transparent 1px), linear-gradient(90deg, var(--hairline) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--primary), transparent 60%)" }}
      />

      <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pt-20 pb-16 text-center sm:pt-28">
        <span className="mb-6 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          osk1xx reps · streetwear · hypebeast
        </span>
        <h1 className="text-balance bg-gradient-to-br from-foreground via-foreground to-primary bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-7xl">
          {tr.title}
        </h1>
        <p className="mt-6 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">{tr.sub}</p>

        <div className="mt-10 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
          <Link to="/qc">
            <Button className="h-14 w-full rounded-xl bg-primary text-base font-bold tracking-wide text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-90">
              <Search className="mr-2 h-5 w-5" />
              {tr.qc}
            </Button>
          </Link>
          <Link to="/products">
            <Button variant="outline" className="h-14 w-full rounded-xl border-primary/40 text-base font-bold tracking-wide hover:bg-primary/10 hover:text-primary">
              <Package className="mr-2 h-5 w-5" />
              {tr.products}
            </Button>
          </Link>
          <Link to="/tracking">
            <Button variant="outline" className="h-14 w-full rounded-xl border-primary/40 text-base font-bold tracking-wide hover:bg-primary/10 hover:text-primary">
              <Truck className="mr-2 h-5 w-5" />
              {tr.tracking}
            </Button>
          </Link>
        </div>

        <Link to="/admin" className="mt-12 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
          {tr.adminLogin} <ArrowRight className="h-3 w-3" />
        </Link>
      </section>
    </main>
  );
}
