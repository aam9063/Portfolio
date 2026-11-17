---
title: "The router was lying about being smart: field notes from building a model router that measures everything"
summary: "For NaN's second hackathon I built NaN Auto: one OpenAI-compatible endpoint where an LLM classifier decides which of eleven models answers and how much it should reason. Here's what measuring everything taught me — including that my router loses on the Pareto frontier, and why I shipped the chart saying so."
date: "2026-11-15"
draft: false
featured: true
tags:
- Field Notes
- AI Agents
- LLM
- Python
- FastAPI
- React
---

## The problem nobody had time to fix

The second NaN hackathon ("Decide con Clef") gave me a catalog of eleven chat models — from `qwen3.8-flash` to `glm5.3` — and a question every API with a model zoo has to answer: which model handles this request?

The three ways out all have a cost. Always calling the most capable model: expensive and slow — I measured a 51.8s average latency. Always calling the fastest: poor quality on code and math. Letting the user choose: friction and manual decisions nobody wants to own.

And picking the model only answers half the question. Several models **reason by default**, so burning reasoning tokens on "what's the weather in Madrid?" buys latency without buying quality. Two decisions per request, then: which model, and how much reasoning.

I built NaN Auto: a gateway that presents itself as just another model — `model: "nan-auto"` works from Cursor, OpenCode, Cline, or the OpenAI SDK with a base-URL change — and makes both decisions per request, behind an OpenAI-compatible endpoint.

## The mechanics in one request

<div style="position:relative;padding-bottom:56.25%;border-radius:0.5rem;overflow:hidden;border:1px solid rgba(128,128,128,0.35);">
<img src="/img/NaN-Auto-Demo.gif" alt="NaN Auto demo: Clef deciding per request, the router serving with fallback, and the live dashboard" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;" />
</div>

1. **Clef** — NaN's system-one classifier model — answers a one-call questionnaire: `task`, `difficulty`, `needs_reasoning`, `expected_output_length`. One LLM call, budgeted at 0.8s.
2. A **capability filter** discards models that can't serve the request: no image support, no tools, premium budget, context length, or an open circuit breaker.
3. The **policy** scores the survivors with `score = fit·q − latency·l` and picks a winner. If Clef is unsure, it climbs one tier — never two.
4. A **reasoning adapter** translates the abstract level (`off`/`low`/`high`) into the real parameters each model accepts. This adapter exists because of a bug I'll get to.
5. The **relay** streams the answer with the client's own key, with fallback: if the chosen model's breaker is open, the router walks the candidate chain — the client never sees a fallen model's error.

Every decision lands in a log and flows out over SSE to a live dashboard: what Clef said, the candidates with their rejection reasons, p50/p95 latency, fallbacks.

## The part I got wrong, part one: the documentation lies by omission

The whole point of the router is to switch reasoning **off** for trivial prompts. Three days before the demo, that didn't work at all.

The gateway returned `200` with `content: null` and `finish_reason: "length"`. The root cause was two layers deep. The model card said `gemma4` is "off by default" — measured: with no parameters it reasoned anyway, burned 72 of 80 tokens thinking, and left the content empty. "Off by default" actually meant *you must send a parameter to turn it off*. And the parameter isn't uniform: `gemma4` obeys `enable_thinking: false`, `deepseek-v4-flash` only accepts `reasoning_effort`, `kimi-k3.1-pro` rejects any explicit `temperature` at all.

So I measured every model twice — with and without the parameter, trivial prompt, 80 tokens — and wrote the measurement into the model card itself, cited in the YAML. Then I made the tests **load the real card**, so restoring the old assumptions breaks the suite.

The lesson: one measurement beats a documentation table, and a test that copies a wrong assumption verifies nothing.

## The part I got wrong, part two: the key, three ways out

An independent verifier — whose job is to refute, not confirm — found that the API key could leak through three paths. The parser built error messages from the server's own text. The redaction sliced `response.text[:200]` *before* redacting, so a key landing near column 187 kept 13 characters in the message. And a malformed body threw exceptions that escaped the fail-open handler.

Both fixes took two verifier rounds, each armed with its own canary key. And the honest conclusion is the most valuable line of the whole project: **the original tests checked "the error body does not contain the key" — exactly the case a broken server does not produce. A test that only proves correct behavior is not a security test.**

## The part I got wrong, part three: tests as fossils

Twice, an existing green test was the obstacle. One pinned an upstream call count that contradicted the spec; another demanded that a fully exhausted fallback chain mark *every* candidate as failed — including ones the retry budget never even tried. In both cases the test had to lose, and the rewritten tests ended up stricter: walk ten candidates in four passes, touch each exactly once, then answer `no_model` without the upstream ever being called again.

A test is a memory of what I believed, not a definition of what I want. The right question about a red test is never "how do I make it pass" but "what is it asserting, and is it still true?"

Also on the list: YAML 1.1 turning `on:` and `off:` into booleans; `True` parsing as `1.0` because `bool` subclasses `int` (the verifier caught it — self-review wouldn't have, I wrote that code); a single 402 removing a model from rotation until process restart; and exceptions of the wrong type breaking the fail-open path that exists precisely for errors.

## The evaluation I publish with the scare quotes

I ran a RouterBench-style offline evaluation: 28 labeled prompts × 11 models = 308 cells, I measured 307 (one model thinks so much it answers empty even capped at 16,384 reasoning tokens — documented, not hidden). A judge model scored every answer against a 0–4 rubric, raw responses cached for audit.

| Policy | Quality | Latency |
|---|---|---|
| Always the default model | 3.68 | 9.84s |
| Always the most capable | 3.68 | 15.95s |
| **The router (Clef + policy)** | **3.57** | **13.13s** |

The router keeps 90.9% of the best single model's quality and beats "always the most capable" by 17.7% latency, with ~0.4–0.5s of decision cost. And here's the thing: **by the Pareto frontier of this 28-prompt sample, the router loses** — "always the default model" dominates it. The spec said the router would sit above the line; the measurement said it doesn't. The dashboard shows the chart with the router below the frontier instead of hiding it.

A 28-prompt sample describes itself, not the distribution — tuning the policy against the measured matrix is the natural next step. But the build ships with its worst chart on its own screen, and I'd rather have that than a green demo.

## What I'd do differently

I'd write the measurement harness before the router. Nearly every bug that mattered came from trusting a written claim: a model card's "off by default", a config key nobody consumed, a test that fossilized the reading order of a slice. The pieces that worked — circuit breakers with injectable clocks, redaction against a canary, tests that load the real card — are the ones where I assumed my own code was guilty until proven measured.

The full report with all nineteen errors, their detection and resolution, is in the repo: [aam9063/nan-auto/informe.md](https://github.com/aam9063/nan-auto/blob/main/informe.md). Five hundred lines of tests written by an agent that timed out, rescued as an executable contract, are in there too.
