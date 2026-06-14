# BBDC Prototype 2 App

A browser-based behavioural biometrics data collection app for continuous authentication research.

This prototype presents participants with a simulated mobile banking workflow and records privacy-preserving interaction telemetry such as tap timing, pointer/touch movement, scrolling, typing metadata, drag/swipe behaviour, motion/orientation where supported, device/browser metadata, and self-reported context. The collected JSON sessions are intended for downstream rolling-window feature extraction and machine-learning experiments.

Live app: https://williaminsley.github.io/BBDC-Prototype-2-App/

## Project purpose

Prototype 2 moves the project beyond a controlled typing-and-tapping task into a more realistic browser banking interaction. The app is designed to support research into:

- continuous authentication using behavioural biometrics;
- multimodal browser telemetry from typing, touch/pointer, scroll, drag/swipe and motion/orientation signals;
- context-aware authentication using device, posture, fatigue, focus and environment variables;
- behavioural drift across repeated sessions;
- privacy-preserving data collection with no raw user-entered text.

The app is **not** a real banking product and is **not** a production authentication system. It is a research data collection prototype.

## Current implementation snapshot

| Item | Value |
|---|---|
| Repository | `williaminsley/BBDC-Prototype-2-App` |
| Live deployment | GitHub Pages |
| Schema name | `continuous_auth_behavioural_biometrics_app` |
| Schema version | `1.2.0` |
| App version | `exploratory_bank_app_v4_longer_validated` |
| App mode | `debug` |
| Task flow | 26 task instances generated from repeated banking content |
| Recommended CA window | 7.5 seconds |
| Recommended step size | 2.5 seconds |
| Raw typed text stored | No |
| Geolocation stored | No |

## User flow

The participant completes:

1. intro and consent;
2. context questionnaire;
3. a simulated banking app sequence;
4. final feeling/check question;
5. JSON download.

The banking task uses five main areas:

- Home
- Activity
- Pots
- Insights
- Secure

The guided sequence includes actions such as passcode entry, account-card tapping, merchant search, transaction filtering, long-list scrolling, category selection, note copying, pot slider dragging, pot transfer confirmation, spending-card horizontal scrolling, insight review, secure approval swipe and secure reply copying.

## Privacy design

This prototype is deliberately privacy-preserving:

- Do not enter real banking details.
- Do not enter real names, emails, passwords, addresses or private personal information.
- User-entered raw text is not intended to be stored.
- Key values are not intended to be stored.
- The app stores behavioural metadata such as input length, timing, correction counts, value length, delta length and interaction timing.
- Generated app prompts, fake merchants and fake banking values may be stored because they are not user-private.
- Geolocation is not requested or stored.

The purpose is to model **how** a user interacts, not **what private content** they type.

## Data captured

The exported JSON contains a raw event stream plus session metadata. Important families include:

- `session_start` and `session_complete`
- `task_start` and `task_end`
- pointer events: `pointerdown`, `pointermove`, `pointerup`, `pointercancel`
- touch events where available
- keyboard/input metadata
- focus and blur events
- scroll and window scroll events
- visual viewport events
- devicemotion and deviceorientation where browser support/permission allows
- custom events such as `transaction_selected`, `category_selected`, `pot_drag_release`, `card_swipe_summary`, `approval_swipe_release`, `pot_transfer_confirmed`

The raw session JSON should be treated as the source of truth for downstream feature extraction.

## Data output structure

A completed session should contain fields such as:

- schema/app identifiers;
- `sessionId`, `participantId`, `sessionIndex`;
- timestamps and duration;
- self-reported context;
- generated fake banking content;
- device/capability/permission metadata;
- raw event stream;
- task summaries;
- quality summary.

The current app uses a 26-task-instance sequence, so downstream extraction and QC should expect 26 completed task summaries for a normal full session.

## Intended modelling pipeline

The intended downstream workflow is:

1. collect raw JSON sessions;
2. validate session integrity and privacy safety;
3. flatten raw events into a canonical event-level table;
4. inherit session context and task labels onto events;
5. build rolling windows using 7.5s windows and 2.5s steps;
6. extract feature families:
   - rhythm;
   - typing/input;
   - pointer/touch movement;
   - scroll;
   - drag/swipe;
   - motion/orientation;
   - context/support/missingness;
7. train behaviour-only baselines;
8. train modality-specific models;
9. test simple and confidence-weighted fusion;
10. compare behaviour-only against behaviour-plus-context models;
11. evaluate repeated-user drift and session-level generalisation.

## Evaluation principles

Continuous authentication should be evaluated as a verification problem, not only as ordinary multiclass classification.

Recommended framing:

- enrol on earlier genuine sessions from a user;
- test later genuine sessions from the same user;
- use other users' windows as impostor windows;
- use session-level or time-aware splits;
- avoid random window-level train/test splits because overlapping windows can leak behaviour;
- control for device/browser artefacts where possible.

Useful metrics include:

- accuracy;
- ROC-AUC;
- equal error rate;
- false acceptance rate;
- false rejection rate;
- calibration / confidence where applicable;
- performance under context shifts.

## Local development

This is a static frontend app. No build step is required.

Open locally by serving the folder with any static server, for example:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

The app can also be opened through GitHub Pages after changes are pushed to `main`.

## Repository structure

```text
.
├── index.html          # Static page entry point
├── app.js              # Main single-file banking app and task flow
├── logger.js           # Session/event logging and JSON export
├── schema.js           # Schema/config constants
├── tasks.js            # Guided task definitions and banking library data
├── styles.css          # App styling
├── firebase.js         # Legacy / deployment-related file, not required for debug JSON mode
├── docs/               # Project documentation
└── README.md
```

`app.js` is intentionally kept as a single large file for this research prototype so it can be easily reviewed, uploaded to AI tools and frozen once stable. The main goal of the project is modelling, not frontend architecture.

## Manual testing checklist

Before launching data collection, complete at least:

1. one full laptop Chrome session;
2. one full iPhone Safari session;
3. one repeated session in the same browser to confirm `participantId` persists and `sessionIndex` increments;
4. check that `session_complete` is the final event;
5. check that a full normal session has 26 task summaries;
6. search exported JSON for raw typed content and confirm it is absent;
7. confirm `devicePlatform` and `deviceModel` are present in context;
8. confirm pot drag values are visible and not redacted;
9. confirm card horizontal scrolling logs `card_swipe_summary`;
10. confirm the UI has no blocked/clipped controls on mobile.

## Current project status

The app is now in a stable debug-collection state. The next major work should be downstream data processing and modelling rather than further frontend refactoring.

Recommended next steps:

1. collect pilot JSON from laptop and iPhone;
2. inspect task completeness, privacy safety and signal richness;
3. update the signal extraction pipeline for the current schema and 26-task flow;
4. build rolling-window datasets;
5. run baseline and modality-specific models;
6. compare behaviour-only, multimodal and context-aware approaches;
7. use repeated-user sessions to analyse drift and context sensitivity.
