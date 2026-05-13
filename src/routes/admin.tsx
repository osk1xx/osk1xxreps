import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ensureAdminUser, ADMIN_EMAIL } from "@/lib/admin-auth.functions";
import {
  CATEGORIES,
  adminListProducts,
  adminCreateDraft,
  adminApproveProduct,
  adminUpdateProduct,
  adminDeleteProduct,
} from "@/lib/products.functions";
import { adminListThreads, adminReply } from "@/lib/chat.functions";
import { getAppSettings, adminUpdateSettings } from "@/lib/settings.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, LogOut, Check, Trash2, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — osk1xx reps" }] }),
});

type Tab = "products" | "chat" | "settings";

function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (authed === null) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!authed) return <Login onAuthed={() => setAuthed(true)} />;
  return <Dashboard onLogout={async () => { await supabase.auth.signOut(); setAuthed(false); }} />;
}

function Login({ onAuthed }: { onAuthed: () => void }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [busy, setBusy] = useState(false);
  const ensure = useServerFn(ensureAdminUser);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      // Map "admin" username to internal email
      const email = u.trim().toLowerCase() === "admin" ? ADMIN_EMAIL : u.trim();
      // Try sign-in first
      let { error } = await supabase.auth.signInWithPassword({ email, password: p });
      if (error && email === ADMIN_EMAIL) {
        // Bootstrap and retry
        await ensure({ data: { password: p } });
        const r = await supabase.auth.signInWithPassword({ email, password: p });
        error = r.error;
      }
      if (error) {
        toast.error("Invalid credentials");
      } else {
        onAuthed();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-glow)]">
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
        <Button variant="outline" onClick={onLogout}><LogOut className="mr-2 h-4 w-4" />Logout</Button>
      </div>
      <div className="mb-6 flex gap-2 border-b border-border">
        {(["products", "chat", "settings"] as Tab[]).map((k) => (
          <button key={k} onClick={() => setTab(k)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm capitalize transition ${tab === k ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {k}
          </button>
        ))}
      </div>
      {tab === "products" && <ProductsTab />}
      {tab === "chat" && <ChatTab />}
      {tab === "settings" && <SettingsTab />}
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

  const refresh = async () => {
    const r = await list();
    setItems(r.products);
  };
  useEffect(() => { refresh(); }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await create({ data: form });
      setForm({ category: form.category, name: "", url: "" });
      toast.success("Draft created");
      await refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={onCreate} className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[160px_1fr_1fr_auto]">
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as any })}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm">
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <Input placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input placeholder="Product link" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required />
        <Button type="submit" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}</Button>
      </form>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <div key={p.id} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-background">
              {p.image_url ? <img src={p.image_url} className="h-full w-full object-cover" /> : null}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase text-muted-foreground">{p.category}</span>
                <span className={`text-xs ${p.status === "approved" ? "text-emerald-400" : "text-amber-400"}`}>{p.status}</span>
              </div>
              <Input className="h-8 text-sm" value={p.name} onChange={(e) => setItems((it) => it.map((x) => x.id === p.id ? { ...x, name: e.target.value } : x))}
                onBlur={() => update({ data: { id: p.id, name: p.name } })} />
              <div className="flex items-center gap-2">
                <Input className="h-8 w-24 text-sm" type="number" value={p.price_cny ?? ""} placeholder="¥"
                  onChange={(e) => setItems((it) => it.map((x) => x.id === p.id ? { ...x, price_cny: e.target.value ? Number(e.target.value) : null } : x))}
                  onBlur={() => update({ data: { id: p.id, price_cny: p.price_cny } })} />
                <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline truncate">link</a>
              </div>
              <Input className="h-8 text-xs" placeholder="Image URL" value={p.image_url ?? ""}
                onChange={(e) => setItems((it) => it.map((x) => x.id === p.id ? { ...x, image_url: e.target.value || null } : x))}
                onBlur={() => update({ data: { id: p.id, image_url: p.image_url || null } })} />
              <div className="mt-1 flex gap-2">
                {p.status !== "approved" && (
                  <Button size="sm" onClick={async () => { await approve({ data: { id: p.id } }); toast.success("Approved"); refresh(); }}>
                    <Check className="mr-1 h-3 w-3" />Approve
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={async () => { await del({ data: { id: p.id } }); refresh(); }}>
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

function ChatTab() {
  const list = useServerFn(adminListThreads);
  const reply = useServerFn(adminReply);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [text, setText] = useState("");

  const refresh = async () => {
    const r = await list();
    setMsgs(r.messages);
    if (!active && r.messages.length) setActive(r.messages[0].browser_id);
  };
  useEffect(() => { refresh(); const id = setInterval(refresh, 5000); return () => clearInterval(id); }, []);

  const threads = Array.from(new Set(msgs.map((m) => m.browser_id)));
  const thread = msgs.filter((m) => m.browser_id === active);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !text.trim()) return;
    await reply({ data: { browserId: active, body: text.trim() } });
    setText("");
    refresh();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <div className="rounded-2xl border border-border bg-card p-2">
        {threads.length === 0 && <p className="p-4 text-xs text-muted-foreground">No conversations yet.</p>}
        {threads.map((b) => {
          const last = [...msgs].reverse().find((m) => m.browser_id === b);
          return (
            <button key={b} onClick={() => setActive(b)}
              className={`block w-full rounded-xl px-3 py-2 text-left text-xs transition ${active === b ? "bg-primary/15 text-foreground" : "hover:bg-background"}`}>
              <div className="font-mono text-[10px] text-muted-foreground">{b.slice(0, 10)}…</div>
              <div className="truncate">{last?.body}</div>
            </button>
          );
        })}
      </div>
      <div className="flex h-[28rem] flex-col rounded-2xl border border-border bg-card">
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {thread.map((m) => (
            <div key={m.id} className={`flex ${m.role === "admin" ? "justify-end" : "justify-start"}`}>
              <div className={m.role === "admin"
                ? "max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
                : "max-w-[80%] rounded-2xl rounded-bl-sm border border-border bg-background px-3 py-2 text-sm"}>{m.body}</div>
            </div>
          ))}
        </div>
        <form onSubmit={send} className="flex gap-2 border-t border-border p-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Reply…" disabled={!active} />
          <Button type="submit" size="icon" disabled={!active || !text.trim()}><Send className="h-4 w-4" /></Button>
        </form>
      </div>
    </div>
  );
}

function SettingsTab() {
  const get = useServerFn(getAppSettings);
  const upd = useServerFn(adminUpdateSettings);
  const [s, setS] = useState({ disable_products: false, critical_alert: false });
  useEffect(() => { get().then(setS).catch(() => {}); }, []);

  const toggle = async (k: "disable_products" | "critical_alert", v: boolean) => {
    setS((p) => ({ ...p, [k]: v }));
    try { await upd({ data: { [k]: v } }); toast.success("Saved"); }
    catch { toast.error("Failed"); setS((p) => ({ ...p, [k]: !v })); }
  };

  return (
    <div className="space-y-3 max-w-xl">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
        <div>
          <h3 className="font-medium">Disable Products Page</h3>
          <p className="text-xs text-muted-foreground">Visitors see a maintenance message instead of products.</p>
        </div>
        <Switch checked={s.disable_products} onCheckedChange={(v) => toggle("disable_products", v)} />
      </div>
      <div className="flex items-center justify-between rounded-2xl border border-destructive/50 bg-card p-4">
        <div>
          <h3 className="font-medium text-destructive">Critical Alert Mode</h3>
          <p className="text-xs text-muted-foreground">Disables products + promo, hides "register for prizes", shows USFans warning everywhere.</p>
        </div>
        <Switch checked={s.critical_alert} onCheckedChange={(v) => toggle("critical_alert", v)} />
      </div>
    </div>
  );
}
