---
name: conversion-call-research
description: >
  Use this skill when the user wants to understand why users are not converting on a page, feature, or flow in their product. Triggers include: "my conversion page isn't working", "users are dropping off", "people aren't converting", "why aren't users signing up/paying/completing", "I want to call users who didn't convert", "user interview playbook for conversion", "drop-off research", or any request to investigate conversion problems through user calls or interviews. This skill walks through app understanding → call playbook generation → Google Sheet format → data analysis and fix recommendations. Use it even if the user only mentions one part of this flow (e.g. just wants a call script, or just wants to analyze collected data).
---

# Conversion Call Research Skill

A structured research workflow to understand why users who reached a conversion page didn't convert — through real user calls, tracked data, and actionable product fixes.

---

## Overview

This skill has **4 phases**:

1. **Understand** — Learn the app and conversion page
2. **Playbook** — Generate a tailored user call script
3. **Sheet** — Provide a Google Sheet structure to log calls
4. **Analyze** — After calls are done, identify top reasons and fixes

Determine which phase the user is in and jump straight to it. If they're starting fresh, begin with Phase 1.

---

## Phase 1: Understand the App & Conversion Page

Ask the user these questions (all at once, in a single message — don't split into multiple turns):

```
To build you a sharp call playbook, I need to understand your product and the page.

1. What does your app do? (one sentence is fine)
2. What is the conversion action on this page? (e.g. pay, sign up, start trial, book a demo, submit a form)
3. What does a user have to do BEFORE they land on this page? (e.g. fill a form, watch a video, complete onboarding)
4. What does the page currently show? (describe or paste the copy/layout, or share a screenshot)
5. What do you already suspect might be causing drop-off? (optional but helpful)
6. What is the user segment that reaches this page? (e.g. free users, paid leads, cold traffic)
7. How many users are you planning to call? (helps calibrate how deep the playbook should go)
```

Wait for answers before proceeding.

---

## Phase 2: Generate the Call Playbook

Once you understand the product, generate a **complete call playbook** structured as follows:

### 2a. Call Prep Sheet

```
CALL PREP — [Product Name] Conversion Research

Goal: Identify the top 3 reasons [user segment] who reached [page name] did NOT [conversion action].

Who to call: Users who visited [conversion page URL/step] in the last [7–30 days] but did NOT complete [conversion action].

Ideal sample size: 8–15 users (diminishing returns after that)
Call duration: 15–20 minutes
Tone: Curious, non-defensive. You're here to learn, not to pitch.
```

### 2b. Opening Script

Write a natural, non-salesy opening the user can adapt. Should:
- Establish that you're NOT trying to sell them anything
- Make it clear this is a research call to improve the product
- Be warm, brief (under 60 seconds)
- Thank them for their time upfront

Example structure:
```
"Hi [Name], this is [Caller] from [Company]. 

I'm reaching out because you recently checked out [page/feature] but didn't [take the action]. I'm NOT calling to sell you anything — I'm doing a 15-minute research call to understand what got in the way. Your honest feedback directly shapes how we improve the product.

Does now work, or is there a better time?"
```

### 2c. Core Interview Questions

Generate 10–14 questions tailored to the specific conversion action and page. Organize them in this order:

**Section 1: Context & Motivation (understand why they came)**
- What were they trying to accomplish?
- What made them look at this option?
- Were they evaluating alternatives?

**Section 2: The Page Experience (what happened on the page)**
- Walk me through what you saw on the page
- What stood out? What was confusing?
- Was there anything missing that would have helped you decide?
- What would have made it an easy yes?

**Section 3: The Drop-off Moment (the actual reason)**
- What was going through your mind right before you left?
- Was there a specific thing that stopped you?
- Did you have a question that wasn't answered?
- Did you feel like you needed more time / more info / to talk to someone?

**Section 4: Alternatives & Comparisons**
- Did you end up doing something else instead? What?
- Have you used a similar product before? How did this compare?

**Section 5: Close**
- If you could change one thing about the page, what would it be?
- Is there anything I haven't asked that you think is important?
- Would you be open to us reaching back out once we've made improvements?

> **Probing tip**: After any answer, follow with: "Can you tell me more about that?" or "What specifically do you mean by [X]?" Don't accept one-word answers.

### 2d. What to Listen For

Tell the user what patterns to flag during calls:

- **Pricing confusion**: They didn't understand what they'd be paying or for what
- **Trust gap**: They weren't sure if the product/company was legit
- **Feature mismatch**: They wanted something that wasn't there or wasn't clear
- **Timing objection**: Right product, wrong time — need to ask what would change that
- **Process friction**: Form too long, signup too complex, required info they didn't have
- **Competitor preference**: They went elsewhere — find out why the other option won
- **Unclear value**: They didn't understand what they'd get out of it
- **Decision not theirs**: They needed approval from someone else

---

## Phase 3: Google Sheet Format

Provide this exact structure for a Google Sheet to track every call.

### Sheet 1: Call Log

| Column | Field | Notes |
|--------|-------|-------|
| A | Call # | Auto number |
| B | User Name | First name or pseudonym |
| C | Date Called | MM/DD/YYYY |
| D | Call Duration (mins) | |
| E | User Segment | e.g. free, paid, lead type |
| F | Primary Drop-off Reason | One sentence — the main reason |
| G | Secondary Reason | If mentioned |
| H | Confusion Points | What they didn't understand |
| I | Missing Info / Features | What they needed that wasn't there |
| J | Trust/Credibility Issues | Anything that made them hesitant |
| K | Pricing Reaction | What they said about pricing |
| L | What Would Have Converted Them | Their own words |
| M | Competitor / Alternative Mentioned | |
| N | Sentiment Score | 1–5 (1=very negative, 5=very positive) |
| O | Follow-up Needed? | Yes / No |
| P | Raw Notes | Full unedited notes from call |

### Sheet 2: Reason Tally

A simple pivot to tally reasons as you go:

| Reason Category | Tally | Count | % of Calls |
|----------------|-------|-------|------------|
| Pricing confusion | | | |
| Trust gap | | | |
| Feature mismatch | | | |
| Timing objection | | | |
| Process friction | | | |
| Competitor preference | | | |
| Unclear value | | | |
| Decision not theirs | | | |
| Other | | | |

### Sheet 3: Verbatim Quotes

| Call # | Quote | Theme Tag |

> **Tip**: After each call, immediately fill in Sheet 1 while it's fresh. Update Sheet 2 tallies in real time. Paste standout quotes into Sheet 3 — these become your most persuasive evidence for what to fix.

---

## Phase 4: Analyze Call Data

When the user returns with completed call data (paste from sheet or describe findings), do the following:

### Step 1: Identify Top 3 Reasons

Count frequency of each reason category. Rank by prevalence. Write:

```
TOP 3 REASONS [users] DID NOT CONVERT ON [PAGE]:

#1 — [Reason] (X/Y calls, Z%)
Summary: [2–3 sentence synthesis of what users said]
Key quote: "[most representative verbatim quote]"

#2 — [Reason] (X/Y calls, Z%)
...

#3 — [Reason] (X/Y calls, Z%)
...
```

### Step 2: Page Fix Recommendations

For each top reason, generate specific, actionable fixes:

```
FIX RECOMMENDATIONS

For Reason #1 — [Reason]:
- Immediate (low effort): [specific copy/UI/UX change]
- Medium term: [feature or flow change]
- Test idea: [A/B test hypothesis to validate the fix]

For Reason #2...
For Reason #3...
```

### Step 3: Prioritization Matrix

Output a simple 2x2 (impact vs effort) recommendation:

```
DO FIRST (high impact, low effort):
- [specific fix]

SCHEDULE (high impact, higher effort):
- [specific fix]

QUICK WINS (low effort, lower impact):
- [specific fix]

DEPRIORITIZE:
- [specific fix]
```

### Step 4: What to Track After Fixes

Tell the user exactly which metrics to watch to know if the fixes worked:
- Primary: conversion rate on this specific page
- Secondary: time-on-page, scroll depth, specific click events
- Qualitative: repeat user calls 30 days after fixes ship

---

## Tone & Principles Throughout

- **Be specific to their product** — never give generic advice. Use the page copy, flow, and segment they described.
- **Prioritize the user's own words** — the best insights come from verbatim quotes, not paraphrased patterns.
- **Don't over-engineer** — 8–12 calls is usually enough to identify the top 3 reasons. Discourage over-sampling.
- **Remind them this is qualitative** — call data identifies *why*, not *how widespread*. Quantitative data (analytics) shows *how widespread*.