---
title: "NaN Auto"
summary: "One OpenAI-compatible endpoint where Clef, a system-one classifier, decides which of eleven NaN models answers each request and how much it should reason — with fallback, circuit breakers and a live decision dashboard."
date: "2026-11-15"
draft: false
caseStudy: true
status: "coming-soon"
image: "/img/nan.png"
repoUrl: https://github.com/aam9063/nan-auto
tags:
- AI Agents
- LLM
- Python
- FastAPI
- React
---

![NaN Auto demo: Clef deciding per request, the router serving with fallback](/img/NaN-Auto-Demo.gif)

## Context

A catalog of eleven chat models — from `qwen3.8-flash` to `glm5.3` — means one decision per request: which model answers? Always the most capable is slow (51.8s average, measured); always the fastest is weak on code and math; asking the user is friction. And picking the model is half the question: several models reason by default, burning tokens and latency on trivial prompts.

NaN Auto takes both decisions, per request. It exposes one OpenAI-compatible endpoint — `model: "nan-auto"` works from Cursor, OpenCode, Cline or the OpenAI SDK by changing only the base URL — and routes each request to the right model with the right amount of reasoning. Built for the #2 NaN Hackathon "Decide con Clef".

## Constraints

- **Client owns the key.** The relay uses the client's own API key; the dashboard's key lives only in session memory, never in `localStorage`.
- **Clef is the classifier, not the decider.** It answers one questionnaire call (task, difficulty, needs_reasoning, expected_output_length); deterministic code filters and scores. A hallucination can mislabel a task — it cannot send traffic to an excluded model.
- **The client never sees a fallen model.** Circuit breakers and a fallback chain walk candidates by score; only the model that actually failed is opened.
- **No claim without a measurement.** Policy constants start as `[HYPOTHESIS]` and are replaced by the measured quality matrix; the evaluation reports its exact sample.

## How it works

1. **Clef** classifies the request in one call, budgeted at 0.8s; on timeout the gateway fails open to the default model.
2. A **capability filter** discards models that can't serve it (image, tools, premium budget, context, open circuits).
3. The **policy** scores survivors with `score = fit·q − latency·l`, using **measured per-model latencies**, and picks the winner; over the fallback chain the reasoning adapter translates `off`/`low`/`high` into each model's real parameters — measured, because `gemma4` obeys `enable_thinking:false`, `deepseek-v4-flash` only accepts `reasoning_effort`, and `kimi-k3.1-pro` rejects any explicit `temperature`.
4. Every decision is logged and streamed over SSE to a live dashboard: playground (decide without calling a model, see Clef's answer and rejected candidates), live feed with p50/p95, registry with circuit state, and an evaluation screen fed by the offline benchmark.

## Stack

| Layer | |
| --- | --- |
| Gateway | Python 3.14, FastAPI, Pydantic v2, uv, SQLite decision log |
| Dashboard | React 19, TypeScript, Vite, Tailwind CSS v4, live SSE feed |
| Evaluation | RouterBench-style harness: 28 prompts × 11 models, judge rubric 0–4, cached raw answers, baselines R0–R3 + Pareto |
| Quality | 305 backend tests (pytest + respx), `ruff` clean, `pyright` 0 errors |
| Methodology | ODD feature documents per unit, receipt-driven review with independent verifier, multi-agent development |
| Delivery | main/dev branches with pre-push protection, PRs from feature branches, conventional commits with tests in the same commit |

## What made it hard

The router was the easy part. The honest material is in the report's nineteen documented errors:

- **The documentation lies by omission.** `gemma4`'s card said "off by default"; measured, it reasoned anyway (72 of 80 tokens, `content: null`) unless forced off with a parameter — and the parameter is different per model. The fix: measure every model twice, write the result into the YAML, and make tests load the real card.
- **The API key could leak by three paths** — error echo, a redaction that truncated before redacting, and exceptions escaping the fail-open handler. Two verifier rounds with a canary key closed them. Lesson kept: a test that only proves correct behavior is not a security test.
- **Green tests as fossils** — one pinned a call count that contradicted the spec, another demanded blaming candidates the retry budget never tried. Both were rewritten stricter.
- **And the classics**: YAML 1.1 turning `on:`/`off:` into booleans, `True` parsing as `1.0` (`bool ⊂ int`), a 402 removing a model from rotation until restart, and malformed upstream bodies breaking the fail-open path.

Each is written up with its detection and resolution in [the field note that goes with this project](/blog/13-router-that-measures-everything/).

## Results

Measured against the real NaN API (307/308 matrix cells, raw answers cached for audit):

- The router keeps **90.9%** of the best single model's quality and beats "always the most capable" by **17.7% latency**, at ~0.4–0.5s of decision cost.
- Reasoning-off really works for trivial prompts: from 72 burned reasoning tokens to 0 on measured models.
- The dashboard publishes the worst chart on its own screen: with this 28-prompt sample, the single default model sits **on the Pareto frontier** and the router below it — the evaluation screen says so instead of hiding it. Tuning the policy against the measured matrix is the next step.

There is no public deployment: the gateway runs locally against the NaN API with your own key; the full runbook and design document live in the repository: [aam9063/nan-auto](https://github.com/aam9063/nan-auto).
