import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Gift } from "lucide-react";
import { getAppSettings } from "@/lib/settings.functions";
import { DEFAULT_AGENT_CONFIG, type AgentConfig } from "@/lib/agent-link";
import { useLang, getStoredLang } from "@/lib/i18n";

export function PromoPopup() {
  const loc = useLocation();
  const [lang] = useLang();
  const [open, setOpen] = useState(false);
  const [agent, setAgent] = useState<AgentConfig>(DEFAULT_AGENT_CONFIG);
  const getSettings = useServerFn(getAppSettings);

  useEffect(() => {
    if (loc.pathname !== "/") return;
    if (typeof window === "undefined") return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const trigger = (delay: number) => {
      timer = setTimeout(async () => {
        try {
          const s = await getSettings();
          if (cancelled) return;
          if (s.agent_config) setAgent(s.agent_config as AgentConfig);
          if (s.critical_alert) return;
          setOpen(true);
        } catch {
          if (!cancelled) setOpen(true);
        }
      }, delay);
    };

    const hasLang = !!getStoredLang();
    if (hasLang) {
      trigger(0);
    } else {
      // Wait until the user picks a language, then open immediately.
      pollTimer = setInterval(() => {
        if (cancelled) return;
        if (getStoredLang()) {
          if (pollTimer) clearInterval(pollTimer);
          trigger(0);
        }
      }, 200);
    }

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [loc.pathname, getSettings]);

  const close = () => {
    setOpen(false);
  };

  const en = lang === "en";
  const promo = agent.promo;

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
          {agent.logo_url ? (
            <img
              src={agent.logo_url}
              alt={agent.name}
              className="mx-auto mb-2 h-12 w-auto object-contain"
            />
          ) : (
            <div className="mb-2 text-6xl leading-none">🎁</div>
          )}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background/60 px-3 py-1 text-xs text-primary">
            <Gift className="h-3.5 w-3.5" />
            {en ? "Special Offer" : "Specjalna oferta"}
          </div>
          <DialogHeader className="mt-3">
            <DialogTitle className="text-2xl font-semibold tracking-tight">
              {en ? promo.title_en : promo.title_pl}
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-relaxed">
              {en ? promo.body_en : promo.body_pl}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border px-2 py-1">{agent.name}</span>
            <span>·</span>
            <span>{en ? "Cheapest · Fastest · Trusted" : "Najtaniej · Najszybciej · Zaufanie"}</span>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <a
              href={promo.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 shadow-[var(--shadow-glow)]"
            >
              {en ? promo.cta_en : promo.cta_pl}
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
