import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FlagGB, FlagPL } from "./Flags";
import { getStoredLang, setStoredLang, t, useLang } from "@/lib/i18n";

export function LanguageModal() {
  const [open, setOpen] = useState(false);
  const [lang] = useLang();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!getStoredLang()) setOpen(true);
  }, []);

  const tr = t[lang];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
      <DialogContent className="max-w-sm border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-center">{tr.langPick}</DialogTitle>
          <DialogDescription className="text-center">{tr.langSub}</DialogDescription>
        </DialogHeader>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => { setStoredLang("en"); setOpen(false); }}
            className="flex flex-col items-center gap-3 rounded-xl border border-border bg-background p-5 transition hover:border-primary/60 hover:shadow-[var(--shadow-glow)]"
          >
            <FlagGB className="h-8 w-12 rounded" />
            <span className="font-medium">English</span>
          </button>
          <button
            type="button"
            onClick={() => { setStoredLang("pl"); setOpen(false); }}
            className="flex flex-col items-center gap-3 rounded-xl border border-border bg-background p-5 transition hover:border-primary/60 hover:shadow-[var(--shadow-glow)]"
          >
            <FlagPL className="h-8 w-12 rounded" />
            <span className="font-medium">Polski</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
