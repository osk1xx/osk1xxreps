import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { getAppSettings } from "@/lib/settings.functions";
import { t, useLang } from "@/lib/i18n";

const SESSION_KEY = "osk:alertDismissed";

export function CriticalAlertModal() {
  const loc = useLocation();
  const [lang] = useLang();
  const getSettings = useServerFn(getAppSettings);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loc.pathname.startsWith("/admin")) return;
    let cancelled = false;
    getSettings()
      .then((s) => {
        if (cancelled) return;
        if (!s.critical_alert) return;
        if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY)) return;
        setOpen(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [loc.pathname, getSettings]);

  const close = () => {
    setOpen(false);
    if (typeof window !== "undefined") sessionStorage.setItem(SESSION_KEY, "1");
  };

  const tr = t[lang].alert;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md border-destructive/60 bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {tr.title}
          </DialogTitle>
        </DialogHeader>
        <pre className="whitespace-pre-wrap text-center text-sm leading-relaxed text-foreground font-sans">
          {tr.body}
        </pre>
        <Button variant="destructive" onClick={close} className="mt-2">{tr.ack}</Button>
      </DialogContent>
    </Dialog>
  );
}
