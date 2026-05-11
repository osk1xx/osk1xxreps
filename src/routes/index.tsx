import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { findQcImages, findQcImagesViaTymix } from "@/lib/qc.functions";
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

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "osk1xx.x QC Finder — Find QC Photos by Product Link" },
      {
        name: "description",
        content:
          "Paste any Chinese agent product link and instantly fetch QC photos. No API, no setup.",
      },
    ],
  }),
});

function Index() {
  const find = useServerFn(findQcImages);
  const findAlt = useServerFn(findQcImagesViaTymix);
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
      const [r1, r2] = await Promise.all([
        find({ data: { url: url.trim() } }).catch((e) => ({
          success: false as const,
          error: e instanceof Error ? e.message : "Error",
          images: [] as string[],
        })),
        findAlt({ data: { url: url.trim() } }).catch((e) => ({
          success: false as const,
          error: e instanceof Error ? e.message : "Error",
          images: [] as string[],
        })),
      ]);

      const merged = Array.from(
        new Set<string>([
          ...(r1.success ? r1.images : []),
          ...(r2.success ? r2.images : []),
        ]),
      );

      if (merged.length > 0) {
        setImages(merged);
      } else if (!r1.success && !r2.success) {
        setDialog({
          open: true,
          title: "Something went wrong",
          msg: r1.error || r2.error || "Both finders failed.",
        });
      } else {
        setDialog({
          open: true,
          title: "No images found",
          msg: "We couldn't find any QC photos for this link.",
        });
      }
    } catch {
      setDialog({ open: true, title: "Server error", msg: "Please try again in a moment." });
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
        <span className="text-xs text-muted-foreground">QC Finder</span>
      </header>

      <section className="mx-auto flex max-w-3xl flex-col items-center px-6 pt-16 pb-12 text-center sm:pt-24">
        <span className="mb-6 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          Quality Check photo lookup
        </span>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          Find QC photos<br />from any product link
        </h1>
        <p className="mt-5 max-w-xl text-balance text-sm text-muted-foreground sm:text-base">
          Paste a product URL from your Chinese agent. We fetch the QC images for you — no API, no clicks.
        </p>

        <form onSubmit={onSubmit} className="mt-10 w-full max-w-xl">
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-[var(--shadow-soft)] sm:flex-row">
            <Input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
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
                  Searching…
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search QC
                </>
              )}
            </Button>
          </div>
          {loading && (
            <p className="mt-4 text-xs text-muted-foreground">
              Please wait, searching QC… this can take ~10 seconds.
            </p>
          )}
        </form>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        {images.length > 0 ? (
          <>
            <div className="mb-6 flex items-end justify-between">
              <h2 className="text-lg font-medium">Results</h2>
              <span className="text-xs text-muted-foreground">{images.length} photos</span>
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
              <p className="text-sm text-muted-foreground">Your QC photos will appear here.</p>
            </div>
          )
        )}
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        osk1xx.x · QC Finder
      </footer>

      <Dialog open={dialog.open} onOpenChange={(o) => setDialog((s) => ({ ...s, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog.title}</DialogTitle>
            <DialogDescription>{dialog.msg}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl border-border bg-card p-2">
          {preview && (
            <img src={preview} alt="QC preview" className="h-auto w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
