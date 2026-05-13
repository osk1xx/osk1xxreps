import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Gift } from "lucide-react";
import { getAppSettings } from "@/lib/settings.functions";
import { useLang } from "@/lib/i18n";

const USFANS_URL = "https://www.usfans.com/register?ref=YMCNSE";
const SEEN_KEY = "osk:promoSeen";

export function PromoPopup() {
  const loc = useLocation();
  const [lang] = useLang();
  const [open, setOpen] = useState(false);
  const getSettings = useServerFn(getAppSettings);

  useEffect(() => {
    if (loc.pathname !== "/") return;
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(SEEN_KEY)) return;

    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const s = await getSettings();
        if (cancelled) return;
        if (s.critical_alert) return; // suppressed by emergency
        setOpen(true);
      } catch {
        if (!cancelled) setOpen(true);
      }
    }, 2500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [loc.pathname, getSettings]);

  const close = () => {
    setOpen(false);
    if (typeof window !== "undefined") window.localStorage.setItem(SEEN_KEY, "1");
  };

  const en = lang === "en";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md overflow-hidden border-border p-0">
        <div
          className="relative px-6 pb-6 pt-12 text-center"
          style={{
            background:
              "linear-gradient(160deg, color-mix(in oklab, var(--primary) 22%, transparent), transparent 70%)",
          }}
        >
          <div className="mb-2 text-6xl leading-none">🎁</div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background/60 px-3 py-1 text-xs text-primary">
            <Gift className="h-3.5 w-3.5" />
            {en ? "Special Offer" : "Specjalna oferta"}
          </div>
          <DialogHeader className="mt-3">
            <DialogTitle className="text-2xl font-semibold tracking-tight">
              {en ? "30% OFF shipping + $300 in coupons" : "30% RABATU na wysyłkę + 300$ w kuponach"}
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-relaxed">
              {en
                ? "USFans is the cheapest and fastest Chinese shipping agent. Lower fees, faster QC, faster shipping — and right now new users get an exclusive welcome bundle."
                : "USFans to najtańszy i najszybszy chiński agent wysyłkowy. Niższe opłaty, szybsze QC, szybsza wysyłka — a teraz nowi użytkownicy dostają ekskluzywny pakiet powitalny."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border px-2 py-1">USFans</span>
            <span>·</span>
            <span>{en ? "Cheapest · Fastest · Trusted" : "Najtaniej · Najszybciej · Zaufanie"}</span>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <a
              href={USFANS_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 shadow-[var(--shadow-glow)]"
            >
              {en ? "I'm getting it →" : "Biorę to →"}
            </a>
            <button
              type="button"
              onClick={close}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {en ? "Maybe later" : "Może później"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
