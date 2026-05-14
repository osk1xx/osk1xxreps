import { useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, Send, X, CheckCircle2 } from "lucide-react";
import { submitContactMessage } from "@/lib/chat.functions";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ChatWidget() {
  const loc = useLocation();
  const [lang] = useLang();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = useServerFn(submitContactMessage);

  if (loc.pathname.startsWith("/admin")) return null;

  const en = lang === "en";
  const tr = {
    title: en ? "Contact us" : "Skontaktuj się",
    sub: en
      ? "Leave your email and a message — we'll reply by email."
      : "Zostaw email i wiadomość — odpowiemy na maila.",
    email: en ? "Your email" : "Twój email",
    msg: en ? "How can we help?" : "Jak możemy pomóc?",
    send: en ? "Send" : "Wyślij",
    sentT: en ? "Message sent" : "Wiadomość wysłana",
    sentB: en
      ? "Thanks! We'll get back to you by email shortly."
      : "Dzięki! Odpowiemy na maila wkrótce.",
    again: en ? "Send another" : "Wyślij kolejną",
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending || !email.trim() || !body.trim()) return;
    setSending(true);
    setError(null);
    try {
      await submit({ data: { email: email.trim(), body: body.trim() } });
      setSent(true);
      setEmail("");
      setBody("");
    } catch (err: any) {
      setError(err?.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open contact form"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-glow)] transition hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border bg-background/60 px-4 py-3">
            <div>
              <p className="text-sm font-medium">{tr.title}</p>
              <p className="text-[11px] text-muted-foreground">{tr.sub}</p>
            </div>
          </div>

          {sent ? (
            <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-primary" />
              <p className="text-sm font-medium">{tr.sentT}</p>
              <p className="text-xs text-muted-foreground">{tr.sentB}</p>
              <Button variant="outline" size="sm" onClick={() => setSent(false)}>
                {tr.again}
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-2 p-3">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={tr.email}
                required
                maxLength={255}
                disabled={sending}
              />
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={tr.msg}
                required
                maxLength={2000}
                rows={5}
                disabled={sending}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" disabled={sending || !email.trim() || !body.trim()}>
                <Send className="mr-2 h-4 w-4" />
                {tr.send}
              </Button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
