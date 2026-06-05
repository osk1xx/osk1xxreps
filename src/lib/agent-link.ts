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

export type AgentConfig = {
  base: string;
  ref: string;
  platforms: { "1688": string; taobao: string; weidian: string };
};

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  base: "https://uidbuy.com/product",
  ref: "LZU8AH",
  platforms: { "1688": "1", taobao: "2", weidian: "3" },
};

// Normalize whatever is stored in settings into a safe config.
export function normalizeAgentConfig(input: unknown): AgentConfig {
  const c = (input ?? {}) as Partial<AgentConfig>;
  const p = (c.platforms ?? {}) as Partial<AgentConfig["platforms"]>;
  return {
    base: (c.base || DEFAULT_AGENT_CONFIG.base).replace(/\/+$/, ""),
    ref: c.ref || DEFAULT_AGENT_CONFIG.ref,
    platforms: {
      "1688": p["1688"] || DEFAULT_AGENT_CONFIG.platforms["1688"],
      taobao: p.taobao || DEFAULT_AGENT_CONFIG.platforms.taobao,
      weidian: p.weidian || DEFAULT_AGENT_CONFIG.platforms.weidian,
    },
  };
}

// Convert an agent row (from the `agents` table) into an AgentConfig.
export function agentToConfig(agent: {
  base?: string | null;
  ref?: string | null;
  platform_1688?: string | null;
  platform_taobao?: string | null;
  platform_weidian?: string | null;
} | null | undefined): AgentConfig {
  return normalizeAgentConfig({
    base: agent?.base ?? undefined,
    ref: agent?.ref ?? undefined,
    platforms: {
      "1688": agent?.platform_1688 ?? undefined,
      taobao: agent?.platform_taobao ?? undefined,
      weidian: agent?.platform_weidian ?? undefined,
    },
  });
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
