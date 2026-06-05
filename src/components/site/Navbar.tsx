import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FlagGB, FlagPL } from "./Flags";
import { useLang, t, useCurrency, type Currency } from "@/lib/i18n";
import { getAppSettings } from "@/lib/settings.functions";
import { useServerFn } from "@tanstack/react-start";

const REGISTER_URL = "https://uidbuy.com/register?ref=LZU8AH";

const CURRENCIES: Currency[] = ["CNY", "PLN", "USD", "EUR"];

export function Navbar() {
  const [lang, setLang] = useLang();
  const [cur, setCur] = useCurrency();
  const loc = useLocation();
  if (loc.pathname.startsWith("/admin")) return null;

  const tr = t[lang].nav;

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

  const navItems = [
    { to: "/qc", label: tr.qc },
    { to: "/products", label: tr.products },
    { to: "/agents", label: tr.agents },
    { to: "/tutorials", label: tr.tutorials },
    { to: "/tracking", label: tr.tracking },
    { to: "/sizes", label: tr.sizes },
  ] as const;

  const NavLink = ({ to, label }: { to: string; label: string }) => {
    const active = loc.pathname === to;
    return (
      <Link
        to={to}
        className={`relative px-3 py-1.5 text-sm transition-all duration-300 rounded-full ${
          active
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <span className="relative z-10">{label}</span>
        {active && (
          <>
            <span className="absolute inset-0 rounded-full bg-primary/10 animate-fade-in" />
            <span className="absolute inset-0 rounded-full ring-1 ring-primary/40 shadow-[0_0_18px_var(--primary)]" />
            <span className="absolute -bottom-[7px] left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)] animate-scale-in" />
          </>
        )}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="group flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_var(--primary)] animate-pulse" />
          <span className="font-semibold tracking-widest text-foreground transition-all duration-300 group-hover:tracking-[0.25em] group-hover:text-primary">
            osk1xx<span className="text-primary"> reps</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((it) => (
            <NavLink key={it.to} to={it.to} label={it.label} />
          ))}
          {!criticalAlert && (
            <a
              href={REGISTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 hover:scale-105 transition-all duration-300"
            >
              🎁 {tr.gifts}
            </a>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <select
            value={cur}
            onChange={(e) => setCur(e.target.value as Currency)}
            aria-label="Currency"
            className="h-8 rounded-full border border-border bg-card px-2 text-xs font-medium text-foreground hover:border-primary/60 transition-colors cursor-pointer"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setLang("en")}
              aria-label="English"
              className={`rounded-full p-1 transition-all duration-300 ${lang === "en" ? "ring-2 ring-primary/60 scale-110" : "opacity-60 hover:opacity-100"}`}
            >
              <FlagGB />
            </button>
            <button
              type="button"
              onClick={() => setLang("pl")}
              aria-label="Polski"
              className={`rounded-full p-1 transition-all duration-300 ${lang === "pl" ? "ring-2 ring-primary/60 scale-110" : "opacity-60 hover:opacity-100"}`}
            >
              <FlagPL />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="border-t border-border/60 md:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-1 overflow-x-auto px-4 py-2 text-xs">
          {navItems.map((it) => {
            const active = loc.pathname === it.to;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`relative rounded-full px-3 py-1 transition-all duration-300 ${
                  active
                    ? "bg-primary/15 text-primary ring-1 ring-primary/40 shadow-[0_0_10px_var(--primary)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {it.label}
              </Link>
            );
          })}
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
