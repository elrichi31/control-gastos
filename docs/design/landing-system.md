# Landing visual system

## Overview
- Scope: public homepage and `src/components/landing` only; mode: Persuade. Dashboard, auth, email review and global theme remain unchanged.
- Authority: `landing.module.css`, `LandingMotion.tsx`, `Hero.tsx` and `docs/design/landing.md`; this replaces the old flat landing description.
- User-pinned Expo screenshots inform oversized typography, layered runtime UI, directional lighting and asymmetric charcoal panels; retain BethaSpend identity.
- Existing Inter is inherited without a module font override. No new dependencies or shipping rasters; no global DESIGN.md or sidecar is required for this scoped update.

## Colors
Local `--landing-` tokens; values are light / dark, selected by the global `.dark` ancestor.
| Suffix | Light | Dark | Role |
| --- | --- | --- | --- |
| `bg` | `#fafafa` | `#101113` | Page and sticky navigation |
| `ink` | `#16181c` | `#f3f4f5` | Main text and primary action |
| `muted` | `#62676f` | `#a5abb4` | Supporting text and controls |
| `line` | `#e0e2e5` | `#2d3035` | Outlines and dividers |
| `soft` | `#f0f1f3` | `#181a1d` | Hover surfaces |
| `accent` | `#287449` | `#8ad8ab` | Brand, selection and focus |
- Scene tokens stay dark in both themes: `--scene-bg: #17191c`, `ink: #f4f5f6`, `muted: #a6adb7`, `line: #33373d`, `accent: #8ad8ab` (all `--scene-` prefixed).
- Scene links use `#88c4ff`; closing CTA uses `#131517` / `#f4f5f6`. Wrapper sets matching `color-scheme`; selection uses accent/background.

## Typography
- Hero: `clamp(42px,6.4vw,88px)`, weight 600, line-height 1.03, tracking `-.04em`; body 17px/1.65, max-width 570px.
- Section headings: `clamp(34px,4vw,56px)`, weight 550, 1.1, `-.04em`; scene titles `clamp(26px,2.6vw,36px)`, weight 550, 1.15, `-.035em`.
- Interlude: `clamp(34px,5.6vw,80px)`/1.28; CTA heading `clamp(36px,5vw,70px)`; headings use balanced wrapping.
- Actions 15px/1.4, weight 550; phone balance 38px/1.2, weight 500; sample amounts use tabular numerals; scene details 9–14px.

## Layout
- Container `min(100% - 48px, 1440px)`; sticky navigation 76px minimum; hero padding 78px/38px, centered copy above a 550px-minimum product stage.
- Central 320px phone with offset left category object and right expense form; layered objects, not an equal two-column hero.
- Asymmetric bento: `.9fr 1.1fr`, 24px gap; 900px-minimum budget panel spans two rows, recurring panel 555px, category 445px, statistics spans both columns at 360px.
- Features start at 68px; interlude padding 125px/100px; CTA 90px/100px; footer 60px/30px. Section anchors offset 96px.
- At ≤1100px: tighter navigation, outlined desktop auth action and category label hidden, expense form narrowed.
- At ≤760px: 16px gutters, 72px navigation, desktop links/auth replaced by disclosure; bento becomes one column with 16px gaps and statistics stacks.
- Mobile hero heading `clamp(36px,8.5vw,60px)`; stage minimum 680px, phone 294px, expense form below; panels use 30px corners. At ≤380px: stage 700px, phone 268px, category float hidden and sample objects narrowed.

## Elevation & Depth
Directional radial lighting, gradient tiles, overlapping rotated UI and inset highlights create depth; phone shadow `0 22px 50px rgb(0 0 0 / 35%)` plus inset rim, expense shadow `0 24px 48px rgb(0 0 0 / 32%)`.

## Shapes
Stage radius 48px, scene panels 44px, CTA 60px; mobile stage/panels 30px and CTA 40px. Phone 39px; layered cards mostly 19–27px; pill actions 999px.

## Components
- Actions: 46px minimum, 12px/23px padding; theme/pause/menu controls 44px circles; focus outline 2px accent with 5px offset. Fine-pointer hover lifts actions 2px; active scales to `.97`; transitions 160ms.
- Illustrative expense demo starts once at 15% visibility: phases 0→1→2→3, delays 1300ms then 1600ms each; no automatic replay. Description/amount, category, then confirmation appear.
- Completion adds “Café con amigos” ($8.00), changes monthly total $352.00→$360.00 against $600.00 budget and available $248.00→$240.00; budget scale follows total with a 650ms transition.
- “Reproducir demo” resets phase to 0; disabled while paused. Sample caption stays visible; rendered form/save affordances are illustrative, not financial inputs.
- CSS handles scene floats (6–8s loops), tile floats (7s), phase-1 cursor blink (900ms), and once-revealed chart growth (1000ms, 60ms stagger). Static headings do not animate.
- WAAPI entrances run once: opacity `.65→1`, translateY `24px→0`, 600ms; `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`, `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`.
- A 12%-threshold observer marks scenes/reveals; CSS floats run only in-view. Demo timers stop offscreen or paused and restart their current phase delay when eligible; observers/listeners/timers clean up.
- Effective pause = user pause OR reduced-motion OR hidden tab. Pause finishes running WAAPI entrances, freezes CSS animations/cursor and stops demo advancement; foreground return resumes only if other pause reasons clear.
- Reduced-motion changes are observed live: no WAAPI entrances; CSS animations removed, transition duration 0ms, scrolling auto, cursor hidden; pause and replay controls disabled. Content stays readable at its current demo phase.

## Do's and Don'ts
- Do preserve landing-local scope, theme support, existing destinations and clearly labeled sample data. Don't invent logos, adoption/security claims, capabilities or auto-loop the expense workflow.
- Reported verification: actual production landing components hydrated in an isolated Next app; 11 browser checks covered pause, finite row/total update, replay, theme controls, four viewport/theme overflow cases, 320px width, mobile menu and reduced motion; zero runtime/console errors.
- Reported regression evidence: 11 tests passed; typecheck and lint clean. These are prior execution results, not a new verification run for this documentation-only edit.
- Limits: screenshot fixture used Arial fallback instead of production Inter; auth/session fixture returned an unauthenticated empty object, not a real backend. Real hardware, live deployment, destination flows and full accessibility/contrast compliance are not established by that evidence.
