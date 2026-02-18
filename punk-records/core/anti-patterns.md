---
title: "Anti-Patterns"
domain: "core"
tags: ["anti-patterns", "avoid", "mistakes", "warnings", "design", "code", "strategy"]
created: "2019-01-01"
updated: "2026-02-17"
---

# Things I Refuse to Build

---

## 1. Generic Corporate Speak

**Pattern:** Using hollow business language that sounds professional but says nothing.

**Examples:**
- "Leverage synergies"
- "Best-in-class solutions"
- "We're passionate about..."
- "Innovative disruption"
- "Customer-centric excellence"

**Why rejected:** It's a mask. It signals that either you have nothing real to say, or you're afraid to say it directly. People tune it out instantly. It's the opposite of authentic storytelling.

**Alternative:** Say the real thing. 'We help you X' not 'We provide X solutions'. 'This solves Y' not 'This leverages Y'.

---

## 2. Stock Photo Aesthetic

**Pattern:** Using generic, polished imagery that could belong to any brand.

**Examples:**
- Smiling diverse team in modern office
- Handshake close-ups
- Abstract geometric shapes
- Generic African safari sunset shots
- Laptop on wooden table with coffee

**Why rejected:** It's visual corporate speak. It says nothing about who you actually are. It makes you invisible because you look like everyone else. Real brands have visual identity rooted in their specific truth.

**Alternative:** Real photos of real context. If you don't have them, commission them. If you can't, use illustration or design that's genuinely yours.

---

## 3. Assuming Reliable Internet

**Pattern:** Building products that require constant connectivity to function.

**Examples:**
- Loading spinners that never resolve
- Features that fail silently offline
- No local data persistence
- Real-time features as primary functionality
- Large asset downloads on every use

**Why rejected:** This excludes most of Tanzania and Africa. It's not just bad UX — it's a statement that these users don't matter. Products should degrade gracefully, not fail completely.

**Alternative:** Offline-first architecture. Local storage. Background sync. Progressive enhancement. Assume disconnection is the default state.

---

## 4. English-Only for African Users

**Pattern:** Building products in English and treating translation as an afterthought.

**Examples:**
- UI labels in English with no localization
- Error messages only in English
- Educational content that assumes English comprehension
- Support documentation in English only

**Why rejected:** Language is not just words — it's worldview. Products built in English and translated to Swahili still think in English. For Tanzanian students, English is often a barrier to learning, not a neutral medium.

**Alternative:** Build Swahili-native. Think in Swahili. Test with Swahili speakers. English as the afterthought, not the other way around.

---

## 5. Promotional Language in Content

**Pattern:** Writing content that sounds like advertising instead of genuine communication.

**Examples:**
- "This amazing product will change your life!"
- "Don't miss out on this incredible deal!"
- "The best [X] you'll ever experience"
- "Limited time offer! Act now!"
- "Experts agree this is revolutionary"

**Why rejected:** It's noise. People scroll past it. It creates distrust because everyone knows you're trying to sell them. Genuine enthusiasm is magnetic — hype is repellent.

**Alternative:** Personal discovery narrative. 'I didn't expect to like this, but...' Share real experience, including doubts. Let the product speak through honest reaction.

---

## 6. Copying Western Playbooks

**Pattern:** Importing Silicon Valley strategies without adapting for African context.

**Examples:**
- Growth hacking tactics that assume cheap advertising
- Freemium models that assume users can upgrade
- Viral mechanics that assume widespread smartphone adoption
- Credit card payment flows in cash-dominant economies
- AWS/cloud-first architecture assuming reliable connectivity

**Why rejected:** Different context, different constraints, different opportunities. What works in San Francisco often fails in Dar es Salaam — not because African markets are 'behind' but because they're different. Blind copying is intellectual laziness.

**Alternative:** Learn the principles, but discover local applications. Mobile money instead of credit cards. WhatsApp instead of email. Offline-first instead of cloud-first. Build for reality.

---

## 7. Building Without a Why

**Pattern:** Starting with features or technology instead of purpose.

**Examples:**
- "Let's build an app that uses AI"
- "We should have a mobile presence"
- "Competitors have this feature, so should we"
- "This technology is trending, let's use it"

**Why rejected:** Technology is a means, not an end. Features without purpose create bloated products. The why is the filter — without it, everything seems like a good idea, and you end up building everything poorly.

**Alternative:** Start with the problem. Who has it? How badly? What would their life look like if it was solved? Then, and only then, ask what to build.

---

## 8. Over-Engineering Simple Problems

**Pattern:** Using complex solutions when simple ones would work.

**Examples:**
- Microservices for a simple CRUD app
- Custom authentication when OAuth works fine
- Complex state management for basic forms
- Building infrastructure instead of using existing services

**Why rejected:** Complexity is debt. Every abstraction layer is maintenance burden. Build the simplest thing that solves the problem. Optimize when you have evidence it's needed, not before.

**Alternative:** Start simple. Add complexity only when the simple solution demonstrably fails. 'Will this matter at 10x scale?' If you're not at 1x yet, it doesn't matter.

---

## 9. Building Identities for Uncommitted Clients

**Pattern:** Continuing brand work when the client won't collaborate on their own identity.

**Examples:**
- Client expects a logo and color palette handed to them like a takeout order
- Client can't commit to the discovery process or defined scope
- Client doesn't understand that brand identity requires their participation
- Client treats branding as decoration, not strategy
- Client won't cooperate within defined project scope

**Why rejected:** Real brand identities are built, not handed over. They require the client to show up — to answer hard questions about who they are, what they stand for, and why they exist. A brand built without the client's soul in it is staged, not real. If a client can't or won't cooperate, the output will be hollow regardless of how good the design is.

**Case:** Makando Travel — terminated because the client didn't understand the depth of the work. Couldn't commit, couldn't cooperate within scope. The right call was to walk away.

**Alternative:** Set clear expectations upfront about the collaborative nature of the process. If a client can't meet that bar, terminate early. Better no project than a fake one. The work demands investment from both sides.
