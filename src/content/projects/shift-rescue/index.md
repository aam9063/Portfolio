---
title: "Shift Rescue"
summary: "An AI agent that covers last-minute shift absences over WhatsApp, end to end, with the manager only stepping in when the system asks."
date: "2026-09-28"
draft: false
caseStudy: true
status: "coming-soon"
image: "/img/shift-rescue/dashboard.png"
repoUrl: https://github.com/aam9063/Shift-Rescue
tags:
- AI Agents
- LLM
- Python
- FastAPI
- React
- Twilio
---

![Shift Rescue rescue case, covered](/img/shift-rescue/case-covered.png)

## Context

In shift-based businesses, an absence two hours before the shift costs the manager
thirty to sixty minutes of phone calls: who is free, who lives nearby, who should
not be asked again because they closed last night. Sometimes the shift is not
covered at all.

Shift Rescue is an AI agent that takes that job: it talks to the employees over
WhatsApp, decides who can cover the shift, offers it in waves, keeps the first
acceptance and updates the rota. The manager stays in control and is only asked to
intervene when the agent reaches something it must not decide alone — an overtime
approval, a partial coverage, or a rescue that nobody accepted in time.

## Constraints

- **The manager decides anything that affects people.** Overtime, partial coverage
  and schedule changes always go through an explicit approval; the agent proposes,
  it never approves.
- **Privacy by design.** The absence reason is never asked for and never stored; if
  an employee volunteers health details, the stored body is redacted before it
  touches the database.
- **Nothing is left stuck.** Every rescue either ends covered, or escalates to the
  manager with a summary of who was contacted and what each person answered.

## How it works

The employee writes on WhatsApp; the webhook validates the provider signature and
answers in milliseconds, with the thinking delegated to a background worker. The
LLM interprets the message and writes the reply, always with a validated
structured output and with a deterministic parser as the fallback when the
provider is slow or down. The rescue itself is a state machine over deterministic
rules: roles, rest between shifts, weekly hour caps, availability, quiet hours and
fairness across employees. Every transition is audited, so the dashboard can show
the whole story of a case and each LLM decision carries its own cost and latency.

A simulator lets the whole flow be reproduced without a second phone — including a
shared demo clock to bring a deadline forward — and the manager's dashboard is
live: a change produced anywhere reaches every open screen over a WebSocket.

The flow, from the rota to the covered case (drag or swipe):

<div class="shift-carousel swiper">
<div class="swiper-wrapper">
<div class="swiper-slide">
<img src="/img/shift-rescue/dashboard.png" alt="Manager dashboard with today's rota and active rescues" loading="lazy" />
<div class="slide-caption">The manager's rota. The agent works in the background; the manager only sees it when a decision is needed.</div>
</div>
<div class="swiper-slide">
<img src="/img/shift-rescue/absence-chat.png" alt="WhatsApp conversation where an employee confirms an absence" loading="lazy" />
<div class="slide-caption">"I can't come in today." The agent confirms the absence in the employee's own chat — no reason is asked for and none is stored.</div>
</div>
<div class="swiper-slide">
<img src="/img/shift-rescue/offer-chat.png" alt="WhatsApp conversation where a candidate accepts a shift offer" loading="lazy" />
<div class="slide-caption">The offer goes out in waves to eligible employees; the first acceptance wins the shift.</div>
</div>
<div class="swiper-slide">
<img src="/img/shift-rescue/case-covered.png" alt="Rescue case marked Covered with the agent's audit timeline and candidates" loading="lazy" />
<div class="slide-caption">The case, covered: every agent action is audited, so the manager can replay the whole decision.</div>
</div>
</div>
<div class="carousel-footer">
<div class="swiper-button-prev"></div>
<div class="swiper-pagination"></div>
<div class="swiper-button-next"></div>
</div>
</div>

## Stack

| Layer | |
| --- | --- |
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0 async, Alembic, PostgreSQL, Redis |
| Async work | Celery (worker and beat), broker-owned timers with a reconciliation sweep |
| AI | Strands Agents SDK with OpenAI, structured output validated with Pydantic, no autonomous tool loop |
| Messaging | Twilio WhatsApp (signature-validated webhooks, sandbox for the demo) |
| Frontend | React 19, TypeScript, Vite, Tailwind, TanStack Query, live WebSocket channel |
| Observability | OpenTelemetry to Langfuse Cloud (traces, cost and latency per call), structured logs, alerts, Sentry |
| Quality | 515 backend tests, 199 frontend tests, property-based tests, strict typing and linting |
| Delivery | Docker Compose, Caddy with automatic TLS, AWS (EC2, ECR, SSM, IAM with OIDC) and GitHub Actions |

## What made it hard

The agent was the easy part. The hard part was trusting it, and the honest
material is in the bugs:

- A **quality gate that had been passing for months** because it compared keys
  that did not exist, so it skipped every check. It now fails closed.
- **Test fixtures that described a world production never sent** — a context key
  the orchestrator did not include — which is how an employee confirming their
  absence received "I don't understand you" in production with a green suite.
- **Timers that never fired**: the queue lived in one process and the worker runs
  twelve. Fixing it uncovered an audit id of 81 characters against a `VARCHAR(64)`
  column, which meant no rescue had ever escalated.
- **Tests that passed on my machine and failed in CI** because they reached the
  ambient database, and later the ambient Redis.

Each of those is written up in [the field note that goes with this project](/blog/12-agent-that-moves-peoples-shifts/).

## Results

The full flow works end to end and is verified with real phones and a real model:
absence → confirmation → offers → acceptance → covered shift and updated rota, with
escalation and a manager decision when nobody accepts.

- ~99% intent accuracy interpreting colloquial Spanish, measured on a 150-message
  golden set, with 1.0 health-detail detection.
- 15 end-to-end scenarios (concurrent acceptances, quiet hours, provider outage,
  HRIS failures, manipulation attempts) that must finish with zero invariant
  violations.
- Cost per model call tracked and visible: around $0.0002 per interpretation.

The AWS deployment is prepared and automated but not activated, to stay within
budget; the environment is documented in the repository runbook so it can be
started on demand. The full code is on GitHub: [aam9063/Shift-Rescue](https://github.com/aam9063/Shift-Rescue).
