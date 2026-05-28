const SCHEMA_NAME = "continuous_auth_behavioural_biometrics_app";
const SCHEMA_VERSION = "1.1.0";
const APP_VERSION = "banking_flow_gesture_enriched_v2";
const APP_MODE = "debug";

const SESSION_CONFIG = {
  targetSessionMinutes: 3,
  targetSessionRangeSeconds: [150, 210],
  recommendedWindowMs: 7500,
  recommendedStepMs: 2500,
  storesRawText: false,
  storesGeolocation: false,
  participantIdentityMethod: "localStorage_participantId_sessionCount",
  interactionDesign: "banking_flow_with_natural_tap_scroll_type_drag_and_swipe_interactions",
  gestureTasks: ["pots_drag_amount", "insights_swipe_cards", "secure_approval"],
  eventSchema: {
    commonTopLevelFields: ["kind", "tRelMs", "timestampIso", "taskId", "taskIndex", "screenId", "componentId", "payload"],
    highFrequencyThrottleMs: {
      pointermove: 16,
      touchmove: 16,
      scroll: 30,
      devicemotion: 50,
      deviceorientation: 50,
      visualViewport: 50
    }
  }
};
