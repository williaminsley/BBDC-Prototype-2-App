const SCHEMA_NAME = "bbdc_prototype2_app";
const SCHEMA_VERSION = "0.3.0";
const APP_VERSION = "mvp-0.3";

const SESSION_CONFIG = {
  targetSessionMinutes: 4,
  recommendedWindowMs: 7500,
  recommendedStepMs: 2500,
  storesRawText: false,
  storesGeolocation: false,
  participantIdentityMethod: "prototype1_localStorage_participantId_sessionCount",
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