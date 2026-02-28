---
title: "pulse Lessons"
domain: "memory"
tags: ["pulse", "lessons"]
auto_generated: true
updated: "2026-02-28"
---

# pulse — Lessons Learned

*Auto-maintained from session timeline. Non-obvious discoveries and mistakes that taught something.*

---

### 2026-02-26 — LLM prompts that say 'consider' or 'if available, lead with' produce inconsistent output. The model treats suggestions as optional. Decision trees (IF X → MUST do Y, ELSE → MUST do Z) produce consistently strong output. Same principle applies to quality gates: deterministic checks (word in banned list? reject) are more reliable than asking an LLM to score how well an email avoids generic language.

**Context:** Discovered during audit that generator prompt gave 3 conflicting opening strategies as suggestions. LLM picked randomly, producing high variance. Decision tree eliminated variance.

---

### 2026-02-26 — Feedback loops in autonomous systems need wiring verification at BOTH ends. Pulse had sophisticated functions for recording angles tried and processing reply insights, but neither was called from the delivery pipeline. The functions existed, had tests in concept, but the call sites were missing. Always trace data flow from trigger to storage to retrieval — if any link is missing, the intelligence doesn't compound.

---

### 2026-02-27 — Follow-up email system is NOT dumb — it's surprisingly intelligent but with critical blind spots

**What works:** Generates context-aware follow-ups using buildWorldContext (industry, market, prospect intelligence), checks angles_tried to avoid repeating angles, goes through full critique loop (gates + LLM scoring), uses getGraphExpertise for diagnosed patterns, uses exemplars with proper weighting, sequence_position correctly tracked at positions 2 and 3

**Gap:** Follow-up prompt is STATIC — doesn't use selectAngle() for position 2-3. Reuses same opening structure every time regardless of prospect receptivity. Doesn't access the original email's angle to deliberately pick a different one. Door close (position 3) has NO special handling beyond word count. No knowledge of what specifically failed in the previous email. No retry loop like synthesizeWithCritique — generateFollowUp runs once, no gate failures trigger retrys. Prompt doesn't reference prospect's emotional_state or reply sentiment from interactions. No pattern weighting based on what worked previously.

---

### 2026-02-27 — Traced complete research→empathy→synthesis pipeline. When data is thin, empathy model produces deterministic but hollow outputs with low readiness scores rather than useful narratives.

**Gap:** Empathy model can produce empty shells with sparse data. All inference functions have fallback defaults and no minimum data threshold. When deepResearch returns empty/failed, customer_sentiment defaults to empty arrays. No reviews → readiness_score floors at 0.3. No social presence → channel_presence returns empty object. No competitors → competitive_pressure defaults to 'low'. Few pages scraped → brand_maturity set to 'nascent'. Email synthesis receives weak context that doesn't surface prospect's real situation.

---

