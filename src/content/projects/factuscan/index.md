---
title: "FactuScan"
summary: "Invoice scanning for a real client: photo in, structured spreadsheet out — built with Claude Vision, shipped in weeks not months."
date: "2026-09-21"
draft: false
caseStudy: true
status: "live"
iconImage: "/img/icon-512.png"
tags:
- React
- Claude Vision
- SheetJS
- Supabase
- FastAPI
---

## Context

A real client was manually re-typing supplier invoices into spreadsheets every week — photos and PDFs coming in from multiple vendors, each with a different layout, all ending up copied by hand into the same Excel template. There was no budget or appetite for a heavyweight OCR/ERP integration; the ask was simple: turn a photo of an invoice into the rows the client already used, without changing how they worked day to day.

## Constraints

- No dedicated backend team on the client side — the tool had to be self-serve for non-technical staff.
- The output had to match an existing spreadsheet format exactly, not a new schema the client would have to adapt to.
- Turnaround mattered more than polish: the client needed something usable in weeks, not a multi-month integration project.
- Invoices arrive as photos from phones, in varying lighting and layouts — no scanner, no consistent template.

## Decisions

The core bet was using **Claude Vision** to read the invoice image directly rather than building or tuning a traditional OCR pipeline — multimodal extraction handled layout variance far better than template-based OCR would have, with much less engineering effort up front.

The frontend is a **React** app: upload or photograph an invoice, see the extracted fields, correct anything before committing. **SheetJS** turns confirmed extractions into the client's existing spreadsheet format so the output slots directly into their current workflow.

The backend started on **Supabase** (Postgres + auth + storage) to move fast during the first working version. As the extraction logic grew — more validation, more control over how the Claude Vision calls were orchestrated and retried — the project moved to a dedicated **FastAPI** service for that layer, keeping Supabase for storage/auth where it was already doing its job well. That split let the extraction pipeline evolve independently from the parts of the stack that didn't need to change.

## How I built it

I worked directly with the client to see the actual invoices and the actual spreadsheet they needed filled in, rather than guessing at a generic schema. The build was iterative and agent-assisted end to end: Claude Code for scaffolding and implementation, fast feedback loops against real sample invoices supplied by the client, and short cycles of "extract → show the client → adjust the prompt/validation → re-test" instead of a long upfront design phase. The migration of the extraction service from Supabase functions to FastAPI happened once the orchestration logic (retries, structured validation of the model's output, error handling for malformed images) outgrew what was comfortable to maintain inside Supabase alone.

## Result

FactuScan is in active use, replacing manual re-typing of supplier invoices with a photo-in, spreadsheet-out flow the client's staff can run themselves. It shipped and reached real usage in a matter of weeks, not months, which was the constraint that mattered most going in.

## What I'd do differently

I'd introduce the FastAPI extraction service earlier instead of starting fully inside Supabase — the migration was manageable, but the orchestration and validation needs were predictable in hindsight, and starting with a clearer separation between storage/auth and the extraction pipeline would have avoided a mid-project restructure.
