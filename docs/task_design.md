# Prototype 2 Task Design

This document describes the current guided banking task design used by Prototype 2.

**Implementation note:** the JavaScript code files are the source of truth. This document mirrors the current implementation in `tasks.js` and `app.js`.

## Design purpose

The Prototype 2 task is designed to collect realistic browser interaction behaviour for continuous authentication research while keeping the app privacy-preserving and repeatable.

The task should produce a mixture of:

- tap rhythm;
- navigation behaviour;
- typing/input rhythm without raw text storage;
- vertical scrolling;
- horizontal scrolling;
- drag behaviour;
- swipe/approval behaviour;
- reading/decision pauses;
- optional motion/orientation data;
- context and device metadata.

The participant-facing app should feel like a guided review inside a fake banking app rather than a lab test.

## Banking areas

The app has five persistent banking areas:

| Area | Purpose |
|---|---|
| Home | Balance and account-card interactions. |
| Activity | Merchant search, transaction feed, filters, categories and notes. |
| Pots | Savings pot selection, slider drag and transfer confirmation. |
| Insights | Horizontal spending-card scrolling and insight review. |
| Secure | Passcode, approval swipe, secure reply and final feeling. |

The bottom navigation remains visible during the banking flow so users can navigate like a normal app. The guided task banner tells the participant where to go and what to do.

## Base task definitions

`tasks.js` defines 15 base tasks.

| # | Base task ID | Area | Type | User action | Main signal value |
|---:|---|---|---|---|---|
| 1 | `unlock_code` | Secure | `code` | Enter displayed demo passcode. | Tap rhythm, keypad timing, corrections. |
| 2 | `home_balance_check` | Home | `tap_account` | Tap Current Account after checking balance. | First account tap, reading pause, navigation. |
| 3 | `home_explore_cards` | Home | `home_explore` | Tap each account card once. | Repeated taps and exploration pattern. |
| 4 | `activity_search` | Activity | `typing_search` | Type target merchant and select it. | Typing rhythm, corrections, search/list interaction. |
| 5 | `activity_filter_review` | Activity | `activity_filter` | Select target category filter. | Decision pause and chip selection. |
| 6 | `activity_scroll_select` | Activity | `transaction_feed` | Scroll long feed and open target transaction. | Vertical scroll dynamics and target acquisition. |
| 7 | `transaction_category` | Activity | `categorise` | Select best category from long list. | List scanning, scrolling and decision tap. |
| 8 | `transaction_note` | Activity | `guided_note` | Copy generated payment note. | Longer typing rhythm without raw text storage. |
| 9 | `pots_drag_amount` | Pots | `pot_drag` | Drag slider to displayed amount. | Drag path, release ratio, accuracy, duration. |
| 10 | `pots_transfer` | Pots | `pots_transfer` | Select Travel Pot, type amount and confirm. | Pot selection, numeric typing, confirmation tap. |
| 11 | `insights_swipe_cards` | Insights | `card_swipe` | Horizontally scroll spending cards and select target. | Horizontal movement and card selection. |
| 12 | `insights_review` | Insights | `insights_review` | Scroll insight list and select target insight. | Insight scan, vertical scroll and tap. |
| 13 | `secure_approval` | Secure | `swipe_approval` | Swipe to approve generated demo payment. | Swipe/drag path, release ratio, duration. |
| 14 | `secure_reply` | Secure | `guided_reply` | Copy generated secure reply. | Longer guided typing rhythm. |
| 15 | `finish_feeling` | Secure/Finish | `finish` | Choose how the session felt. | Final tap and completion metadata. |

## Generated 26-task flow

The current app uses two generated content sets.

`app.js` generates task instances from the 15 base definitions using this logic:

1. Generate content set 1.
2. Add every base task except `finish_feeling`.
3. Generate content set 2.
4. Repeat most banking tasks using different generated content.
5. Do not repeat setup/final tasks.
6. Add `finish_feeling` once at the end.

Tasks skipped on the repeated content set:

- `unlock_code`
- `home_balance_check`
- `home_explore_cards`
- `finish_feeling`

This gives:

```text
14 first-content tasks
+ 11 repeated-content tasks
+ 1 final feeling task
= 26 task instances
```

## Task instance IDs

Each generated task instance has a unique ID with an occurrence suffix:

```text
activity_search_01
activity_search_02
pots_drag_amount_01
pots_drag_amount_02
secure_reply_01
secure_reply_02
```

The base task identity is kept separately as `baseId` and can also be recovered by stripping a final `_<two digits>` suffix.

Downstream datasets should preserve both:

| Field | Use |
|---|---|
| generated task ID | Exact task instance and time order. |
| base task ID | Grouping repeated behaviour across content sets. |
| task type | Modality/task family. |
| task area | Banking app area. |
| content set index | Which generated banking content set was active. |

## Content generation

The app generates fake banking content at session start.

Generated content includes:

- demo passcode;
- target merchant;
- target amount;
- target category;
- target transaction date bucket;
- merchant option list;
- long transaction feed;
- category option list;
- transfer amount;
- spending card target;
- insight target;
- secure approval payment;
- secure reply text.

The app also stores recent target choices in localStorage and attempts to avoid recently used merchants/insights/cards so repeated sessions are less repetitive.

Generated content is safe to store because it is created by the app. User-entered raw text is not stored.

## Validation design

The Continue button validates that the required action has been completed. Validation is based on task evidence accumulated during interaction.

Current validation rules:

| Base task ID | Validation condition |
|---|---|
| `home_balance_check` | Current Account was reviewed/tapped. |
| `home_explore_cards` | All account cards were tapped. |
| `activity_search` | Prompted merchant was typed and selected. |
| `activity_filter_review` | Correct filter chip was selected. |
| `activity_scroll_select` | Target transaction was selected from the feed. |
| `transaction_category` | Correct category was selected. |
| `transaction_note` | Prompted note was copied with trimmed/case-insensitive exact match. |
| `pots_drag_amount` | Slider was released within tolerance of target amount. |
| `pots_transfer` | Travel Pot selected, amount typed, Move Money confirmed. |
| `insights_swipe_cards` | Target card selected after horizontal scroll evidence. |
| `insights_review` | Target insight selected. |
| `secure_approval` | Approval swipe completed. |
| `secure_reply` | Prompted secure reply copied with trimmed/case-insensitive exact match. |
| `finish_feeling` | Final feeling chip selected. |

Passcode completion advances automatically once the correct four-digit generated code has been entered.

## Behavioural evidence by task

Each task contributes different behavioural evidence.

### Passcode

Useful evidence:

- digit tap timing;
- correction count;
- input length progression;
- keypad pointer/touch events.

Raw passcode values are generated by the app and not private user content.

### Home account tasks

Useful evidence:

- first action latency;
- account-card tap order;
- repeated tap timing;
- navigation into the Home area.

### Merchant search and guided typing

Useful evidence:

- focus-to-first-input latency;
- keydown/keyup timing;
- input event timing;
- value length slope;
- correction count;
- selection ranges;
- exact-match completion flag.

Raw typed content is not stored. The app stores behavioural metadata and generated target length/content separately.

### Feed, category and insight scrolling

Useful evidence:

- scroll event rate;
- max scroll depth;
- scroll velocity and acceleration downstream;
- direction changes downstream;
- target selection after scrolling;
- reading/decision pauses.

### Pot drag and secure approval swipe

Useful evidence:

- drag start/end;
- path distance;
- duration;
- sample count;
- release ratio;
- released value/action;
- correctness/tolerance.

### Spending-card horizontal scroll

Useful evidence:

- horizontal scroll distance;
- max scroll ratio;
- target card selection;
- `card_swipe_summary` event;
- card selection after horizontal movement.

## Navigation behaviour

The task system allows natural navigation but validates task completion.

Each event records:

- `activeArea`: area the user is currently in;
- `instructionArea`: area required by the guided task;
- `screenId`: current screen;
- `taskId`: current generated task instance.

This allows downstream analysis to compare instructed behaviour against actual navigation behaviour.

## Research value of the repeated-content design

The 26-task design gives the project a stronger repeated-behaviour dataset than a single short 15-task run.

Benefits:

- more rolling windows per session;
- repeated modalities under different content;
- ability to compare behaviour across repeated task instances;
- less dependence on one merchant/category/task target;
- stronger audit trail for sparse multimodal windows.

Trade-offs:

- longer session duration;
- higher participant fatigue risk;
- more need for careful task-instance and base-task handling in extraction;
- possible learning/familiarity effects within the same session.

These trade-offs should be measured using pilot sessions rather than assumed.

## Downstream extraction implications

The extraction pipeline should:

1. expect 26 task summaries for normal full sessions;
2. preserve generated task instance IDs;
3. derive and preserve base task IDs;
4. preserve content set index;
5. inherit context and task labels onto events;
6. build rolling windows by session;
7. split train/test by session, not random overlapping windows;
8. report feature availability by modality and task type;
9. keep generated content as audit metadata rather than direct identity features.

## Manual test expectations

A valid pilot session should normally show:

- one `session_start` event;
- one final `session_complete` event;
- 26 completed `taskSummary` rows;
- at least one input event;
- at least one scroll event;
- `card_swipe_summary`;
- `approval_swipe_release`;
- no raw user-entered typed text;
- no geolocation;
- `devicePlatform` and `deviceModel` in context;
- `usableForSignalExtraction: true`, unless there is a clear explainable warning.

Motion/orientation may be missing on unsupported browsers or when permission is denied. Missing motion/orientation should be treated as modality missingness, not a failed session.

## Recommended next step

The frontend task design is now mature enough for pilot collection. The next priority should be validating exported/uploaded JSON and updating the downstream signal-extraction pipeline to match schema `1.2.0` and the 26-task instance flow.
