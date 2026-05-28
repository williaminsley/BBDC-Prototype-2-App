const SCHEMA_NAME = "bbdc_prototype2_banking_app";
const SCHEMA_VERSION = "0.4.0";
const APP_VERSION = "banking-redesign-0.4";

const SESSION_CONFIG = {
  targetSessionMinutes: 3.5,
  recommendedWindowMs: 7500,
  recommendedStepMs: 2500,
  storesRawText: false,
  storesGeolocation: false,
  participantIdentityMethod: "prototype1_localStorage_participantId_sessionCount",
  interactionDesign: "banking_app_tap_first_gesture_optional",
  eventSchema: {
    commonTopLevelFields: [
      "kind",
      "tRelMs",
      "timestampIso",
      "taskId",
      "taskIndex",
      "screenId",
      "componentId",
      "payload"
    ]
  }
};
