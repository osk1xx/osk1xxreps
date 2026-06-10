import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Truck,
  Loader2,
  PackageSearch,
  CheckCircle2,
  Plane,
  MapPin,
  Clock,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import { useLang, t } from "@/lib/i18n";
import { trackParcel, type TrackResult } from "@/lib/tracking.functions";

export const Route = createFileRoute("/tracking")({
  component: TrackingPage,
  head: () => ({
    meta: [
      { title: "Tracking — osk1xx reps" },
      {
        name: "description",
        content: "Paste your parcel number and get the latest delivery updates instantly.",
      },
    ],
  }),
});

function statusIcon(status: string) {
  const s = status.toLowerCase();
  if (s.includes("deliver")) return CheckCircle2;
  if (s.includes("transit") || s.includes("en route") || s.includes("flight"))
    return Plane;
  if (s.includes("pick") || s.includes("out for")) return Truck;
  return PackageSearch;
}

function TrackingPage() {
  const [lang] = useLang();
  const tr = t[lang].tracking;
  const [num, setNum] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackResult | null>(null);

  const track = useServerFn(trackParcel);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = num.trim();
    if (!n || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await track({ data: { num: n } });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  const StatusIcon = result?.found ? statusIcon(result.status) : PackageSearch;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-24 pt-12 sm:px-6">
      <div className="flex flex-col items-center text-center">
        <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/30 shadow-[0_0_28px_var(--primary)]">
          <Truck className="h-7 w-7 text-primary" />
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{tr.title}</h1>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">{tr.sub}</p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 flex w-full flex-col gap-2 sm:flex-row">
        <Input
          value={num}
          onChange={(e) => setNum(e.target.value)}
          placeholder={tr.placeholder}
          className="h-12 text-base"
          disabled={loading}
        />
        <Button type="submit" className="h-12 px-6" disabled={loading || !num.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : tr.submit}
        </Button>
      </form>

      {/* Tutorial CTA */}
      <div className="mt-4 flex justify-center">
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link to="/tutorials">
            <BookOpen className="h-4 w-4" />
            {tr.tutorialCta}
          </Link>
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{tr.loading}</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="mt-10 flex flex-col items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-8 text-center">
          <AlertTriangle className="h-7 w-7 text-destructive" />
          <p className="text-sm font-medium text-foreground">{tr.errorTitle}</p>
        </div>
      )}

      {/* Not found */}
      {!loading && result && !result.found && (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-8 text-center">
          <PackageSearch className="h-9 w-9 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{tr.notFound}</p>
          <Button variant="outline" size="sm" onClick={reset} className="mt-1 rounded-full">
            {tr.tryAgain}
          </Button>
        </div>
      )}

      {/* Result */}
      {!loading && result && result.found && (
        <div className="mt-10 animate-fade-in space-y-6">
          {/* Summary card */}
          <div className="rounded-2xl border border-primary/30 bg-card/70 p-5 shadow-[0_0_30px_-12px_var(--primary)]">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
                <StatusIcon className="h-6 w-6 text-primary" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {result.trackedNumber}
                </p>
                <p className="mt-0.5 text-lg font-semibold leading-tight">
                  {result.status || tr.latest}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {result.carriers.length > 0 && (
                    <span>
                      {tr.carrier}: {result.carriers.join(" · ")}
                    </span>
                  )}
                  {result.syncTime && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {tr.syncTime}: {result.syncTime}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {tr.history}
            </h2>
            <ol className="relative space-y-6 pl-2">
              {/* vertical line */}
              <span className="absolute left-[9px] top-1.5 bottom-1.5 w-px bg-gradient-to-b from-primary/60 via-border to-transparent" />
              {result.events.map((ev, i) => (
                <li key={i} className="relative pl-7">
                  <span
                    className={`absolute left-0 top-1 h-[18px] w-[18px] rounded-full border-2 ${
                      i === 0
                        ? "border-primary bg-primary shadow-[0_0_12px_var(--primary)]"
                        : "border-border bg-card"
                    }`}
                  >
                    {i === 0 && (
                      <span className="absolute inset-0 animate-ping rounded-full bg-primary/50" />
                    )}
                  </span>
                  <div
                    className={`rounded-xl border p-3 transition-colors ${
                      i === 0
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/60 bg-card/40"
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground">
                      {ev.description || "—"}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {ev.time && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {ev.time}
                        </span>
                      )}
                      {ev.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {ev.location}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex justify-center">
            <Button variant="outline" size="sm" onClick={reset} className="rounded-full">
              {tr.tryAgain}
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
