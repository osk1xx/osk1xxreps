import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { listPublishedTutorials, getTutorial } from "@/lib/tutorials.functions";
import { getAppSettings } from "@/lib/settings.functions";
import { useLang, t } from "@/lib/i18n";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ArrowLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/tutorials")({
  component: TutorialsPage,
  head: () => ({
    meta: [
      { title: "Tutorials — osk1xx reps" },
      {
        name: "description",
        content: "Step-by-step guides to order, QC and track your reps.",
      },
    ],
  }),
});

type Tut = {
  id: string;
  title: string;
  description: string | null;
  language: string;
};
type Step = { id: string; name: string; text: string; photos: string[] };

function TutorialsPage() {
  const [lang] = useLang();
  const tr = t[lang].tutorials;
  const list = useServerFn(listPublishedTutorials);
  const getOne = useServerFn(getTutorial);
  const getSettings = useServerFn(getAppSettings);

  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [items, setItems] = useState<Tut[]>([]);
  const [selected, setSelected] = useState<{ tut: Tut; steps: Step[] } | null>(null);
  const [loadingOne, setLoadingOne] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setSelected(null);
      const s = await getSettings().catch(() => ({ critical_alert: false }));
      if (cancelled) return;
      if ((s as any).critical_alert) {
        setBlocked(true);
        setLoading(false);
        return;
      }
      try {
        const r = await list({ data: { language: lang } });
        if (!cancelled) setItems(r.tutorials as Tut[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang, list, getSettings]);

  const open = async (tut: Tut) => {
    setLoadingOne(true);
    try {
      const r = await getOne({ data: { id: tut.id } });
      const steps = ((r.steps as any[]) ?? []).map((x) => ({
        id: x.id,
        name: x.name,
        text: x.text,
        photos: Array.isArray(x.photos) ? x.photos : [],
      }));
      setSelected({ tut, steps });
    } finally {
      setLoadingOne(false);
    }
  };

  if (blocked) {
    return (
      <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          {t[lang].products.maintenance}
        </h1>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 pt-12 pb-24">
      {!selected ? (
        <>
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{tr.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{tr.sub}</p>
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : items.length === 0 ? (
              <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                {tr.empty}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => open(it)}
                    className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary/60 hover:shadow-[var(--shadow-glow)]"
                  >
                    <span className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
                      <BookOpen className="h-5 w-5" />
                    </span>
                    <span className="flex flex-col">
                      <span className="font-medium">{it.title}</span>
                      {it.description && (
                        <span className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {it.description}
                        </span>
                      )}
                    </span>
                    <ChevronRight className="ml-auto mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <article>
          <button
            onClick={() => setSelected(null)}
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {tr.back}
          </button>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{selected.tut.title}</h1>
          {selected.tut.description && (
            <p className="mt-2 text-sm text-muted-foreground">{selected.tut.description}</p>
          )}

          {loadingOne ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <ol className="mt-8 space-y-8">
              {selected.steps.map((s, i) => (
                <li
                  key={s.id}
                  className="rounded-2xl border border-border bg-card p-5"
                >
                  <div className="mb-2 flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <h2 className="font-semibold">{s.name || `${tr.step} ${i + 1}`}</h2>
                  </div>
                  {s.text && (
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{s.text}</p>
                  )}
                  {s.photos.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {s.photos.map((src) => (
                        <button
                          key={src}
                          onClick={() => setPreview(src)}
                          className="overflow-hidden rounded-xl border border-border bg-background"
                        >
                          <img
                            src={src}
                            alt={s.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </article>
      )}

      <Dialog open={preview !== null} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl border-border bg-card p-2">
          {preview && (
            <img src={preview} alt="preview" className="h-auto w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
