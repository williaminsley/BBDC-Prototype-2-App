const app = document.getElementById("app");

const state = {
  identity: null,
  context: {},
  content: {},
  evidence: {},
  completedTasks: new Set(),
  currentTaskIndex: -1,
  activeArea: "home",
  selectedTransaction: null,
  reviewedInsights: new Set(),
  codeInput: ""
};

window.currentTask = null;
window.currentTaskIndex = null;
window.currentScreenId = "consent";

function renderConsent() {
  state.identity = ensureIdentity();
  window.currentScreenId = "consent";
  app.innerHTML = `
    <section class="intro-screen">
      <div class="brand-pill">Research prototype</div>
      <h1>Continuous Authentication Using Behavioural Biometrics</h1>
      <p class="lead">This short banking-style prototype records how you interact with the app, not real banking details.</p>
      <div class="privacy-grid">
        <article class="info-card accent-coral"><span class="card-icon">Tap</span><h2>Collected</h2><p>Timing, taps, scrolling, typing rhythm, pointer/touch movement, viewport changes and motion/orientation where available.</p></article>
        <article class="info-card accent-teal"><span class="card-icon">Safe</span><h2>Not collected</h2><p>No raw typed text, no geolocation, no real banking data and no manual personal identifier.</p></article>
        <article class="info-card accent-yellow"><span class="card-icon">Flow</span><h2>What you do</h2><p>Complete a guided Pulse Bank review: search, scroll, categorise, move money, review insights and reply securely.</p></article>
      </div>
      <div class="inline-note"><strong>Anonymous ID</strong><span>${escapeHtml(state.identity.participantId)}</span></div>
      <label class="check-row"><input id="consentCheck" type="checkbox" /><span>I understand this is a research prototype and I can stop at any time.</span></label>
      <button id="consentNext" class="primary-btn" disabled>Continue</button>
    </section>`;
  const check = document.getElementById("consentCheck");
  const btn = document.getElementById("consentNext");
  check.addEventListener("change", () => { btn.disabled = !check.checked; });
  btn.addEventListener("click", renderContext);
}

function renderContext() {
  state.identity = ensureIdentity();
  window.currentScreenId = "context";
  app.innerHTML = `
    <section class="intro-screen compact-intro">
      <div class="brand-pill">Before you start</div>
      <h1>How are you using the app?</h1>
      <p class="lead">These quick context answers help interpret behaviour across different situations.</p>
      <div class="id-strip"><span>Anonymous ID</span><strong>${escapeHtml(state.identity.participantId)}</strong></div>
      ${renderSegmentGroup("posture", "Posture", ["Sitting", "Standing", "Walking / moving"])}
      ${renderSegmentGroup("handUse", "Hand use", ["Two-handed", "One-handed right", "One-handed left"])}
      ${renderSegmentGroup("dominantHand", "Dominant hand", ["Right", "Left", "Ambidextrous"])}
      ${renderSegmentGroup("environment", "Environment", ["Quiet", "Normal", "Noisy", "Moving / travelling"])}
      ${renderSegmentGroup("focus", "Focus", ["Focused", "Neutral", "Distracted"])}
      ${renderSegmentGroup("tiredness", "Tiredness", ["Not tired", "Slightly tired", "Tired"])}
      <button class="primary-btn" id="startReview">Open Pulse Bank</button>
    </section>`;
  bindSegmentGroups();
  document.getElementById("startReview").addEventListener("click", startReview);
}

function renderSegmentGroup(id, label, options) {
  return `<fieldset class="seg-group" data-field="${id}"><legend>${escapeHtml(label)}</legend><div class="seg-row">${options.map((option, i) => `<button type="button" class="seg-chip ${i === 0 ? "selected" : ""}" data-value="${escapeAttr(slugify(option))}">${escapeHtml(option)}</button>`).join("")}</div></fieldset>`;
}

function bindSegmentGroups() {
  document.querySelectorAll(".seg-group").forEach((group) => {
    group.querySelectorAll(".seg-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        group.querySelectorAll(".seg-chip").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
      });
    });
  });
}

async function startReview() {
  state.context = {};
  document.querySelectorAll(".seg-group").forEach((group) => {
    const selected = group.querySelector(".seg-chip.selected");
    state.context[group.dataset.field] = selected?.dataset.value || null;
  });
  state.content = generateSessionContent();
  state.evidence = {};
  state.completedTasks = new Set();
  state.currentTaskIndex = -1;
  state.reviewedInsights = new Set();
  state.codeInput = "";
  createSession(state.context, publicGeneratedContent(state.content));
  const permissionResult = await requestMotionPermission();
  startMotionLogging();
  logEvent("motion_logging_started", { permissionResult });
  goToTask(0);
}

function publicGeneratedContent(content) {
  return {
    targetMerchant: content.target.merchant,
    targetAmount: content.target.amount,
    targetCategory: content.target.category,
    suggestedNote: content.target.note,
    suggestedReply: content.target.reply,
    codeLength: content.code.length,
    transferAmount: content.transferAmount,
    insightTarget: content.insightTarget.title,
    expectedApprovalAction: content.expectedApprovalAction,
    feedItemCount: content.feedItems.length
  };
}

function generateSessionContent() {
  const target = randomChoice(BANKING_LIBRARY.merchants);
  const code = randomChoice(BANKING_LIBRARY.codes);
  const transferAmount = randomChoice(BANKING_LIBRARY.transferAmounts);
  const insightTarget = randomChoice(BANKING_LIBRARY.insightTemplates);
  const feedItems = shuffleArray([
    ...BANKING_LIBRARY.fillerTransactions,
    ...BANKING_LIBRARY.merchants.filter((m) => m.merchant !== target.merchant).map((m) => ({ ...m, when: randomChoice(["This week", "Last week", "Last month"]) })),
    { ...target, when: "Last month", isTarget: true }
  ]).map((item, idx) => ({ ...item, id: `txn_${idx}_${slugify(item.merchant)}` }));
  return { code, target, searchTerm: target.merchant, feedItems, accounts: BANKING_LIBRARY.accounts, categories: BANKING_LIBRARY.categories, pots: BANKING_LIBRARY.pots, transferAmount, insights: shuffleArray([...BANKING_LIBRARY.insightTemplates]), insightTarget, approvalPayment: { merchant: "Nottingham Coffee", amount: "GBP 4.80" }, expectedApprovalAction: "Approve" };
}

function goToTask(index) {
  if (window.currentTask && state.currentTaskIndex >= 0 && !state.completedTasks.has(window.currentTask.id)) {
    logTaskEnd(window.currentTask, state.currentTaskIndex, getEvidence(window.currentTask.id));
    state.completedTasks.add(window.currentTask.id);
  }
  state.currentTaskIndex = index;
  window.currentTaskIndex = index;
  window.currentTask = GUIDED_TASKS[index] || null;
  if (!window.currentTask) return renderCompletion();
  state.activeArea = window.currentTask.area === "finish" ? "secure" : window.currentTask.area;
  ensureEvidence(window.currentTask.id);
  logTaskStart(window.currentTask, index);
  if (window.currentTask.type === "code") renderCode();
  else renderBankShell();
}

function renderCode() {
  window.currentScreenId = "secure_code";
  app.innerHTML = `<section class="passcode-screen"><div class="passcode-card"><div class="lock-badge">Lock</div><p class="eyebrow">Secure login</p><h1>Enter demo passcode</h1><p class="muted">Face ID is unavailable in this demo. Copy the passcode below.</p><div class="demo-code">${escapeHtml(state.content.code)}</div><div class="pass-dots">${[0,1,2,3].map((i) => `<span class="${state.codeInput.length > i ? "filled" : ""}"></span>`).join("")}</div><div class="keypad" data-component-id="code_keypad">${[1,2,3,4,5,6,7,8,9,"Back",0,"Clear"].map((n) => `<button class="keypad-btn" data-key="${escapeAttr(String(n))}" data-component-id="code_key_${escapeAttr(String(n))}">${escapeHtml(String(n))}</button>`).join("")}</div><div id="codeWarning" class="task-warning" hidden></div></div></section>`;
  attachTaskElementLogging(document);
  document.querySelectorAll(".keypad-btn").forEach((btn) => btn.addEventListener("click", () => handleCodeKey(btn.dataset.key)));
  logEvent("screen_view", { screenId: "secure_code", taskId: window.currentTask.id });
}

function handleCodeKey(key) {
  const before = state.codeInput.length;
  if (key === "Clear") state.codeInput = "";
  else if (key === "Back") state.codeInput = state.codeInput.slice(0, -1);
  else if (/^\d$/.test(key) && state.codeInput.length < 4) state.codeInput += key;
  const after = state.codeInput.length;
  logEvent("passcode_digit_tap", { componentId: `code_key_${key}`, keyClass: /^\d$/.test(key) ? "DIGIT" : "CONTROL", inputLengthBefore: before, inputLengthAfter: after, deltaLength: after - before });
  updateEvidence("unlock_code", { inputLength: after, targetLength: state.content.code.length, corrections: (getEvidence("unlock_code").corrections || 0) + (key === "Back" || key === "Clear" ? 1 : 0), codeCorrect: state.codeInput === state.content.code });
  renderCodeDots();
  if (state.codeInput.length === 4) {
    if (state.codeInput === state.content.code) {
      updateEvidence("unlock_code", { completedWithCorrectCode: true });
      setTimeout(() => goToTask(1), 180);
    } else {
      const warning = document.getElementById("codeWarning");
      warning.textContent = "That did not match the demo passcode. Clear and try again.";
      warning.hidden = false;
    }
  }
}

function renderCodeDots() {
  const dots = document.querySelector(".pass-dots");
  if (dots) dots.innerHTML = [0,1,2,3].map((i) => `<span class="${state.codeInput.length > i ? "filled" : ""}"></span>`).join("");
}

function renderBankShell() {
  const task = window.currentTask;
  window.currentScreenId = `${state.activeArea}_${task.id}`;
  app.innerHTML = `<section class="bank-screen"><header class="bank-header"><div><p class="eyebrow">Pulse Bank</p><h1>${headingForArea(state.activeArea)}</h1></div><button class="avatar" data-component-id="profile_button">${escapeHtml(state.identity?.participantId?.slice(1,3) || "PB")}</button></header><div class="review-banner"><div><p>${task.id === "finish_feeling" ? "Final check" : `Review step ${state.currentTaskIndex + 1} of ${GUIDED_TASKS.length}`}</p><strong>${escapeHtml(task.title)}</strong><span>${instructionForTask(task)}</span></div><div class="progress-ring">${Math.round(((state.currentTaskIndex + 1) / GUIDED_TASKS.length) * 100)}%</div></div><div class="bank-content">${renderAreaContent(task)}</div><div id="taskWarning" class="task-warning" hidden></div>${task.type === "finish" ? "" : `<button class="primary-btn sticky-action" data-component-id="continue_button" id="continueBtn">Continue</button>`}${renderBottomNav()}</section>`;
  attachTaskElementLogging(document);
  bindAreaHandlers(task);
  document.getElementById("continueBtn")?.addEventListener("click", attemptContinue);
  logEvent("screen_view", { screenId: window.currentScreenId, taskId: task.id, area: state.activeArea });
}

function renderBottomNav() {
  return `<nav class="bottom-nav">${NAV_TABS.map((tab) => `<button class="nav-tab ${tab.id === state.activeArea ? "active" : ""}" data-area="${tab.id}" data-component-id="nav_${tab.id}"><span>${escapeHtml(tab.icon)}</span><small>${escapeHtml(tab.label)}</small></button>`).join("")}</nav>`;
}

function headingForArea(area) { return { home: "Home", activity: "Activity", pots: "Pots", insights: "Insights", secure: "Secure" }[area] || "Pulse"; }

function instructionForTask(task) {
  const target = state.content.target;
  const map = {
    home_balance_check: "Tap the Current Account card after checking the balance.",
    activity_search: `Search for: ${target.merchant}`,
    activity_scroll_select: `Find ${target.merchant} from last month and tap it.`,
    transaction_category: `Categorise ${target.merchant} as ${target.category}.`,
    transaction_note: `Copy this note: ${target.note}`,
    pots_transfer: `Move GBP ${state.content.transferAmount} to Travel Pot.`,
    insights_review: `Tap the insight: ${state.content.insightTarget.title}.`,
    secure_approval: `Approve ${state.content.approvalPayment.merchant} for ${state.content.approvalPayment.amount}.`,
    secure_reply: `Copy: ${target.reply}`,
    finish_feeling: "Choose how this review felt."
  };
  return map[task.id] || task.title;
}

function renderAreaContent(task) {
  switch (task.type) {
    case "tap_account": return renderHome();
    case "typing_search": return renderActivitySearch();
    case "transaction_feed": return renderActivityFeed();
    case "categorise": return renderTransactionDetail(false);
    case "guided_note": return renderTransactionDetail(true);
    case "pots_transfer": return renderPots();
    case "insights_review": return renderInsights();
    case "approval": return renderSecureApproval();
    case "guided_reply": return renderSecureReply();
    case "finish": return renderFinish();
    default: return `<p>Unknown step.</p>`;
  }
}

function renderHome() {
  return `<div class="balance-hero"><span>Pulse</span><p>Good afternoon</p><h2>GBP 2,112.77</h2><small>Across Pulse accounts</small></div><div class="card-list">${state.content.accounts.map((a) => `<button class="account-card ${a.accent}" data-account-id="${a.id}" data-component-id="account_${a.id}"><span><strong>${escapeHtml(a.name)}</strong><small>${escapeHtml(a.sub)}</small></span><b>${escapeHtml(a.balance)}</b></button>`).join("")}</div><div class="mini-grid"><div class="mini-card"><span>Pots</span><strong>3 pots</strong><small>GBP 1,556 saved</small></div><div class="mini-card"><span>Alerts</span><strong>2 alerts</strong><small>Ready to review</small></div></div>`;
}

function renderActivitySearch() {
  return `<div class="section-card search-card"><p class="muted">Find this merchant</p><h2>${escapeHtml(state.content.searchTerm)}</h2><label class="input-label" for="searchInput">Search transactions</label><input id="searchInput" data-component-id="search_input" class="text-input" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Type merchant name" /></div>${renderRecentPreview()}`;
}

function renderRecentPreview() { return `<div class="section-card"><div class="section-title"><strong>Recent activity</strong><span>Preview</span></div>${state.content.feedItems.slice(0, 4).map((item) => renderTransactionRow(item, false)).join("")}</div>`; }

function renderActivityFeed() { return `<div class="section-card"><div class="search-pill">Search: ${escapeHtml(state.content.searchTerm)}</div><p class="muted">Scroll to last month and open the matching payment.</p></div><div class="transaction-feed" data-log-scroll="true" data-component-id="transaction_feed">${state.content.feedItems.map((item) => renderTransactionRow(item, true)).join("")}</div>`; }

function renderTransactionRow(item, interactive) {
  return `<button class="txn-row" ${interactive ? `data-txn-id="${escapeAttr(item.id)}"` : "disabled"} data-component-id="txn_${slugify(item.merchant)}"><span class="txn-icon">${escapeHtml(item.icon || "TX")}</span><span class="txn-main"><strong>${escapeHtml(item.merchant)}</strong><small>${escapeHtml(item.when || "Today")} · ${escapeHtml(item.category || "Card")}</small></span><span class="txn-amount">${escapeHtml(item.amount)}</span></button>`;
}

function renderTransactionDetail(showNote) {
  const target = state.content.target;
  const selectedCategory = getEvidence("transaction_category").category || null;
  if (showNote) return `<div class="transaction-detail-card"><span class="large-emoji">${escapeHtml(target.icon)}</span><h2>${escapeHtml(target.merchant)}</h2><h3>${escapeHtml(target.amount)}</h3><p>Last month · Card payment · ${escapeHtml(target.hint)}</p></div><div class="section-card"><p class="muted">Copy this payment note</p><h2>${escapeHtml(target.note)}</h2><textarea id="noteInput" data-component-id="payment_note_input" class="text-area" autocomplete="off" spellcheck="false" placeholder="Copy note here"></textarea></div>`;
  return `<div class="transaction-detail-card"><span class="large-emoji">${escapeHtml(target.icon)}</span><h2>${escapeHtml(target.merchant)}</h2><h3>${escapeHtml(target.amount)}</h3><p>Last month · Card payment · ${escapeHtml(target.hint)}</p></div><div class="section-card"><p class="muted">Choose category</p><h2>${escapeHtml(target.category)}</h2><div class="chip-grid">${state.content.categories.map((cat) => `<button class="category-chip ${selectedCategory === cat ? "selected" : ""}" data-category="${escapeAttr(cat)}" data-component-id="category_${slugify(cat)}">${escapeHtml(cat)}</button>`).join("")}</div></div>`;
}

function renderPots() {
  return `<div class="pot-list">${state.content.pots.map((pot) => `<button class="pot-card ${pot.id === "travel" ? "highlight" : ""}" data-pot-id="${pot.id}" data-component-id="pot_${pot.id}"><span>${escapeHtml(pot.icon)}</span><span><strong>${escapeHtml(pot.name)}</strong><small>${escapeHtml(pot.balance)} saved of ${escapeHtml(pot.target)}</small></span></button>`).join("")}</div><div class="section-card"><p class="muted">Amount to move to Travel Pot</p><h2>GBP ${escapeHtml(state.content.transferAmount)}</h2><input id="potAmountInput" data-component-id="pot_amount_input" class="text-input" inputmode="numeric" autocomplete="off" placeholder="Enter amount" /><button id="moveMoneyBtn" class="secondary-action" data-component-id="move_money_button">Move money</button></div>`;
}

function renderInsights() {
  return `<div class="section-card"><p class="muted">Notification to find</p><h2>${escapeHtml(state.content.insightTarget.title)}</h2></div><div class="insight-list" data-log-scroll="true" data-component-id="insight_list">${state.content.insights.map((insight) => `<button class="insight-card ${state.reviewedInsights.has(insight.id) ? "selected" : ""}" data-insight-id="${insight.id}" data-component-id="insight_${insight.id}"><span>${escapeHtml(insight.icon)}</span><strong>${escapeHtml(insight.title)}</strong><small>${escapeHtml(insight.body)}</small></button>`).join("")}</div>`;
}

function renderSecureApproval() {
  return `<div class="approval-card"><span class="large-emoji">NC</span><p class="muted">Demo payment request</p><h2>${escapeHtml(state.content.approvalPayment.merchant)}</h2><h3>${escapeHtml(state.content.approvalPayment.amount)}</h3><div class="approval-actions"><button class="decline-btn" data-approval="Decline" data-component-id="approval_decline">Decline</button><button class="approve-btn" data-approval="Approve" data-component-id="approval_approve">Approve</button></div></div>`;
}

function renderSecureReply() {
  const target = state.content.target;
  return `<div class="message-bubble incoming"><p>Should we save the note for ${escapeHtml(target.merchant)}?</p></div><div class="section-card"><p class="muted">Copy this secure reply</p><h2>${escapeHtml(target.reply)}</h2><textarea id="replyInput" data-component-id="secure_reply_input" class="text-area" autocomplete="off" spellcheck="false" placeholder="Copy reply here"></textarea></div>`;
}

function renderFinish() {
  return `<div class="finish-card"><span class="large-emoji">Done</span><h2>Review complete</h2><p class="muted">How did this review feel?</p><div class="chip-grid feeling-grid">${BANKING_LIBRARY.feelings.map((f) => `<button class="feeling-chip" data-feeling="${escapeAttr(f)}" data-component-id="feeling_${slugify(f)}">${escapeHtml(f)}</button>`).join("")}</div></div>`;
}

function bindAreaHandlers(task) {
  document.querySelectorAll(".nav-tab").forEach((btn) => btn.addEventListener("click", () => { logEvent("nav_tab_clicked", { componentId: btn.dataset.componentId, area: btn.dataset.area, activeArea: state.activeArea }); if (btn.dataset.area !== state.activeArea) showWarning("Follow the highlighted review step first — the rest of the app will open as you progress."); }));
  if (task.type === "tap_account") document.querySelectorAll(".account-card").forEach((card) => card.addEventListener("click", () => { document.querySelectorAll(".account-card").forEach((c) => c.classList.remove("selected")); card.classList.add("selected"); updateEvidence(task.id, { accountReviewed: card.dataset.accountId === "current", selectedAccount: card.dataset.accountId }); logEvent("account_card_selected", { componentId: card.dataset.componentId, accountId: card.dataset.accountId }); }));
  if (["typing_search", "guided_note", "guided_reply"].includes(task.type)) bindTypingTask(task);
  if (task.type === "transaction_feed") document.querySelectorAll("[data-txn-id]").forEach((row) => row.addEventListener("click", () => { const item = state.content.feedItems.find((x) => x.id === row.dataset.txnId); state.selectedTransaction = item; document.querySelectorAll(".txn-row").forEach((r) => r.classList.remove("selected")); row.classList.add("selected"); const selectedTarget = !!item?.isTarget; updateEvidence(task.id, { selectedTarget, selectedMerchantIsGeneratedTarget: selectedTarget, selectedCategory: item?.category || null }); logEvent("transaction_selected", { componentId: row.dataset.componentId, selectedTarget, merchantIsGeneratedTarget: selectedTarget }); if (selectedTarget) setTimeout(() => goToTask(state.currentTaskIndex + 1), 220); }));
  if (task.type === "categorise") document.querySelectorAll(".category-chip").forEach((chip) => chip.addEventListener("click", () => { document.querySelectorAll(".category-chip").forEach((c) => c.classList.remove("selected")); chip.classList.add("selected"); const category = chip.dataset.category; updateEvidence(task.id, { categorySelected: true, category, expectedCategory: state.content.target.category, correctCategory: category === state.content.target.category }); logEvent("category_selected", { componentId: chip.dataset.componentId, category, correctCategory: category === state.content.target.category }); }));
  if (task.type === "pots_transfer") { document.querySelectorAll(".pot-card").forEach((pot) => pot.addEventListener("click", () => { document.querySelectorAll(".pot-card").forEach((p) => p.classList.remove("selected")); pot.classList.add("selected"); updateEvidence(task.id, { potSelected: pot.dataset.potId, travelPotSelected: pot.dataset.potId === "travel" }); logEvent("pot_selected", { componentId: pot.dataset.componentId, potId: pot.dataset.potId }); })); bindTypingTask(task, document.getElementById("potAmountInput"), state.content.transferAmount); document.getElementById("moveMoneyBtn")?.addEventListener("click", () => { updateEvidence(task.id, { moveConfirmed: true, amountLength: document.getElementById("potAmountInput")?.value.length || 0 }); logEvent("pot_transfer_confirmed", { componentId: "move_money_button", expectedAmountLength: state.content.transferAmount.length }); }); }
  if (task.type === "insights_review") document.querySelectorAll(".insight-card").forEach((card) => card.addEventListener("click", () => { const insightId = card.dataset.insightId; state.reviewedInsights.add(insightId); card.classList.add("selected"); updateEvidence(task.id, { targetInsightTapped: insightId === state.content.insightTarget.id, reviewedCount: state.reviewedInsights.size }); logEvent("insight_card_selected", { componentId: card.dataset.componentId, isTargetInsight: insightId === state.content.insightTarget.id, reviewedCount: state.reviewedInsights.size }); }));
  if (task.type === "approval") document.querySelectorAll("[data-approval]").forEach((btn) => btn.addEventListener("click", () => { document.querySelectorAll("[data-approval]").forEach((b) => b.classList.remove("selected")); btn.classList.add("selected"); const action = btn.dataset.approval; updateEvidence(task.id, { approvalSelected: true, action, expectedAction: state.content.expectedApprovalAction, correctAction: action === state.content.expectedApprovalAction }); logEvent("secure_approval_selected", { componentId: btn.dataset.componentId, action, correctAction: action === state.content.expectedApprovalAction }); }));
  if (task.type === "finish") document.querySelectorAll(".feeling-chip").forEach((btn) => btn.addEventListener("click", () => { document.querySelectorAll(".feeling-chip").forEach((b) => b.classList.remove("selected")); btn.classList.add("selected"); updateEvidence(task.id, { finalFeelingSelected: true, feeling: btn.dataset.feeling }); logEvent("final_feeling_selected", { componentId: btn.dataset.componentId, feeling: btn.dataset.feeling }); goToTask(state.currentTaskIndex + 1); }));
}

function bindTypingTask(task, inputOverride = null, targetOverride = null) {
  const input = inputOverride || document.querySelector("input, textarea");
  if (!input) return;
  const target = targetOverride || expectedTextForTask(task);
  let previousLength = input.value.length;
  input.addEventListener("input", () => { const currentLength = input.value.length; const delta = currentLength - previousLength; const corrections = (getEvidence(task.id).corrections || 0) + (delta < 0 ? 1 : 0); previousLength = currentLength; updateEvidence(task.id, { inputLength: currentLength, targetLength: target.length, deltaLengthLast: delta, corrections, completedLength: currentLength >= target.length, exactMatch: input.value === target }); });
}

function expectedTextForTask(task) {
  if (task.id === "activity_search") return state.content.searchTerm;
  if (task.id === "transaction_note") return state.content.target.note;
  if (task.id === "secure_reply") return state.content.target.reply;
  if (task.id === "pots_transfer") return state.content.transferAmount;
  return "";
}

function attemptContinue() { const task = window.currentTask; const warning = validateTask(task); if (warning) return showWarning(warning); clearWarning(); goToTask(state.currentTaskIndex + 1); }

function validateTask(task) {
  const ev = getEvidence(task.id);
  switch (task.id) {
    case "home_balance_check": return ev.accountReviewed ? null : "Tap the Current Account card to continue.";
    case "activity_search": return ev.exactMatch ? null : `Type the exact merchant: ${state.content.searchTerm}`;
    case "activity_scroll_select": return ev.selectedTarget ? null : `Tap the ${state.content.target.merchant} payment from last month.`;
    case "transaction_category": return ev.correctCategory ? null : `Choose ${state.content.target.category}.`;
    case "transaction_note": return ev.exactMatch ? null : `Copy the exact note: ${state.content.target.note}`;
    case "pots_transfer": return ev.travelPotSelected && ev.exactMatch && ev.moveConfirmed ? null : `Select Travel Pot, type ${state.content.transferAmount}, then tap Move money.`;
    case "insights_review": return ev.targetInsightTapped ? null : `Tap the ${state.content.insightTarget.title} insight.`;
    case "secure_approval": return ev.correctAction ? null : `Choose ${state.content.expectedApprovalAction}.`;
    case "secure_reply": return ev.exactMatch ? null : "Copy the exact secure reply.";
    default: return null;
  }
}

function showWarning(message) { const warning = document.getElementById("taskWarning"); if (warning) { warning.textContent = message; warning.hidden = false; } }
function clearWarning() { const warning = document.getElementById("taskWarning"); if (warning) { warning.textContent = ""; warning.hidden = true; } }

function renderCompletion() {
  window.currentTask = null;
  window.currentScreenId = "complete";
  completeSession();
  const s = getSession();
  app.innerHTML = `<section class="intro-screen completion-screen"><div class="success-orb">OK</div><h1>Review complete</h1><p class="lead">Thanks — this session is ready for development review.</p><div class="summary-card"><div><span>Anonymous ID</span><strong>${escapeHtml(s.participantId)}</strong></div><div><span>Session</span><strong>${escapeHtml(String(s.sessionIndex))}</strong></div><div><span>Duration</span><strong>${Math.round((s.sessionDurationMs || 0) / 1000)}s</strong></div><div><span>Events</span><strong>${s.events.length}</strong></div></div>${APP_MODE === "debug" ? `<button class="primary-btn" onclick="downloadSessionJson()">Download JSON</button>` : `<p class="muted">Your session has been uploaded.</p>`}<button class="secondary-btn" onclick="renderContext()">Start another session</button></section>`;
}

function ensureEvidence(taskId) { if (!state.evidence[taskId]) state.evidence[taskId] = {}; }
function updateEvidence(taskId, patch) { ensureEvidence(taskId); state.evidence[taskId] = { ...state.evidence[taskId], ...patch }; }
function getEvidence(taskId) { ensureEvidence(taskId); return state.evidence[taskId]; }
function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffleArray(arr) { const copy = [...arr]; for (let i = copy.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; }
function slugify(value) { return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); }
function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function escapeAttr(value) { return escapeHtml(value); }

renderConsent();
