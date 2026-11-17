# NaN Auto portfolio entries

Feature: publish NaN Auto (NaN Hackathon #2 — "Decide con Clef") as a blog post and a project case study in the Astro portfolio.

Source material: README (raw.githubusercontent.com/aam9063/nan-auto/main/README.md) and informe.md (same repo) fetched 2026-?; assets already in repo: `public/img/NaN-Auto-Demo.gif` (800x450 demo), `public/img/nan.png` (979x568 card image).

## Specs

- S1: Blog post at `src/content/blog/13-<slug>/index.md` following the Field Notes narrative voice, in English, same frontmatter schema as posts 11/12 (title, summary, date, draft:false, featured, tags incl. Field Notes).
- S2: Project entry at `src/content/projects/nan-auto/index.md` with `caseStudy: true`, `status: "coming-soon"` (no deployment), `image: "/img/nan.png"`, `repoUrl: https://github.com/aam9063/nan-auto`.
- S3: Both entries embed the demo GIF `/img/NaN-Auto-Demo.gif`.
- S4: Blog explains the process including failures from informe.md (the documented errors), consistent with the "leads with the mistakes" voice of posts 11/12.
- S5: Project entry follows the case-study structure (Context / Constraints / How it works / Stack / What made it hard / Results) and cross-links the blog post.
- S6: `npm run build` (astro check + build) passes with 0 errors.

## Tasks

- [x] T1 — S3: assets verified in `public/img/` (pre-existing).
- [x] T2 — S1, S4: write blog post (`src/content/blog/13-router-that-measures-everything/index.md`). First-person voice per user correction (he did it solo, no "we"); GIF embedded as a 16:9 demo wrapper (better than static carousel for an animated demo).
- [x] T3 — S2, S3, S5: write project entry (`src/content/projects/nan-auto/index.md`) — GIF as featured image, card image `nan.png`, `repoUrl`, `status: coming-soon`, cross-link to the post.
- [x] T4 — S6: full `npm run build` passes, 27 pages, 0 errors; dist verified (gif, card image, repo link, cross-link, home card).

## Log (continuation)

- User correction: write in first person singular — he built it alone; removed all "we/our".
- User decision: "coming soon" badge on home cards replaced by "Read case study" like the others (`CaseStudyCard.astro`; status field still drives nothing there now).
- Note: earlier headless `swiper-initialized` test on these pages was a bad assertion — these entries intentionally have no `.shift-carousel`; the animated GIF replaces the carousel.

## Log

- L1 (user request): "Vamos a hacer una nueva entrada en el blog y tambien en proyectos. Es sobre mi ultimo proyecto para la #2 Hachathon de NaN builder 'NaN Auto'... un enroutador de sus modelos a traves de 'Clef' un modelo system-one que segun el prompt que le envíes decide que modelo usar de manera automática calculando esfuerzo, costes, etc." + assets paths + readme/informe links.
- Notes gathered from sources: 11 NaN chat models; router = gateway OpenAI-compatible endpoint; Clef questionnaire (task, difficulty, needs_reasoning, expected_output_length); capability filter; policy v2 `score = fit·q − lat·l` with measured latencies; reasoning adapter (off/low/high) with per-model quirks measured; fallback walk + circuit breakers; decision log + SSE live dashboard (4 screens).
- Evaluation: 307/308 matrix cells (28 prompts × 11 models), judge glm5.3 rubric 0–4, baselines R0–R3; router keeps 90.9% quality of best single model, −17.7% latency vs "always most capable", ~0.4–0.5s decision cost; honest negative: router below Pareto frontier of single models with this sample; dashboard states it.
- Errors for the blog (from informe §5): 5.2 reasoning ate responses (documentation lie, measured table, tests load the real card); 5.4 API key leak by three paths, two verifier rounds, canary key — "a test that only proves correct behavior is not a security test"; 5.3 `true` parsed as 1.0 (bool ⊂ int, found by verifier); 5.5 exceptions broke fail-open; 5.7 YAML 1.1 `on:`/`off:` booleans; 5.11/5.14 tests fossilizing obsolete behavior ("what is this test asserting and is it still true?"); 5.19 a 402 removed a model until restart; 5.6 silent composite-command git failure. 305 tests green; ODD + RDD methodology, multi-agent.
