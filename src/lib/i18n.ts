import { useEffect, useState } from "react";

export type Lang = "en" | "pl";
export type Currency = "CNY" | "PLN" | "USD" | "EUR";

const LANG_KEY = "osk:lang";
const CUR_KEY = "osk:currency";
const LANG_EVT = "osk:lang-change";
const CUR_EVT = "osk:cur-change";

export function getStoredLang(): Lang | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(LANG_KEY);
  return v === "en" || v === "pl" ? v : null;
}

export function setStoredLang(l: Lang) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LANG_KEY, l);
  window.dispatchEvent(new CustomEvent(LANG_EVT));
}

export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    const sync = () => setLang(getStoredLang() ?? "en");
    sync();
    window.addEventListener(LANG_EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(LANG_EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return [lang, setStoredLang];
}

// Currency. Conversion rates relative to 1 CNY.
export const CNY_RATES: Record<Currency, number> = {
  CNY: 1,
  PLN: 0.55,
  EUR: 0.13,
  USD: 0.15,
};

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  CNY: "¥",
  PLN: "zł",
  EUR: "€",
  USD: "$",
};

function getStoredCurrency(): Currency {
  if (typeof window === "undefined") return "USD";
  const v = window.localStorage.getItem(CUR_KEY);
  return v === "CNY" || v === "PLN" || v === "USD" || v === "EUR" ? v : "USD";
}

export function setStoredCurrency(c: Currency) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CUR_KEY, c);
  window.dispatchEvent(new CustomEvent(CUR_EVT));
}

export function useCurrency(): [Currency, (c: Currency) => void] {
  const [cur, setCur] = useState<Currency>("USD");
  useEffect(() => {
    const sync = () => setCur(getStoredCurrency());
    sync();
    window.addEventListener(CUR_EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CUR_EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return [cur, setStoredCurrency];
}

export function formatPrice(priceCNY: number | null | undefined, cur: Currency): string {
  if (priceCNY == null) return "—";
  const v = priceCNY * CNY_RATES[cur];
  const sym = CURRENCY_SYMBOL[cur];
  const formatted = v >= 100 ? v.toFixed(0) : v.toFixed(2);
  return cur === "PLN" ? `${formatted} ${sym}` : `${sym}${formatted}`;
}

export const t = {
  en: {
    nav: {
      qc: "QC Finder",
      products: "Products",
      tutorials: "Tutorials",
      tracking: "Tracking",
      sizes: "Size Guide",
      gifts: "Register for Prizes",
    },
    home: {
      title: "OSK1XX REPS – FIND. CHECK. WEAR.",
      sub: "The plug for the rep game. Fastest QC photos, curated picks, no cap.",
      qc: "FIND QC",
      products: "PRODUCTS",
      tracking: "TRACKING",
      adminLogin: "Admin Panel Login",
    },
    tracking: {
      title: "Track your parcel",
      sub: "Enter your tracking number and we'll open it on 17track.",
      placeholder: "Tracking number",
      submit: "Track",
    },
    sizes: {
      title: "Size Guide",
      sub: "How to size your reps — from Yeezys to Balenciaga.",
      labels: {
        "All Yeezys": "All Yeezys",
        "Football boots": "Football boots",
        "All other shoes": "All other shoes",
      },
    },
    products: {
      title: "Products",
      sub: "Curated reps catalog. Click to open the page or check QC's.",
      total: "items",
      empty: "No products in this category yet.",
      maintenance: "WE ARE MAKING THINGS BETTER. COMING BACK SOON.",
      all: "All",
      currency: "Currency",
      buy: "Buy with UIDBuy",
      checkQc: "Check QC",
    },
    tutorials: {
      title: "Tutorials",
      sub: "Step-by-step guides to help you order, check and track.",
      empty: "No tutorials yet. Check back soon.",
      steps: "steps",
      step: "Step",
      back: "Back to tutorials",
    },
    alert: {
      title: "CRITICAL ALERT",
      body: "UIDBUY IS NOT A TRUSTWORTHY AGENT ANYMORE.\n\nPLEASE DO NOT USE UIDBUY.\n\nQC PHOTOS / TRACKING / SIZE GUIDE WORK NORMALLY.\n\nPLEASE WAIT UNTIL UPDATES FROM ME!",
      ack: "Got it",
    },
    langPick: "Choose your language",
    langSub: "Wybierz język / Select language",
  },
  pl: {
    nav: {
      qc: "QC Finder",
      products: "Produkty",
      tutorials: "Poradniki",
      tracking: "Śledzenie",
      sizes: "Rozmiarówka",
      gifts: "Zarejestruj po nagrody",
    },
    home: {
      title: "OSK1XX REPS – FIND. CHECK. WEAR.",
      sub: "Wtyczka do świata repów. Najszybsze QC, wyselekcjonowane dropy, bez ściemy.",
      qc: "SPRAWDŹ QC",
      products: "PRODUKTY",
      tracking: "ŚLEDZENIE PRZESYŁKI",
      adminLogin: "Logowanie do panelu admina",
    },
    tracking: {
      title: "Śledź paczkę",
      sub: "Wpisz numer trackingu — otworzymy go w 17track.",
      placeholder: "Numer trackingu",
      submit: "Śledź",
    },
    sizes: {
      title: "Rozmiarówka",
      sub: "Jak dobrać rozmiar repa — od Yeezy po Balenciagę.",
      labels: {
        "All Yeezys": "Wszystkie Yeezy",
        "Football boots": "Korki piłkarskie",
        "All other shoes": "Wszystkie inne buty",
      },
    },
    products: {
      title: "Produkty",
      sub: "Wybrany katalog repów. Kliknij aby otworzyć stronę lub sprawdzić QC.",
      total: "produktów",
      empty: "Brak produktów w tej kategorii.",
      maintenance: "PRACUJEMY NAD ULEPSZENIAMI. WRACAMY WKRÓTCE.",
      all: "Wszystkie",
      currency: "Waluta",
      buy: "Kup przez UIDBuy",
      checkQc: "Sprawdź QC",
    },
    tutorials: {
      title: "Poradniki",
      sub: "Poradniki krok po kroku — jak zamawiać, sprawdzać i śledzić.",
      empty: "Brak poradników. Zajrzyj wkrótce.",
      steps: "kroków",
      step: "Krok",
      back: "Wróć do poradników",
    },
    alert: {
      title: "PILNE OSTRZEŻENIE",
      body: "UIDBUY NIE JEST JUŻ ZAUFANYM AGENTEM.\n\nPROSZĘ NIE UŻYWAJCIE UIDBUY.\n\nZDJĘCIA QC / ŚLEDZENIE / ROZMIARÓWKA DZIAŁAJĄ NORMALNIE.\n\nPOCZEKAJCIE NA AKTUALIZACJE OD MNIE!",
      ack: "Rozumiem",
    },
    langPick: "Wybierz język",
    langSub: "Select language / Wybierz język",
  },
} as const;
