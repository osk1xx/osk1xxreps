import { useEffect, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, Send, X } from "lucide-react";
import { listMyMessages, sendUserMessage } from "@/lib/chat.functions";
import { t, useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BID_KEY = "osk:browserId";

function getBrowserId() {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(BID_KEY);
  if (!id) {
    id = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)).replace(/-/g, "");
    window.localStorage.setItem(BID_KEY, id);
  }
  return id;
}

type Msg = { id: string; role: string; body: string; created_at: string };

export function ChatWidget() {
  const loc = useLocation();
  const [lang] = useLang();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const list = useServerFn(listMyMessages);
  const send = useServerFn(sendUserMessage);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bid = useRef<string>("");

  useEffect(() => { bid.current = getBrowserId(); }, []);

  useEffect(() => {
    if (!open || !bid.current) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const r = await list({ data: { browserId: bid.current } });
        if (!cancelled) setMessages(r.messages as Msg[]);
      } catch {}
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, [open, list]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  if (loc.pathname.startsWith("/admin")) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);
    setInput("");
    // optimistic
    const optimistic: Msg = {
      id: "tmp-" + Date.now(),
      role: "user",
      body,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    try {
      await send({ data: { browserId: bid.current, body } });
      const r = await list({ data: { browserId: bid.current } });
      setMessages(r.messages as Msg[]);
    } catch {} finally {
      setSending(false);
    }
  };

  const tr = t[lang].chat;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open chat"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-glow)] transition hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border bg-background/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
              <span className="text-sm font-medium">{tr.title}</span>
            </div>
          </div>
          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
            {messages.length === 0 && (
              <p className="mt-8 text-center text-xs text-muted-foreground">{tr.empty}</p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
                      : "max-w-[80%] rounded-2xl rounded-bl-sm border border-border bg-background px-3 py-2 text-sm text-foreground"
                  }
                >
                  {m.body}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={submit} className="flex items-center gap-2 border-t border-border bg-background/60 p-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={tr.placeholder}
              className="h-9"
              disabled={sending}
            />
            <Button type="submit" size="icon" disabled={sending || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
