let session = null;
let listenersAttached = false;
let motionListenersAttached = false;

let lastPointerMoveLog = 0;
let lastWindowScrollLog = 0;
let lastMotionLog = 0;
let lastOrientationLog = 0;

let activeSwipe = null;
let activeDrags = new Map();

function nowIso() {
  return new Date().toISOString();
}

function nowMs() {
  return performance.now();
}

function tRelMs() {
  if (!session) return 0;
  return Math.round(performance.now() - session.startedAtPerf);
}

// ==========================
// Prototype 1-style identity
// ==========================

function makeId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID().replace(/-/g, "");
  }

  const cryptoObj = globalThis.crypto || globalThis.msCrypto;

  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoObj.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  return (Date.now().toString(16) + Math.random().toString(16).slice(2)).replace(".", "");
}

function makeParticipantId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "p";

  for (let i = 0; i < 6; i += 1) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return s;
}

function ensureIdentity() {
  let participantId = localStorage.getItem("participantId");

  if (!participantId) {
    participantId = makeParticipantId();
    localStorage.setItem("participantId", participantId);
  }

  return {
    uid: null,
    participantId
  };
}

function getNextSessionIndex() {
  const count = Number(localStorage.getItem("sessionCount") || 0) + 1;
  localStorage.setItem("sessionCount", String(count));
  return count;
}

// ==========================
// Session setup
// ==========================

function createSession(context = {}, generatedContent = {}) {
  const identity = ensureIdentity();
  const sessionIndex = getNextSessionIndex();

  session = {
    schemaName: SCHEMA_NAME,
    schemaVersion: SCHEMA_VERSION,
    appVersion: APP_VERSION,

    sessionId: makeId(),
    sessionIndex,
    participantId: identity.participantId,
    displayName: localStorage.getItem("displayName") || "",

    createdAtClientISO: nowIso(),
    startedAtIso: nowIso(),
    completedAtIso: null,
    startedAtPerf: performance.now(),
    sessionDurationMs: null,
    completedNormally: false,

    context: {
      ...context,
      participantId: identity.participantId
    },

    generatedContent,
    config: SESSION_CONFIG,

    privacyFlags: {
      storesRawText: false,
      storesGeolocation: false,
      typedTextRedacted: true
    },

    device: getDeviceSummary(),
    capabilities: getCapabilitySummary(),

    permissions: {
      motion: "not_requested",
      geolocation: "not_collected_privacy"
    },

    events: [],
    taskSummary: []
  };

  logEvent("session_start", {
    participantId: identity.participantId,
    sessionIndex,
    storesRawText: false,
    storesGeolocation: false
  });

  attachGlobalListeners();

  return session;
}

function getSession() {
  return session;
}

function getDeviceSummary() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    vendor: navigator.vendor || null,
    language: navigator.language,
    maxTouchPoints: navigator.maxTouchPoints || 0,

    pointerEventSupported: "PointerEvent" in window,
    touchEventSupported: "TouchEvent" in window,
    visualViewportSupported: "visualViewport" in window,
    deviceMotionSupported: "DeviceMotionEvent" in window,
    deviceOrientationSupported: "DeviceOrientationEvent" in window,

    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,

    screen: {
      w: screen.width,
      h: screen.height,
      dpr: window.devicePixelRatio || 1
    },

    screenWidth: screen.width,
    screenHeight: screen.height,
    devicePixelRatio: window.devicePixelRatio || 1,

    timezoneOffsetMin: new Date().getTimezoneOffset(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
}

function getCapabilitySummary() {
  return {
    secureContext: window.isSecureContext,
    localStorageSupported: storageAvailable("localStorage"),
    sessionStorageSupported: storageAvailable("sessionStorage"),
    genericSensorSupported: "Sensor" in window,
    vibrationSupported: "vibrate" in navigator,
    motionPermissionApi: !!(
      window.DeviceMotionEvent &&
      typeof DeviceMotionEvent.requestPermission === "function"
    ),
    orientationPermissionApi: !!(
      window.DeviceOrientationEvent &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    )
  };
}

function storageAvailable(type) {
  try {
    const storage = window[type];
    const testKey = "__bbdc_storage_test__";
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch (_) {
    return false;
  }
}

// ==========================
// Event logger
// ==========================

function sanitisePayload(payload = {}) {
  const blockedKeys = [
    "value",
    "text",
    "rawText",
    "inputValue",
    "message",
    "note",
    "typedText",
    "content"
  ];

  const clean = { ...payload };

  blockedKeys.forEach((key) => {
    if (key in clean) clean[key] = "[REDACTED]";
  });

  return clean;
}

function logEvent(kind, payload = {}) {
  if (!session) return;

  const cleanPayload = sanitisePayload(payload);

  session.events.push({
    kind,
    t: kind,
    tRelMs: tRelMs(),
    ms: tRelMs(),
    timestampIso: nowIso(),
    tISO: nowIso(),
    taskId: window.currentTask?.id || null,
    taskIndex: window.currentTaskIndex ?? null,
    screenId: window.currentScreenId || null,
    componentId: cleanPayload.componentId || null,
    payload: cleanPayload
  });
}

function logTaskStart(task, index) {
  logEvent("task_start", {
    taskId: task.id,
    taskType: task.type,
    taskTitle: task.title,
    targetTimeSec: task.targetTimeSec
  });
}

function logTaskEnd(task, index, evidence = {}) {
  logEvent("task_end", {
    taskId: task.id,
    taskType: task.type,
    evidence
  });

  if (session) {
    session.taskSummary.push({
      taskId: task.id,
      taskType: task.type,
      completedAtMs: tRelMs(),
      evidence
    });
  }
}

function classifyKey(key) {
  if (/^[a-zA-Z]$/.test(key)) return "LETTER";
  if (/^[0-9]$/.test(key)) return "DIGIT";
  if (key === " ") return "SPACE";
  if (key === "Backspace") return "BACKSPACE";
  if (key === "Enter") return "ENTER";
  if (key.startsWith("Arrow")) return "ARROW";
  if (/^[.,!?;:'"-]$/.test(key)) return "PUNCT";
  return "OTHER";
}

// ==========================
// Input logging
// ==========================

function attachPrivacySafeInputLogging(root = document) {
  root.querySelectorAll("input, textarea").forEach((el) => {
    if (el.dataset.loggerAttached === "true") return;
    el.dataset.loggerAttached = "true";

    let previousLength = el.value.length;

    el.addEventListener("focus", () => {
      logEvent("input_focus", {
        componentId: el.dataset.componentId || el.id || null
      });
    });

    el.addEventListener("blur", () => {
      logEvent("input_blur", {
        componentId: el.dataset.componentId || el.id || null,
        valueLength: el.value.length
      });
    });

    el.addEventListener("keydown", (e) => {
      logEvent("keydown", {
        componentId: el.dataset.componentId || el.id || null,
        keyClass: classifyKey(e.key),
        repeat: e.repeat,
        valueLength: el.value.length
      });
    });

    el.addEventListener("keyup", (e) => {
      logEvent("keyup", {
        componentId: el.dataset.componentId || el.id || null,
        keyClass: classifyKey(e.key),
        valueLength: el.value.length
      });
    });

    el.addEventListener("beforeinput", (e) => {
      logEvent("beforeinput", {
        componentId: el.dataset.componentId || el.id || null,
        inputType: e.inputType || null,
        dataLength: e.data ? e.data.length : 0,
        valueLength: el.value.length
      });
    });

    el.addEventListener("input", () => {
      const currentLength = el.value.length;

      logEvent("input", {
        componentId: el.dataset.componentId || el.id || null,
        valueLength: currentLength,
        deltaLength: currentLength - previousLength
      });

      previousLength = currentLength;
    });
  });
}

// ==========================
// Pointer / swipe / drag logging
// ==========================

function pointerPayload(e, el = null) {
  return {
    componentId: el?.dataset?.componentId || el?.dataset?.item || el?.id || null,
    x: Number.isFinite(e.clientX) ? Math.round(e.clientX) : null,
    y: Number.isFinite(e.clientY) ? Math.round(e.clientY) : null,
    xNorm: window.innerWidth ? Number((e.clientX / window.innerWidth).toFixed(5)) : null,
    yNorm: window.innerHeight ? Number((e.clientY / window.innerHeight).toFixed(5)) : null,
    pointerType: e.pointerType || null,
    pressure: e.pressure ?? null,
    buttons: e.buttons ?? null
  };
}

function attachPointerLogging() {
  document.addEventListener(
    "pointerdown",
    (e) => {
      logEvent("pointerdown", pointerPayload(e, e.target));
      logEvent("pointer_down", pointerPayload(e, e.target));

      activeSwipe = {
        pointerId: e.pointerId,
        componentId: e.target?.dataset?.componentId || e.target?.id || null,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        startMs: performance.now(),
        pathLengthPx: 0,
        pointCount: 1,
        maxStepSpeedPxPerMs: 0
      };
    },
    { passive: true }
  );

  document.addEventListener(
    "pointermove",
    (e) => {
      const now = performance.now();

      if (activeSwipe && activeSwipe.pointerId === e.pointerId) {
        const dxStep = e.clientX - activeSwipe.lastX;
        const dyStep = e.clientY - activeSwipe.lastY;
        const stepDist = Math.hypot(dxStep, dyStep);
        const dt = Math.max(now - (activeSwipe.lastMoveMs || activeSwipe.startMs), 1);

        activeSwipe.pathLengthPx += stepDist;
        activeSwipe.pointCount += 1;
        activeSwipe.maxStepSpeedPxPerMs = Math.max(
          activeSwipe.maxStepSpeedPxPerMs,
          stepDist / dt
        );

        activeSwipe.lastX = e.clientX;
        activeSwipe.lastY = e.clientY;
        activeSwipe.lastMoveMs = now;
      }

      if (now - lastPointerMoveLog < 16) return;

      lastPointerMoveLog = now;

      logEvent("pointermove", pointerPayload(e, e.target));
      logEvent("pointer_move", pointerPayload(e, e.target));
    },
    { passive: true }
  );

  document.addEventListener(
    "pointerup",
    (e) => {
      logEvent("pointerup", pointerPayload(e, e.target));
      logEvent("pointer_up", pointerPayload(e, e.target));
      finishSwipeIfActive(e, "pointerup");
    },
    { passive: true }
  );

  document.addEventListener(
    "pointercancel",
    (e) => {
      logEvent("pointercancel", pointerPayload(e, e.target));
      finishSwipeIfActive(e, "pointercancel");
    },
    { passive: true }
  );
}

function finishSwipeIfActive(e, endKind) {
  if (!activeSwipe || activeSwipe.pointerId !== e.pointerId) return;

  const durationMs = Math.max(performance.now() - activeSwipe.startMs, 1);
  const dx = e.clientX - activeSwipe.startX;
  const dy = e.clientY - activeSwipe.startY;
  const distancePx = Math.hypot(dx, dy);
  const pathLengthPx = activeSwipe.pathLengthPx || distancePx;
  const straightness = pathLengthPx > 0 ? distancePx / pathLengthPx : null;

  if (distancePx >= 30 || pathLengthPx >= 60) {
    logEvent("swipe_summary", {
      componentId: activeSwipe.componentId,
      endKind,
      dx: Number(dx.toFixed(3)),
      dy: Number(dy.toFixed(3)),
      distancePx: Number(distancePx.toFixed(3)),
      durationMs: Math.round(durationMs),
      pathLengthPx: Number(pathLengthPx.toFixed(3)),
      meanSpeedPxPerMs: Number((pathLengthPx / durationMs).toFixed(5)),
      maxSpeedPxPerMs: Number(activeSwipe.maxStepSpeedPxPerMs.toFixed(5)),
      straightness: straightness === null ? null : Number(straightness.toFixed(5)),
      direction:
        Math.abs(dx) >= Math.abs(dy)
          ? dx >= 0
            ? "right"
            : "left"
          : dy >= 0
            ? "down"
            : "up",
      pointCount: activeSwipe.pointCount
    });
  }

  activeSwipe = null;
}

function attachScrollableLogging(root = document) {
  root.querySelectorAll("[data-log-scroll='true']").forEach((el) => {
    if (el.dataset.scrollLoggerAttached === "true") return;
    el.dataset.scrollLoggerAttached = "true";

    let lastLog = 0;

    el.addEventListener(
      "scroll",
      () => {
        const now = performance.now();

        if (now - lastLog < 30) return;

        lastLog = now;

        logEvent("scroll", {
          componentId: el.dataset.componentId || null,
          scrollTop: el.scrollTop,
          scrollLeft: el.scrollLeft,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight
        });
      },
      { passive: true }
    );
  });
}

function attachDragCardLogging(root = document) {
  root.querySelectorAll("[data-draggable-card='true']").forEach((el) => {
    if (el.dataset.dragLoggerAttached === "true") return;
    el.dataset.dragLoggerAttached = "true";

    el.addEventListener("pointerdown", (e) => {
      activeDrags.set(e.pointerId, {
        item: el.dataset.item || null,
        startMs: performance.now()
      });

      el.setPointerCapture?.(e.pointerId);

      logEvent("drag_start", {
        ...pointerPayload(e, el),
        item: el.dataset.item || null
      });
    });

    el.addEventListener("pointermove", (e) => {
      if (!activeDrags.has(e.pointerId)) return;

      logEvent("drag_move", {
        ...pointerPayload(e, el),
        item: el.dataset.item || null
      });
    });

    el.addEventListener("pointerup", (e) => {
      if (!activeDrags.has(e.pointerId)) return;

      const drag = activeDrags.get(e.pointerId);
      activeDrags.delete(e.pointerId);

      logEvent("drag_end", {
        ...pointerPayload(e, el),
        item: drag.item,
        durationMs: Math.round(performance.now() - drag.startMs)
      });
    });

    el.addEventListener("pointercancel", (e) => {
      if (!activeDrags.has(e.pointerId)) return;

      const drag = activeDrags.get(e.pointerId);
      activeDrags.delete(e.pointerId);

      logEvent("drag_cancel", {
        ...pointerPayload(e, el),
        item: drag.item,
        durationMs: Math.round(performance.now() - drag.startMs)
      });
    });
  });
}

function attachTaskElementLogging(root = document) {
  attachPrivacySafeInputLogging(root);
  attachScrollableLogging(root);
  attachDragCardLogging(root);
}

function attachGlobalListeners() {
  if (listenersAttached) return;
  listenersAttached = true;

  document.addEventListener("visibilitychange", () => {
    logEvent("visibilitychange", {
      visibilityState: document.visibilityState
    });
  });

  window.addEventListener("resize", () => {
    logEvent("resize", {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight
    });
  });

  window.addEventListener("orientationchange", () => {
    logEvent("orientationchange", {});
  });

  window.addEventListener(
    "scroll",
    () => {
      const now = performance.now();

      if (now - lastWindowScrollLog < 30) return;

      lastWindowScrollLog = now;

      logEvent("window_scroll", {
        scrollTop: window.scrollY,
        scrollLeft: window.scrollX
      });
    },
    { passive: true }
  );

  attachPointerLogging();
}

// ==========================
// Motion / orientation
// ==========================

async function requestMotionPermission() {
  if (!session) return "no_session";

  try {
    if (
      window.DeviceMotionEvent &&
      typeof DeviceMotionEvent.requestPermission === "function"
    ) {
      const motionState = await DeviceMotionEvent.requestPermission();
      session.permissions.motion = motionState;

      logEvent("motion_permission_result", {
        permission: motionState
      });

      return motionState;
    }

    session.permissions.motion = "not_required_or_unavailable";

    logEvent("motion_permission_result", {
      permission: session.permissions.motion
    });

    return session.permissions.motion;
  } catch (err) {
    session.permissions.motion = "error";

    logEvent("motion_permission_error", {
      name: err.name,
      message: err.message
    });

    return "error";
  }
}

function startMotionLogging() {
  if (!session || motionListenersAttached) return;

  motionListenersAttached = true;

  window.addEventListener(
    "devicemotion",
    (e) => {
      const now = performance.now();

      if (now - lastMotionLog < 50) return;

      lastMotionLog = now;

      logEvent("devicemotion", {
        ax: roundMaybe(e.acceleration?.x),
        ay: roundMaybe(e.acceleration?.y),
        az: roundMaybe(e.acceleration?.z),
        agx: roundMaybe(e.accelerationIncludingGravity?.x),
        agy: roundMaybe(e.accelerationIncludingGravity?.y),
        agz: roundMaybe(e.accelerationIncludingGravity?.z),
        rotAlpha: roundMaybe(e.rotationRate?.alpha),
        rotBeta: roundMaybe(e.rotationRate?.beta),
        rotGamma: roundMaybe(e.rotationRate?.gamma),
        interval: roundMaybe(e.interval)
      });
    },
    { passive: true }
  );

  window.addEventListener(
    "deviceorientation",
    (e) => {
      const now = performance.now();

      if (now - lastOrientationLog < 50) return;

      lastOrientationLog = now;

      logEvent("deviceorientation", {
        alpha: roundMaybe(e.alpha),
        beta: roundMaybe(e.beta),
        gamma: roundMaybe(e.gamma),
        absolute: e.absolute ?? null
      });
    },
    { passive: true }
  );
}

function roundMaybe(value, digits = 4) {
  return typeof value === "number" && Number.isFinite(value)
    ? Number(value.toFixed(digits))
    : null;
}

// ==========================
// Complete / export
// ==========================

function completeSession() {
  if (!session) return null;

  if (!session.completedAtIso) {
    session.completedAtIso = nowIso();
    session.sessionDurationMs = tRelMs();
    session.completedNormally = true;

    logEvent("session_complete", {
      eventCountBeforeComplete: session.events.length,
      participantId: session.participantId,
      sessionIndex: session.sessionIndex
    });
  }

  return session;
}

function downloadSessionJson() {
  const finalSession = completeSession();

  if (!finalSession) return;

  const blob = new Blob([JSON.stringify(finalSession, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `${finalSession.participantId}_s${String(finalSession.sessionIndex).padStart(3, "0")}_${finalSession.sessionId}.json`;
  a.click();

  URL.revokeObjectURL(url);
}