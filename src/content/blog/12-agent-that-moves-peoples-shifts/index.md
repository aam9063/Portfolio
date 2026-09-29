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

## What it looks like

The whole flow, from the manager's rota to the covered shift (drag or swipe through the four screens):

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

## The parts I got wrong

**My quality gate had been passing for months without checking anything.** I had thresholds — intent accuracy ≥ 0.92, health-detail detection ≥ 0.95 — and a green suite. The gate compared keys ending in `_min` against a report that stored the metrics without the suffix, so every lookup returned nothing, every comparison was skipped, and the runner printed "thresholds met" while accuracy was 0.86. A gate that cannot fail is not a gate; it is decoration. It now fails closed: an unknown metric counts as a violation, never as a pass.

**My test fixtures described a world production never sent.** The golden set fed the model a context key — the pending confirmation — that the orchestrator did not actually include. The fixture passed, the suite was green, and in production an employee answering "SÍ" to *"do you confirm you are not coming in?"* got "I don't understand you, could you repeat that?" and their absence was never confirmed. The same thing happened a second time with the list of upcoming shifts, and a third with a withdrawal marker. Your fixtures are a specification: when they drift from what the system really sends, the suite is measuring fiction. I now have a contract test that pins the exact context keys the orchestrator emits.

**The timers never fired in production, and fixing that uncovered a second bug.** Wave timeouts and deadlines lived in an in-memory queue inside one process — and the worker runs twelve. The case was opened in one child, the clock ticked in another with an empty queue, so no rescue ever escalated. Moving the timers into the broker fixed it, and then the escalation failed for a completely different reason: the audit id was composed as `audit_<case>_escalated_<timestamp>_<event>`, 81 characters against a `VARCHAR(64)` column. Every escalation had been rolling back silently. Fixing the thing that hides a bug is how you find the bug.

**A test that passed on my laptop and failed in CI.** Twice. First it read the database URL from the ambient environment instead of its own settings; later, a test enqueued a real task and reached Redis, which exists on my machine and not on the runner. Both times the test was testing my setup, not my code. Unit tests now cannot reach a broker by accident.

## Where it stands

The whole flow runs end to end: absence on WhatsApp → confirmation → eligible candidates → offers → someone accepts → shift covered and rota updated, with escalation and a manager decision when nobody does. It is verified with real phones and a real LLM, not only in tests.

The evaluation that used to lie now measures: ~99% intent accuracy on a 150-message golden set, 1.0 health-detail detection, and fifteen end-to-end scenarios with a simulated clock and simulated employees that must finish with zero invariant violations. 515 backend tests and 199 frontend tests gate every change, and the cost of each model call is tracked — around $0.0002 per interpretation.

The deployment to AWS is written and automated but switched off, because the demo does not need to be online for me to keep learning from it. The code is on GitHub: [aam9063/Shift-Rescue](https://github.com/aam9063/Shift-Rescue).

## What I'd do differently

I would write the evaluation contract before the evaluator. Almost every expensive bug here came from the gap between what I *believed* the system was doing and what it was actually doing at that moment: which context the model received, which process held the timers, which database the test was talking to. Tests that pin the contract — the exact context keys, the exact invariants, the exact status codes — would have caught all of them on the day I wrote them, instead of weeks later when a friend's restaurant was the demo.
