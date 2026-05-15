// Converts a raw seller link (1688 / Weidian / Taobao) to the current
// agent (UIDBUY) deep link with referral. If the URL is not recognized,
// the original URL is returned unchanged.
//
// Mapping:
//   1688:    https://detail.1688.com/offer/<ID>.html
//            -> https://uidbuy.com/product/1/<ID>?ref=LZU8AH
//   Taobao:  https://item.taobao.com/item.htm?id=<ID>
//            -> https://uidbuy.com/product/2/<ID>?ref=LZU8AH
//   Weidian: https://shop<...>.v.weidian.com/item.html?itemID=<ID>
//            -> https://uidbuy.com/product/3/<ID>?ref=LZU8AH

const REF = "LZU8AH";

export function toAgentLink(raw: string): string {
  if (!raw) return raw;
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();

    // 1688
    if (host.includes("1688.com")) {
      const m = u.pathname.match(/\/offer\/(\d+)\.html/i);
      const id = m?.[1] ?? u.searchParams.get("offerId");
      if (id) return `https://uidbuy.com/product/1/${id}?ref=${REF}`;
    }

    // Taobao / Tmall
    if (host.includes("taobao.com") || host.includes("tmall.com")) {
      const id = u.searchParams.get("id");
      if (id) return `https://uidbuy.com/product/2/${id}?ref=${REF}`;
    }

    // Weidian
    if (host.includes("weidian.com")) {
      const id = u.searchParams.get("itemID") || u.searchParams.get("itemId");
      if (id) return `https://uidbuy.com/product/3/${id}?ref=${REF}`;
    }
  } catch {
    /* fall through */
  }
  return raw;
}
