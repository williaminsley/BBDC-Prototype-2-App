const SCHEMA_NAME = "continuous_auth_behavioural_biometrics_app";
const SCHEMA_VERSION = "1.2.0";
const APP_VERSION = "exploratory_bank_app_v4_longer_validated";
const APP_MODE = "debug";

const SESSION_CONFIG = {
  targetSessionMinutes: 2.5,
  targetSessionRangeSeconds: [130, 180],
  minimumUsefulSeconds: 100,
  recommendedWindowMs: 7500,
  recommendedStepMs: 2500,
  storesRawText: false,
  storesGeolocation: false,
  participantIdentityMethod: "localStorage_participantId_sessionCount",
  interactionDesign: "exploratory_banking_app_with_validated_home_exploration_activity_filter_open_navigation_and_natural_tap_scroll_type_drag_swipe_interactions",
  gestureTasks: ["pots_drag_amount", "insights_swipe_cards", "secure_approval"],
  eventSchema: {
    commonTopLevelFields: ["kind", "tRelMs", "timestampIso", "taskId", "taskIndex", "screenId", "componentId", "activeArea", "instructionArea", "payload"],
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
