import { useEffect, useState } from "react";

export type Lang = "en" | "pl";

const LANG_KEY = "osk:lang";
const EVT = "osk:lang-change";

export function getStoredLang(): Lang | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(LANG_KEY);
  return v === "en" || v === "pl" ? v : null;
}

export function setStoredLang(l: Lang) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LANG_KEY, l);
  window.dispatchEvent(new CustomEvent(EVT));
}

export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    const sync = () => setLang(getStoredLang() ?? "en");
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return [lang, setStoredLang];
}

export const t = {
  en: {
    nav: {
      qc: "QC Finder",
      products: "Products",
      tracking: "Tracking",
      sizes: "Size Guide",
      gifts: "Register for Prizes",
    },
    home: {
      title: "OSK1XX REPS – FIND. CHECK. WEAR.",
      sub: "The plug for the rep game. Fastest QC photos, curated picks, no cap.",
      qc: "SPRAWDŹ QC",
      products: "PRODUKTY",
      tracking: "ŚLEDZENIE PRZESYŁKI",
      adminLogin: "Admin Panel Login",
    },
    chat: {
      title: "Live support",
      placeholder: "Type a message…",
      send: "Send",
      empty: "Say hi — we usually reply fast.",
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
    },
    products: {
      title: "Products",
      sub: "Curated reps catalog. Click to copy the link.",
      total: "items",
      empty: "No products in this category yet.",
      maintenance: "WE ARE MAKING THINGS BETTER. COMING BACK SOON.",
    },
    alert: {
      title: "CRITICAL ALERT",
      body: "USFANS IS NOT A TRUSTWORTHY AGENT ANYMORE.\n\nPLEASE DO NOT USE USFANS.\n\nQC PHOTOS / TRACKING / SIZE GUIDE WORK NORMALLY.\n\nPLEASE WAIT UNTIL UPDATES FROM ME!",
      ack: "Got it",
    },
    langPick: "Choose your language",
    langSub: "Wybierz język / Select language",
  },
  pl: {
    nav: {
      qc: "Wyszukiwarka QC",
      products: "Produkty",
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
    chat: {
      title: "Czat na żywo",
      placeholder: "Napisz wiadomość…",
      send: "Wyślij",
      empty: "Napisz do nas — zwykle szybko odpowiadamy.",
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
    },
    products: {
      title: "Produkty",
      sub: "Wybrany katalog repów. Kliknij aby skopiować link.",
      total: "produktów",
      empty: "Brak produktów w tej kategorii.",
      maintenance: "PRACUJEMY NAD ULEPSZENIAMI. WRACAMY WKRÓTCE.",
    },
    alert: {
      title: "PILNE OSTRZEŻENIE",
      body: "USFANS NIE JEST JUŻ ZAUFANYM AGENTEM.\n\nPROSZĘ NIE UŻYWAJCIE USFANS.\n\nZDJĘCIA QC / ŚLEDZENIE / ROZMIARÓWKA DZIAŁAJĄ NORMALNIE.\n\nPOCZEKAJCIE NA AKTUALIZACJE OD MNIE!",
      ack: "Rozumiem",
    },
    langPick: "Wybierz język",
    langSub: "Select language / Wybierz język",
  },
} as const;
