// Server-only helpers to read the public "BEST QUALITY SPREADSHEETS" Google
// Sheet via the Lovable connector gateway and parse it into product candidates.
//
// Layout of each tab: repeating 5-column blocks starting at column index 1
// (0-based), i.e. blocks at columns 1, 6, 11, 16, ...
//   [0] PRODUCTs (name)   [1] USFANS (LINK hyperlink -> uidbuy)
//   [2] PRice (e.g. "54.54$\n49.69€")   [3] QC LINK (ignored)   [4] IMAGE
// Photos are floating over-cell images and are NOT exposed by the API, so we
// only extract name + direct uidbuy link + USD/EUR prices.

const SPREADSHEET_ID = "1p5dmt6qfyIw-fvIa-k0HQBYhp2Zaowey87IPyR8OsNo";
const GW = "https://connector-gateway.lovable.dev/google_sheets/v4";

// USD -> CNY factor (inverse of the site's fixed CNY->USD rate of 0.15).
const USD_TO_CNY = 1 / 0.15;

export type ImportCandidate = {
  name: string;
  url: string;
  priceUsd: number | null;
  priceEur: number | null;
  priceCny: number | null;
  category: string;
  tab: string;
};

// gid -> default category on the site
const TAB_CATEGORY: { gid: number; category: string }[] = [
  { gid: 1832673018, category: "Shoes" },
  { gid: 595104429, category: "Hoodies" },
  { gid: 1583250866, category: "T-Shirts" },
  { gid: 1508899370, category: "Coats & Jackets" },
  { gid: 111572037, category: "Accessories" },
  { gid: 1918094610, category: "Electronics" },
];

function headers() {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const sheetsKey = process.env.GOOGLE_SHEETS_API_KEY;
  if (!lovableKey) throw new Error("LOVABLE_API_KEY is not configured");
  if (!sheetsKey) throw new Error("GOOGLE_SHEETS_API_KEY is not configured (connect Google Sheets)");
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": sheetsKey,
  };
}

function parsePrices(text: string | undefined): { usd: number | null; eur: number | null } {
  if (!text) return { usd: null, eur: null };
  const usdM = text.match(/(\d+(?:[.,]\d+)?)\s*\$/);
  const eurM = text.match(/(\d+(?:[.,]\d+)?)\s*€/);
  const num = (s: string | undefined) => {
    if (!s) return null;
    const n = Number(s.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };
  return { usd: num(usdM?.[1]), eur: num(eurM?.[1]) };
}

function isUidbuyProduct(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname.toLowerCase().includes("uidbuy.com") && /\/product\//i.test(u.pathname);
  } catch {
    return false;
  }
}

// Map target gids -> sheet titles using spreadsheet metadata.
async function getGidTitles(): Promise<Map<number, string>> {
  const res = await fetch(
    `${GW}/spreadsheets/${SPREADSHEET_ID}?fields=sheets(properties(sheetId,title))`,
    { headers: headers() },
  );
  if (!res.ok) throw new Error(`Sheets metadata error ${res.status}: ${await res.text()}`);
  const data: any = await res.json();
  const map = new Map<number, string>();
  for (const s of data.sheets ?? []) {
    const p = s.properties ?? {};
    map.set(p.sheetId, p.title);
  }
  return map;
}

async function fetchTabRows(title: string): Promise<any[]> {
  const range = encodeURIComponent(`${title}!A1:Z2000`);
  const res = await fetch(
    `${GW}/spreadsheets/${SPREADSHEET_ID}?includeGridData=true&ranges=${range}&fields=sheets(data(rowData(values(formattedValue,hyperlink))))`,
    { headers: headers() },
  );
  if (!res.ok) throw new Error(`Sheets data error ${res.status}: ${await res.text()}`);
  const data: any = await res.json();
  return data.sheets?.[0]?.data?.[0]?.rowData ?? [];
}

export async function readAllCandidates(): Promise<ImportCandidate[]> {
  const titles = await getGidTitles();
  const out: ImportCandidate[] = [];
  const seen = new Set<string>();

  for (const { gid, category } of TAB_CATEGORY) {
    const title = titles.get(gid);
    if (!title) continue;
    let rows: any[] = [];
    try {
      rows = await fetchTabRows(title);
    } catch {
      continue;
    }
    for (const row of rows) {
      const cells: any[] = row.values ?? [];
      for (let c = 1; c + 2 < cells.length; c += 5) {
        const name = (cells[c]?.formattedValue ?? "").trim();
        const url = (cells[c + 1]?.hyperlink ?? "").trim();
        const priceText = cells[c + 2]?.formattedValue ?? "";
        if (!name || !url) continue;
        if (!isUidbuyProduct(url)) continue; // excludes reddit/telegram/discord/brand anchors
        if (seen.has(url)) continue;
        seen.add(url);
        const { usd, eur } = parsePrices(priceText);
        out.push({
          name,
          url,
          priceUsd: usd,
          priceEur: eur,
          priceCny: usd != null ? Math.round(usd * USD_TO_CNY) : null,
          category,
          tab: title,
        });
      }
    }
  }
  return out;
}
