let session = null;
let listenersAttached = false;
let motionListenersAttached = false;
let viewportListenersAttached = false;
let lastPointerMoveLog = 0;
let lastTouchMoveLog = 0;
let lastWindowScrollLog = 0;
let lastMotionLog = 0;
let lastOrientationLog = 0;
let lastViewportLog = 0;
const taskStarts = new Map();

function nowIso() { return new Date().toISOString(); }
function tRelMs() { return session ? Math.round(performance.now() - session.startedAtPerf) : 0; }

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

function ensureIdentity() {
  let participantId = localStorage.getItem("participantId");
  if (!participantId) {
    participantId = makeParticipantId();
    localStorage.setItem("participantId", participantId);
  }
  return { uid: null, participantId };
}

function getNextSessionIndex() {
  const count = Number(localStorage.getItem("sessionCount") || 0) + 1;
  localStorage.setItem("sessionCount", String(count));
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
  } catch (_) { return false; }
}

function createSession(context = {}, generatedContent = {}) {
  const identity = ensureIdentity();
  const sessionIndex = getNextSessionIndex();
  taskStarts.clear();
  session = {
    schemaName: SCHEMA_NAME,
    schemaVersion: SCHEMA_VERSION,
    appVersion: APP_VERSION,
    appMode: APP_MODE,
    sessionId: makeId(),
    sessionIndex,
    participantId: identity.participantId,
    startedAtIso: nowIso(),
    createdAtClientISO: nowIso(),
    completedAtIso: null,
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
    taskSummary: []
  };
  logEvent("session_start", { participantId: identity.participantId, sessionIndex, storesRawText: false, storesGeolocation: false });
  attachGlobalListeners();
  attachViewportLogging();
  return session;
}

function getSession() { return session; }

function sanitisePayload(payload = {}) {
  const blocked = new Set(["value", "text", "rawText", "inputValue", "typedText", "content", "message", "note", "reply", "searchText"]);
  const out = {};
  for (const [k, v] of Object.entries(payload || {})) {
    if (blocked.has(k)) out[k] = "[REDACTED]";
    else if (v && typeof v === "object" && !Array.isArray(v)) out[k] = sanitisePayload(v);
    else out[k] = v;
  }
  return out;
}

function logEvent(kind, payload = {}) {
  if (!session) return;
  const clean = sanitisePayload(payload);
  const rel = tRelMs();
  const timestampIso = nowIso();
  session.events.push({
    kind,
    t: kind,
    tRelMs: rel,
    ms: rel,
    timestampIso,
    tISO: timestampIso,
    taskId: window.currentTask?.id || null,
    taskIndex: window.currentTaskIndex ?? null,
    screenId: window.currentScreenId || null,
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
    ["copy", "cut", "paste"].forEach((kind) => el.addEventListener(kind, (e) => logEvent(kind, { componentId: componentIdOf(el), valueLength: el.value.length, clipboardTextLength: e.clipboardData?.getData?.("text")?.length || 0 })));
  });
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
  return { componentId: componentIdOf(target?.closest?.("[data-component-id]") || target), touchesCount: all.length, changedTouchesCount: changed.length, targetTouchesCount: [...(e.targetTouches || [])].length, touchIdentifierPresent: first?.identifier != null, x: roundMaybe(first?.clientX, 2), y: roundMaybe(first?.clientY, 2), xNorm: window.innerWidth && first ? roundMaybe(first.clientX / window.innerWidth, 5) : null, yNorm: window.innerHeight && first ? roundMaybe(first.clientY / window.innerHeight, 5) : null, force: roundMaybe(first?.force, 4), radiusX: roundMaybe(first?.radiusX, 4), radiusY: roundMaybe(first?.radiusY, 4), rotationAngle: roundMaybe(first?.rotationAngle, 4), centroidX: roundMaybe(centroidX, 2), centroidY: roundMaybe(centroidY, 2), pinchDistance: roundMaybe(pinchDistance, 2) };
}

function attachPointerLogging() {
  document.addEventListener("pointerdown", (e) => logEvent("pointerdown", pointerPayload(e, e.target)), { passive: true });
  document.addEventListener("pointermove", (e) => { const now = performance.now(); if (now - lastPointerMoveLog < 16) return; lastPointerMoveLog = now; logEvent("pointermove", pointerPayload(e, e.target)); }, { passive: true });
  document.addEventListener("pointerup", (e) => logEvent("pointerup", pointerPayload(e, e.target)), { passive: true });
  document.addEventListener("pointercancel", (e) => logEvent("pointercancel", pointerPayload(e, e.target)), { passive: true });
  if ("onpointerrawupdate" in window) document.addEventListener("pointerrawupdate", (e) => logEvent("pointerrawupdate", pointerPayload(e, e.target)), { passive: true });
  ["touchstart", "touchmove", "touchend", "touchcancel"].forEach((kind) => document.addEventListener(kind, (e) => { if (kind === "touchmove") { const now = performance.now(); if (now - lastTouchMoveLog < 16) return; lastTouchMoveLog = now; } logEvent(kind, touchPayload(e, e.target)); }, { passive: true }));
}

function attachScrollableLogging(root = document) {
  root.querySelectorAll("[data-log-scroll='true']").forEach((el) => {
    if (el.dataset.scrollLoggerAttached === "true") return;
    el.dataset.scrollLoggerAttached = "true";
    let lastLog = 0;
    el.addEventListener("scroll", () => { const now = performance.now(); if (now - lastLog < 30) return; lastLog = now; logEvent("scroll", { componentId: componentIdOf(el), scrollTop: roundMaybe(el.scrollTop, 2), scrollLeft: roundMaybe(el.scrollLeft, 2), scrollHeight: roundMaybe(el.scrollHeight, 2), scrollWidth: roundMaybe(el.scrollWidth, 2), clientHeight: roundMaybe(el.clientHeight, 2), clientWidth: roundMaybe(el.clientWidth, 2) }); }, { passive: true });
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

function completeSession() {
  if (!session) return null;
  if (!session.completedAtIso) {
    session.completedAtIso = nowIso();
    session.sessionDurationMs = tRelMs();
    session.completedNormally = true;
    logEvent("session_complete", { eventCountBeforeComplete: session.events.length, participantId: session.participantId, sessionIndex: session.sessionIndex, taskCount: session.taskSummary.length });
  }
  return session;
}

function downloadSessionJson() {
  const finalSession = completeSession();
  if (!finalSession) return;
  const blob = new Blob([JSON.stringify(finalSession, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${finalSession.participantId}_s${String(finalSession.sessionIndex).padStart(3, "0")}_${finalSession.sessionId}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
