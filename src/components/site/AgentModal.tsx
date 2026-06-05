import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Crown, Check } from "lucide-react";
import { listActiveAgents } from "@/lib/agents.functions";
import { getStoredLang, getStoredAgent, setStoredAgent, useLang, t } from "@/lib/i18n";

type Agent = {
  id: string;
  name: string;
  logo_url: string | null;
  recommended: boolean;
};

export function AgentModal() {
  const [lang] = useLang();
  const [open, setOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const getAgents = useServerFn(listActiveAgents);
  const tr = t[lang].agents;

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    let poll: ReturnType<typeof setInterval> | null = null;

    const start = async () => {
      try {
        const r = await getAgents();
        if (cancelled) return;
        const list = (r.agents ?? []) as Agent[];
        setAgents(list);
        if (list.length === 0) return;
        const rec = list.find((a) => a.recommended) ?? list[0];
        setSelected(rec.id);
        setOpen(true);
      } catch {
        /* ignore */
      }
    };

    if (getStoredLang() && !getStoredAgent()) {
      start();
    } else if (!getStoredLang()) {
      poll = setInterval(() => {
        if (cancelled) return;
        if (getStoredLang() && !getStoredAgent()) {
          if (poll) clearInterval(poll);
          start();
        }
      }, 200);
    }

    return () => {
      cancelled = true;
      if (poll) clearInterval(poll);
    };
  }, [getAgents]);

  const confirm = () => {
    if (selected) setStoredAgent(selected);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && confirm()}>
      <DialogContent className="max-w-md border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-center">{tr.pickTitle}</DialogTitle>
          <DialogDescription className="text-center">{tr.pickSub}</DialogDescription>
        </DialogHeader>
        <div className="mt-2 grid gap-3">
          {agents.map((a) => {
            const active = selected === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelected(a.id)}
                className={`relative flex items-center gap-3 rounded-xl border bg-background p-3 text-left transition ${
                  a.recommended
                    ? "border-amber-400/70 shadow-[0_0_18px_rgba(251,191,36,0.25)]"
                    : "border-border"
                } ${active ? "ring-2 ring-primary" : "hover:border-primary/60"}`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-card">
                  {a.logo_url ? (
                    <img src={a.logo_url} alt={a.name} className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-sm font-bold">{a.name.slice(0, 2)}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    {a.name}
                    {a.recommended && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                        <Crown className="h-3 w-3" />
                        {tr.recommended}
                      </span>
                    )}
                  </div>
                </div>
                {active && <Check className="h-5 w-5 text-primary" />}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={confirm}
          className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          {tr.continue}
        </button>
      </DialogContent>
    </Dialog>
  );
}
