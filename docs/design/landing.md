# Landing pública

Scope: only homepage and src/components/landing. Mode: Persuade. Never change dashboard, auth or email review.

## Direction contract
THESIS: Make the expense workflow memorable through a live, clearly illustrative product stage; avoid an icon grid dressed as a redesign.
OWN-WORLD: Expo informs composition and motion, not materials or palette. Use BethaSpend's existing global theme tokens: primary green, background, card, foreground, border and chart colors. No metallic reflections, pastel surfaces, gradients or inset highlights.
STORY: See a sample expense enter the ledger and update its budget; explore dedicated budget, recurring and category scenes; register through existing links.
FIRST VIEWPORT: Expo-inspired three-part composition: left-aligned “Tu dinero. bajo control.” with solid brand-green emphasis and existing actions; a centred brand-green emblem inside a radial burst of rays and dots; supporting copy on the right; a row of category tiles below. No pretend phone, no metallic or gradient surfaces. Mobile stacks copy, emblem and copy. All financial values are labeled illustrative.
FORM: Scroll-linked hero. On desktop the stage is sticky inside a 250vh track and scroll progress (0–1) drives CSS variables: six sample expenses travel from the burst into the emblem, a budget ring fills and a running total counts up, while the burst scales and fades. Below 1001px the layout stacks and progress follows page scroll. Reduced motion shows the finished state (no sticky, no travelling chips); the global pause stops the slow burst rotation only. Scroll entrances, scene motion only in view, large asymmetric panels, typographic interlude, immersive rounded closing CTA below the hero.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

No invented adoption metrics, logos, commercial claims or new dependencies. No shipping raster assets; the stage is semantic, runtime-rendered sample product UI, not a copied Expo illustration. Validate actual hydrated components, desktop/mobile, themes and motion controls. Existing static-preview limitations do not count as interaction verification.
