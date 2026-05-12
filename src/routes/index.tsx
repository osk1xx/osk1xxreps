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
import { Loader2, Search, ImageOff, ChevronLeft, ChevronRight, Gift } from "lucide-react";

type Lang = "en" | "pl";

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
    langTitle: "Choose your language",
    langSub: "Wybierz język / Select language",
    continue: "Continue",
    offerTitle: "Special Offer 🎁",
    offerHeadline: "30% OFF shipping + $300 in coupons",
    offerBody:
      "USFans is the new best, cheapest and fastest Chinese shipping agent. Lower fees, faster QC, faster shipping — and right now new users get an exclusive welcome bundle.",
    offerCta: "I'm getting it",
    offerSkip: "Maybe later",
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
    langTitle: "Wybierz język",
    langSub: "Select language / Wybierz język",
    continue: "Dalej",
    offerTitle: "Specjalna oferta 🎁",
    offerHeadline: "30% RABATU na wysyłkę + 300$ w kuponach",
    offerBody:
      "USFans to nowy najlepszy, najtańszy i najszybszy chiński agent wysyłkowy. Niższe opłaty, szybsze QC, szybsza wysyłka — a teraz nowi użytkownicy dostają ekskluzywny pakiet powitalny.",
    offerCta: "Biorę to",
    offerSkip: "Może później",
  },
} as const;

const USFANS_URL = "https://www.usfans.com/register?ref=YMCNSE";

const FlagGB = ({ className = "h-6 w-9" }: { className?: string }) => (
  <svg viewBox="0 0 60 36" className={className} aria-hidden>
    <clipPath id="t"><path d="M30,18 h30 v18 z v18 h-30 z h-30 v-18 z v-18 h30 z" /></clipPath>
    <rect width="60" height="36" fill="#012169" />
    <path d="M0,0 L60,36 M60,0 L0,36" stroke="#fff" strokeWidth="6" />
    <path d="M0,0 L60,36 M60,0 L0,36" stroke="#C8102E" strokeWidth="3" clipPath="url(#t)" />
    <path d="M30,0 v36 M0,18 h60" stroke="#fff" strokeWidth="10" />
    <path d="M30,0 v36 M0,18 h60" stroke="#C8102E" strokeWidth="6" />
  </svg>
);

const FlagPL = ({ className = "h-6 w-9" }: { className?: string }) => (
  <svg viewBox="0 0 60 36" className={className} aria-hidden>
    <rect width="60" height="18" fill="#fff" />
    <rect y="18" width="60" height="18" fill="#DC143C" />
  </svg>
);

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Ultimate QC Finder — The Best & Fastest QC Photo Lookup" },
      {
        name: "description",
        content:
          "The fastest QC photo finder for Taobao, Weidian, 1688 and every Chinese agent. Paste a link, get QC photos instantly.",
      },
    ],
  }),
});

function Index() {
  const find = useServerFn(findQcImages);
  const findAlt = useServerFn(findQcImagesViaTymix);
  const findRep = useServerFn(findQcImagesViaRepworld);

  const [lang, setLang] = useState<Lang>("en");
  const [langPicker, setLangPicker] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);

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

  // First-load: language picker, then offer popup. Persist choices.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("qc:lang") as Lang | null;
    if (saved === "en" || saved === "pl") {
      setLang(saved);
      if (!window.localStorage.getItem("qc:offerSeen")) {
        setOfferOpen(true);
      }
    } else {
      setLangPicker(true);
    }
  }, []);

  const pickLang = (l: Lang) => {
    setLang(l);
    if (typeof window !== "undefined") window.localStorage.setItem("qc:lang", l);
    setLangPicker(false);
    if (typeof window !== "undefined" && !window.localStorage.getItem("qc:offerSeen")) {
      setOfferOpen(true);
    }
  };

  const closeOffer = () => {
    setOfferOpen(false);
    if (typeof window !== "undefined") window.localStorage.setItem("qc:offerSeen", "1");
  };

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
        setDialog({
          open: true,
          title: t.noneTitle,
          msg: t.noneMsg,
        });
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

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-foreground" />
          <span className="text-sm font-medium tracking-widest">osk1xx.x</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{t.brandTag}</span>
          <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => pickLang("en")}
              aria-label="English"
              className={`rounded-full p-1 transition ${lang === "en" ? "ring-2 ring-foreground/40" : "opacity-60 hover:opacity-100"}`}
            >
              <FlagGB className="h-4 w-6 rounded-sm" />
            </button>
            <button
              type="button"
              onClick={() => pickLang("pl")}
              aria-label="Polski"
              className={`rounded-full p-1 transition ${lang === "pl" ? "ring-2 ring-foreground/40" : "opacity-60 hover:opacity-100"}`}
            >
              <FlagPL className="h-4 w-6 rounded-sm" />
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto flex max-w-3xl flex-col items-center px-6 pt-16 pb-12 text-center sm:pt-24">
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
            <Button
              type="submit"
              disabled={loading}
              className="h-12 rounded-xl px-6 text-sm font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.searching}
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  {t.search}
                </>
              )}
            </Button>
          </div>
          {loading && (
            <p className="mt-4 text-xs text-muted-foreground">{t.waitMsg}</p>
          )}
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

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        osk1xx.x · {t.brandTag}
      </footer>

      <Dialog open={dialog.open} onOpenChange={(o) => setDialog((s) => ({ ...s, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog.title}</DialogTitle>
            <DialogDescription>{dialog.msg}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Language picker (first visit) */}
      <Dialog open={langPicker} onOpenChange={(o) => !o && setLangPicker(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">{T.en.langTitle} / {T.pl.langTitle}</DialogTitle>
            <DialogDescription className="text-center">
              {T.en.langSub}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => pickLang("en")}
              className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-5 transition hover:border-foreground/40"
            >
              <FlagGB />
              <span className="font-medium">English</span>
            </button>
            <button
              type="button"
              onClick={() => pickLang("pl")}
              className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-5 transition hover:border-foreground/40"
            >
              <FlagPL />
              <span className="font-medium">Polski</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* USFans special offer */}
      <Dialog open={offerOpen} onOpenChange={(o) => !o && closeOffer()}>
        <DialogContent className="max-w-md overflow-hidden border-border p-0">
          <div
            className="relative px-6 pb-6 pt-8 text-center"
            style={{
              background:
                "linear-gradient(160deg, color-mix(in oklab, var(--primary) 18%, transparent), transparent 70%)",
            }}
          >
            <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 text-7xl opacity-90">
              🎁
            </div>
            <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs">
              <Gift className="h-3.5 w-3.5" />
              {t.offerTitle}
            </div>
            <DialogHeader className="mt-4">
              <DialogTitle className="text-2xl font-semibold tracking-tight">
                {t.offerHeadline}
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm leading-relaxed">
                {t.offerBody}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border px-2 py-1">USFans</span>
              <span>·</span>
              <span>Cheapest · Fastest · Trusted</span>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <a
                href={USFANS_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeOffer}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-90"
              >
                {t.offerCta} →
              </a>
              <button
                type="button"
                onClick={closeOffer}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {t.offerSkip}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={(o) => !o && setPreviewIndex(null)}>
        <DialogContent className="max-w-3xl border-border bg-card p-2">
          {previewIndex !== null && (
            <div className="relative">
              <img
                src={images[previewIndex]}
                alt="QC preview"
                className="h-auto w-full rounded-lg"
              />
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPrev}
                    aria-label="Previous photo"
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground shadow backdrop-blur transition hover:bg-background"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={showNext}
                    aria-label="Next photo"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground shadow backdrop-blur transition hover:bg-background"
                  >
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
