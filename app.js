const app = document.getElementById("app");

const appState = {
  currentTaskIndex: -1,
  selectedContext: {},
  content: {},
  evidenceByTask: {},
  motionStarted: false
};

window.currentTask = null;
window.currentTaskIndex = null;
window.currentScreenId = "welcome";

function renderWelcome() {
  window.currentScreenId = "welcome";

  app.innerHTML = `
    <section class="screen">
      <div class="hero-card">
        <p class="eyebrow">Prototype 2</p>
        <h1>Pulse Daily Review</h1>
        <p class="muted">
          Complete a short app-style review while privacy-preserving interaction
          data is collected for behavioural biometrics research.
        </p>

        <div class="privacy-box">
          <p><strong>Records:</strong> timing, taps, typing rhythm, scrolling, swipes, drags and motion/orientation where available.</p>
          <p><strong>Does not store:</strong> raw typed text or geolocation.</p>
        </div>

        <button class="primary-btn" onclick="renderContext()">Start session</button>
      </div>
    </section>
  `;
}

function renderContext() {
  window.currentScreenId = "context";

  app.innerHTML = `
    <section class="screen">
      <div class="topbar">
        <span>Pulse</span>
        <span>Setup</span>
      </div>

      <div class="card">
        <h2>Before you start</h2>
        <p class="muted">Add quick context for this session.</p>

        <label for="participantId">Participant ID</label>
        <input id="participantId" data-component-id="participant_id" placeholder="e.g. P001" autocomplete="off" />

        <label for="posture">Posture</label>
        <select id="posture">
          <option value="sitting">Sitting</option>
          <option value="standing">Standing</option>
          <option value="walking">Walking</option>
        </select>

        <label for="handUse">Hand use</label>
        <select id="handUse">
          <option value="two_handed">Two-handed</option>
          <option value="one_handed_right">One-handed right</option>
          <option value="one_handed_left">One-handed left</option>
        </select>

        <label for="dominantHand">Dominant hand</label>
        <select id="dominantHand">
          <option value="right">Right</option>
          <option value="left">Left</option>
          <option value="ambidextrous">Ambidextrous</option>
        </select>

        <label for="environment">Environment</label>
        <select id="environment">
          <option value="quiet">Quiet</option>
          <option value="normal">Normal</option>
          <option value="noisy">Noisy</option>
          <option value="moving">Moving / travelling</option>
        </select>

        <label for="focus">Focus level</label>
        <select id="focus">
          <option value="5">Very focused</option>
          <option value="4">Focused</option>
          <option value="3">Neutral</option>
          <option value="2">Distracted</option>
          <option value="1">Very distracted</option>
        </select>

        <label for="tiredness">Tiredness</label>
        <select id="tiredness">
          <option value="1">Not tired</option>
          <option value="2">Slightly tired</option>
          <option value="3">Neutral</option>
          <option value="4">Tired</option>
          <option value="5">Very tired</option>
        </select>

        <button class="primary-btn" onclick="startSession()">Begin review</button>
      </div>
    </section>
  `;

  attachTaskElementLogging(document);
}

async function startSession() {
  appState.selectedContext = {
    participantId: document.getElementById("participantId").value.trim() || "unknown",
    posture: document.getElementById("posture").value,
    handUse: document.getElementById("handUse").value,
    dominantHand: document.getElementById("dominantHand").value,
    environment: document.getElementById("environment").value,
    focus: document.getElementById("focus").value,
    tiredness: document.getElementById("tiredness").value
  };

  appState.content = generateSessionContent();
  appState.evidenceByTask = {};

  createSession(appState.selectedContext, appState.content);

  const motionPermission = await requestMotionPermission();
  startMotionLogging();

  appState.motionStarted = true;

  logEvent("motion_logging_started", {
    permissionResult: motionPermission
  });

  goToTask(0);
}

function generateSessionContent() {
  const merchants = shuffleArray([...ROTATING_CONTENT.merchants]);
  const targetMerchant = merchants[0];

  return {
    searchTerm: randomChoice(ROTATING_CONTENT.searchTerms),
    targetMerchant,
    feedItems: merchants.map((merchant) => ({
      merchant,
      amount: randomAmount()
    })),
    priorities: shuffleArray([...ROTATING_CONTENT.priorities]),
    suggestions: shuffleArray([...ROTATING_CONTENT.suggestions]),
    messagePrompt: randomChoice(ROTATING_CONTENT.messagePrompts)
  };
}

function goToTask(index) {
  if (window.currentTask && appState.currentTaskIndex >= 0) {
    logTaskEnd(
      window.currentTask,
      appState.currentTaskIndex,
      getTaskEvidence(window.currentTask.id)
    );
  }

  appState.currentTaskIndex = index;
  window.currentTaskIndex = index;
  window.currentTask = TASKS[index];

  if (!window.currentTask) {
    renderComplete();
    return;
  }

  ensureEvidenceBucket(window.currentTask.id);
  logTaskStart(window.currentTask, index);
  renderTask(window.currentTask, index);
}

function renderTask(task, index) {
  window.currentScreenId = task.id;

  const progress = Math.round(((index + 1) / TASKS.length) * 100);

  app.innerHTML = `
    <section class="screen">
      <div class="topbar">
        <span>Pulse</span>
        <span>${index + 1}/${TASKS.length}</span>
      </div>

      <div class="progress-track">
        <div class="progress-fill" style="width:${progress}%"></div>
      </div>

      <div class="task-header">
        <p class="eyebrow">Daily review</p>
        <h2>${task.title}</h2>
        <p class="muted">${task.subtitle}</p>
      </div>

      <div class="task-body">
        ${renderTaskBody(task)}
      </div>

      <div id="taskWarning" class="task-warning" hidden></div>

      <button class="primary-btn bottom-btn" onclick="attemptContinue()">
        Continue
      </button>
    </section>
  `;

  attachTaskElementLogging(document);
  attachTaskSpecificHandlers(task);
}

function renderTaskBody(task) {
  switch (task.type) {
    case "hold":
      return `
        <button class="hold-card" data-component-id="hold_button">
          Hold to begin
        </button>
        <p class="hint">Hold for around one second, then continue.</p>
      `;

    case "swipe_intro":
      return `
        <div class="swipe-instruction">Swipe across at least two cards.</div>
        <div class="swipe-stack">
          <div class="swipe-card" data-component-id="intro_card_activity">Today’s activity</div>
          <div class="swipe-card" data-component-id="intro_card_messages">Messages waiting</div>
          <div class="swipe-card" data-component-id="intro_card_priorities">Priorities to organise</div>
        </div>
      `;

    case "typing_search":
      return `
        <div class="mini-card">
          <p>Search for:</p>
          <h3>${appState.content.searchTerm}</h3>
        </div>
        <input class="large-input" data-component-id="search_input" placeholder="Search activity..." autocomplete="off" autocapitalize="none" spellcheck="false" />
      `;

    case "scroll_find":
      return `
        <p class="hint">Find and tap: <strong>${appState.content.targetMerchant}</strong></p>
        <div class="feed-list" data-log-scroll="true" data-component-id="activity_feed">
          ${appState.content.feedItems
            .map(
              (item) => `
            <button class="feed-item" data-merchant="${escapeAttr(item.merchant)}" data-component-id="feed_item_${slugify(item.merchant)}">
              <span>${escapeHtml(item.merchant)}</span>
              <span>£${item.amount}</span>
            </button>
          `
            )
            .join("")}
        </div>
      `;

    case "categorise":
      return `
        <div class="mini-card">
          <h3>${escapeHtml(appState.content.targetMerchant)}</h3>
          <p>Choose a category</p>
        </div>
        <div class="chip-grid">
          ${ROTATING_CONTENT.categories
            .map(
              (c) => `
            <button class="chip" data-category="${escapeAttr(c)}" data-component-id="category_${slugify(c)}">${escapeHtml(c)}</button>
          `
            )
            .join("")}
        </div>
      `;

    case "typing_note":
      return `
        <textarea class="large-textarea" data-component-id="note_input" placeholder="Add 2–5 words..." autocomplete="off" spellcheck="false"></textarea>
      `;

    case "drag_reorder":
      return `
        <div class="priority-list">
          ${appState.content.priorities
            .map(
              (p) => `
            <div class="priority-card" data-draggable-card="true" data-item="${escapeAttr(p)}" data-component-id="priority_${slugify(p)}">
              ${escapeHtml(p)}
            </div>
          `
            )
            .join("")}
        </div>
      `;

    case "swipe_decisions":
      return `
        <div class="swipe-instruction">Swipe cards, or use the decision buttons.</div>
        <div class="swipe-stack">
          ${appState.content.suggestions
            .map(
              (s) => `
            <div class="swipe-card" data-component-id="decision_card_${slugify(s)}">${escapeHtml(s)}</div>
          `
            )
            .join("")}
        </div>
        <div class="decision-row">
          <button class="secondary-btn" data-decision="dismiss" data-component-id="decision_dismiss">Dismiss</button>
          <button class="secondary-btn" data-decision="keep" data-component-id="decision_keep">Keep</button>
        </div>
      `;

    case "typing_reply":
      return `
        <div class="message-card">
          <p class="muted">Alex from Support</p>
          <p>${escapeHtml(appState.content.messagePrompt)}</p>
        </div>
        <textarea class="large-textarea" data-component-id="reply_input" placeholder="Type short reply..." autocomplete="off" spellcheck="false"></textarea>
      `;

    case "final_checkin":
      return `
        <div class="chip-grid">
          ${ROTATING_CONTENT.feelings
            .map(
              (x) => `
            <button class="chip" data-feeling="${escapeAttr(x)}" data-component-id="feeling_${slugify(x)}">${escapeHtml(x)}</button>
          `
            )
            .join("")}
        </div>
        <textarea class="large-textarea" data-component-id="final_note_input" placeholder="Optional few words..." autocomplete="off" spellcheck="false"></textarea>
      `;

    default:
      return `<p>Unknown task type.</p>`;
  }
}

function attachTaskSpecificHandlers(task) {
  switch (task.type) {
    case "hold":
      attachHoldHandlers();
      break;
    case "typing_search":
    case "typing_note":
    case "typing_reply":
      attachTypingEvidenceHandlers(task);
      break;
    case "scroll_find":
      attachFeedHandlers();
      break;
    case "categorise":
      attachCategoryHandlers();
      break;
    case "drag_reorder":
      attachDragEvidenceMonitor();
      break;
    case "swipe_intro":
    case "swipe_decisions":
      attachSwipeEvidenceMonitor(task);
      attachDecisionHandlers();
      break;
    case "final_checkin":
      attachFinalCheckinHandlers();
      break;
    default:
      break;
  }
}

function attachHoldHandlers() {
  const el = document.querySelector("[data-component-id='hold_button']");
  if (!el) return;

  let start = null;

  el.addEventListener("pointerdown", () => {
    start = performance.now();
    logEvent("hold_start", {
      componentId: "hold_button"
    });
  });

  el.addEventListener("pointerup", () => {
    const durationMs = start ? Math.round(performance.now() - start) : null;

    updateTaskEvidence("hold_to_start", {
      holdEnds: 1,
      holdDurationMs: durationMs
    });

    logEvent("hold_end", {
      componentId: "hold_button",
      durationMs
    });
  });
}

function attachTypingEvidenceHandlers(task) {
  const input = document.querySelector("input, textarea");
  if (!input) return;

  input.addEventListener("input", () => {
    updateTaskEvidence(task.id, {
      inputLength: input.value.length
    });
  });
}

function attachFeedHandlers() {
  document.querySelectorAll(".feed-item").forEach((button) => {
    button.addEventListener("click", () => {
      const merchant = button.dataset.merchant;
      const selectedTarget = merchant === appState.content.targetMerchant;

      updateTaskEvidence("scroll_find", {
        selectedTarget,
        selectedMerchant: merchant
      });

      logEvent("feed_item_selected", {
        componentId: button.dataset.componentId,
        merchant,
        selectedTarget
      });
    });
  });
}

function attachCategoryHandlers() {
  document.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      const category = button.dataset.category;

      updateTaskEvidence("categorise_item", {
        categorySelected: true,
        category
      });

      logEvent("category_selected", {
        componentId: button.dataset.componentId,
        category
      });
    });
  });
}

function attachDecisionHandlers() {
  document.querySelectorAll("[data-decision]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.decision;
      const current = getTaskEvidence("swipe_decisions");

      updateTaskEvidence("swipe_decisions", {
        decisionActions: (current.decisionActions || 0) + 1
      });

      logEvent("decision_card_action", {
        componentId: button.dataset.componentId,
        action
      });
    });
  });
}

function attachFinalCheckinHandlers() {
  document.querySelectorAll("[data-feeling]").forEach((button) => {
    button.addEventListener("click", () => {
      const feeling = button.dataset.feeling;

      updateTaskEvidence("final_checkin", {
        finalFeeling: true,
        feeling
      });

      logEvent("final_feeling_selected", {
        componentId: button.dataset.componentId,
        feeling
      });
    });
  });

  const input = document.querySelector("textarea");

  if (input) {
    input.addEventListener("input", () => {
      updateTaskEvidence("final_checkin", {
        finalNoteLength: input.value.length
      });
    });
  }
}

function attachDragEvidenceMonitor() {
  const taskId = "reorder_priorities";
  let dragEnds = getTaskEvidence(taskId).dragEnds || 0;

  document.querySelectorAll("[data-draggable-card='true']").forEach((card) => {
    card.addEventListener("pointerup", () => {
      dragEnds += 1;

      updateTaskEvidence(taskId, {
        dragEnds
      });
    });
  });
}

function attachSwipeEvidenceMonitor(task) {
  const taskId = task.id;
  let swipeStarts = 0;
  let swipeSummaries = 0;

  document.querySelectorAll(".swipe-card").forEach((card) => {
    let startX = null;
    let startY = null;

    card.addEventListener("pointerdown", (e) => {
      startX = e.clientX;
      startY = e.clientY;
      swipeStarts += 1;

      updateTaskEvidence(taskId, {
        swipeStarts,
        swipeSummaries
      });
    });

    card.addEventListener("pointerup", (e) => {
      if (startX === null || startY === null) return;

      const distance = Math.hypot(e.clientX - startX, e.clientY - startY);

      if (distance >= 30) swipeSummaries += 1;

      updateTaskEvidence(taskId, {
        swipeStarts,
        swipeSummaries
      });

      startX = null;
      startY = null;
    });
  });
}

function attemptContinue() {
  const task = window.currentTask;

  if (!task) return;

  const warning = validateTaskEvidence(task);

  if (warning) {
    showTaskWarning(warning);
    return;
  }

  clearTaskWarning();
  goToTask(appState.currentTaskIndex + 1);
}

function validateTaskEvidence(task) {
  const evidence = getTaskEvidence(task.id);

  switch (task.id) {
    case "hold_to_start":
      return evidence.holdEnds ? null : "Press and hold the start card first.";
    case "swipe_intro":
      return (evidence.swipeSummaries || 0) >= 2
        ? null
        : "Swipe across at least two cards.";
    case "search_activity":
      return (evidence.inputLength || 0) >= 2
        ? null
        : "Type the search term before continuing.";
    case "scroll_find":
      return evidence.selectedTarget
        ? null
        : `Tap the ${appState.content.targetMerchant} item first.`;
    case "categorise_item":
      return evidence.categorySelected ? null : "Choose a category first.";
    case "add_note":
      return (evidence.inputLength || 0) >= 4
        ? null
        : "Add a short note first.";
    case "reorder_priorities":
      return (evidence.dragEnds || 0) >= 1
        ? null
        : "Drag at least one priority card first.";
    case "swipe_decisions":
      return (evidence.swipeSummaries || 0) >= 2 ||
        (evidence.decisionActions || 0) >= 2
        ? null
        : "Swipe or choose at least two decisions.";
    case "reply_message":
      return (evidence.inputLength || 0) >= 6
        ? null
        : "Type a short reply first.";
    case "final_checkin":
      return evidence.finalFeeling ? null : "Choose how the session felt first.";
    default:
      return null;
  }
}

function showTaskWarning(message) {
  const warning = document.getElementById("taskWarning");
  if (!warning) return;

  warning.textContent = message;
  warning.hidden = false;
}

function clearTaskWarning() {
  const warning = document.getElementById("taskWarning");
  if (!warning) return;

  warning.textContent = "";
  warning.hidden = true;
}

function renderComplete() {
  window.currentScreenId = "complete";

  app.innerHTML = `
    <section class="screen">
      <div class="hero-card">
        <p class="eyebrow">Complete</p>
        <h1>Session finished</h1>
        <p class="muted">
          Download the session JSON and inspect it before Firebase upload is added.
        </p>

        <button class="primary-btn" onclick="downloadSessionJson()">Download JSON</button>
        <button class="secondary-btn" onclick="renderWelcome()">Start again</button>
      </div>
    </section>
  `;
}

function ensureEvidenceBucket(taskId) {
  if (!appState.evidenceByTask[taskId]) {
    appState.evidenceByTask[taskId] = {};
  }
}

function updateTaskEvidence(taskId, patch) {
  ensureEvidenceBucket(taskId);

  appState.evidenceByTask[taskId] = {
    ...appState.evidenceByTask[taskId],
    ...patch
  };
}

function getTaskEvidence(taskId) {
  ensureEvidenceBucket(taskId);
  return appState.evidenceByTask[taskId];
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAmount() {
  return (Math.random() * 40 + 3).toFixed(2);
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));

    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

renderWelcome();