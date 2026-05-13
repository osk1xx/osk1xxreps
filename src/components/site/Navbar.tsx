import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FlagGB, FlagPL } from "./Flags";
import { useLang, t } from "@/lib/i18n";
import { getAppSettings } from "@/lib/settings.functions";
import { useServerFn } from "@tanstack/react-start";

const REGISTER_URL = "https://www.usfans.com/register?ref=YMCNSE";

export function Navbar() {
  const [lang, setLang] = useLang();
  const loc = useLocation();
  if (loc.pathname.startsWith("/admin")) return null;

  const tr = t[lang].nav;

  const link =
    "text-sm text-muted-foreground hover:text-foreground transition-colors";
  const active = "text-foreground";

  const getSettings = useServerFn(getAppSettings);
  const [criticalAlert, setCriticalAlert] = useState(false);
  useEffect(() => {
    let mounted = true;
    getSettings()
      .then((s) => mounted && setCriticalAlert(!!s.critical_alert))
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [loc.pathname, getSettings]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="group flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
          <span className="font-semibold tracking-widest text-foreground group-hover:text-primary transition-colors">
            osk1xx<span className="text-primary"> reps</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          <Link to="/qc" className={link} activeProps={{ className: active }}>
            {tr.qc}
          </Link>
          <Link to="/products" className={link} activeProps={{ className: active }}>
            {tr.products}
          </Link>
          <Link to="/tracking" className={link} activeProps={{ className: active }}>
            {tr.tracking}
          </Link>
          <Link to="/sizes" className={link} activeProps={{ className: active }}>
            {tr.sizes}
          </Link>
          {!criticalAlert && (
            <a
              href={REGISTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              🎁 {tr.gifts}
            </a>
          )}
        </nav>

        <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => setLang("en")}
            aria-label="English"
            className={`rounded-full p-1 transition ${lang === "en" ? "ring-2 ring-primary/60" : "opacity-60 hover:opacity-100"}`}
          >
            <FlagGB />
          </button>
          <button
            type="button"
            onClick={() => setLang("pl")}
            aria-label="Polski"
            className={`rounded-full p-1 transition ${lang === "pl" ? "ring-2 ring-primary/60" : "opacity-60 hover:opacity-100"}`}
          >
            <FlagPL />
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="border-t border-border/60 md:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 overflow-x-auto px-4 py-2 text-xs">
          <Link to="/qc" className={link} activeProps={{ className: active }}>{tr.qc}</Link>
          <Link to="/products" className={link} activeProps={{ className: active }}>{tr.products}</Link>
          <Link to="/tracking" className={link} activeProps={{ className: active }}>{tr.tracking}</Link>
          <Link to="/sizes" className={link} activeProps={{ className: active }}>{tr.sizes}</Link>
          {!criticalAlert && (
            <a href={REGISTER_URL} target="_blank" rel="noopener noreferrer" className="text-primary">
              🎁
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
