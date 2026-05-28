const SCHEMA_NAME = "bbdc_prototype2_app";
const SCHEMA_VERSION = "0.2.0";
const APP_VERSION = "mvp-0.2";

const SESSION_CONFIG = {
  targetSessionMinutes: 4,
  recommendedWindowMs: 7500,
  recommendedStepMs: 2500,
  storesRawText: false,
  storesGeolocation: false,
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