# Shift Rescue portfolio entries

Feature: publish Shift Rescue as a blog post and a project case study in the Astro portfolio.

Source material: `PORTFOLIO_CONTENT.md` (root). Screenshots: `public/img/shift-rescue/` (dashboard, absence-chat, offer-chat, case-covered).

## Tasks

- [x] T1 — Rename screenshots to semantic names (`1..4.png` → `dashboard.png`, `absence-chat.png`, `offer-chat.png`, `case-covered.png`).
- [x] T2 — Create `src/content/blog/12-agent-that-moves-peoples-shifts/index.md` with the 4-screenshot carousel (CSS-only scroll-snap, no JS).
- [x] T3 — Create `src/content/projects/shift-rescue/index.md` with `caseStudy: true`, `status: coming-soon`, `repoUrl`, card image `dashboard.png`, and the carousel.
- [x] T4 — Run `astro build` (includes `astro check`) and verify both pages render in `dist/`.

## Decisions

- Screenshots live in `public/img/shift-rescue/`; no demo URL because the AWS deployment is off (costs) — `status: "coming-soon"`, `repoUrl: https://github.com/aam9063/Shift-Rescue`.
- Carousel: inline HTML in markdown with scroll-snap and inline styles (Tailwind classes are not guaranteed for markdown-authored HTML).
- Card image: `dashboard.png` (wide, fits the `aspect-video object-cover` card).

## Evidence

- T1: done — files renamed in `public/img/shift-rescue/`.
- Round 2 (user feedback): carousel replaced with Swiper 14 (uniform slide container, `object-fit: contain`, pagination + navigation) — init script and global styles in `src/layouts/ArticleBottomLayout.astro`, markup in both entries. `CaseStudyCard.astro` now renders coming-soon projects as clickable case-study cards (badge kept). Blog listing "0 of 12" was a stale Vite dep cache (`Error hydrating SearchCollection`); fixed by clearing `node_modules/.vite` and restarting the dev server — verified "SHOWING 12 OF 12 posts" headless. `astro build` passes; carousel initialized (4 slides, 4 bullets) verified headless on the post page.
- Round 3: drag/swipe didn't work — Swiper 14's `onTouchEnd` treats a pointerup landing on the nav arrows (overlaid on the slides) as a prev-button click and snaps back. Arrows moved to a footer row (`.carousel-footer`: prev / bullets / next) below the slides in both entries; styles updated in `ArticleBottomLayout.astro`. Verified with puppeteer-core + system Chrome: drag left/right (edge and mid release), prev/next clicks, and bullets all slide correctly. Build passes.
