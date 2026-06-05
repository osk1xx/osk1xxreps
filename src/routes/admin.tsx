import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { validateAdminCredentials } from "@/lib/admin-auth.functions";
import {
  CATEGORIES,
  adminListProducts,
  adminCreateDraft,
  adminApproveProduct,
  adminUpdateProduct,
  adminDeleteProduct,
} from "@/lib/products.functions";
import {
  adminListTutorials,
  adminGetTutorialSteps,
  adminCreateTutorial,
  adminUpdateTutorial,
  adminDeleteTutorial,
  adminCreateStep,
  adminUpdateStep,
  adminDeleteStep,
} from "@/lib/tutorials.functions";
import { getAppSettings, adminUpdateSettings } from "@/lib/settings.functions";
import {
  adminListAgents,
  adminCreateAgent,
  adminUpdateAgent,
  adminDeleteAgent,
} from "@/lib/agents.functions";
import { DEFAULT_AGENT_CONFIG, type AgentConfig } from "@/lib/agent-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, LogOut, Check, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

const KEY_STORAGE = "admin_key";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — osk1xx reps" }] }),
});

type Tab = "products" | "tutorials" | "settings";

function getKey(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY_STORAGE);
}

function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthed(!!getKey());
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!authed) return <Login onAuthed={() => setAuthed(true)} />;

  return (
    <Dashboard
      onLogout={() => {
        localStorage.removeItem(KEY_STORAGE);
        setAuthed(false);
      }}
    />
  );
}

function Login({ onAuthed }: { onAuthed: () => void }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [busy, setBusy] = useState(false);
  const validate = useServerFn(validateAdminCredentials);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !u.trim() || !p.trim()) return;
    setBusy(true);
    try {
      const r = await validate({ data: { username: u.trim(), password: p } });
      if (r.valid) {
        localStorage.setItem(KEY_STORAGE, p);
        onAuthed();
      } else {
        toast.error("Invalid credentials");
      }
    } catch {
      toast.error("Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-glow)]"
      >
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-xs text-muted-foreground">Restricted area.</p>
        <Input value={u} onChange={(e) => setU(e.target.value)} placeholder="Username" autoFocus required />
        <Input type="password" value={p} onChange={(e) => setP(e.target.value)} placeholder="Password" required />
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
        </Button>
      </form>
    </main>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("products");

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin panel</h1>
        <Button variant="outline" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
      <div className="mb-6 flex gap-2 border-b border-border">
        {(["products", "tutorials", "settings"] as Tab[]).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm capitalize transition ${
              tab === k
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {k}
          </button>
        ))}
      </div>
      <div>
        {tab === "products" && <ProductsTab />}
        {tab === "tutorials" && <TutorialsTab />}
        {tab === "settings" && <SettingsTab />}
      </div>
    </main>
  );
}

function ProductsTab() {
  const list = useServerFn(adminListProducts);
  const create = useServerFn(adminCreateDraft);
  const approve = useServerFn(adminApproveProduct);
  const update = useServerFn(adminUpdateProduct);
  const del = useServerFn(adminDeleteProduct);
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ category: CATEGORIES[0], name: "", url: "" });
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoadError(null);
      const r = await list({ data: { adminKey: getKey() ?? "" } });
      setItems(r.products);
    } catch (e: any) {
      console.error(e);
      setLoadError("Failed to load products");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res: any = await create({ data: { ...form, adminKey: getKey() ?? "" } });
      if (res?.duplicate) {
        const ok = window.confirm(
          `We already found that link (existing: "${res.existing?.name ?? "—"}"). Are you sure you want to add it again?`,
        );
        if (!ok) return;
        await create({ data: { ...form, force: true, adminKey: getKey() ?? "" } });
      }
      setForm({ category: form.category, name: "", url: "" });
      toast.success("Draft created");
      await refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  if (loadError) {
    return (
      <div className="rounded-2xl border border-destructive/50 bg-card p-6 text-center">
        <p className="mb-4 font-semibold text-destructive">{loadError}</p>
        <Button onClick={refresh}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={onCreate}
        className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[160px_1fr_1fr_auto]"
      >
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value as any })}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Input
          placeholder="Product name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <Input
          placeholder="UIDBUY or seller link"
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          required
        />
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
        </Button>
      </form>

      <Input
        placeholder="Search products by name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items
          .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()))
          .map((p) => (
          <div key={p.id} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-background">
              {p.image_url ? <img src={p.image_url} className="h-full w-full object-cover" /> : null}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase text-muted-foreground">{p.category}</span>
                <span
                  className={`text-xs ${p.status === "approved" ? "text-emerald-400" : "text-amber-400"}`}
                >
                  {p.status}
                </span>
              </div>
              <Input
                className="h-8 text-sm"
                value={p.name}
                onChange={(e) =>
                  setItems((it) => it.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)))
                }
                onBlur={() =>
                  update({ data: { id: p.id, name: p.name, adminKey: getKey() ?? "" } })
                }
              />
              <div className="flex items-center gap-2">
                <Input
                  className="h-8 w-24 text-sm"
                  type="number"
                  value={p.price_cny ?? ""}
                  placeholder="¥"
                  onChange={(e) =>
                    setItems((it) =>
                      it.map((x) =>
                        x.id === p.id
                          ? { ...x, price_cny: e.target.value ? Number(e.target.value) : null }
                          : x,
                      ),
                    )
                  }
                  onBlur={() =>
                    update({
                      data: { id: p.id, price_cny: p.price_cny, adminKey: getKey() ?? "" },
                    })
                  }
                />
                <a
                  href={p.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-xs text-primary underline"
                >
                  link
                </a>
              </div>
              <Input
                className="h-8 text-xs"
                placeholder="Image URL"
                value={p.image_url ?? ""}
                onChange={(e) =>
                  setItems((it) =>
                    it.map((x) => (x.id === p.id ? { ...x, image_url: e.target.value || null } : x)),
                  )
                }
                onBlur={() =>
                  update({
                    data: { id: p.id, image_url: p.image_url || null, adminKey: getKey() ?? "" },
                  })
                }
              />
              <select
                className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                value={p.badge ?? ""}
                onChange={(e) => {
                  const v = e.target.value || null;
                  setItems((it) => it.map((x) => (x.id === p.id ? { ...x, badge: v } : x)));
                  update({ data: { id: p.id, badge: v as any, adminKey: getKey() ?? "" } })
                    .then(() => toast.success("Badge saved"))
                    .catch(() => toast.error("Failed"));
                }}
              >
                <option value="">No badge</option>
                <option value="best">Best Batch (green)</option>
                <option value="budget">Budget Batch (yellow)</option>
              </select>
              <div className="mt-1 flex gap-2">
                {p.status !== "approved" && (
                  <Button
                    size="sm"
                    onClick={async () => {
                      await approve({ data: { id: p.id, adminKey: getKey() ?? "" } });
                      toast.success("Approved");
                      refresh();
                    }}
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Approve
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
                    await del({ data: { id: p.id, adminKey: getKey() ?? "" } });
                    toast.success("Deleted");
                    refresh();
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsTab() {
  const get = useServerFn(getAppSettings);
  const upd = useServerFn(adminUpdateSettings);
  const [s, setS] = useState({ disable_products: false, critical_alert: false });
  const [agent, setAgent] = useState<AgentConfig>(DEFAULT_AGENT_CONFIG);
  const [savingAgent, setSavingAgent] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    get()
      .then((r: any) => {
        setS({ disable_products: r.disable_products, critical_alert: r.critical_alert });
        if (r.agent_config) setAgent(r.agent_config);
      })
      .catch((e: any) => {
        console.error(e);
        setLoadError("Failed to load settings");
      });
  }, []);

  const toggle = async (k: "disable_products" | "critical_alert", v: boolean) => {
    setS((p) => ({ ...p, [k]: v }));
    try {
      await upd({ data: { [k]: v, adminKey: getKey() ?? "" } });
      toast.success("Saved");
    } catch {
      toast.error("Failed");
      setS((p) => ({ ...p, [k]: !v }));
    }
  };

  const saveAgent = async () => {
    setSavingAgent(true);
    try {
      await upd({ data: { agent_config: agent, adminKey: getKey() ?? "" } });
      toast.success("Agent settings saved");
    } catch (e: any) {
      toast.error(e.message || "Failed to save agent settings");
    } finally {
      setSavingAgent(false);
    }
  };


  if (loadError) {
    return (
      <div className="rounded-2xl border border-destructive/50 bg-card p-6 text-center">
        <p className="font-semibold text-destructive">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-3">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
        <div>
          <h3 className="font-medium">Disable Products Page</h3>
          <p className="text-xs text-muted-foreground">
            Visitors see a maintenance message instead of products.
          </p>
        </div>
        <Switch checked={s.disable_products} onCheckedChange={(v) => toggle("disable_products", v)} />
      </div>
      <div className="flex items-center justify-between rounded-2xl 	border border-destructive/50 bg-card p-4">
        <div>
          <h3 className="font-medium text-destructive">Critical Alert Mode</h3>
          <p className="text-xs text-muted-foreground">
            Disables products + promo, hides "register for prizes", shows UIDBUY warning everywhere.
          </p>
        </div>
        <Switch checked={s.critical_alert} onCheckedChange={(v) => toggle("critical_alert", v)} />
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div>
          <h3 className="font-medium">Agent & Link Converter</h3>
          <p className="text-xs text-muted-foreground">
            Change the agent or its link algorithm. Links are built as
            {" "}
            <code className="text-primary">{`{base}/{platform}/{productId}?ref={ref}`}</code>.
            Stored product links stay as the original Chinese seller links, so
            switching the agent re-points every product instantly.
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Agent base URL</label>
          <Input
            value={agent.base}
            onChange={(e) => setAgent({ ...agent, base: e.target.value })}
            placeholder="https://uidbuy.com/product"
          />
          <label className="text-xs text-muted-foreground">Referral code</label>
          <Input
            value={agent.ref}
            onChange={(e) => setAgent({ ...agent, ref: e.target.value })}
            placeholder="LZU8AH"
          />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">1688 #</label>
              <Input
                value={agent.platforms["1688"]}
                onChange={(e) =>
                  setAgent({ ...agent, platforms: { ...agent.platforms, "1688": e.target.value } })
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Taobao #</label>
              <Input
                value={agent.platforms.taobao}
                onChange={(e) =>
                  setAgent({ ...agent, platforms: { ...agent.platforms, taobao: e.target.value } })
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Weidian #</label>
              <Input
                value={agent.platforms.weidian}
                onChange={(e) =>
                  setAgent({ ...agent, platforms: { ...agent.platforms, weidian: e.target.value } })
                }
              />
            </div>
          </div>
          <Button onClick={saveAgent} disabled={savingAgent}>
            {savingAgent ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save agent settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function TutorialsTab() {
  const listFn = useServerFn(adminListTutorials);
  const createFn = useServerFn(adminCreateTutorial);
  const updateFn = useServerFn(adminUpdateTutorial);
  const deleteFn = useServerFn(adminDeleteTutorial);
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<{ language: "en" | "pl"; title: string; description: string }>({
    language: "en",
    title: "",
    description: "",
  });
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const r = await listFn({ data: { adminKey: getKey() ?? "" } });
      setItems(r.tutorials);
    } catch {
      toast.error("Failed to load tutorials");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !form.title.trim()) return;
    setBusy(true);
    try {
      await createFn({
        data: {
          adminKey: getKey() ?? "",
          language: form.language,
          title: form.title.trim(),
          description: form.description.trim() || undefined,
        },
      });
      setForm({ language: form.language, title: "", description: "" });
      toast.success("Tutorial created");
      await refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const patch = (id: string, data: any) => {
    setItems((it) => it.map((x) => (x.id === id ? { ...x, ...data } : x)));
  };

  const save = (id: string, data: any) =>
    updateFn({ data: { id, adminKey: getKey() ?? "", ...data } })
      .then(() => toast.success("Saved"))
      .catch(() => toast.error("Failed"));

  return (
    <div className="space-y-8">
      <form
        onSubmit={onCreate}
        className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[120px_1fr_auto]"
      >
        <select
          value={form.language}
          onChange={(e) => setForm({ ...form, language: e.target.value as "en" | "pl" })}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="en">English</option>
          <option value="pl">Polski</option>
        </select>
        <div className="space-y-2">
          <Input
            placeholder="Tutorial title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <Input
            placeholder="Short description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <Button type="submit" disabled={busy} className="self-start">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
        </Button>
      </form>

      <div className="space-y-3">
        {items.map((tu) => (
          <div key={tu.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase">
                {tu.language}
              </span>
              <Input
                className="h-8 max-w-xs text-sm"
                value={tu.title}
                onChange={(e) => patch(tu.id, { title: e.target.value })}
                onBlur={() => save(tu.id, { title: tu.title })}
              />
              <select
                className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                value={tu.language}
                onChange={(e) => {
                  patch(tu.id, { language: e.target.value });
                  save(tu.id, { language: e.target.value });
                }}
              >
                <option value="en">English</option>
                <option value="pl">Polski</option>
              </select>
              <label className="ml-auto flex items-center gap-2 text-xs">
                Published
                <Switch
                  checked={tu.published}
                  onCheckedChange={(v) => {
                    patch(tu.id, { published: v });
                    save(tu.id, { published: v });
                  }}
                />
              </label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setOpenId(openId === tu.id ? null : tu.id)}
              >
                {openId === tu.id ? "Hide steps" : "Edit steps"}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={async () => {
                  if (!window.confirm(`Delete "${tu.title}"? This cannot be undone.`)) return;
                  await deleteFn({ data: { id: tu.id, adminKey: getKey() ?? "" } });
                  toast.success("Deleted");
                  refresh();
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <Input
              className="mt-2 h-8 text-xs"
              placeholder="Description"
              value={tu.description ?? ""}
              onChange={(e) => patch(tu.id, { description: e.target.value })}
              onBlur={() => save(tu.id, { description: tu.description || null })}
            />
            {openId === tu.id && <StepsEditor tutorialId={tu.id} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function StepsEditor({ tutorialId }: { tutorialId: string }) {
  const getSteps = useServerFn(adminGetTutorialSteps);
  const createStep = useServerFn(adminCreateStep);
  const updateStep = useServerFn(adminUpdateStep);
  const deleteStep = useServerFn(adminDeleteStep);
  const [steps, setSteps] = useState<any[]>([]);

  const refresh = async () => {
    const r = await getSteps({ data: { tutorialId, adminKey: getKey() ?? "" } });
    setSteps(
      (r.steps as any[]).map((s) => ({
        ...s,
        photosText: (Array.isArray(s.photos) ? s.photos : []).join("\n"),
      })),
    );
  };

  useEffect(() => {
    refresh();
  }, [tutorialId]);

  const patch = (id: string, data: any) =>
    setSteps((it) => it.map((x) => (x.id === id ? { ...x, ...data } : x)));

  const saveStep = (s: any) => {
    const photos = String(s.photosText || "")
      .split(/[\n,]+/)
      .map((x: string) => x.trim())
      .filter(Boolean);
    return updateStep({
      data: { id: s.id, adminKey: getKey() ?? "", name: s.name, text: s.text, photos },
    })
      .then(() => toast.success("Step saved"))
      .catch((e: any) => toast.error(e.message || "Failed"));
  };

  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      {steps.map((s, i) => (
        <div key={s.id} className="rounded-xl border border-border bg-background p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {i + 1}
            </span>
            <Input
              className="h-8 text-sm"
              placeholder="Step name"
              value={s.name}
              onChange={(e) => patch(s.id, { name: e.target.value })}
              onBlur={() => saveStep(s)}
            />
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                await deleteStep({ data: { id: s.id, adminKey: getKey() ?? "" } });
                refresh();
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          <textarea
            className="min-h-16 w-full rounded-md border border-border bg-background p-2 text-sm"
            placeholder="Step text"
            value={s.text}
            onChange={(e) => patch(s.id, { text: e.target.value })}
            onBlur={() => saveStep(s)}
          />
          <textarea
            className="mt-2 min-h-14 w-full rounded-md border border-border bg-background p-2 text-xs"
            placeholder="Photo URLs (one per line)"
            value={s.photosText}
            onChange={(e) => patch(s.id, { photosText: e.target.value })}
            onBlur={() => saveStep(s)}
          />
        </div>
      ))}
      <Button
        size="sm"
        variant="outline"
        onClick={async () => {
          await createStep({
            data: { tutorialId, adminKey: getKey() ?? "", position: steps.length },
          });
          refresh();
        }}
      >
        <Plus className="mr-1 h-3 w-3" />
        Add step
      </Button>
    </div>
  );
}
