# Landing visual system

## Overview
- Scope: public homepage and `src/components/landing` only; mode: Persuade. Dashboard, auth, email review and global theme remain unchanged.
- Authority: `landing.module.css`, `LandingMotion.tsx`, `Hero.tsx` and `docs/design/landing.md`; this replaces the old flat landing description.
- Expo informs oversized typography, layered runtime UI and asymmetric panels. User rejected metallic, pastel and muted-material styling: the app's actual palette is the color authority.
- Existing Inter is inherited without a module font override. No new dependencies or shipping rasters; no global DESIGN.md or sidecar is required for this scoped update.

## Colors
Landing and scene aliases reference global HSL tokens from `src/app/globals.css`, inheriting both themes. No independent hex palette.
- Page/text: `background` / `foreground`; scene background: `muted`; layered product surfaces: `card`.
- Secondary text: `muted-foreground`; dividers: `border`; brand, buttons and chart bars: `primary`; filled-brand foreground: `primary-foreground`.
- Category/statement icons use existing `chart-1` through `chart-4`; category labels retain normal foreground contrast.
- No gradients, inset highlights, metallic device frames or pastel-colored card surfaces. Selection and focus use primary; hover slightly darkens primary.

## Typography
- Hero: `clamp(56px,6.2vw,88px)`, weight 650, line-height 1.04, tracking `-.04em`; body 17px/1.7, max-width 400px. “bajo control.” uses solid primary green.
- Section headings: `clamp(34px,4vw,56px)`, weight 550, 1.1, `-.04em`; scene titles `clamp(26px,2.6vw,36px)`, weight 550, 1.15, `-.035em`.
- Interlude: `clamp(34px,5.6vw,80px)`/1.28; CTA heading `clamp(36px,5vw,70px)`; headings use balanced wrapping.
- Actions 15px/1.4, weight 550; workspace balance 46px/1.2 (mobile 40px), weight 500; sample amounts use tabular numerals; scene details 9–14px.

## Layout
- Container `min(100% - 48px, 1440px)`; sticky navigation 76px minimum; hero padding 52px/42px, two columns `1fr 1.12fr`, 48px gap.
- Left-aligned copy and actions alongside a 730px product stage: large monthly workspace, slightly rotated neutral backdrop, expense form overlapping only the lower card edge, not expense rows or amounts. No phone shell or decorative category object.
- Asymmetric bento: `.9fr 1.1fr`, 24px gap; 900px-minimum budget panel spans two rows, recurring panel 555px, category 445px, statistics spans both columns at 360px.
- Features start at 68px; interlude padding 125px/100px; CTA 90px/100px; footer 60px/30px. Section anchors offset 96px.
- At ≤1100px: tighter navigation, outlined desktop auth action hidden, 24px hero gap, smaller headline and form; secondary available balance hidden.
- At ≤760px: 16px gutters, 72px navigation, desktop links/auth replaced by disclosure; bento becomes one column with 16px gaps and statistics stacks.
- Mobile hero stacks copy and product; heading `clamp(44px,11.7vw,72px)`, stage 730px, workspace fills available width, expense form sits below ledger rows. At ≤380px headline is 40px; sample objects narrow.

## Elevation & Depth
Depth comes only from overlapping UI, rotation and offset neutral shadows. Workspace uses `0 20px 44px rgb(0 0 0 / 14%)`; expense form uses `0 24px 48px rgb(0 0 0 / 18%)`. No simulated reflective materials.

## Shapes
Scene panels 44px, CTA 60px; mobile panels 30px and CTA 40px. Hero workspace 20px (mobile 16px), expense form 18px; layered cards mostly 19–27px; pill actions 999px.

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
- Verification: actual landing components hydrated in an isolated Next app; 12 browser checks cover pause, finite row/total update, replay, theme controls, app-primary palette, four viewport/theme overflow cases, 320px width, mobile menu and reduced motion. Additional geometry assertions ensure the form neither hides ledger rows nor gets clipped. Zero runtime/console errors.
- Regression evidence: 12 tests passed; typecheck and targeted Hero lint clean. No backend or deployment verification is implied.
- Limits: screenshot fixture used Arial fallback instead of production Inter; auth/session fixture returned an unauthenticated empty object, not a real backend. Real hardware, live deployment, destination flows and full accessibility/contrast compliance are not established by that evidence.
