
# osk1xx reps — full platform build

## Scope at a glance
- Keep current QC Finder logic & UI exactly — move to `/qc`.
- Build new dark/neon-purple streetwear landing at `/`.
- New routes: `/products`, `/tracking`, `/sizes`, `/admin`.
- Global navbar, global floating chat, language modal (first visit), promo popup (home only) — fix oversized gift icon.
- Admin panel with product management, chat replies, and 2 emergency switches.

## Backend (Lovable Cloud)
We need persistent global state (products, chat threads, settings), so I'll enable Lovable Cloud. Tables:
- `products` — id, category, name, source_url, image_url, price_cny, status (`draft`|`approved`), created_at.
- `chat_messages` — id, browser_id, role (`user`|`admin`), body, created_at.
- `app_settings` — singleton row: `disable_products`, `critical_alert`.
- Admin auth: a single admin user created via Cloud (email/password). Login screen takes username `admin` (mapped to a fixed admin email) + password `Andzis<3` set on the seeded user. RLS protects writes; public can read approved products + settings; chat insert allowed for anyone, read scoped by `browser_id`; admin role (via `user_roles` + `has_role`) for all admin operations and updates.

> Note: hardcoding the password in client code would be insecure. I'll seed the admin user once in the DB with that password so the credentials work as you specified, but auth runs through Cloud (Supabase) — secure session-based, not client-side check.

## Routes & layout
- `__root.tsx` — adds `<Navbar />`, `<ChatWidget />`, `<LanguageModal />`, `<CriticalAlertModal />`, `<Outlet />`. Each gated by their own logic.
- `/` (`index.tsx`) — hero (“OSK1XX REPS – FIND. CHECK. WEAR.”), 3 CTA buttons, small Admin login link, promo popup (existing, fixed).
- `/qc` — current `index.tsx` QC Finder content moved verbatim. No design changes.
- `/products` — category tabs, grid of approved products, count. If `disable_products` or `critical_alert` → maintenance page.
- `/tracking` — input → `window.location = https://t.17track.net/pl#nums=<num>`.
- `/sizes` — static styled table with the 5 rules.
- `/admin` — login form → tabs: Products (drafts/approved, edit, approve), Chat (threads grouped by browser_id, reply), Settings (2 switches).

## Server functions (TanStack `createServerFn`)
- `createProductDraft({category, name, url})` — fetches the URL with existing scraping helpers (reuse logic from `qc.functions.ts` minimal fetch + cheerio-style regex) to extract `og:image` and a CNY price (regex `¥\s?(\d+(\.\d+)?)` / `(\d+(\.\d+)?)\s?元`). Insert as draft.
- `listProducts({status?, category?})`, `updateProduct`, `approveProduct`, `deleteProduct`.
- `sendChatMessage({browserId, body})`, `listChatMessages({browserId})`, `adminListThreads`, `adminReply`.
- `getSettings`, `updateSettings` (admin).
All admin mutations use `requireSupabaseAuth` + role check.

## Global chat
- `ChatWidget` floating button bottom-right (z-50). Generates `browser_id` in localStorage. Polls `listChatMessages` every 5s while open. Hidden on `/admin`.

## Language modal
- Reuse existing logic; show on first visit (no `qc:lang` set). Persist.

## Promo popup fix
- The 🎁 emoji is `text-7xl` with `-top-10` on a `pt-8` container — clipped by `DialogContent` overflow. Fix: change container to `overflow-visible` on the inner wrapper (already has `overflow-hidden` on DialogContent — switch to `overflow-visible` and clip via inner radius, or move emoji inline/larger inside the padding instead of negative offset). I'll move the emoji inside (no negative offset) and increase top padding.

## Emergency switches
- `disable_products` → `/products` shows full-page “WE ARE MAKING THINGS BETTER. COMING BACK SOON.”
- `critical_alert` → also disables products, hides promo popup on home, hides "register for prizes" navbar link, shows the CRITICAL ALERT modal on every page entry until user dismisses (per-session dismissal in `sessionStorage`). QC/Tracking/Sizes still function.

## Design system
- Update `src/styles.css` tokens: near-black bg, neon purple primary (`oklch(0.7 0.25 295)`), purple glow shadow, gradient. Keep current QC page visual untouched (it already uses tokens).

## Files to create
```
src/components/site/Navbar.tsx
src/components/site/ChatWidget.tsx
src/components/site/LanguageModal.tsx
src/components/site/PromoPopup.tsx
src/components/site/CriticalAlertModal.tsx
src/components/site/MaintenancePage.tsx
src/lib/products.functions.ts
src/lib/chat.functions.ts
src/lib/settings.functions.ts
src/lib/scrape.server.ts        (price + image extraction)
src/routes/qc.tsx               (current index content)
src/routes/products.tsx
src/routes/tracking.tsx
src/routes/sizes.tsx
src/routes/admin.tsx
src/routes/index.tsx            (rewritten landing)
```
Update `src/routes/__root.tsx` and `src/styles.css`.

## Confirmations needed
1. **Admin auth approach:** I'll use Cloud auth with a seeded admin user (email `admin@osk1xx.local`, password `Andzis<3`). Login form accepts username `admin` and maps it to that email behind the scenes. OK?
2. **Chat realtime:** polling every 5s when open is sufficient (cheaper than realtime channels). OK, or want websocket realtime?
3. **Product price scrape:** if a source page doesn't expose CNY price in HTML (many agents render via JS), the draft will save with `price_cny: null` and admin can edit before approving. OK?

If yes to all three, I'll enable Cloud and build it end-to-end.
