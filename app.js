const app = document.getElementById("app");

const appState = {
  currentTaskIndex: -1,
  selectedContext: {},
  content: {},
  evidenceByTask: {},
  identity: null
};

window.currentTask = null;
window.currentTaskIndex = null;
window.currentScreenId = "welcome";

function renderWelcome() {
  window.currentScreenId = "welcome";
  appState.identity = ensureIdentity();

  app.innerHTML = `
    <section class="screen banking-home">
      <div class="bank-topbar">
        <div>
          <p class="eyebrow">Pulse Bank</p>
          <h1>Good afternoon</h1>
        </div>
        <div class="avatar-dot">PB</div>
      </div>

      <div class="balance-card">
        <p class="muted">Total balance</p>
        <h2>£5,420.65</h2>
        <p class="positive">+£265.00 this month</p>
      </div>

      <div class="card">
        <h2>Daily banking review</h2>
        <p class="muted">
          Open your short Pulse Bank review. You’ll search transactions,
          categorise a payment, review insights and reply to a secure message.
        </p>

        <div class="privacy-box">
          <p><strong>Anonymous ID:</strong> ${escapeHtml(appState.identity.participantId)}</p>
          <p><strong>Privacy:</strong> raw typed text and geolocation are not stored.</p>
        </div>

        <button class="primary-btn" onclick="renderContext()">Start review</button>
      </div>
    </section>
  `;
}

function renderContext() {
  window.currentScreenId = "context";
  appState.identity = ensureIdentity();

  app.innerHTML = `
    <section class="screen">
      <div class="topbar">
        <span>Pulse Bank</span>
        <span>Setup</span>
      </div>

      <div class="card">
        <h2>Session context</h2>
        <p class="muted">Choose the option that best describes this run.</p>

        <div class="mini-card compact">
          <p class="muted">Anonymous participant</p>
          <h3>${escapeHtml(appState.identity.participantId)}</h3>
        </div>

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

        <button class="primary-btn" onclick="startSession()">Open secure review</button>
      </div>
    </section>
  `;

  attachTaskElementLogging(document);
}

async function startSession() {
  appState.identity = ensureIdentity();

  appState.selectedContext = {
    posture: document.getElementById("posture").value,
    handUse: document.getElementById("handUse").value,
    dominantHand: document.getElementById("dominantHand").value,
    environment: document.getElementById("environment").value
  };

  appState.content = generateSessionContent();
  appState.evidenceByTask = {};

  createSession(appState.selectedContext, appState.content);

  const motionPermission = await requestMotionPermission();
  startMotionLogging();

  logEvent("motion_logging_started", {
    permissionResult: motionPermission,
    participantId: appState.identity.participantId
  });

  goToTask(0);
}

function generateSessionContent() {
  const feedItems = shuffleArray([...BANKING_CONTENT.merchants]);
  const target = feedItems[0];

  return {
    target,
    searchTerm: target.merchant,
    feedItems,
    accounts: BANKING_CONTENT.accounts,
    categories: BANKING_CONTENT.categories,
    insights: BANKING_CONTENT.insights,
    actions: BANKING_CONTENT.actions,
    messagePrompt: `Pulse has found ${target.merchant} ${target.amount}. Should we save this note?`,
    suggestedReply: target.reply,
    suggestedNote: target.note
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
        <span>Pulse Bank</span>
        <span>${index + 1}/${TASKS.length}</span>
      </div>

      <div class="progress-track">
        <div class="progress-fill" style="width:${progress}%"></div>
      </div>

      <div class="task-header">
        <p class="eyebrow">Secure daily review</p>
        <h2>${escapeHtml(task.title)}</h2>
        <p class="muted">${escapeHtml(task.subtitle)}</p>
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
  const target = appState.content.target;

  switch (task.type) {
    case "hold":
      return `
        <button class="hold-card banking-lock" data-component-id="unlock_button">
          <span class="lock-icon">●</span>
          Hold to unlock review
        </button>
        <p class="hint">This gives a clear start point for the session.</p>
      `;

    case "account_overview":
      return `
        <div class="account-list">
          ${appState.content.accounts.map((a, i) => `
            <button class="account-card" data-account-card="true" data-component-id="account_${i}">
              <span>
                <strong>${escapeHtml(a.name)}</strong>
                <small>${escapeHtml(a.change)}</small>
              </span>
              <span>${escapeHtml(a.balance)}</span>
            </button>
          `).join("")}
        </div>
        <p class="hint">Tap one account card to confirm you have reviewed the overview.</p>
      `;

    case "typing_search":
      return `
        <div class="mini-card">
          <p class="muted">Search for this merchant</p>
          <h3>${escapeHtml(appState.content.searchTerm)}</h3>
        </div>
        <input class="large-input" data-component-id="search_input"
          placeholder="Type ${escapeAttr(appState.content.searchTerm)}"
          autocomplete="off" autocapitalize="none" spellcheck="false" />
      `;

    case "transaction_feed":
      return `
        <p class="hint">Find and tap <strong>${escapeHtml(target.merchant)}</strong>.</p>
        <div class="feed-list banking-feed" data-log-scroll="true" data-component-id="transaction_feed">
          ${appState.content.feedItems.map((item) => `
            <button class="feed-item" data-merchant="${escapeAttr(item.merchant)}" data-component-id="txn_${slugify(item.merchant)}">
              <span>
                <strong>${escapeHtml(item.merchant)}</strong>
                <small>Today · Card payment</small>
              </span>
              <span>${escapeHtml(item.amount)}</span>
            </button>
          `).join("")}
        </div>
      `;

    case "categorise":
      return `
        <div class="transaction-card">
          <p class="muted">Transaction</p>
          <h3>${escapeHtml(target.merchant)}</h3>
          <p>${escapeHtml(target.amount)} · Today</p>
        </div>
        <div class="chip-grid">
          ${appState.content.categories.map((c) => `
            <button class="chip" data-category="${escapeAttr(c)}" data-component-id="category_${slugify(c)}">
              ${escapeHtml(c)}
            </button>
          `).join("")}
        </div>
      `;

    case "guided_note":
      return `
        <div class="mini-card">
          <p class="muted">Copy this payment note</p>
          <h3>${escapeHtml(appState.content.suggestedNote)}</h3>
        </div>
        <textarea class="large-textarea" data-component-id="payment_note_input"
          placeholder="Copy: ${escapeAttr(appState.content.suggestedNote)}"
          autocomplete="off" spellcheck="false"></textarea>
      `;

    case "review_cards":
      return `
        <div class="insight-list">
          ${appState.content.insights.map((insight, i) => `
            <button class="insight-card" data-insight-card="true" data-component-id="insight_${i}">
              <strong>${escapeHtml(insight.title)}</strong>
              <span>${escapeHtml(insight.body)}</span>
            </button>
          `).join("")}
        </div>
        <p class="hint">Tap all three cards. Swipes/touch movement are still logged naturally.</p>
      `;

    case "choose_action":
      return `
        <div class="mini-card">
          <p class="muted">Recommended based on today</p>
          <h3>${escapeHtml(target.category)} · ${escapeHtml(target.merchant)}</h3>
        </div>
        <div class="action-list">
          ${appState.content.actions.map((a) => `
            <button class="action-card" data-action-card="true" data-action="${escapeAttr(a)}" data-component-id="action_${slugify(a)}">
              ${escapeHtml(a)}
            </button>
          `).join("")}
        </div>
      `;

    case "guided_reply":
      return `
        <div class="message-card">
          <p class="muted">Secure message from Pulse</p>
          <p>${escapeHtml(appState.content.messagePrompt)}</p>
        </div>
        <div class="mini-card">
          <p class="muted">Copy this reply</p>
          <h3>${escapeHtml(appState.content.suggestedReply)}</h3>
        </div>
        <textarea class="large-textarea" data-component-id="secure_reply_input"
          placeholder="Copy: ${escapeAttr(appState.content.suggestedReply)}"
          autocomplete="off" spellcheck="false"></textarea>
      `;

    case "finish":
      return `
        <div class="chip-grid">
          ${BANKING_CONTENT.feelings.map((x) => `
            <button class="chip" data-feeling="${escapeAttr(x)}" data-component-id="feeling_${slugify(x)}">
              ${escapeHtml(x)}
            </button>
          `).join("")}
        </div>
        <p class="hint">Choose one option to complete the banking review.</p>
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
    case "account_overview":
      attachAccountHandlers();
      break;
    case "typing_search":
    case "guided_note":
    case "guided_reply":
      attachTypingEvidenceHandlers(task);
      break;
    case "transaction_feed":
      attachFeedHandlers();
      break;
    case "categorise":
      attachCategoryHandlers();
      break;
    case "review_cards":
      attachInsightHandlers();
      break;
    case "choose_action":
      attachActionHandlers();
      break;
    case "finish":
      attachFinalCheckinHandlers();
      break;
    default:
      break;
  }
}

function attachHoldHandlers() {
  const el = document.querySelector("[data-component-id='unlock_button']");
  if (!el) return;

  let start = null;

  el.addEventListener("pointerdown", () => {
    start = performance.now();
    logEvent("hold_start", { componentId: "unlock_button" });
  });

  el.addEventListener("pointerup", () => {
    const durationMs = start ? Math.round(performance.now() - start) : null;
    updateTaskEvidence("unlock_bank", { holdEnds: 1, holdDurationMs: durationMs });
    logEvent("hold_end", { componentId: "unlock_button", durationMs });
  });
}

function attachAccountHandlers() {
  document.querySelectorAll("[data-account-card='true']").forEach((card) => {
    card.addEventListener("click", () => {
      markSelected(card, "[data-account-card='true']");
      updateTaskEvidence("account_overview", { accountReviewed: true });
      logEvent("account_card_selected", { componentId: card.dataset.componentId });
    });
  });
}

function attachTypingEvidenceHandlers(task) {
  const input = document.querySelector("input, textarea");
  if (!input) return;

  input.addEventListener("input", () => {
    updateTaskEvidence(task.id, {
      inputLength: input.value.length,
      targetLength:
        task.id === "search_transaction"
          ? appState.content.searchTerm.length
          : task.id === "transaction_note"
            ? appState.content.suggestedNote.length
            : appState.content.suggestedReply.length
    });
  });
}

function attachFeedHandlers() {
  document.querySelectorAll(".feed-item").forEach((button) => {
    button.addEventListener("click", () => {
      const merchant = button.dataset.merchant;
      const selectedTarget = merchant === appState.content.target.merchant;
      markSelected(button, ".feed-item");

      updateTaskEvidence("open_transaction", {
        selectedTarget,
        selectedMerchant: merchant
      });

      logEvent("transaction_selected", {
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
      markSelected(button, "[data-category]");

      updateTaskEvidence("categorise_transaction", {
        categorySelected: true,
        category,
        expectedCategory: appState.content.target.category
      });

      logEvent("category_selected", {
        componentId: button.dataset.componentId,
        category
      });
    });
  });
}

function attachInsightHandlers() {
  const reviewed = new Set();

  document.querySelectorAll("[data-insight-card='true']").forEach((card) => {
    card.addEventListener("click", () => {
      reviewed.add(card.dataset.componentId);
      card.classList.add("selected-card");

      updateTaskEvidence("review_insights", {
        cardsReviewed: reviewed.size
      });

      logEvent("insight_card_reviewed", {
        componentId: card.dataset.componentId,
        cardsReviewed: reviewed.size
      });
    });
  });
}

function attachActionHandlers() {
  document.querySelectorAll("[data-action-card='true']").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      markSelected(button, "[data-action-card='true']");

      updateTaskEvidence("choose_action", {
        actionSelected: true,
        action
      });

      logEvent("banking_action_selected", {
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
      markSelected(button, "[data-feeling]");

      updateTaskEvidence("finish_review", {
        finalFeeling: true,
        feeling
      });

      logEvent("final_feeling_selected", {
        componentId: button.dataset.componentId,
        feeling
      });
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
    case "unlock_bank":
      return evidence.holdEnds ? null : "Press and hold the unlock card first.";
    case "account_overview":
      return evidence.accountReviewed ? null : "Tap one account card before continuing.";
    case "search_transaction":
      return (evidence.inputLength || 0) >= Math.min(3, appState.content.searchTerm.length)
        ? null
        : `Type ${appState.content.searchTerm} into the search box.`;
    case "open_transaction":
      return evidence.selectedTarget
        ? null
        : `Tap the ${appState.content.target.merchant} transaction.`;
    case "categorise_transaction":
      return evidence.categorySelected ? null : "Choose a category first.";
    case "transaction_note":
      return (evidence.inputLength || 0) >= Math.min(4, appState.content.suggestedNote.length)
        ? null
        : `Copy the note: ${appState.content.suggestedNote}`;
    case "review_insights":
      return (evidence.cardsReviewed || 0) >= 3 ? null : "Tap all three insight cards.";
    case "choose_action":
      return evidence.actionSelected ? null : "Choose one banking action.";
    case "secure_message":
      return (evidence.inputLength || 0) >= Math.min(6, appState.content.suggestedReply.length)
        ? null
        : "Copy the suggested secure reply.";
    case "finish_review":
      return evidence.finalFeeling ? null : "Choose how the review felt.";
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
  const s = getSession();

  app.innerHTML = `
    <section class="screen banking-home">
      <div class="hero-card">
        <p class="eyebrow">Pulse Bank</p>
        <h1>Review complete</h1>

        <div class="mini-card">
          <p class="muted">Anonymous participant</p>
          <h3>${escapeHtml(s?.participantId || appState.identity?.participantId || "unknown")}</h3>
          <p class="hint">Session ${escapeHtml(String(s?.sessionIndex || ""))}</p>
        </div>

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

function markSelected(el, selector) {
  document.querySelectorAll(selector).forEach((x) => x.classList.remove("selected-card"));
  el.classList.add("selected-card");
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
