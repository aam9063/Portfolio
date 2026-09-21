---
title: "From a manual YAML chore to a shipped tool: a field note from an industrial client"
summary: "Inside a mission-critical Angular/.NET platform, a recurring internal task was still done by hand-editing YAML. Here's the spike, the case I made to the client, and what actually made it to production."
date: "2026-09-21"
draft: false
featured: true
tags:
- Field Notes
- Angular
- .NET
- Azure DevOps
---

## The problem nobody had time to fix

I work on a mission-critical Angular/.NET platform for an industrial client's innovation division. The platform runs simulations and optimizations for metallurgical model designs, and the results get visualized, shared, and exported by end users.

Buried inside that platform was a smaller, recurring annoyance: a configuration step that ran on hand-edited YAML files. Nothing about it was exotic — it just meant someone opening a file, editing it carefully by hand, and hoping they didn't break the indentation or typo a key. It worked, in the sense that nothing was on fire. But every time it needed to happen, it cost time and carried risk that had nothing to do with the actual engineering problem the platform was built to solve.

It wasn't broken enough to be an incident. It was just annoying enough that everyone noticed it, and quiet enough that it kept getting deprioritized.

## The spike

I picked it up as a spike, not a ticket — I wanted to understand the actual shape of the problem before proposing anything. That meant sitting with how the YAML was structured, who touched it and when, and where in the existing CI/CD pipeline (Azure DevOps) it needed to plug in without disrupting what already worked.

The constraint that mattered most wasn't technical, it was organizational: this is an enterprise platform with real client stakeholders reviewing the work, so whatever I proposed had to fit the existing architecture, not sit beside it as a one-off script nobody would maintain. A tool that only I understood wasn't a solution — it was a liability with my name on it.

## Making the case

Once the spike gave me enough to reason about, I took it to the client directly: here's the manual process today, here's what it costs, here's a guided, validated workflow that replaces the hand-editing with something a non-expert can run correctly. I proposed building it as an integrated feature of the main application rather than a standalone tool, specifically so it would inherit the platform's existing auth, deployment pipeline, and review process instead of needing its own.

That direct-contact loop — proposing, getting pushback, revising — was as much a part of the work as the code. The client's questions shaped the scope as much as the technical constraints did.

## What shipped

I owned the full lifecycle end to end: the spike, the backend, the frontend, and the day-to-day design decisions, with direct client contact throughout rather than working from a spec handed down secondhand. It shipped through the platform's existing Azure DevOps CI/CD, went into production, and replaced the manual YAML editing with a guided workflow.

The part that actually mattered: the client was satisfied enough with it that there are now confirmed plans for similar tools covering other manual tasks in the same application. That's the real signal — not that the tool worked once, but that the client trusted the same approach enough to want it applied elsewhere.

## What I'd do differently

If I started this one again, I'd bring the client into the review loop earlier in the spike, not after I had a shaped proposal. It worked out fine here, but I got lucky that my first framing of the problem matched what the client actually cared about — earlier, rougher check-ins would have de-risked that instead of relying on it going well.
