import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { listActiveAgents } from "@/lib/agents.functions";
import { useLang, t, useAgentId } from "@/lib/i18n";
import { Loader2, Crown, Check, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/agents")({
  component: AgentsPage,
  head: () => ({
    meta: [
      { title: "Agents — osk1xx reps" },
      { name: "description", content: "Choose your trusted Chinese shopping agent." },
    ],
  }),
});

type Agent = {
  id: string;
  name: string;
  logo_url: string | null;
  register_url: string;
  recommended: boolean;
};

function AgentsPage() {
  const [lang] = useLang();
  const tr = t[lang].agents;
  const [chosen, setChosen] = useAgentId();
  const getAgents = useServerFn(listActiveAgents);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAgents()
      .then((r) => !cancelled && setAgents((r.agents ?? []) as Agent[]))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [getAgents]);

  return (
    <main className="mx-auto max-w-4xl px-6 pt-12 pb-24">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{tr.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{tr.sub}</p>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {agents.map((a) => {
            const isChosen = chosen === a.id;
            return (
              <div
                key={a.id}
                className={`relative flex flex-col gap-4 rounded-2xl border bg-card p-5 transition ${
                  a.recommended
                    ? "border-amber-400/70 shadow-[0_0_22px_rgba(251,191,36,0.22)]"
                    : "border-border"
                }`}
              >
                {a.recommended && (
                  <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
                    <Crown className="h-3 w-3" />
                    {tr.recommended}
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-background">
                    {a.logo_url ? (
                      <img src={a.logo_url} alt={a.name} className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-lg font-bold">{a.name.slice(0, 2)}</span>
                    )}
                  </div>
                  <span className="text-lg font-semibold">{a.name}</span>
                </div>
                <div className="mt-auto flex gap-2">
                  <button
                    type="button"
                    onClick={() => setChosen(a.id)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      isChosen
                        ? "bg-primary/15 text-primary ring-1 ring-primary/50"
                        : "bg-primary text-primary-foreground hover:opacity-90"
                    }`}
                  >
                    {isChosen ? (
                      <>
                        <Check className="h-4 w-4" />
                        {tr.chosen}
                      </>
                    ) : (
                      tr.choose
                    )}
                  </button>
                  {a.register_url && (
                    <a
                      href={a.register_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold transition hover:border-primary/60 hover:text-primary"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {tr.register}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
