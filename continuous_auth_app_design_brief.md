
---
title: "App and Data Extraction Design Brief"
subtitle: "Continuous Authentication Using Behavioural Biometrics"
author: "Design + data collection specification"
date: "2026-05-28"
geometry: margin=0.72in
fontsize: 10pt
mainfont: DejaVu Sans
monofont: DejaVu Sans Mono
colorlinks: true
---

# 1. Purpose

This document specifies the next redesign of the data collection app for **continuous authentication using behavioural biometrics**. The app should no longer feel like a sequence of research tasks. It should feel like a polished, Monzo-inspired banking app that quietly produces rich behavioural data while the user completes realistic banking actions.

The app should support repeated sessions, because the target data collection process depends on users completing several sessions over time. A good session should take roughly **3 minutes**, with enough interaction to produce continuous-authentication windows but not so much friction that repeat completion becomes annoying.

The key principle is:

> The participant should feel like they are using a real banking app. The researcher should still receive clean, labelled, privacy-preserving behavioural telemetry.

# 2. Design target

## 2.1 Visual target

The visual direction should be **Monzo-inspired**, without copying Monzo branding directly. The interface should be friendly, colourful, card-based, simple, and highly legible on mobile.

The app should use:

- A light or warm off-white background, not a heavy dark dashboard.
- Bright accent colours, especially coral, pink, teal, yellow, and blue.
- Rounded cards with soft shadows and strong spacing.
- Friendly emoji-style icons for quick recognition.
- Minimal explanatory text on app screens.
- Simple headings, plain English, and obvious primary actions.

Avoid a dark "cybersecurity dashboard" feel. The project is about authentication, but the app should look like a consumer fintech product.

## 2.2 Name and framing

The project/app should be referred to as:

**Continuous Authentication Using Behavioural Biometrics**

Within the app UI, the product can use a short banking-style brand such as **Pulse** or **Pulse Bank**, but the document title and research framing should use the full project name above.

## 2.3 User-facing language

The app itself should avoid research language during the flow. Do not show terms like:

- behavioural biometrics
- event logging
- extracted features
- task evidence
- signal capture
- experiment task

Those terms belong in the consent/info page and technical documentation, not the app flow. During the banking flow, the user should only see realistic banking language, such as:

- Check your balance
- Search your transactions
- Open the PureGym payment
- Categorise this payment
- Add the suggested note
- Review your spending insight
- Reply to secure message
- Confirm review

# 3. High-level product structure

The app should be structured like a real banking app with persistent navigation.

## 3.1 Main bottom navigation

The bottom navigation should be visible throughout the main app, except on the initial consent page, secure passcode screen, and final completion screen.

Recommended tabs:

| Tab | Purpose | Behavioural value |
|---|---|---|
| Home | Account overview, balance cards, pots | tapping, reading pauses, first interaction rhythm |
| Activity | Transaction search and scrollable payment history | typing, scrolling, transaction selection |
| Pots | Savings pots and transfer task | tapping, amount entry, controlled decision flow |
| Insights | Spending cards, alerts, notifications | card review, comprehension, tap timing |
| Secure | Secure message / approval flow | guided typing, approval decision |

If five tabs are too crowded on mobile, use four:

| Home | Activity | Insights | Secure |

and place Pots inside the Home screen.

## 3.2 Guided flow inside app navigation

The user should not freely wander with no instruction. Instead, the app should run a guided review that moves through normal banking screens. The navigation should make the user feel like they are moving through an app, not through survey pages.

Recommended pattern:

1. Consent/info page.
2. Context page.
3. Passcode unlock.
4. Home dashboard.
5. Activity/search.
6. Transaction detail.
7. Pots/transfer or savings check.
8. Insights/notifications.
9. Secure message.
10. Completion.

The app should show subtle progress, but not as "Task 3/10". Use language such as:

- Secure review - Activity
- Review step 3 of 9
- Almost done
- Final check

# 4. Consent and context pages

## 4.1 Consent/info page

The app must include a consent/info screen before the banking UI, similar in principle to Prototype 1. This screen is where research language belongs.

Required consent/info content:

- This is a research prototype for continuous authentication using behavioural biometrics.
- The app records interaction timing and device/browser interaction data.
- It records things like taps, scrolling, typing timing, pointer/touch movement, motion/orientation where available, and task completion events.
- It does **not** store raw typed text.
- It does **not** collect geolocation.
- It uses an anonymous participant ID assigned automatically to this browser/device.
- The participant can stop at any time.

The consent page should have a clear primary button:

**I understand - continue**

## 4.2 Context page

The context page should appear before the banking app begins, also following the Prototype 1 style. It should be quick and consistent across repeated sessions.

Required fields:

| Field | Options |
|---|---|
| Posture | Sitting, standing, walking/moving |
| Hand use | Two-handed, one-handed right, one-handed left |
| Dominant hand | Right, left, ambidextrous |
| Environment | Quiet, normal, noisy, moving/travelling |
| Focus | Focused, neutral, distracted |
| Tiredness | Not tired, slightly tired, tired |

Participant ID must be assigned automatically. Do not use a manual participant ID field.

## 4.3 Participant identity

Use the working Prototype 1 identity model:

- `participantId` stored in localStorage.
- `sessionCount` stored in localStorage.
- New browsers/devices receive new participant IDs.
- Same browser/device keeps the same participant ID across repeated sessions.
- Each new session increments session count.

Example:

```json
{
  "participantId": "pG5G4MS",
  "sessionIndex": 24
}
```

# 5. Target session length and repeated use

## 5.1 Target duration

The target session duration should be roughly **3 minutes**.

Acceptable range:

- Minimum useful duration: 90 seconds
- Target: 150-210 seconds
- Upper limit before it feels too long: 4 minutes

A 45-second run is too short. It proves the app works, but it does not provide enough sustained continuous-authentication evidence.

## 5.2 Repetition expectation

Expected participant repeat count: **3-4 sessions on average**, with the possibility of more if the flow is pleasant.

The design must therefore rotate content while preserving the same behavioural structure.

Rotating content should include:

- Target merchant
- Transaction amount
- Category
- Payment note text
- Secure message reply
- Insight cards
- Notification content
- Pot names and transfer prompts

The task structure stays stable; the content changes.

# 6. Core interaction principles

## 6.1 Tap-first, gesture-optional

Do not require swipe or drag. Earlier testing showed that swipe/drag interactions felt unreliable on mobile. The app should be tap-first so that every user can complete every session smoothly.

However, the app should still log pointer/touch movement in the background. If a user naturally swipes, scrolls, drags, or moves their finger between taps, those signals can still be captured.

## 6.2 No vague writing prompts

Never ask the user to invent a note on the spot. The app should always provide an answer or a specific text to copy.

Bad:

> Add a short note.

Good:

> Copy this note: monthly membership

Good:

> Answer: PureGym was £14.70 last month. Type `14.70`.

Good:

> Rename this activity to: gym membership

This creates controlled, comparable typing without confusing the participant.

## 6.3 Raw text must not be stored

The app should allow typing but must never store raw typed content. Store only privacy-safe typing metadata:

- key class, not key value
- value length
- delta length
- input type
- timing
- focus and blur events
- correction/backspace count
- selection range if useful

Do not store:

- typed phrases
- notes
- replies
- search strings as user-entered raw text
- geolocation

The expected prompt text can be stored as generated task content, because it is not private user text and is known by the app.

# 7. Final task flow

The session should contain 9-11 guided banking actions. The recommended version is 10 actions.

## 7.1 Task list

| Step | App area | User-facing action | Main behavioural signal |
|---:|---|---|---|
| 1 | Secure | Type displayed passcode | controlled tap/typing timing |
| 2 | Home | Check account balance | reading pause, taps, first navigation |
| 3 | Activity | Search payment history | typing rhythm |
| 4 | Activity | Scroll recent transactions | scroll dynamics, tap selection |
| 5 | Transaction detail | Open and categorise payment | decision pause, tap coordinates |
| 6 | Transaction detail | Add/copy payment note | guided typing rhythm |
| 7 | Pots | Move/check savings pot | tap sequence, optional numeric input |
| 8 | Insights | Review Monzo-like insights/notifications | tap timing, comprehension |
| 9 | Secure | Approve payment or reply to secure message | decision + guided typing |
| 10 | Finish | Confirm session feeling | final tap, completion metadata |

Each task must be mandatory for data quality, but validation messages should feel natural.

Bad validation:

> Missing task evidence.

Good validation:

> Tap the PureGym payment to continue.

Good validation:

> Type the displayed passcode first.

# 8. Screen-by-screen design specification

## 8.1 Consent screen

Purpose: explain research data collection once, before the app starts.

Visual design:

- Clean white/off-white page.
- Friendly card layout.
- Project title: Continuous Authentication Using Behavioural Biometrics.
- Three privacy cards: What is collected, what is not collected, what the user does.
- Primary button at bottom.

Wireframe:

```text
[Project title]
Continuous Authentication Using Behavioural Biometrics

[Info card]
This research prototype records interaction timing, taps,
scrolling, typing rhythm and device motion where available.

[Privacy card]
Does not store raw typed text or geolocation.

[Button]
I understand - continue
```

## 8.2 Context screen

Purpose: collect short session state before the app begins.

Visual design:

- Same clean style as consent.
- Automatic participant ID shown as small non-editable pill.
- Context options as large segmented controls or rounded dropdown cards.
- Do not make it feel like a long form.

Wireframe:

```text
[Anonymous ID]
pG5G4MS

How are you using the app?
[ Sitting ] [ Standing ] [ Moving ]

Hand use
[ Two-handed ] [ Right ] [ Left ]

[Continue]
```

## 8.3 Passcode unlock

Purpose: generate controlled authentication-like behaviour and give a realistic app entry point.

User-facing prompt:

> Enter this demo passcode: 4826

The passcode should be displayed clearly. The user copies it using an on-screen numeric keypad or input field.

Recommended behaviour:

- Show four large passcode dots.
- Show displayed passcode above keypad.
- User taps digits on a custom keypad.
- No real authentication.
- Log tap coordinates and timing.
- Continue only after correct four digits are tapped.

Wireframe:

```text
Secure login
Enter demo passcode

Passcode to copy: 4826

[ . . . . ]

[1] [2] [3]
[4] [5] [6]
[7] [8] [9]
    [0]
```

Behavioural signals:

- digit tap latency
- inter-tap timing
- tap coordinates
- correction if clear/backspace included
- phone motion while entering passcode

## 8.4 Home dashboard

Purpose: make the app feel like a real banking product and create reading/tap behaviour.

Visual design:

- Monzo-style account card at top.
- Current account balance.
- Savings pots preview.
- Recent spending preview.
- Bottom nav visible.

User task:

> Check your Current Account balance and tap the account card.

Optional comprehension-style variant:

> What is the Current Account balance? Type the amount shown.

This produces useful typing but may feel more like a quiz. Use it sparingly.

Wireframe:

```text
Home
Good afternoon

[Current account]
£1,284.20

[Pots]
Holiday £420   Emergency £950

[Button/card]
Current account
```

Behavioural signals:

- first navigation timing
- reading pause before tap
- tap coordinates
- pointer/touch movement
- motion/orientation

## 8.5 Activity search

Purpose: produce controlled typing and a realistic transaction search.

User-facing prompt examples:

- Search payment history for: PureGym
- Search payment history for: Trainline
- Search payment history for: Spotify

The search term should be displayed above the search bar. The user types it. Do not store the raw text.

Wireframe:

```text
Activity
Search payment history

Find: PureGym
[ Search transactions... ]

Recent transactions
```

Behavioural signals:

- keydown/keyup timing
- beforeinput/input timing
- valueLength and deltaLength
- pause before first key
- correction/backspace behaviour
- focus/blur behaviour
- keyboard viewport resize on mobile

## 8.6 Activity transaction feed

Purpose: produce scroll behaviour and target selection.

User task:

> Find the PureGym payment from last month and tap it.

The transaction list should be long enough to require scrolling. It should contain realistic entries, dates, and amounts.

Example feed:

| Merchant | Amount | Date |
|---|---:|---|
| Tesco | £5.96 | Today |
| Pret | £6.19 | Yesterday |
| PureGym | £14.70 | Last month |
| Trainline | £25.17 | Last month |
| Spotify | £12.40 | Last month |

Wireframe:

```text
Activity
Find: PureGym last month

[Search bar]

Today
Tesco      £5.96
Pret       £6.19

Last month
PureGym    £14.70
Trainline  £25.17
Spotify    £12.40
```

Behavioural signals:

- scrollTop over time
- scroll velocity and acceleration
- scroll pauses/read time
- tap after scroll
- transaction selection latency
- x/y touch path

## 8.7 Transaction detail and categorisation

Purpose: generate decision behaviour and category taps.

User task:

> Categorise the PureGym payment as Fitness.

The correct category should be obvious from the prompt, not a guessing task.

Wireframe:

```text
PureGym
£14.70
Last month - Card payment

Choose category
[Travel] [Food]
[Fitness] [Subscription]
[Shopping] [Other]
```

Behavioural signals:

- decision pause
- category tap timing
- x/y tap coordinates
- hesitation or correction if changed

## 8.8 Guided payment note

Purpose: generate a controlled, realistic typing sample.

User task examples:

- Copy this note: monthly membership
- Rename this activity to: gym membership
- Add payment note: train to Manchester
- Add payment note: music subscription

The note should be displayed above the input, not just hidden in placeholder text. Placeholder can repeat it.

Wireframe:

```text
Add note
Copy this note:
monthly membership

[ monthly membership ]
```

Behavioural signals:

- sustained typing rhythm
- correction behaviour
- pauses and bursts
- input length growth
- keyboard open/close viewport changes

## 8.9 Pots / savings task

Purpose: add a Monzo-like interaction and a second navigation mode.

Possible tasks:

1. Move £5 to Travel Pot.
2. Open Holiday Pot and check balance.
3. Set a savings target to £500.

Recommended first version:

> Move £5 to Travel Pot.

Show amount to copy, not a free-form decision.

Wireframe:

```text
Pots
Travel Pot       £186.45
Holiday Pot      £420.00
Emergency Pot    £950.00

Move to Travel Pot
Amount to enter: 5
[ £ 5 ]
[Move money]
```

Behavioural signals:

- tab navigation
- numeric input/tap timing
- amount field focus
- confirm button tap
- reading pause

## 8.10 Insights / notification review

Purpose: produce comprehension/detective-style behaviour without vague typing.

Tasks should feel like checking fake banking notifications.

Example prompts:

- Check notifications: which bill is due tomorrow?
- Review insights: which category increased this week?
- Tap the insight about subscriptions.
- Find the alert about travel spending.

Monzo-like insight cards:

- Subscriptions: Spotify and iCloud renew this week.
- Travel: Trainline spending is up this month.
- Food & coffee: small purchases total £42 this week.
- Upcoming bill: phone bill due tomorrow.

Wireframe:

```text
Insights

[Subscriptions]
Spotify and iCloud renew this week

[Travel]
Trainline spending is up this month

[Upcoming bill]
Phone bill due tomorrow
```

Behavioural signals:

- card reading time
- card tap order
- comprehension selection
- scroll if insight list is long
- pointer/touch movement between cards

## 8.11 Secure approval / message reply

Purpose: generate a realistic security decision and a longer guided typing sample.

Two possible subtasks:

### Option A: Approve payment

> Approve payment to Nottingham Coffee for £4.80.

Buttons:

- Approve
- Decline

### Option B: Reply to secure message

> Secure message: Should we save this PureGym note?
> Copy reply: Yes, please save this as fitness.

Input field:

```text
Yes, please save this as fitness.
```

Recommended: include both across rotating sessions, or include approval plus reply in the same secure tab if session duration allows.

Behavioural signals:

- decision timing
- approve/decline tap coordinates
- guided sentence typing rhythm
- pause before typing
- correction/backspace behaviour

## 8.12 Completion screen

Purpose: close the session, collect simple context, and handle upload/download mode.

User-facing prompt:

> How did this review feel?

Options:

- Easy
- Normal
- Distracted
- Rushed

Modes:

| Mode | Completion behaviour |
|---|---|
| Debug mode | Show Download JSON button |
| Participant mode | Upload automatically, show thank-you screen |

Wireframe:

```text
Review complete
How did this feel?
[Easy] [Normal] [Distracted] [Rushed]

Debug mode:
[Download JSON]

Participant mode:
Thanks - your session has been uploaded.
```

# 9. Content randomisation

The app should rotate content across sessions to reduce monotony while keeping the structure stable.

## 9.1 Rotating merchant examples

| Merchant | Category | Note | Reply |
|---|---|---|---|
| PureGym | Fitness | monthly membership | Yes, please save this as fitness. |
| Trainline | Travel | train to Manchester | Yes, please add this to travel. |
| Spotify | Subscription | music subscription | Yes, please keep this reminder. |
| Pret | Food | lunch near campus | Yes, please mark this as food. |
| Uber | Travel | ride to station | Yes, please tag this as travel. |
| Boots | Health | pharmacy purchase | Yes, please save the receipt. |
| Tesco | Groceries | weekly groceries | Yes, please mark as groceries. |
| Apple | Subscription | icloud storage | Yes, please keep this subscription. |

## 9.2 Rotating detective-style prompts

Use direct answerable prompts, not open-ended questions.

Examples:

- Search payment history for PureGym. How much was it last month? Type `14.70`.
- Find Trainline in payment history and open it.
- Which bill is due tomorrow? Tap `Phone bill`.
- Rename the activity to `gym membership`.
- Move `5` to Travel Pot.
- Reply with `Yes, please save this as fitness.`

These tasks create comprehension, searching, scrolling, tapping, and typing while avoiding participant uncertainty.

# 10. Navigation and screen behaviour

## 10.1 Bottom nav requirements

The bottom navigation must feel native to the banking app.

Recommended labels and icons:

| Tab | Icon style | Main content |
|---|---|---|
| Home | house emoji-style icon | balances, cards, pots preview |
| Activity | card/list emoji-style icon | search, transaction feed |
| Pots | jar/pot emoji-style icon | savings pots and transfer task |
| Insights | chart/bulb emoji-style icon | insight cards and notifications |
| Secure | lock emoji-style icon | approval and secure message |

Use emoji-style icons or simple rounded line icons. If using real emoji, ensure they render consistently on iOS and desktop. If using SVG, keep the style playful and friendly.

## 10.2 Guided route

The app may allow tapping bottom nav, but the guided review should direct the user clearly.

Example route:

1. Unlock directs to Home.
2. Home CTA directs to Activity.
3. Activity transaction opens detail.
4. Detail categorisation opens note field.
5. Continue directs to Pots.
6. Pots continue directs to Insights.
7. Insights continue directs to Secure.
8. Secure continue directs to Completion.

## 10.3 Continue button behaviour

Use Continue where it feels natural:

- after typing passcode
- after account check
- after guided note
- after insights reviewed
- after secure reply

Auto-navigate where it feels app-native:

- tapping a transaction opens detail
- tapping a bottom nav tab changes section
- selecting a category highlights it immediately
- choosing an insight marks it as reviewed

# 11. Behavioural signals by task

| Task | Required user action | Primary signals | Secondary signals |
|---|---|---|---|
| Consent/context | select options | tap timing, form interaction | initial device context |
| Passcode | copy displayed digits | tap rhythm, coordinates | correction behaviour, motion |
| Home balance | tap account/pot | reading pause, tap | pointer/touch path |
| Search history | type merchant/amount | typing rhythm | viewport resize, focus/blur |
| Transaction feed | scroll and tap target | scroll dynamics | tap after scroll, path |
| Categorise | choose category | decision pause, tap | correction if changed |
| Payment note | copy provided note | guided typing rhythm | backspace/correction |
| Pots | numeric entry/tap transfer | numeric input timing | confirm tap, navigation |
| Insights | tap correct cards | reading pause, card order | scroll/touch movement |
| Secure approval | approve/reply | decision + typing | hesitation, corrections |
| Finish | choose feeling | final tap | session completion state |

# 12. Raw event logging specification

Each raw event should include stable common metadata.

```json
{
  "kind": "input",
  "tRelMs": 12450,
  "timestampIso": "2026-05-28T15:38:12.000Z",
  "taskId": "search_transaction",
  "taskIndex": 2,
  "screenId": "activity_search",
  "componentId": "search_input",
  "payload": {}
}
```

Required top-level fields:

| Field | Purpose |
|---|---|
| kind | event type |
| tRelMs | relative time since session start |
| timestampIso | wall-clock timestamp |
| taskId | current guided action |
| taskIndex | current guided action index |
| screenId | current UI screen |
| componentId | UI component involved |
| payload | event-specific fields |

## 12.1 Required event families

The signal extraction lab showed the app should preserve the following browser signal families:

- pointer/touch movement
- taps/pointerdown/pointerup
- typing/input timing
- scroll dynamics
- motion/orientation
- visual viewport changes
- task transitions
- focus/blur events
- optional gesture summaries

The signal audit logger explicitly tracked fields such as x/y movement, dx/dy, distance, duration, path length, speed, straightness, direction, pressure/contact fields, scrollTop/scrollLeft, valueLength, selection ranges, orientation alpha/beta/gamma, acceleration, rotation, and viewport size/scale. The feature extractor then converted these into task-agnostic behavioural features over rolling windows.

## 12.2 Event types to log

| Event type | Required fields |
|---|---|
| session_start/session_complete | participantId, sessionIndex, appVersion |
| task_start/task_end | taskId, taskType, evidence summary |
| pointerdown/pointerup | x, y, xNorm, yNorm, pointerType, pressure, componentId |
| pointermove | throttled x/y, pointerType, componentId |
| scroll | scrollTop, scrollLeft, scrollHeight, clientHeight |
| keydown/keyup | keyClass, repeat, valueLength |
| beforeinput/input | inputType, dataLength, valueLength, deltaLength |
| focus/blur | componentId, valueLength on blur |
| devicemotion | acceleration, accelerationIncludingGravity, rotationRate |
| deviceorientation | alpha, beta, gamma, absolute |
| visual viewport | width, height, scale, offset if available |
| category/transaction/action selected | selected label, expected label if applicable |

## 12.3 Throttling requirements

High-frequency events must be throttled to avoid huge files.

| Event family | Recommended throttle |
|---|---:|
| pointermove/touchmove | 16 ms |
| scroll | 30 ms |
| devicemotion | 50 ms |
| deviceorientation | 50 ms |
| visual viewport scroll/resize | 33-50 ms |

# 13. Privacy and safety requirements

The app must preserve privacy by design.

## 13.1 Never store raw typed text

Do not store:

- search text as typed by the user
- payment notes as typed by the user
- secure replies as typed by the user
- free text fields

Allowed:

- task prompt text generated by the app
- expected answer text generated by the app
- input length
- key class
- delta length
- correction count
- timing

## 13.2 No geolocation

Geolocation should not be requested or stored.

## 13.3 No real financial data

All banking data must be fake and generated by the app. The UI may look realistic, but it must never ask for real banking information.

## 13.4 Debug versus participant mode

| Mode | Behaviour |
|---|---|
| Debug | Download JSON locally at completion |
| Participant | Upload JSON and show thank-you screen |

Debug mode is for development. Participant mode should hide raw export details.

# 14. Data extraction design

## 14.1 Windowing

Use continuous-authentication style rolling windows:

- Window length: **7.5 seconds**
- Step size: **2.5 seconds**

For a 3-minute session, this produces approximately:

```text
(180 - 7.5) / 2.5 + 1 = 70 windows
```

This is much richer than a short single-window task and closer to how continuous authentication would operate.

## 14.2 Feature design principle

Features should describe **how** the user interacts, not the content of the task.

Do not train models on:

- merchant name
- raw typed phrase
- exact category label
- exact note/reply content
- generated prompt text

Use these fields for routing, labels, support flags, or audit only.

## 14.3 Feature families

| Feature family | Examples |
|---|---|
| Rhythm | event count, events per second, inter-event mean/median/std/p95, pauses, bursts |
| Typing | keydown/up timing, input deltas, correction rate, pause count, focus latency |
| Pointer/touch movement | speed, acceleration, jerk, path length, displacement, angle change, entropy |
| Scroll | scroll velocity, acceleration, total distance, pauses, direction changes |
| Tap/decision | reaction time, tap coordinates, repeat taps, time-to-select |
| Motion | acceleration magnitude, rotation magnitude, stillness ratio, motion energy |
| Orientation | alpha/beta/gamma drift, tilt magnitude, orientation change rate |
| Viewport/context | keyboard open resize, viewport height changes, device family |
| Support flags | has_keyboard, has_scroll, has_motion, n_pointer_events, missingness indicators |

## 14.4 Feature groups inspired by signal extraction lab

The signal extraction lab should inform the extraction pipeline. The app should preserve enough events to support:

### Rhythm / burst features

- `event_count`
- `events_per_second`
- `inter_event_ms_mean/median/std/p95/iqr`
- `pause_count`
- `long_pause_count`
- `active_time_ratio`
- `idle_time_ratio`
- `interaction_burst_count`
- `interaction_burst_size_mean/max`

### Movement features

- movement event rate
- normalised speed statistics
- acceleration statistics
- jerk statistics
- step distance statistics
- angle change statistics
- angle entropy
- total distance
- displacement
- path efficiency
- direction change rate
- micro-pause count

### Scroll features

- scroll event rate
- scroll velocity statistics
- scroll acceleration statistics
- scroll step distance
- total scroll distance
- scroll direction changes
- scroll pause count

### Keyboard/input features

- keyboard event rate
- inter-key timing statistics
- input length growth
- delta length statistics
- backspace/correction count
- focus-to-first-input latency
- typing pause count

### Motion/orientation features

- acceleration magnitude
- acceleration including gravity magnitude
- rotation magnitude
- motion energy
- stillness ratio
- alpha/beta/gamma summaries
- unwrapped alpha drift
- tilt magnitude
- orientation change rate

### Contact/audit-only features

These should be logged but treated cautiously:

- pressure
- force
- width/height
- radiusX/radiusY
- rotationAngle
- pinchDistance

These fields are often device/browser artefacts, so they should not be central identity evidence unless later analysis supports them.

# 15. Dataset schema

## 15.1 Raw session JSON

Top-level required fields:

```json
{
  "schemaName": "continuous_auth_behavioural_biometrics_app",
  "schemaVersion": "1.0.0",
  "appVersion": "monzo_style_banking_flow_v1",
  "sessionId": "...",
  "sessionIndex": 3,
  "participantId": "pABC123",
  "startedAtIso": "...",
  "completedAtIso": "...",
  "sessionDurationMs": 180000,
  "completedNormally": true,
  "context": {},
  "generatedContent": {},
  "device": {},
  "capabilities": {},
  "permissions": {},
  "privacyFlags": {},
  "events": [],
  "taskSummary": []
}
```

## 15.2 Task summary

Each task summary row should include:

```json
{
  "taskId": "search_transaction",
  "taskType": "typing_search",
  "startedAtMs": 24000,
  "completedAtMs": 42000,
  "durationMs": 18000,
  "completed": true,
  "evidence": {
    "inputLength": 7,
    "targetLength": 7,
    "corrections": 1
  }
}
```

# 16. Acceptance criteria

The redesign is not successful unless all of the following pass.

## 16.1 UX acceptance criteria

- The app looks like a consumer banking app, not a survey.
- It uses Monzo-inspired card styling, playful icons, strong spacing, and a persistent bottom nav.
- It contains consent and context screens before app entry.
- Participant ID is automatic and cannot be manually typed.
- No task asks the user to invent text.
- All typed tasks provide exact text or exact answers.
- No task requires swipe or drag.
- Every task has a clear banking reason.
- The user can complete the app on iPhone Safari and laptop Chrome without confusion.
- The session should take about 3 minutes in normal use.

## 16.2 Data acceptance criteria

- Session JSON contains participantId and incrementing sessionIndex.
- Session JSON contains exactly one session_complete event.
- taskSummary contains all required tasks.
- Raw typed user text does not appear anywhere in exported JSON.
- Geolocation is never requested.
- Pointer/touch events are present.
- Typing events are present for search/note/reply tasks.
- Scroll events are present for the transaction feed.
- Motion/orientation events are present when permission is granted.
- Event schema is stable and compatible with rolling-window extraction.

## 16.3 Testing checklist

Manual tests:

1. Complete one full iPhone Safari session.
2. Complete one full laptop Chrome session.
3. Complete two sessions in the same browser and confirm participantId stays the same while sessionIndex increments.
4. Type a unique phrase in a field during debug testing and confirm it does not appear in JSON.
5. Search JSON for expected event types: pointerdown, pointerup, pointermove, keydown, input, scroll, devicemotion, deviceorientation, task_start, task_end.
6. Confirm session duration is not too short.
7. Confirm all tasks produce evidence in taskSummary.

# 17. Implementation notes

## 17.1 Technology

Use the same simple stack that worked for Prototype 1:

- static HTML
- CSS
- vanilla JavaScript
- GitHub Pages deployment
- local JSON export in debug mode
- Firebase upload later for participant mode

Avoid adding React or a complex build system unless necessary.

## 17.2 File structure

Recommended:

```text
index.html
styles.css
app.js
logger.js
tasks.js
schema.js
firebase.js
README.md
docs/design_brief.md
docs/data_schema.md
```

## 17.3 Build mode flags

Use a simple config flag:

```js
const APP_MODE = "debug"; // "debug" or "participant"
```

Debug:

- show Download JSON
- show schema/version details optionally

Participant:

- upload automatically
- show thank-you screen
- hide debug details

# 18. Future ChatGPT coding prompt

Use the following as the implementation prompt for a future coding pass:

**Implementation prompt:** Build a static GitHub Pages-compatible banking app for continuous authentication using behavioural biometrics. The app should be Monzo-inspired: light, friendly, card-based, colourful, with bottom navigation, large rounded cards, emoji-style icons and smooth transitions. It must feel like a real banking app, not a survey or lab task.

Use vanilla HTML/CSS/JS. Keep files as `index.html`, `styles.css`, `app.js`, `logger.js`, `tasks.js`, `schema.js` and `firebase.js`.

The app must include a consent/info page and context page before the banking UI. Use Prototype 1-style automatic participant identity with `localStorage` `participantId` and `sessionCount`. No manual participant ID input.

The guided session should take around 3 minutes and include: passcode unlock, home account balance check, transaction search, scroll transaction feed, open transaction detail, categorise payment, copy guided payment note, savings pot task, insights/notifications review, secure approval/reply, and final completion. No task should require swipe or drag. All typing tasks must display exact text or answer to copy/type.

Do not store raw typed text. Log only key class, input length, delta length, timings, focus/blur and correction behaviour. Never request geolocation. Store generated prompt text separately as app-generated content.

Log pointer/touch events, scroll events, keyboard/input events, motion/orientation where available, task transitions, visual viewport changes and task evidence. Use 7.5s windows and 2.5s step in the downstream extraction design. Preserve event families needed for rhythm, typing, movement, scroll, motion/orientation and support/missingness features.

Include debug mode with Download JSON and participant mode with upload/thank-you behaviour. The exported JSON must include `participantId`, `sessionIndex`, device/capability metadata, context, generatedContent, events and taskSummary.

# 19. Do-not-build list

Avoid the following:

- manual participant ID input
- vague note prompts
- mandatory swipe cards
- mandatory drag/reorder cards
- raw typed text storage
- geolocation requests
- survey-like task pages
- research language inside the app flow
- dark cybersecurity dashboard styling
- overly short sessions under 60 seconds
- fake UI elements that do not respond visibly

# 20. Summary

The app should become a realistic, Monzo-inspired banking prototype that quietly collects rich continuous-authentication telemetry. The flow must be tap-first, guided, and repeatable. It should combine account checking, payment search, transaction detail review, categorisation, guided typing, pots, insights, notifications and secure reply/approval.

The data extraction side should preserve the rich signal families identified in the signal extraction lab: rhythm, typing, pointer/touch movement, scroll, motion, orientation, viewport changes and support/missingness indicators. The design must support rolling 7.5-second windows with 2.5-second steps, producing enough windows per session for continuous authentication modelling while keeping the user experience smooth enough for repeated participation.
