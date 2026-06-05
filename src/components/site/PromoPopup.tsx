import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Gift } from "lucide-react";
import { getAppSettings } from "@/lib/settings.functions";
import { listActiveAgents } from "@/lib/agents.functions";
import { useLang, getStoredAgent } from "@/lib/i18n";

type Agent = {
  id: string;
  name: string;
  register_url: string;
  recommended: boolean;
  promo_title_en: string;
  promo_body_en: string;
  promo_title_pl: string;
  promo_body_pl: string;
  promo_image_url: string | null;
};

export function PromoPopup() {
  const loc = useLocation();
  const [lang] = useLang();
  const [open, setOpen] = useState(false);
  const [agent, setAgent] = useState<Agent | null>(null);
  const getSettings = useServerFn(getAppSettings);
  const getAgents = useServerFn(listActiveAgents);

  useEffect(() => {
    if (loc.pathname !== "/") return;
    if (typeof window === "undefined") return;

    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const trigger = async () => {
      try {
        const s = await getSettings();
        if (cancelled) return;
        if (s.critical_alert) return;
        const r = await getAgents();
        if (cancelled) return;
        const list = (r.agents ?? []) as Agent[];
        const chosenId = getStoredAgent();
        const a =
          list.find((x) => x.id === chosenId) ??
          list.find((x) => x.recommended) ??
          list[0] ??
          null;
        if (!a) return;
        setAgent(a);
        setOpen(true);
      } catch {
        /* ignore */
      }
    };

    // Wait until the user has picked an agent (which happens after language).
    if (getStoredAgent()) {
      trigger();
    } else {
      pollTimer = setInterval(() => {
        if (cancelled) return;
        if (getStoredAgent()) {
          if (pollTimer) clearInterval(pollTimer);
          trigger();
        }
      }, 200);
    }

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [loc.pathname, getSettings, getAgents]);

  const close = () => setOpen(false);
  const en = lang === "en";

  if (!agent) return null;

  const title = (en ? agent.promo_title_en : agent.promo_title_pl) || agent.promo_title_en;
  const body = (en ? agent.promo_body_en : agent.promo_body_pl) || agent.promo_body_en;

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
          {agent.promo_image_url ? (
            <img
              src={agent.promo_image_url}
              alt={agent.name}
              className="mx-auto mb-3 h-20 w-auto rounded-xl object-contain"
            />
          ) : (
            <div className="mb-2 text-6xl leading-none">🎁</div>
          )}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background/60 px-3 py-1 text-xs text-primary">
            <Gift className="h-3.5 w-3.5" />
            {en ? "Special Offer" : "Specjalna oferta"}
          </div>
          <DialogHeader className="mt-3">
            <DialogTitle className="text-2xl font-semibold tracking-tight">{title}</DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-relaxed">{body}</DialogDescription>
          </DialogHeader>

          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border px-2 py-1">{agent.name}</span>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            {agent.register_url && (
              <a
                href={agent.register_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 shadow-[var(--shadow-glow)]"
              >
                {en ? "I'm getting it →" : "Biorę to →"}
              </a>
            )}
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
