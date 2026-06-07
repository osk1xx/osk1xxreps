// ============================================================================
// AGENT LINK CONVERTER  —  easy to read / easy to change
// ----------------------------------------------------------------------------
// The whole conversion is driven by a small, human-readable config object that
// the admin can edit in the Admin → Settings tab. Change the agent, the ref
// code or the platform numbers there and the whole site follows.
//
//   base      -> agent product base URL  (no trailing slash)
//   ref       -> your referral code
//   platforms -> which number the agent uses for each Chinese platform
//
// Final agent link shape:
//   {base}/{platformNumber}/{productId}?ref={ref}
//   e.g. https://uidbuy.com/product/2/123456?ref=LZU8AH
//
// Seller link shapes we understand:
//   1688:    https://detail.1688.com/offer/<ID>.html
//   Taobao:  https://item.taobao.com/item.htm?id=<ID>
//   Weidian: https://shop<...>.v.weidian.com/item.html?itemID=<ID>
// ============================================================================

export type AgentPromo = {
  title_en: string;
  title_pl: string;
  body_en: string;
  body_pl: string;
  cta_en: string;
  cta_pl: string;
  url: string;
};

export type AgentConfig = {
  base: string;
  ref: string;
  name: string;
  logo_url: string;
  platforms: { "1688": string; taobao: string; weidian: string };
  promo: AgentPromo;
};

export const DEFAULT_AGENT_PROMO: AgentPromo = {
  title_en: "35% OFF shipping for 6 months + unlimited 25% coupons",
  title_pl: "35% RABATU na wysyłkę przez 6 miesięcy + nielimitowane kupony 25%",
  body_en:
    "UIDBUY is the new cheapest and fastest Chinese shipping agent. Lower fees, faster QC, faster shipping. New users get 35% off shipping valid for 6 months — plus an unlimited 25% off coupon you can collect every day.",
  body_pl:
    "UIDBUY to nowy, najtańszy i najszybszy chiński agent wysyłkowy. Niższe opłaty, szybsze QC, szybsza wysyłka. Nowi użytkownicy dostają 35% rabatu na wysyłkę ważne przez 6 miesięcy — plus nielimitowany kupon 25% do odbioru codziennie.",
  cta_en: "I'm getting it →",
  cta_pl: "Biorę to →",
  url: "https://uidbuy.com/register?ref=LZU8AH",
};

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  base: "https://uidbuy.com/product",
  ref: "LZU8AH",
  name: "UIDBUY",
  logo_url: "",
  platforms: { "1688": "1", taobao: "2", weidian: "3" },
  promo: DEFAULT_AGENT_PROMO,
};

// Normalize whatever is stored in settings into a safe config.
export function normalizeAgentConfig(input: unknown): AgentConfig {
  const c = (input ?? {}) as Partial<AgentConfig>;
  const p = (c.platforms ?? {}) as Partial<AgentConfig["platforms"]>;
  const pr = (c.promo ?? {}) as Partial<AgentPromo>;
  return {
    base: (c.base || DEFAULT_AGENT_CONFIG.base).replace(/\/+$/, ""),
    ref: c.ref || DEFAULT_AGENT_CONFIG.ref,
    name: c.name || DEFAULT_AGENT_CONFIG.name,
    logo_url: c.logo_url || "",
    platforms: {
      "1688": p["1688"] || DEFAULT_AGENT_CONFIG.platforms["1688"],
      taobao: p.taobao || DEFAULT_AGENT_CONFIG.platforms.taobao,
      weidian: p.weidian || DEFAULT_AGENT_CONFIG.platforms.weidian,
    },
    promo: {
      title_en: pr.title_en ?? DEFAULT_AGENT_PROMO.title_en,
      title_pl: pr.title_pl ?? DEFAULT_AGENT_PROMO.title_pl,
      body_en: pr.body_en ?? DEFAULT_AGENT_PROMO.body_en,
      body_pl: pr.body_pl ?? DEFAULT_AGENT_PROMO.body_pl,
      cta_en: pr.cta_en ?? DEFAULT_AGENT_PROMO.cta_en,
      cta_pl: pr.cta_pl ?? DEFAULT_AGENT_PROMO.cta_pl,
      url: pr.url || DEFAULT_AGENT_PROMO.url,
    },
  };
}

// Detect platform + product id from a raw seller URL.
export function parseSellerLink(
  raw: string,
): { platform: "1688" | "taobao" | "weidian"; id: string } | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();

    if (host.includes("1688.com")) {
      const m = u.pathname.match(/\/offer\/(\d+)\.html/i);
      const id = m?.[1] ?? u.searchParams.get("offerId");
      if (id) return { platform: "1688", id };
    }
    if (host.includes("taobao.com") || host.includes("tmall.com")) {
      const id = u.searchParams.get("id");
      if (id) return { platform: "taobao", id };
    }
    if (host.includes("weidian.com")) {
      const id = u.searchParams.get("itemID") || u.searchParams.get("itemId");
      if (id) return { platform: "weidian", id };
    }
  } catch {
    /* ignore */
  }
  return null;
}

// Seller link -> agent deep link. Returns input unchanged if unrecognized.
export function toAgentLink(raw: string, config?: AgentConfig): string {
  const cfg = normalizeAgentConfig(config ?? DEFAULT_AGENT_CONFIG);
  const parsed = parseSellerLink(raw);
  if (!parsed) return raw;
  const num = cfg.platforms[parsed.platform];
  return `${cfg.base}/${num}/${parsed.id}?ref=${cfg.ref}`;
}

// Agent deep link -> original seller URL. Returns input unchanged if it is not
// an agent link for the configured agent.
export function fromAgentLink(raw: string, config?: AgentConfig): string {
  if (!raw) return raw;
  const cfg = normalizeAgentConfig(config ?? DEFAULT_AGENT_CONFIG);
  try {
    const u = new URL(raw);
    const baseHost = new URL(cfg.base).hostname.toLowerCase();
    if (!u.hostname.toLowerCase().includes(baseHost)) return raw;

    const m = u.pathname.match(/\/product\/([^/]+)\/(\d+)/);
    if (!m) return raw;
    const [, num, id] = m;

    if (num === cfg.platforms["1688"]) return `https://detail.1688.com/offer/${id}.html`;
    if (num === cfg.platforms.taobao) return `https://item.taobao.com/item.htm?id=${id}`;
    if (num === cfg.platforms.weidian) return `https://shop.v.weidian.com/item.html?itemID=${id}`;
  } catch {
    /* ignore */
  }
  return raw;
}
