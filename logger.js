let session = null;
let listenersAttached = false;
let motionListenersAttached = false;
let viewportListenersAttached = false;
let loggingClosed = false;
let memoryParticipantId = null;
let memorySessionCount = 0;
let lastPointerMoveLog = 0;
let lastTouchMoveLog = 0;
let lastWindowScrollLog = 0;
let lastMotionLog = 0;
let lastOrientationLog = 0;
let lastViewportLog = 0;
const taskStarts = new Map();

const P2_PARTICIPANT_ID_KEY = "bbdc_p2_participantId";
const P2_SESSION_COUNT_KEY = "bbdc_p2_sessionCount";
const LEGACY_PARTICIPANT_ID_KEY = "participantId";

function nowIso() { return new Date().toISOString(); }
function tRelMs() { return session ? Math.round(performance.now() - session.startedAtPerf) : 0; }
function clamp01(value) { return Math.max(0, Math.min(1, Number(value) || 0)); }

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID().replace(/-/g, "");
  const cryptoObj = globalThis.crypto || globalThis.msCrypto;
  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoObj.getRandomValues(bytes);
    return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return (Date.now().toString(16) + Math.random().toString(16).slice(2)).replace(".", "");
}

function makeParticipantId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "p";
  for (let i = 0; i < 6; i += 1) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

function safeGetLocalStorage(key) {
  try { return localStorage.getItem(key); } catch (_) { return null; }
}

function safeSetLocalStorage(key, value) {
  try { localStorage.setItem(key, value); return true; } catch (_) { return false; }
}

function ensureIdentity() {
  const p2Stored = safeGetLocalStorage(P2_PARTICIPANT_ID_KEY);
  const legacyStored = safeGetLocalStorage(LEGACY_PARTICIPANT_ID_KEY);
  let participantId = p2Stored || legacyStored || memoryParticipantId;
  let identitySource = p2Stored
    ? "localStorage_p2_returning"
    : (legacyStored ? "localStorage_legacy_migrated_to_p2" : (memoryParticipantId ? "memory_fallback" : "fresh_minted"));

  if (!participantId) {
    participantId = makeParticipantId();
    identitySource = "fresh_minted";
  }

  memoryParticipantId = participantId;
  safeSetLocalStorage(P2_PARTICIPANT_ID_KEY, participantId);
  return { uid: null, participantId, identitySource };
}

function getNextSessionIndex() {
  const storedCount = Number(safeGetLocalStorage(P2_SESSION_COUNT_KEY) || 0);
  const count = Math.max(storedCount, memorySessionCount) + 1;
  memorySessionCount = count;
  safeSetLocalStorage(P2_SESSION_COUNT_KEY, String(count));
  return count;
}

function inferDeviceFamily() {
  const ua = String(navigator.userAgent || "").toLowerCase();
  if (ua.includes("ipad") || ua.includes("tablet")) return "tablet";
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) return "mobile";
  return "desktop";
}

function getDeviceSummary() {
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
  const orientation = screen?.orientation || null;
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    vendor: navigator.vendor || null,
    language: navigator.language,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    deviceFamily: inferDeviceFamily(),
    pointerEventSupported: "PointerEvent" in window,
    pointerRawUpdateSupported: "onpointerrawupdate" in window,
    touchEventSupported: "ontouchstart" in window || "TouchEvent" in window,
    visualViewportSupported: "visualViewport" in window,
    deviceMotionSupported: "DeviceMotionEvent" in window,
    deviceOrientationSupported: "DeviceOrientationEvent" in window,
    hoverNone: matchMedia?.("(hover: none)").matches ?? null,
    pointerCoarse: matchMedia?.("(pointer: coarse)").matches ?? null,
    pointerFine: matchMedia?.("(pointer: fine)").matches ?? null,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    outerWidth: window.outerWidth ?? null,
    outerHeight: window.outerHeight ?? null,
    screen: {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      dpr: window.devicePixelRatio || 1,
      orientationType: orientation?.type ?? null,
      orientationAngle: orientation?.angle ?? null
    },
    timezoneOffsetMin: new Date().getTimezoneOffset(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    connection: c ? { effectiveType: c.effectiveType ?? null, rtt: c.rtt ?? null, downlink: c.downlink ?? null, saveData: c.saveData ?? null } : { supported: false }
  };
}

function getCapabilitySummary() {
  return {
    secureContext: window.isSecureContext,
    localStorageSupported: storageAvailable("localStorage"),
    sessionStorageSupported: storageAvailable("sessionStorage"),
    indexedDbSupported: "indexedDB" in window,
    vibrationSupported: typeof navigator.vibrate === "function",
    genericSensorSupported: "Sensor" in window,
    accelerometerSupported: "Accelerometer" in window,
    gyroscopeSupported: "Gyroscope" in window,
    magnetometerSupported: "Magnetometer" in window,
    motionPermissionApi: !!(window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === "function"),
    orientationPermissionApi: !!(window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === "function")
  };
}

function storageAvailable(type) {
  try {
    const storage = window[type];
    const key = "__bbdc_storage_test__";
    storage.setItem(key, key);
    storage.removeItem(key);
    return true;
  } catch (_) {
    return false;
  }
}

function createSession(context = {}, generatedContent = {}) {
  const identity = ensureIdentity();
  const sessionIndex = getNextSessionIndex();
  taskStarts.clear();
  loggingClosed = false;
  session = {
    schemaName: SCHEMA_NAME,
    schemaVersion: SCHEMA_VERSION,
    appVersion: APP_VERSION,
    appMode: APP_MODE,
    sessionId: makeId(),
    sessionIndex,
    participantId: identity.participantId,
    identitySource: identity.identitySource,
    startedAtIso: nowIso(),
    createdAtClientISO: nowIso(),
    completedAtIso: null,
    exportedAtIso: null,
    exportMethod: null,
    startedAtPerf: performance.now(),
    sessionDurationMs: null,
    completedNormally: false,
    context: { ...context },
    generatedContent,
    config: SESSION_CONFIG,
    privacyFlags: { storesRawText: false, storesGeolocation: false, typedTextRedacted: true, userTypedContentStored: false },
    device: getDeviceSummary(),
    capabilities: getCapabilitySummary(),
    permissions: { motion: "not_requested", orientation: "not_requested", geolocation: "not_collected_privacy" },
    events: [],
    taskSummary: [],
    qualitySummary: null
  };
  logEvent("session_start", { participantId: identity.participantId, identitySource: identity.identitySource, sessionIndex, storesRawText: false, storesGeolocation: false });
  attachGlobalListeners();
  attachViewportLogging();
  return session;
}

function getSession() { return session; }

function shouldRedactKey(key) {
  const normalisedKey = String(key || "").toLowerCase();
  const safeExactKeys = new Set(["storesrawtext", "storesgeolocation", "typedtextredacted", "usertypedcontentstored"]);
  if (safeExactKeys.has(normalisedKey)) return false;
  const sensitiveExactKeys = new Set(["rawtext", "typedtext", "inputvalue", "userinput", "searchtext", "clipboardtext", "password", "passphrase", "email", "phone"]);
  const sensitiveSubstrings = ["rawtext", "typedtext", "inputvalue", "searchtext", "clipboardtext", "password", "passphrase", "email"];
  return sensitiveExactKeys.has(normalisedKey) || sensitiveSubstrings.some((blocked) => normalisedKey.includes(blocked));
}

function sanitisePayload(payload = {}) {
  if (Array.isArray(payload)) return payload.map((item) => sanitisePayload(item));
  if (!payload || typeof payload !== "object") return payload;
  const out = {};
  for (const [key, value] of Object.entries(payload)) {
    out[key] = shouldRedactKey(key) ? "[REDACTED]" : sanitisePayload(value);
  }
  return out;
}

function activeAreaFromScreen(screenId) {
  const first = String(screenId || "").split("_")[0];
  return ["home", "activity", "pots", "insights", "secure"].includes(first) ? first : null;
}

function logEvent(kind, payload = {}) {
  if (!session || loggingClosed) return;
  const clean = sanitisePayload(payload);
  const rel = tRelMs();
  const timestampIso = nowIso();
  const screenId = window.currentScreenId || null;
  session.events.push({
    kind,
    t: kind,
    tRelMs: rel,
    ms: rel,
    timestampIso,
    tISO: timestampIso,
    taskId: window.currentTask?.id || null,
    taskIndex: window.currentTaskIndex ?? null,
    screenId,
    activeArea: clean.area || window.currentActiveArea || activeAreaFromScreen(screenId),
    instructionArea: window.currentTask?.area || null,
    componentId: clean.componentId || clean.zone || null,
    payload: clean
  });
}

function logTaskStart(task, index) {
  taskStarts.set(task.id, tRelMs());
  logEvent("task_start", { taskId: task.id, taskType: task.type, taskArea: task.area, taskIndex: index, taskTitle: task.title, expectedSeconds: task.expectedSeconds });
}

function logTaskEnd(task, index, evidence = {}) {
  const completedAtMs = tRelMs();
  const startedAtMs = taskStarts.get(task.id) ?? null;
  const summary = { taskId: task.id, taskType: task.type, taskArea: task.area, taskIndex: index, startedAtMs, completedAtMs, durationMs: Number.isFinite(startedAtMs) ? completedAtMs - startedAtMs : null, completed: true, evidence: sanitisePayload(evidence) };
  logEvent("task_end", summary);
  if (session && !session.taskSummary.some((r) => r.taskId === task.id)) session.taskSummary.push(summary);
}

function classifyKey(key) {
  if (!key) return "UNKNOWN";
  if (/^[a-zA-Z]$/.test(key)) return "LETTER";
  if (/^[0-9]$/.test(key)) return "DIGIT";
  if (key === " ") return "SPACE";
  if (key === "Backspace") return "BACKSPACE";
  if (key === "Enter") return "ENTER";
  if (key === "Tab") return "TAB";
  if (key.startsWith("Arrow")) return "ARROW";
  if (/^[.,!?;:'"\-£$%()&]$/.test(key)) return "PUNCT_OR_SYMBOL";
  return "OTHER";
}

function classifyCode(code) {
  if (!code) return null;
  if (/^Key[A-Z]$/.test(code)) return "KEY_LETTER";
  if (/^Digit[0-9]$/.test(code) || /^Numpad[0-9]$/.test(code)) return "KEY_DIGIT";
  if (code.includes("Space")) return "KEY_SPACE";
  if (code.includes("Enter")) return "KEY_ENTER";
  if (code.includes("Backspace")) return "KEY_BACKSPACE";
  return "KEY_OTHER";
}

function componentIdOf(el) { return el?.closest?.("[data-component-id]")?.dataset?.componentId || el?.dataset?.componentId || el?.id || null; }
function roundMaybe(value, digits = 4) { return typeof value === "number" && Number.isFinite(value) ? Number(value.toFixed(digits)) : null; }

function attachPrivacySafeInputLogging(root = document) {
  root.querySelectorAll("input, textarea").forEach((el) => {
    if (el.dataset.loggerAttached === "true") return;
    el.dataset.loggerAttached = "true";
    let previousLength = el.value.length;
    el.addEventListener("focus", () => logEvent("focus", { componentId: componentIdOf(el), valueLength: el.value.length }));
    el.addEventListener("blur", () => logEvent("blur", { componentId: componentIdOf(el), valueLength: el.value.length, selectionStart: el.selectionStart ?? null, selectionEnd: el.selectionEnd ?? null }));
    el.addEventListener("keydown", (e) => logEvent("keydown", { componentId: componentIdOf(el), keyClass: classifyKey(e.key), codeClass: classifyCode(e.code), repeat: e.repeat, valueLength: el.value.length, selectionStart: el.selectionStart ?? null, selectionEnd: el.selectionEnd ?? null, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey, altKey: e.altKey, metaKey: e.metaKey }));
    el.addEventListener("keyup", (e) => logEvent("keyup", { componentId: componentIdOf(el), keyClass: classifyKey(e.key), codeClass: classifyCode(e.code), valueLength: el.value.length }));
    el.addEventListener("beforeinput", (e) => logEvent("beforeinput", { componentId: componentIdOf(el), inputType: e.inputType || null, dataLength: e.data ? String(e.data).length : 0, valueLength: el.value.length, isComposing: e.isComposing ?? null }));
    el.addEventListener("input", () => {
      const currentLength = el.value.length;
      logEvent("input", { componentId: componentIdOf(el), valueLength: currentLength, deltaLength: currentLength - previousLength, selectionStart: el.selectionStart ?? null, selectionEnd: el.selectionEnd ?? null });
      previousLength = currentLength;
    });
    el.addEventListener("select", () => logEvent("select", { componentId: componentIdOf(el), valueLength: el.value.length, selectionStart: el.selectionStart ?? null, selectionEnd: el.selectionEnd ?? null }));
    ["copy", "cut", "paste"].forEach((kind) => el.addEventListener(kind, () => logEvent(kind, { componentId: componentIdOf(el), valueLength: el.value.length })));
  });
}

function pointerPayload(e, target = null) {
  const el = target?.closest?.("[data-component-id]") || target;
  return { componentId: componentIdOf(el), pointerType: e.pointerType ?? null, pointerId: e.pointerId ?? null, isPrimary: e.isPrimary ?? null, button: e.button ?? null, buttons: e.buttons ?? null, x: roundMaybe(e.clientX, 2), y: roundMaybe(e.clientY, 2), xNorm: window.innerWidth ? roundMaybe(e.clientX / window.innerWidth, 5) : null, yNorm: window.innerHeight ? roundMaybe(e.clientY / window.innerHeight, 5) : null, pageX: roundMaybe(e.pageX, 2), pageY: roundMaybe(e.pageY, 2), screenX: roundMaybe(e.screenX, 2), screenY: roundMaybe(e.screenY, 2), movementX: roundMaybe(e.movementX, 4), movementY: roundMaybe(e.movementY, 4), pressure: roundMaybe(e.pressure, 4), width: roundMaybe(e.width, 4), height: roundMaybe(e.height, 4), tiltX: roundMaybe(e.tiltX, 4), tiltY: roundMaybe(e.tiltY, 4), twist: roundMaybe(e.twist, 4), coalescedCount: typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents().length : null };
}

function touchPayload(e, target = null) {
  const changed = [...(e.changedTouches || [])];
  const all = [...(e.touches || [])];
  const first = changed[0] || all[0] || null;
  const centroidX = all.length ? all.reduce((s, t) => s + t.clientX, 0) / all.length : null;
  const centroidY = all.length ? all.reduce((s, t) => s + t.clientY, 0) / all.length : null;
  const pinchDistance = all.length >= 2 ? Math.hypot(all[1].clientX - all[0].clientX, all[1].clientY - all[0].clientY) : null;
  return { componentId: componentIdOf(target?.closest?.("[data-component-id]") || target), touchesCount: all.length, changedTouchesCount: changed.length, targetTouchesCount: e.targetTouches?.length ?? null, touchIdentifierPresent: first?.identifier != null, x: roundMaybe(first?.clientX, 2), y: roundMaybe(first?.clientY, 2), xNorm: first && innerWidth ? roundMaybe(first.clientX / innerWidth, 5) : null, yNorm: first && innerHeight ? roundMaybe(first.clientY / innerHeight, 5) : null, force: roundMaybe(first?.force), radiusX: roundMaybe(first?.radiusX), radiusY: roundMaybe(first?.radiusY), rotationAngle: roundMaybe(first?.rotationAngle), centroidX: roundMaybe(centroidX, 2), centroidY: roundMaybe(centroidY, 2), pinchDistance: roundMaybe(pinchDistance, 2) };
}

function attachPointerLogging() {
  document.addEventListener("pointerdown", (e) => logEvent("pointerdown", pointerPayload(e, e.target)), { passive: true });
  document.addEventListener("pointermove", (e) => { const now = performance.now(); if (now - lastPointerMoveLog < 16) return; lastPointerMoveLog = now; logEvent("pointermove", pointerPayload(e, e.target)); }, { passive: true });
  document.addEventListener("pointerup", (e) => logEvent("pointerup", pointerPayload(e, e.target)), { passive: true });
  document.addEventListener("pointercancel", (e) => logEvent("pointercancel", { ...pointerPayload(e, e.target), treatedAsPointerEnd: true }), { passive: true });
  if ("onpointerrawupdate" in window) document.addEventListener("pointerrawupdate", (e) => { const now = performance.now(); if (now - lastPointerMoveLog < 16) return; lastPointerMoveLog = now; logEvent("pointerrawupdate", pointerPayload(e, e.target)); }, { passive: true });
  ["touchstart", "touchmove", "touchend", "touchcancel"].forEach((kind) => document.addEventListener(kind, (e) => { if (kind === "touchmove") { const now = performance.now(); if (now - lastTouchMoveLog < 16) return; lastTouchMoveLog = now; } logEvent(kind, touchPayload(e, e.target)); }, { passive: true }));
}

function attachScrollableLogging(root = document) {
  root.querySelectorAll("[data-log-scroll='true']").forEach((el) => {
    if (el.dataset.scrollLoggerAttached === "true") return;
    el.dataset.scrollLoggerAttached = "true";
    let lastLog = 0;
    el.addEventListener("scroll", () => {
      const now = performance.now();
      if (now - lastLog < 30) return;
      lastLog = now;
      const maxTop = Math.max(0, el.scrollHeight - el.clientHeight);
      const maxLeft = Math.max(0, el.scrollWidth - el.clientWidth);
      const scrollTopRatioRaw = maxTop ? el.scrollTop / maxTop : 0;
      const scrollLeftRatioRaw = maxLeft ? el.scrollLeft / maxLeft : 0;
      logEvent("scroll", { componentId: componentIdOf(el), scrollTop: roundMaybe(el.scrollTop, 2), scrollLeft: roundMaybe(el.scrollLeft, 2), scrollTopMaxPossible: roundMaybe(maxTop, 2), scrollLeftMaxPossible: roundMaybe(maxLeft, 2), scrollTopRatioRaw: roundMaybe(scrollTopRatioRaw, 5), scrollLeftRatioRaw: roundMaybe(scrollLeftRatioRaw, 5), scrollTopRatio: maxTop ? roundMaybe(clamp01(scrollTopRatioRaw), 5) : 0, scrollLeftRatio: maxLeft ? roundMaybe(clamp01(scrollLeftRatioRaw), 5) : 0, scrollHeight: roundMaybe(el.scrollHeight, 2), scrollWidth: roundMaybe(el.scrollWidth, 2), clientHeight: roundMaybe(el.clientHeight, 2), clientWidth: roundMaybe(el.clientWidth, 2) });
    }, { passive: true });
  });
}

function attachTaskElementLogging(root = document) { attachPrivacySafeInputLogging(root); attachScrollableLogging(root); }

function attachGlobalListeners() {
  if (listenersAttached) return;
  listenersAttached = true;
  attachPointerLogging();
  document.addEventListener("visibilitychange", () => logEvent("visibilitychange", { visibilityState: document.visibilityState }));
  window.addEventListener("resize", () => logEvent("resize", { innerWidth: innerWidth, innerHeight: innerHeight }), { passive: true });
  window.addEventListener("orientationchange", () => logEvent("orientationchange", {}), { passive: true });
  window.addEventListener("scroll", () => { const now = performance.now(); if (now - lastWindowScrollLog < 30) return; lastWindowScrollLog = now; logEvent("window_scroll", { scrollTop: roundMaybe(scrollY, 2), scrollLeft: roundMaybe(scrollX, 2) }); }, { passive: true });
  window.addEventListener("beforeunload", (e) => {
    if (session && !session.exportedAtIso && !loggingClosed) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
}

function attachViewportLogging() {
  if (viewportListenersAttached || !window.visualViewport) return;
  viewportListenersAttached = true;
  const logViewport = (kind) => { const now = performance.now(); if (now - lastViewportLog < 50) return; lastViewportLog = now; const vv = window.visualViewport; logEvent(kind, { viewportWidth: roundMaybe(vv.width, 2), viewportHeight: roundMaybe(vv.height, 2), scale: roundMaybe(vv.scale, 4), offsetLeft: roundMaybe(vv.offsetLeft, 2), offsetTop: roundMaybe(vv.offsetTop, 2), pageLeft: roundMaybe(vv.pageLeft, 2), pageTop: roundMaybe(vv.pageTop, 2) }); };
  visualViewport.addEventListener("resize", () => logViewport("visual_viewport_resize"), { passive: true });
  visualViewport.addEventListener("scroll", () => logViewport("visual_viewport_scroll"), { passive: true });
}

async function requestMotionPermission() {
  if (!session) return "no_session";
  let motionState = "not_required_or_unavailable";
  let orientationState = "not_required_or_unavailable";
  try {
    if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === "function") motionState = await DeviceMotionEvent.requestPermission();
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === "function") orientationState = await DeviceOrientationEvent.requestPermission();
    session.permissions.motion = motionState;
    session.permissions.orientation = orientationState;
    logEvent("sensor_permission_result", { motion: motionState, orientation: orientationState });
    return motionState === "granted" || orientationState === "granted" ? "granted" : motionState;
  } catch (err) {
    session.permissions.motion = "error";
    session.permissions.orientation = "error";
    logEvent("sensor_permission_error", { name: err.name, message: err.message });
    return "error";
  }
}

function startMotionLogging() {
  if (!session || motionListenersAttached) return;
  motionListenersAttached = true;
  window.addEventListener("devicemotion", (e) => { const now = performance.now(); if (now - lastMotionLog < 50) return; lastMotionLog = now; logEvent("devicemotion", { ax: roundMaybe(e.acceleration?.x), ay: roundMaybe(e.acceleration?.y), az: roundMaybe(e.acceleration?.z), agx: roundMaybe(e.accelerationIncludingGravity?.x), agy: roundMaybe(e.accelerationIncludingGravity?.y), agz: roundMaybe(e.accelerationIncludingGravity?.z), rotAlpha: roundMaybe(e.rotationRate?.alpha), rotBeta: roundMaybe(e.rotationRate?.beta), rotGamma: roundMaybe(e.rotationRate?.gamma), interval: roundMaybe(e.interval) }); }, { passive: true });
  window.addEventListener("deviceorientation", (e) => { const now = performance.now(); if (now - lastOrientationLog < 50) return; lastOrientationLog = now; logEvent("deviceorientation", { alpha: roundMaybe(e.alpha), beta: roundMaybe(e.beta), gamma: roundMaybe(e.gamma), absolute: e.absolute ?? null }); }, { passive: true });
}

function buildQualitySummary() {
  if (!session) return null;
  const events = session.events || [];
  const expectedTaskIds = Array.isArray(window.GUIDED_TASKS) ? window.GUIDED_TASKS.map((task) => task.id) : (typeof GUIDED_TASKS !== "undefined" ? GUIDED_TASKS.map((task) => task.id) : []);
  const completedTaskIds = session.taskSummary.map((task) => task.taskId);
  const warnings = [];
  const has = (kind) => events.some((event) => event.kind === kind);
  const missingTaskIds = expectedTaskIds.filter((id) => !completedTaskIds.includes(id));
  if (missingTaskIds.length) warnings.push("missing_task_summaries");
  if (!has("input")) warnings.push("missing_typing_events");
  if (!has("scroll")) warnings.push("missing_scroll_events");
  if (!has("card_swipe_summary")) warnings.push("missing_card_swipe_summary");
  if (!has("approval_swipe_release")) warnings.push("missing_approval_swipe");
  if (!has("devicemotion")) warnings.push("missing_motion_events");
  if (!has("deviceorientation")) warnings.push("missing_orientation_events");

  return { completedTaskCount: session.taskSummary.length, expectedTaskCount: expectedTaskIds.length || null, expectedTaskIds, completedTaskIds, missingTaskIds, eventCount: events.length, hasMotion: has("devicemotion"), hasOrientation: has("deviceorientation"), hasTyping: has("input"), hasScroll: has("scroll"), hasCardSwipeSummary: has("card_swipe_summary"), hasApprovalSwipe: has("approval_swipe_release"), warnings, usableForSignalExtraction: warnings.filter((warning) => warning !== "missing_motion_events" && warning !== "missing_orientation_events").length === 0 };
}

function completeSession() {
  if (!session) return null;
  if (!session.completedAtIso) {
    session.completedAtIso = nowIso();
    session.sessionDurationMs = tRelMs();
    session.completedNormally = true;
    session.qualitySummary = buildQualitySummary();
    logEvent("session_complete", { eventCountBeforeComplete: session.events.length, participantId: session.participantId, sessionIndex: session.sessionIndex, taskCount: session.taskSummary.length, qualityWarnings: session.qualitySummary?.warnings || [] });
    loggingClosed = true;
  }
  return session;
}

async function downloadSessionJson() {
  const finalSession = completeSession();
  if (!finalSession) return;
  finalSession.exportedAtIso = nowIso();
  const filename = `${finalSession.participantId}_s${String(finalSession.sessionIndex).padStart(3, "0")}_${finalSession.sessionId}.json`;
  const makeBlob = () => new Blob([JSON.stringify(finalSession, null, 2)], { type: "application/json;charset=utf-8" });

  try {
    finalSession.exportMethod = "web_share";
    const file = new File([makeBlob()], filename, { type: "application/json" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: filename });
      return;
    }
  } catch (_) {
    // Unsupported or the user cancelled — fall through to a normal download.
  }

  finalSession.exportMethod = "manual_json_download";
  const blob = makeBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
