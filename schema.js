const SCHEMA_NAME = "continuous_auth_behavioural_biometrics_app";
const SCHEMA_VERSION = "1.2.0";
const APP_VERSION = "exploratory_bank_app_v5_deployment_consent";
const APP_MODE = "collection";
const CONSENT_VERSION = "p2_consent_2026_06_30";

const SESSION_CONFIG = {
  targetSessionMinutes: 4,
  targetSessionRangeSeconds: [120, 600],
  minimumUsefulSeconds: 60,
  recommendedWindowMs: 7500,
  recommendedStepMs: 2500,
  storesRawText: false,
  storesGeolocation: false,
  consentVersion: CONSENT_VERSION,
  participantIdentityMethod: "localStorage_bbdc_p2_participantId_bbdc_p2_sessionCount_firebase_anonymous_uid",
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
