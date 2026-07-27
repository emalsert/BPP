# Training Tracker — Product & Technical Specification

**Working title:** Tally (naming options in §16)
**Status:** Draft v1, for build kickoff
**Author:** Eliot
**Last decisions locked:** React web + Capacitor · Supabase · fully-open link permissions

---

## 1. Vision

A dead-simple, no-login web app to track training sessions toward a shared goal, with a light gamification layer (coins). Think "Tricount for training accountability."

One person creates a page, adds participants by name (no accounts), and shares a link. Anyone opening the link picks locally who they are, then logs sessions inside sections. Each completed session awards coins to the attributed participants. The page shows a live leaderboard and progress toward the main goal.

**One-liner:** Shared training accountability without the friction of accounts.

### Non-goals (explicitly out of scope for v1)
- User authentication, passwords, or accounts.
- Server-side business logic beyond CRUD (Supabase is used as a database + auto API, not a compute layer in v1).
- Social feed, comments, chat, notifications.
- Native-only device features (HealthKit, GPS tracking, background sync).
- Multi-goal pages (one main goal per page in v1).

---

## 2. Core Concepts (Domain Model)

| Concept | Definition |
|---|---|
| **Page** | The shared workspace, identified by an unguessable slug in the URL. Holds one main goal and everything below it. This is the unit that lives "in the DB." |
| **Person** | A participant added by name only (like a Tricount member). Not a user account. Has no credentials. |
| **Local identity** | The browser-local choice of "which Person am I on this page," stored in `localStorage`. Pure UX convenience, not security. |
| **Section** | A named group inside a page (e.g. "Running", "Strength", "Hyrox stations"). Orders sessions. |
| **Session** | The core unit. A note with metadata: title, optional description, a coin value, an attributed set of people, and a status (`todo` / `done`). |
| **Coin** | The reward unit. When a session is marked `done`, each attributed person earns the session's coin value. |
| **Goal** | The page's main objective (e.g. "Hyrox 2026 October"), with an optional target and deadline. Drives the progress bar. |

### Key rule: coins are computed, never stored
Because editing is fully open (no auth, concurrent editors), storing a running coin total per person invites drift and race conditions. Coins are always derived: `sum(coin_value) over that person's done sessions`. This keeps state consistent no matter who edits what. See the `person_score` view in §5.

---

## 3. Permissions & Identity Model

**Decision: fully open.** Anyone with the link can do everything: add/edit/delete sections, sessions, people, coin values, and toggle done status for anyone.

### How identity works
1. On first visit to a page, the app prompts "Who are you?" and shows the list of participants plus an "Add me" option.
2. The chosen `person_id` is saved to `localStorage` under a page-scoped key.
3. All subsequent visits from that browser skip the prompt. A "switch identity" control lets the user change it.

```
localStorage key:  tally:identity:{pageSlug}   ->   person_id
localStorage key:  tally:pages                 ->   [{slug, title, lastOpened}]  // "my pages" list
```

Local identity only affects defaults and highlighting (e.g. pre-checking yourself when creating a session). It grants no special rights, because there are none.

### Access control = unguessable slug
There is no auth gate. A page is reachable only if you know its slug. Slugs are generated with `nanoid(12)` (URL-safe, ~10^21 space), so they are practically unguessable but not secret against someone who has the link. This matches the "share a link, everyone can edit" model.

### Griefing risk and mitigations (v1 accepts the risk)
Fully open + public database key means a malicious link-holder could wipe content. v1 accepts this (small trusted groups). Documented mitigations for later:
- Soft-delete + undo (recoverable for N days) instead of hard delete.
- An `edit link` vs `view link` split (view link cannot mutate).
- RPC-gateway hardening (see §5.4) to stop DB enumeration via the public key.

---

## 4. User Flows

### 4.1 Create a page
1. Landing screen: "Create a page." Enter page title and main goal (e.g. "Hyrox 2026 October"), optional target and deadline.
2. App generates slug, inserts `page` row, redirects to `/p/{slug}`.
3. Creator is prompted to add participants by name.

### 4.2 Share
- A prominent "Share" button copies `https://app.tally/p/{slug}` and offers the native share sheet (works on web and, via Capacitor, on iOS).

### 4.3 Join (open a shared link)
1. Open link, page loads.
2. "Who are you?" prompt: pick an existing person or add yourself.
3. Choice saved locally.

### 4.4 Build structure
- Add a section (name + position).
- Inside a section, add a session: title, optional note, coin value, attributed people (multi-select, self pre-checked), status defaults to `todo`.

### 4.5 Log progress
- Toggle a session `todo` -> `done`. On done, `done_at` is set; attributed people's computed coins increase immediately (optimistic UI, then confirmed).
- Toggle back to `todo` reverses it.

### 4.6 View stats
- Leaderboard: people ranked by coins, with sessions-done count.
- Goal progress: a bar toward the target, plus days remaining if a deadline is set.
- Per-person breakdown on tap.

---

## 5. Data Model (Supabase / Postgres)

### 5.1 Schema (DDL)

```sql
-- One shared workspace per row
create table page (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  goal_title   text,
  goal_type    text not null default 'total_coins'
               check (goal_type in ('total_coins','total_sessions','deadline')),
  goal_target  numeric,          -- e.g. target coins or target sessions
  goal_deadline date,            -- optional
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Participants, added by name only (no accounts)
create table person (
  id         uuid primary key default gen_random_uuid(),
  page_id    uuid not null references page(id) on delete cascade,
  name       text not null,
  color      text,               -- UI accent, optional
  created_at timestamptz not null default now()
);

-- Groups of sessions
create table section (
  id         uuid primary key default gen_random_uuid(),
  page_id    uuid not null references page(id) on delete cascade,
  title      text not null,
  position   int  not null default 0,
  created_at timestamptz not null default now()
);

-- The core unit: a note + metadata
create table session (
  id          uuid primary key default gen_random_uuid(),
  section_id  uuid not null references section(id) on delete cascade,
  page_id     uuid not null references page(id) on delete cascade,  -- denormalized for easy scoping
  title       text not null,
  note        text,
  coin_value  int  not null default 1,
  status      text not null default 'todo' check (status in ('todo','done')),
  done_at     timestamptz,
  position    int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Many-to-many: which people are attributed to a session
create table session_person (
  session_id uuid not null references session(id) on delete cascade,
  person_id  uuid not null references person(id) on delete cascade,
  primary key (session_id, person_id)
);

create index on person(page_id);
create index on section(page_id);
create index on session(section_id);
create index on session(page_id);
create index on session_person(person_id);
```

### 5.2 Derived scores (view)

```sql
create view person_score as
select
  p.id                                                              as person_id,
  p.page_id,
  p.name,
  coalesce(sum(s.coin_value) filter (where s.status = 'done'), 0)   as coins,
  count(s.id)            filter (where s.status = 'done')           as sessions_done
from person p
left join session_person sp on sp.person_id = p.id
left join session s         on s.id = sp.session_id
group by p.id;
```

Page-level aggregate (for the goal bar) is computed client-side or via a second view: total coins earned = sum over `person_score.coins`; total sessions done = count of `session` where status = done.

### 5.3 RLS — v1 (permissive, fast to ship)

```sql
alter table page           enable row level security;
alter table person         enable row level security;
alter table section        enable row level security;
alter table session        enable row level security;
alter table session_person enable row level security;

-- Fully open CRUD for the anon role (public anon key).
create policy anon_all on page           for all to anon using (true) with check (true);
create policy anon_all on person         for all to anon using (true) with check (true);
create policy anon_all on section        for all to anon using (true) with check (true);
create policy anon_all on session        for all to anon using (true) with check (true);
create policy anon_all on session_person for all to anon using (true) with check (true);
```

Trade-off: this exposes all rows to anyone holding the public anon key (which ships in the frontend bundle). Acceptable for small trusted groups + unguessable slugs. Ship this first.

### 5.4 RLS — hardened variant (phase 4, optional)
To stop enumeration through the public key without adding auth:
- Revoke direct table access from `anon`.
- Expose `security definer` RPC functions that take a `slug` and operate only within that page: `get_page(slug)`, `add_session(slug, ...)`, `toggle_session(slug, session_id)`, etc.
- The client never touches tables directly, only RPCs scoped by slug. The slug effectively becomes a bearer token.

This is a clean upgrade path; defer until the app has real users.

### 5.5 Realtime
Enable Supabase Realtime on `session`, `session_person`, `section`, `person` so every open page updates live when anyone edits. Add these tables to the `supabase_realtime` publication.

---

## 6. Coin & Scoring Mechanics

- A session has a single `coin_value` (default 1, editable).
- When `status = done`, **each** attributed person earns the full `coin_value`. (Decision to confirm: full-to-each vs split. Default = full-to-each, since group sessions reward everyone who showed up.)
- Reverting to `todo` removes the coins (because scores are computed, this is automatic).
- No negative coins, no penalties in v1.
- Leaderboard sorts by coins desc, then sessions_done desc, then name.

---

## 7. Stats & Progress

**Goal progress** depends on `goal_type`:
- `total_coins`: progress = `sum(all earned coins) / goal_target`.
- `total_sessions`: progress = `done sessions / goal_target`.
- `deadline`: progress is time-based (days elapsed vs total), coins shown as secondary.

Always show, when present, days remaining to `goal_deadline`.

**Per-person stats:** coins, sessions done, sessions pending (attributed but `todo`), completion rate.

**Charts:** keep it light. A horizontal progress bar for the goal, glass "stat cards" for totals, and a simple ranked list for the leaderboard. If a real chart is wanted, use `recharts` (small, tree-shakeable) for a per-person bar chart. Avoid heavy chart libs on mobile.

---

## 8. Tech Stack (final)

| Layer | Choice | Rationale |
|---|---|---|
| Language | TypeScript | Non-negotiable for a maintainable schema-driven app. |
| Framework | React 18 + **Vite** | Fastest dev + build; produces a static bundle that deploys anywhere in seconds. |
| Routing | React Router (or TanStack Router) | Simple `/`, `/p/:slug`, `/p/:slug/stats`. |
| Server state | **TanStack Query** | Caching, optimistic updates, and easy Supabase integration. |
| Local state | Zustand | Tiny store for local identity + UI state. |
| Backend | **Supabase** | Postgres + auto REST + Realtime + no server to run. All-in-one, matches the fast-deploy goal. |
| Styling | Tailwind CSS | Pairs naturally with glassmorphism and ships fast. |
| Glass UI | shadcn/ui base + a glass token layer (or `glasscn-ui` / `liquid-glass-react`) | shadcn gives accessible primitives you own; a glass layer over it gives full control. Pin the exact lib at implementation time (frontend libs move fast). |
| Background | **shadergradient** (`@shadergradient/react`) | The animated gradient you want. WebGL, so gate it on mobile (see §11.4). |
| Icons | **@phosphor-icons/react** | As requested. |
| IDs | `nanoid` | Unguessable slugs. |
| iOS wrapper | **Capacitor** | Wraps the exact web build into an App Store binary with near-zero extra code. |

---

## 9. Frontend Architecture

### 9.1 Folder structure
```
src/
  app/
    routes.tsx           # route definitions
    providers.tsx        # QueryClient, theme, realtime provider
  lib/
    supabase.ts          # client init
    identity.ts          # localStorage local-user helpers
    ids.ts               # nanoid slug generation
    queries.ts           # TanStack Query hooks (usePage, useSessions, ...)
  features/
    page/                # create page, page shell, share
    people/              # add/pick person, identity prompt
    sections/            # section CRUD + ordering
    sessions/            # session CRUD, toggle done, attribution
    stats/               # leaderboard, goal progress
  components/
    ui/                  # glass primitives: Button, Card, Sheet, Dialog, Input
    Background.tsx       # shadergradient wrapper + fallback
  hooks/
  types/
    db.ts                # generated Supabase types (supabase gen types)
```

### 9.2 Data flow
- `supabase.ts` initializes the client with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- TanStack Query hooks fetch page data; a realtime subscription invalidates queries on change.
- Mutations (toggle done, add session) use optimistic updates for snappy UI, then reconcile.

### 9.3 Key snippets

Client init:
```ts
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

Optimistic toggle:
```ts
const toggleDone = useMutation({
  mutationFn: async (s: Session) =>
    supabase.from('session')
      .update({ status: s.status === 'done' ? 'todo' : 'done',
                done_at: s.status === 'done' ? null : new Date().toISOString() })
      .eq('id', s.id),
  onMutate: async (s) => { /* optimistically flip in cache */ },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['page', slug] }),
});
```

Realtime:
```ts
useEffect(() => {
  const ch = supabase.channel(`page:${pageId}`)
    .on('postgres_changes',
        { event: '*', schema: 'public', table: 'session', filter: `page_id=eq.${pageId}` },
        () => queryClient.invalidateQueries({ queryKey: ['page', slug] }))
    .subscribe();
  return () => { supabase.removeChannel(ch); };
}, [pageId]);
```

---

## 10. Design System / UI

Mobile-first, single-column, generous touch targets (44px min for iOS). The aesthetic is glass panels floating over an animated gradient.

- **Background:** full-viewport `shadergradient` canvas, fixed behind content, low opacity so text stays readable.
- **Surfaces:** glass cards (`backdrop-blur`, translucent white/dark fill, 1px subtle border, soft shadow). Centralize the glass look in a few Tailwind utility classes or a `Card` primitive so it is consistent.
- **Icons:** Phosphor, `weight="duotone"` for headers and `regular` inline. Keep a single weight system.
- **Typography:** one display font for the goal title, one clean UI sans (Inter or system) for body. Large, legible numbers for coins and progress.
- **Motion:** subtle. Session-done should feel rewarding (a small coin pop / count-up), but respect `prefers-reduced-motion`.
- **Empty states:** friendly prompts ("No sections yet, add your first").

### 10.4 shadergradient performance note
shadergradient is WebGL and can drain battery / drop frames on phones. Mitigations:
- Render it once, fixed, behind a blurred overlay so it can run at low resolution.
- Detect low-power / small screens and swap to a static CSS gradient snapshot.
- Pause the animation when the tab/app is backgrounded.
This matters more inside the Capacitor iOS wrapper (WKWebView).

---

## 11. Deploy Pipeline (the priority)

The whole point of the stack is that **web deploy = a git push**, and iOS is an occasional re-wrap of the same build.

### 11.1 Web (fastest path)
1. GitHub repo. Push to `main`.
2. **Vercel** (or Cloudflare Pages, which you already know) imported once, auto-detects Vite.
3. Every push builds and deploys in roughly 30 to 60 seconds. Pull requests get preview URLs automatically.
4. Env vars set in the host dashboard: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

Recommendation: Vercel for the smoothest Vite DX; Cloudflare Pages if you want to stay in an ecosystem you already run. Both are git-push-to-live.

### 11.2 Database
- Supabase project (managed, nothing to deploy).
- Keep schema in `supabase/migrations/` and apply with the Supabase CLI (`supabase db push`) so the DB is reproducible and versioned alongside code.
- Generate TS types: `supabase gen types typescript > src/types/db.ts`.

### 11.3 iOS (Capacitor)
```bash
npm i @capacitor/core @capacitor/ios
npx cap init
npm run build              # produces dist/
npx cap add ios
npx cap sync ios           # copies web build into the iOS project
npx cap open ios           # opens Xcode -> run on device / archive
```
- For releases: archive in Xcode and push to TestFlight.
- To automate TestFlight later: Xcode Cloud or Fastlane. Not needed for MVP.
- Because iOS just wraps `dist/`, shipping a web update to users of the web app is instant; the iOS app updates when you re-wrap and submit.

### 11.4 Summary of the deploy loop
- Ship to web: `git push` (seconds).
- Ship to iOS: `npm run build && npx cap sync ios` then archive (minutes, only when you want a native release).

---

## 12. PWA / Offline (phase 2)
Add `vite-plugin-pwa` for installability and basic offline shell. Cache the app shell; data still needs the network (Supabase). This also improves the "add to home screen" experience before the native iOS app exists, and gives a fast interim mobile path.

---

## 13. MVP Scope & Phasing

**Phase 0 — Foundations**
- Supabase project, schema, permissive RLS, generated types, Vite app skeleton, Vercel deploy.

**Phase 1 — Web MVP (the demo)**
- Create page + goal, add people, share link, local identity prompt.
- Sections CRUD, sessions CRUD, attribution, toggle done.
- Computed coins, leaderboard, goal progress bar.
- Glass UI + shadergradient background + Phosphor icons.

**Phase 2 — Polish & live**
- Realtime sync, optimistic UI, done animation, "my pages" list, PWA, mobile refinements, shadergradient fallback.

**Phase 3 — iOS**
- Capacitor wrap, native share sheet, safe-area handling, TestFlight.

**Phase 4 — Hardening (optional)**
- RPC-gateway RLS, soft-delete + undo, view/edit link split.

---

## 14. Open Decisions to Confirm

These have sensible defaults baked into the spec; flag any you want changed:

1. **Coin award for group sessions:** full to each attributed person (default) vs split evenly.
2. **Goal type:** `total_coins` with a target (default) vs `total_sessions` vs pure `deadline`. Also: is the goal shared across everyone, or does each person have their own target?
3. **Recurring sessions:** v1 treats each session as a one-off instance. Do you want templates or repeats (e.g. "every Monday run")?
4. **UI language:** French default with English option, or English only? (You lean French for personal projects; easy to i18n either way.)
5. **Person visuals:** name only, or name + color + emoji avatar?
6. **Delete confirmations:** given fully-open editing, do you want confirm dialogs / undo from day one, or accept raw deletes in MVP?
7. **Multiple goals per page:** out of scope now; confirm one-goal-per-page is fine.

---

## 15. Risks

- **Griefing / accidental deletion** under fully-open editing (mitigations in §3, §5.4).
- **Public anon key exposure** enables DB enumeration (RPC hardening in §5.4).
- **shadergradient on mobile** battery/perf (fallback in §10.4).
- **No auth means no ownership**, so a page cannot be "reclaimed" if the slug leaks. Accepted for the small-group use case.

---

## 16. Naming (optional)

Working title is **Tally**. Alternatives fitting the accountability + coins theme: **Reps**, **Squad**, **Grind**, **Streak**, **Coin** (as in "earn your coin"), **Huddle**. Pick one and I will thread it through the spec, package name, and Capacitor app id.

---

## 17. Next Step

Confirm the open decisions in §14 (or accept the defaults), and I can turn Phase 0 + Phase 1 into a concrete task breakdown, scaffold the repo structure, and write the initial Supabase migration and the core screens.
