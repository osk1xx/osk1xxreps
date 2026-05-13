import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  findQcImages,
  findQcImagesViaTymix,
  findQcImagesViaRepworld,
} from "@/lib/qc.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Search, ImageOff, ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "@/lib/i18n";

const T = {
  en: {
    brandTag: "QC Finder",
    badge: "Quality Check photo lookup",
    title1: "The Ultimate",
    title2: "Best & Fastest QC Finder",
    subtitle:
      "Paste a product URL from your Chinese agent. We fetch the QC images for you — no API, no clicks.",
    placeholder: "Paste product link (Taobao, Weidian, 1688, agent…)",
    search: "Search QC",
    searching: "Searching…",
    waitMsg: "Please wait, searching QC… this can take ~10 seconds.",
    results: "Results",
    photos: "photos",
    empty: "Your QC photos will appear here.",
    errorTitle: "Something went wrong",
    errorAll: "All finders failed.",
    noneTitle: "No images found",
    noneMsg: "We couldn't find any QC photos for this link.",
    serverErr: "Please try again in a moment.",
  },
  pl: {
    brandTag: "Wyszukiwarka QC",
    badge: "Wyszukiwanie zdjęć kontroli jakości",
    title1: "Najlepsza i Najszybsza",
    title2: "Wyszukiwarka QC",
    subtitle:
      "Wklej link do produktu od swojego chińskiego agenta. My znajdziemy zdjęcia QC — bez API, bez klikania.",
    placeholder: "Wklej link do produktu (Taobao, Weidian, 1688, agent…)",
    search: "Szukaj QC",
    searching: "Szukam…",
    waitMsg: "Proszę czekać, szukam QC… to może potrwać ~10 sekund.",
    results: "Wyniki",
    photos: "zdjęć",
    empty: "Twoje zdjęcia QC pojawią się tutaj.",
    errorTitle: "Coś poszło nie tak",
    errorAll: "Wszystkie wyszukiwarki zawiodły.",
    noneTitle: "Nie znaleziono zdjęć",
    noneMsg: "Nie udało się znaleźć żadnych zdjęć QC dla tego linku.",
    serverErr: "Spróbuj ponownie za chwilę.",
  },
} as const;

export const Route = createFileRoute("/qc")({
  component: QcPage,
  head: () => ({
    meta: [
      { title: "QC Finder — osk1xx reps" },
      {
        name: "description",
        content: "The fastest QC photo finder for Taobao, Weidian, 1688 and every Chinese agent.",
      },
    ],
  }),
});

function QcPage() {
  const find = useServerFn(findQcImages);
  const findAlt = useServerFn(findQcImagesViaTymix);
  const findRep = useServerFn(findQcImagesViaRepworld);
  const [lang] = useLang();

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [dialog, setDialog] = useState<{ open: boolean; title: string; msg: string }>({
    open: false,
    title: "",
    msg: "",
  });
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const previewOpen = previewIndex !== null;
  const showPrev = () =>
    setPreviewIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length));
  const showNext = () =>
    setPreviewIndex((i) => (i === null ? null : (i + 1) % images.length));

  const t = T[lang];

  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") showPrev();
      else if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setImages([]);
    try {
      const fail = (err: unknown) => ({
        success: false as const,
        error: err instanceof Error ? err.message : "Error",
        images: [] as string[],
      });
      const [r1, r2, r3] = await Promise.all([
        find({ data: { url: url.trim() } }).catch(fail),
        findAlt({ data: { url: url.trim() } }).catch(fail),
        findRep({ data: { url: url.trim() } }).catch(fail),
      ]);

      const merged = Array.from(
        new Set<string>([
          ...(r1.success ? r1.images : []),
          ...(r2.success ? r2.images : []),
          ...(r3.success ? r3.images : []),
        ]),
      );

      if (merged.length > 0) {
        setImages(merged);
        setUrl("");
      } else if (!r1.success && !r2.success && !r3.success) {
        setDialog({
          open: true,
          title: t.errorTitle,
          msg: r1.error || r2.error || r3.error || t.errorAll,
        });
      } else {
        setDialog({ open: true, title: t.noneTitle, msg: t.noneMsg });
      }
    } catch {
      setDialog({ open: true, title: t.errorTitle, msg: t.serverErr });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "var(--gradient-radial)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(var(--hairline) 1px, transparent 1px), linear-gradient(90deg, var(--hairline) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <section className="mx-auto flex max-w-3xl flex-col items-center px-6 pt-12 pb-12 text-center sm:pt-20">
        <span className="mb-6 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          {t.badge}
        </span>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          {t.title1}<br />{t.title2}
        </h1>
        <p className="mt-5 max-w-xl text-balance text-sm text-muted-foreground sm:text-base">
          {t.subtitle}
        </p>

        <form onSubmit={onSubmit} className="mt-10 w-full max-w-xl">
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-[var(--shadow-soft)] sm:flex-row">
            <Input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t.placeholder}
              className="h-12 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
              disabled={loading}
            />
            <Button type="submit" disabled={loading} className="h-12 rounded-xl px-6 text-sm font-medium">
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.searching}</>
              ) : (
                <><Search className="mr-2 h-4 w-4" />{t.search}</>
              )}
            </Button>
          </div>
          {loading && <p className="mt-4 text-xs text-muted-foreground">{t.waitMsg}</p>}
        </form>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        {images.length > 0 ? (
          <>
            <div className="mb-6 flex items-end justify-between">
              <h2 className="text-lg font-medium">{t.results}</h2>
              <span className="text-xs text-muted-foreground">{images.length} {t.photos}</span>
            </div>
            <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
              {images.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setPreviewIndex(i)}
                  className="group block w-full overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-foreground/30"
                >
                  <img
                    src={src}
                    alt="QC photo"
                    loading="lazy"
                    className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.02]"
                    onError={(e) => {
                      (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                    }}
                  />
                </button>
              ))}
            </div>
          </>
        ) : (
          !loading && (
            <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border p-10 text-center">
              <ImageOff className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t.empty}</p>
            </div>
          )
        )}
      </section>

      <Dialog open={dialog.open} onOpenChange={(o) => setDialog((s) => ({ ...s, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog.title}</DialogTitle>
            <DialogDescription>{dialog.msg}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={(o) => !o && setPreviewIndex(null)}>
        <DialogContent className="max-w-3xl border-border bg-card p-2">
          {previewIndex !== null && (
            <div className="relative">
              <img src={images[previewIndex]} alt="QC preview" className="h-auto w-full rounded-lg" />
              {images.length > 1 && (
                <>
                  <button type="button" onClick={showPrev} aria-label="Previous photo"
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground shadow backdrop-blur transition hover:bg-background">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button type="button" onClick={showNext} aria-label="Next photo"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground shadow backdrop-blur transition hover:bg-background">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
                    {previewIndex + 1} / {images.length}
                  </span>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
