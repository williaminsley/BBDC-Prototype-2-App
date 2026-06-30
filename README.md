# BBDC Prototype 2 App

A browser-based behavioural biometrics data collection app for continuous authentication research.

This repository contains a static simulated banking app that records privacy-preserving interaction telemetry while a participant completes a guided banking workflow. The data is intended for downstream signal inspection, rolling-window feature extraction and machine-learning experiments.

**Implementation note:** the JavaScript code files are the source of truth. This README summarises the current implementation in `schema.js`, `tasks.js`, `logger.js`, `app.js`, `firebase.js` and `styles.css`.

Live app: https://williaminsley.github.io/BBDC-Prototype-2-App/

## Project purpose

Prototype 2 moves the project beyond a controlled typing-and-tapping task into a more realistic browser banking interaction. It is designed to support research into:

- continuous authentication using behavioural biometrics;
- multimodal browser telemetry from typing, touch/pointer movement, scrolling, drag/swipe and optional motion/orientation signals;
- context-aware authentication using user state, device, posture, focus and environment variables;
- behavioural drift across repeated sessions;
- privacy-preserving data collection with no raw user-entered text.

The app is **not** a real banking product and is **not** a production authentication system. It is a research data collection prototype.

## Current implementation snapshot

| Item | Current value |
|---|---|
| Repository | `williaminsley/BBDC-Prototype-2-App` |
| Live deployment | GitHub Pages |
| App type | Static frontend app |
| Schema name | `continuous_auth_behavioural_biometrics_app` |
| Schema version | `1.2.0` |
| App version | `exploratory_bank_app_v4_longer_validated` |
| App mode | `collection` |
| Participant identity | `localStorage` `participantId` plus `sessionCount` |
| Base task definitions | 15 in `tasks.js` |
| Generated task instances | 26 in `app.js` |
| Content sets | 2 generated banking content sets |
| Recommended CA window | 7.5 seconds |
| Recommended step size | 2.5 seconds |
| Raw typed text stored | No |
| Geolocation stored | No |
| Upload mode | Firebase auto-upload when available, with JSON save/share fallback |

## User flow

The participant completes:

1. intro page;
2. consent page;
3. context questionnaire;
4. simulated banking task sequence;
5. completion screen;
6. automatic Firebase upload where available, plus manual JSON download/share fallback.

The participant-facing banking app uses five main areas:

- Home
- Activity
- Pots
- Insights
- Secure

The guided task banner tells the participant which area to use and what action to complete. The bottom navigation remains available so the participant can move around like a normal banking app, while validation still ensures the required action is completed before continuing.

## Context questionnaire

The current context form records:

- time of day;
- fatigue rating;
- focus rating;
- device platform;
- specific device model;
- input method;
- movement state;
- environment noise;
- privacy of setting;
- posture;
- hand use.

The device model dropdown changes based on the selected device platform. Browser/device metadata is also captured automatically in the raw session object.

## Task design

`tasks.js` defines 15 base tasks:

1. `unlock_code`
2. `home_balance_check`
3. `home_explore_cards`
4. `activity_search`
5. `activity_filter_review`
6. `activity_scroll_select`
7. `transaction_category`
8. `transaction_note`
9. `pots_drag_amount`
10. `pots_transfer`
11. `insights_swipe_cards`
12. `insights_review`
13. `secure_approval`
14. `secure_reply`
15. `finish_feeling`

`app.js` turns these into a 26-task instance sequence using two generated content sets. Some setup/final tasks are not repeated on the second content set:

- `unlock_code`
- `home_balance_check`
- `home_explore_cards`
- `finish_feeling`

Task instances receive stable unique IDs such as:

```text
activity_search_01
activity_search_02
pots_drag_amount_01
pots_drag_amount_02
secure_reply_01
secure_reply_02
```

The original task identity is kept as `baseId`. Downstream extraction should preserve both the unique task instance ID and the base task ID.

See `docs/task_design.md` for the detailed task design.

## Privacy design

This prototype is deliberately privacy-preserving:

- Do not enter real banking details.
- Do not enter real names, emails, passwords, addresses or private personal information.
- User-entered raw text is not intended to be stored.
- Actual key values are not intended to be stored.
- The app stores behavioural metadata such as input length, timing, correction counts, value length, delta length, selection ranges and interaction timing.
- Generated app prompts, fake merchants and fake banking values may be stored because they are not private user content.
- Geolocation is not requested or stored.

The purpose is to model **how** a user interacts, not **what private content** they type.

## Data captured

A completed session JSON contains a raw event stream plus session metadata. Important event families include:

- `session_start` and `session_complete`
- `task_start` and `task_end`
- pointer events: `pointerdown`, `pointermove`, `pointerup`, `pointercancel`, and `pointerrawupdate` where available
- touch events where available
- focus and blur events
- keyboard and input metadata
- copy/cut/paste metadata without clipboard text content
- element scroll and window scroll events
- visual viewport resize/scroll events
- `devicemotion` and `deviceorientation` where browser support and permissions allow
- custom task events such as `transaction_selected`, `category_selected`, `pot_drag_release`, `card_swipe_summary`, `approval_swipe_release` and `pot_transfer_confirmed`

The raw session JSON should be treated as the source of truth for downstream feature extraction.

See `docs/data_schema.md` for the current JSON schema summary.

## Data output structure

A completed session should contain fields such as:

- schema/app identifiers;
- `sessionId`, `participantId`, `sessionIndex`;
- timestamps and duration;
- context answers;
- generated fake banking content;
- device/capability/permission metadata;
- raw event stream;
- task summaries;
- quality summary.

A normal completed current session should contain **26 task summary records**.

## Upload and export behaviour

`firebase.js` is loaded by `index.html`. When Firebase is available, the completion screen attempts to upload the completed session JSON to Firebase Storage and writes metadata to Firestore.

The completion screen also provides a manual JSON download/share fallback. Manual export filenames follow this pattern:

```text
participantId_sNNN_sessionId.json
```

Firebase configuration values for a web app are present in `firebase.js`. Access control must therefore be enforced through Firebase Authentication, Firestore rules and Storage rules, not by hiding the frontend config.

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
- calibration/confidence where applicable;
- performance under context shifts.

## Local development

No build step is required.

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
├── tasks.js            # Base guided task definitions and banking library data
├── styles.css          # App styling
├── firebase.js         # Firebase anonymous identity and session upload
├── docs/               # Project documentation
└── README.md
```

`app.js` is intentionally kept as a single large file for this research prototype so it can be easily reviewed, uploaded to AI tools and frozen once stable. The main goal of the project is modelling, not frontend architecture.

## Manual testing checklist

Before launching or continuing data collection, complete at least:

1. one full laptop Chrome session;
2. one full iPhone Safari session;
3. one repeated session in the same browser to confirm `participantId` persists and `sessionIndex` increments;
4. check that `session_complete` is the final event;
5. check that a full normal session has 26 task summaries;
6. search exported/uploaded JSON for raw typed content and confirm it is absent;
7. confirm `devicePlatform` and `deviceModel` are present in context;
8. confirm pot drag values are visible and not redacted;
9. confirm card horizontal scrolling logs `card_swipe_summary`;
10. confirm secure approval logs `approval_swipe_release`;
11. confirm Firebase upload works where expected;
12. confirm manual JSON save/share fallback works;
13. confirm the UI has no blocked/clipped controls on mobile.

## Current project status

The app is now in a collection-ready Prototype 2 state. The next major work should be downstream data processing, quality control and modelling rather than further frontend redesign.

Recommended next steps:

1. collect pilot JSON from laptop Chrome and iPhone Safari;
2. inspect task completeness, privacy safety and signal richness;
3. update the signal extraction pipeline for schema `1.2.0` and the 26-task flow;
4. build canonical event-level datasets;
5. build 7.5s / 2.5s rolling-window datasets;
6. run feature-quality and missingness reports;
7. train baseline and modality-specific models;
8. compare behaviour-only, multimodal and context-aware approaches;
9. use repeated-user sessions to analyse drift and context sensitivity.
