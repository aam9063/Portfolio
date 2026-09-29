# Portfolio content — Shift Rescue

Two ready-to-paste entries for `github.com/aam9063/Portfolio` (Astro), written in
the repo's own conventions: **English**, the `Field Notes` narrative voice, and
the exact frontmatter each collection schema expects.

| File to create in the portfolio repo | Collection |
| --- | --- |
| `src/content/blog/12-agent-that-moves-peoples-shifts/index.md` | `blog` (the next slot after `11-yaml-config-tool-industrial-client`) |
| `src/content/projects/shift-rescue/index.md` | `projects` (`caseStudy: true`) |

Checklist before publishing:

- The blog post needs **no asset** (the post page renders only `title` and `summary`).
- The project card renders `image` when present; `/img/image.png` is the placeholder
  the repo already uses. Replace it with a real screenshot when you have one.
- `status: "coming-soon"` is used in the project because there is **no public demo
  URL yet** (the AWS deployment is prepared but not activated). Move it to `live`
  and add `demoUrl` the day the instance is up.
- Dates: the two existing entries use `2026-09-21`; the one below uses `2026-09-28`.

---

## 1. Blog post

**Path:** `src/content/blog/12-agent-that-moves-peoples-shifts/index.md`

```markdown
---
title: "The agent worked, the evaluation was lying: field notes from building an autonomous shift-cover agent"
summary: "An AI agent that covers last-minute shift absences over WhatsApp — and the four bugs I only found because I stopped trusting my own test suite."
date: "2026-09-28"
draft: false
featured: true
tags:
- Field Notes
- AI Agents
- LLM
- Python
- FastAPI
---

## The problem nobody had time to fix

A friend of mine owns a restaurant. One day he described something I had never thought about: when someone calls in sick two hours before their shift, he stops running the restaurant and starts making phone calls. Who is free? Who lives close? Who closed last night and shouldn't be asked again? Thirty to sixty minutes of his day, every time, and sometimes the shift ends up uncovered anyway.

I know HR platforms exist that solve this. I built it to learn how a real autonomous agent is designed and shipped — not how a demo looks on a Friday afternoon.

The constraint I set myself shaped everything that follows: **the agent takes the whole job, and the manager only intervenes when the system asks him to.** Not a copilot. An agent with consequences.

## What it actually has to do

An employee writes "I can't come in today" on WhatsApp. The agent confirms the absence, works out who can cover it, sends offers in waves, keeps the first person who accepts, updates the rota, and notifies whoever needs to know. If nobody accepts before the deadline, it escalates to the manager with a summary of who was contacted and what each of them answered.

The design rule underneath is the one I would now defend in any agent that touches real-world state: **the LLM proposes, the domain decides.** The model interprets free-form Spanish and writes the replies; who is eligible, what gets assigned, what needs a human approval is decided by deterministic, tested code. A hallucination can produce an awkward sentence. It cannot move a shift.

## The parts I got wrong

**My quality gate had been passing for months without checking anything.** I had thresholds — intent accuracy ≥ 0.92, health-detail detection ≥ 0.95 — and a green suite. The gate compared keys ending in `_min` against a report that stored the metrics without the suffix, so every lookup returned nothing, every comparison was skipped, and the runner printed "thresholds met" while accuracy was 0.86. A gate that cannot fail is not a gate; it is decoration. It now fails closed: an unknown metric counts as a violation, never as a pass.

**My test fixtures described a world production never sent.** The golden set fed the model a context key — the pending confirmation — that the orchestrator did not actually include. The fixture passed, the suite was green, and in production an employee answering "SÍ" to *"do you confirm you are not coming in?"* got "I don't understand you, could you repeat that?" and their absence was never confirmed. The same thing happened a second time with the list of upcoming shifts, and a third with a withdrawal marker. Your fixtures are a specification: when they drift from what the system really sends, the suite is measuring fiction. I now have a contract test that pins the exact context keys the orchestrator emits.

**The timers never fired in production, and fixing that uncovered a second bug.** Wave timeouts and deadlines lived in an in-memory queue inside one process — and the worker runs twelve. The case was opened in one child, the clock ticked in another with an empty queue, so no rescue ever escalated. Moving the timers into the broker fixed it, and then the escalation failed for a completely different reason: the audit id was composed as `audit_<case>_escalated_<timestamp>_<event>`, 81 characters against a `VARCHAR(64)` column. Every escalation had been rolling back silently. Fixing the thing that hides a bug is how you find the bug.

**A test that passed on my laptop and failed in CI.** Twice. First it read the database URL from the ambient environment instead of its own settings; later, a test enqueued a real task and reached Redis, which exists on my machine and not on the runner. Both times the test was testing my setup, not my code. Unit tests now cannot reach a broker by accident.

## Where it stands

The whole flow runs end to end: absence on WhatsApp → confirmation → eligible candidates → offers → someone accepts → shift covered and rota updated, with escalation and a manager decision when nobody does. It is verified with real phones and a real LLM, not only in tests.

The evaluation that used to lie now measures: ~99% intent accuracy on a 150-message golden set, 1.0 health-detail detection, and fifteen end-to-end scenarios with a simulated clock and simulated employees that must finish with zero invariant violations. 515 backend tests and 199 frontend tests gate every change, and the cost of each model call is tracked — around $0.0002 per interpretation.

The deployment to AWS is written and automated but switched off, because the demo does not need to be online for me to keep learning from it.

## What I'd do differently

I would write the evaluation contract before the evaluator. Almost every expensive bug here came from the gap between what I *believed* the system was doing and what it was actually doing at that moment: which context the model received, which process held the timers, which database the test was talking to. Tests that pin the contract — the exact context keys, the exact invariants, the exact status codes — would have caught all of them on the day I wrote them, instead of weeks later when a friend's restaurant was the demo.
```

---

## 2. Project entry (case study)

**Path:** `src/content/projects/shift-rescue/index.md`

```markdown
---
title: "Shift Rescue"
summary: "An AI agent that covers last-minute shift absences over WhatsApp, end to end, with the manager only stepping in when the system asks."
date: "2026-09-28"
draft: false
caseStudy: true
status: "coming-soon"
image: "/img/image.png"
repoUrl: https://github.com/aam9063/Shift-Rescue
tags:
- AI Agents
- LLM
- Python
- FastAPI
- React
- Twilio
---

![Shift Rescue](/img/image.png)

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

Each of those is written up in the blog post that goes with this project.

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
started on demand.
```

---

## Notes

- Both are in English to match the rest of the portfolio. If you ever want a
  Spanish version of the article, the material is the same; the LinkedIn post
  (`LINKEDIN_POST.md`) already has the short Spanish form.
- The article deliberately leads with the mistakes rather than the architecture:
  it is the part that cannot be found in a documentation page, and it matches the
  voice of the YAML field note.
- If the project card looks empty without an image, use any screenshot of the
  dashboard; the agent decisions screen (intent, confidence, cost, latency) is the
  most striking one.
