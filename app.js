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

const DEVICE_MODEL_OPTIONS = {
  iphone: [
    "iPhone 17e",
    "iPhone 17 Pro Max",
    "iPhone 17 Pro",
    "iPhone Air",
    "iPhone 17",
    "iPhone 16e",
    "iPhone 16 Pro Max",
    "iPhone 16 Pro",
    "iPhone 16 Plus",
    "iPhone 16",
    "iPhone 15 Pro Max",
    "iPhone 15 Pro",
    "iPhone 15 Plus",
    "iPhone 15",
    "iPhone 14 Pro Max",
    "iPhone 14 Pro",
    "iPhone 14 Plus",
    "iPhone 14",
    "iPhone 13 series",
    "iPhone 12 series or older",
    "Other iPhone / not sure"
  ],
  android: [
    "Samsung Galaxy S26 Ultra",
    "Samsung Galaxy S26+",
    "Samsung Galaxy S26",
    "Samsung Galaxy S25 Ultra",
    "Samsung Galaxy S25+",
    "Samsung Galaxy S25",
    "Samsung Galaxy Z Fold 7",
    "Samsung Galaxy Z Flip 7",
    "Samsung Galaxy A series",
    "Google Pixel 10 Pro XL",
    "Google Pixel 10 Pro",
    "Google Pixel 10",
    "Google Pixel 10a",
    "Google Pixel 9 / 9 Pro series",
    "OnePlus 15",
    "OnePlus 13 / 13R",
    "Xiaomi / Redmi / POCO phone",
    "Oppo phone",
    "Honor phone",
    "Motorola phone",
    "Sony Xperia phone",
    "Nothing Phone",
    "Other Android / not sure"
  ],
  tablet: ["iPad Pro", "iPad Air", "iPad mini", "Standard iPad", "Samsung Galaxy Tab", "Other tablet / not sure"],
  desktop: ["MacBook trackpad", "MacBook with mouse", "Windows laptop trackpad", "Windows laptop with mouse", "Desktop with mouse", "Other laptop/desktop"],
  other: ["Other device", "Not sure"]
};

window.currentTask = null;
window.currentTaskIndex = null;
window.currentScreenId = "intro";

// -----------------------------------------------------------------------------
// Pre-session flow
// -----------------------------------------------------------------------------

function renderIntro() {
  state.identity = ensureIdentity();
  window.currentScreenId = "intro";

  app.innerHTML = `
    <section class="intro-screen compact-intro">
      <h1>Behavioural Biometrics Study</h1>
      <p class="lead">This study collects pseudonymised behavioural interaction data for academic research into continuous authentication.</p>

      <article class="info-card">
        <h2>What you will do</h2>
        <p>Use a demo bank app naturally. You can move around the bottom menu like a normal app, but complete each highlighted task before finishing.</p>
        <p><strong>Tasks include:</strong> checking balances, searching transactions, finding a payment, categorising, typing short prompts, dragging a pot slider, swiping spending cards and approving a demo payment.</p>
      </article>

      <article class="info-card">
        <h2>What to expect</h2>
        <p>The full session should take around <strong>2-3 minutes</strong>. It is better to behave naturally than to rush.</p>
        <p>Before the app opens, you will answer context questions about your device, environment, posture, fatigue and focus.</p>
      </article>

      <article class="info-card">
        <h2>Important instructions</h2>
        <p>Use normal typing, scrolling, tapping, dragging and swiping behaviour.</p>
        <p>Only type the short prompted text shown in the app. Do not type personal information.</p>
        <p>Do not take part while driving or in any unsafe situation.</p>
      </article>

      <button id="introNext" class="primary-btn">Continue to Consent</button>
    </section>
  `;

  document.getElementById("introNext").addEventListener("click", renderConsent);
}

function renderConsent() {
  state.identity = ensureIdentity();
  window.currentScreenId = "consent";

  app.innerHTML = `
    <section class="intro-screen compact-intro">
      <h1>Consent</h1>
      <p class="lead">This study collects pseudonymised behavioural, contextual and device interaction data from short banking-style tasks.</p>

      <article class="info-card">
        <h2>What will be collected</h2>
        <p><strong>Typing metadata:</strong> key timing, input length, pauses and corrections. Raw typed content is not stored in the exported session file.</p>
        <p><strong>Touch/pointer metadata:</strong> taps, scrolls, drag paths, swipe movement, target selection timing and touch-contact fields where available.</p>
        <p><strong>Device and context:</strong> device/browser metadata, screen size, selected device model, posture, hand use, focus, fatigue and environment.</p>
        <p><strong>Motion/orientation:</strong> phone motion and orientation where supported and permission is granted.</p>
      </article>

      <article class="info-card">
        <h2>What is not intended to be collected</h2>
        <p>No name, email address, password, location or real banking data is requested. The bank content is fake demo content.</p>
        <p>Because device metadata and a Participant ID are recorded, this study should be understood as <strong>pseudonymised</strong>, not fully anonymous.</p>
      </article>

      <article class="info-card">
        <h2>How your data is used</h2>
        <p>Your session may be processed into derived features for academic research, modelling and dissertation reporting on behavioural biometrics and continuous authentication.</p>
        <p>Participation is voluntary. You can stop at any time by closing the page before finishing. If you later wish to withdraw uploaded data, quote the Participant ID shown on the Results screen.</p>
        <p><strong>18+ only.</strong></p>
      </article>

      <label class="check-row">
        <input id="consentAge" type="checkbox" />
        <span>I am 18 or over, I understand what data may be collected, and I agree to take part.</span>
      </label>

      <label class="check-row">
        <input id="consentBrowser" type="checkbox" />
        <span>I confirm that I am using a normal Safari or Chrome tab, not private/incognito mode.</span>
      </label>

      <button id="consentNext" class="primary-btn" disabled>Continue</button>
    </section>
  `;

  const age = document.getElementById("consentAge");
  const browser = document.getElementById("consentBrowser");
  const next = document.getElementById("consentNext");
  const update = () => { next.disabled = !(age.checked && browser.checked); };

  age.addEventListener("change", update);
  browser.addEventListener("change", update);
  next.addEventListener("click", renderContext);
}

function renderContext() {
  state.identity = ensureIdentity();
  window.currentScreenId = "context";

  app.innerHTML = `
    <section class="intro-screen compact-intro context-screen">
      <h1>Context Before You Start</h1>
      <p class="lead">Answer based on how you feel right now. These fields help interpret behavioural changes across devices and situations.</p>

      ${renderSegmentGroup("timeOfDay", "Time of day", ["Morning", "Afternoon", "Evening", "Night"])}
      ${renderRangeGroup("fatigue", "Fatigue", "1 = very alert, 5 = very tired", 1, 5, 3)}
      ${renderRangeGroup("focusLevel", "Focus", "1 = distracted, 5 = very focused", 1, 5, 3)}

      <article class="info-card form-card">
        <h2>Device-aware CA</h2>
        <p class="muted">Device model matters because screen size, touch sampling, keyboard layout and sensors can affect behavioural biometrics.</p>
        ${renderSelectField("devicePlatform", "Device type / platform", "Choose your device family.", ["iPhone", "Android phone", "iPad / tablet", "Laptop / desktop", "Other / not sure"], "devicePlatformSelect")}
        ${renderDeviceModelField()}
        ${renderDeviceModelHelp()}
      </article>

      <article class="info-card form-card">
        <h2>Input and environment</h2>
        ${renderSelectField("inputDevice", "Input method", "Choose the main input method.", ["Touch", "Trackpad", "Mouse", "Keyboard and trackpad", "Keyboard and mouse", "Other"])}
        ${renderSelectField("movement", "Movement", "For example sitting still, walking, train, bus or car passenger.", ["None", "Slight movement", "Walking / moving", "Public transport / vehicle", "Other"])}
        ${renderSelectField("environmentNoise", "Environment noise", null, ["Quiet", "Normal", "Noisy", "Very noisy"])}
        ${renderSelectField("privacy", "Privacy of setting", null, ["Private", "Shared room", "Public place", "Other people nearby"])}
        ${renderSelectField("alcohol", "Alcohol", null, ["No", "Yes - small amount", "Yes - moderate amount", "Prefer not to say"])}
        ${renderSelectField("caffeine", "Caffeine in last 2 hours", null, ["No", "Yes", "Prefer not to say"])}
      </article>

      ${renderSegmentGroup("posture", "Posture", ["Sitting", "Standing", "Walking / moving"])}
      ${renderSegmentGroup("handUse", "Hand use", ["Two-handed", "One-handed right", "One-handed left"])}
      ${renderSegmentGroup("dominantHand", "Dominant hand", ["Right", "Left", "Ambidextrous"])}
      ${renderSegmentGroup("devicePosition", "Phone / device position", ["Held in hand", "On desk / table", "Laptop keyboard", "External keyboard", "Other"])}

      <button class="primary-btn" id="startReview">Open bank app</button>
    </section>
  `;

  bindSegmentGroups();
  bindRangeLabels();
  bindDeviceModelSelect();
  document.getElementById("startReview").addEventListener("click", startReview);
}

function renderSegmentGroup(id, label, options) {
  return `
    <fieldset class="seg-group info-card" data-field="${id}">
      <legend><h2>${escapeHtml(label)}</h2></legend>
      <div class="seg-row">
        ${options.map((option, index) => `<button type="button" class="seg-chip ${index === 0 ? "selected" : ""}" data-value="${escapeAttr(slugify(option))}">${escapeHtml(option)}</button>`).join("")}
      </div>
    </fieldset>
  `;
}

function renderRangeGroup(id, label, help, min, max, value) {
  return `
    <article class="info-card range-card">
      <h2>${escapeHtml(label)}</h2>
      <p class="muted">${escapeHtml(help)}</p>
      <p class="muted">Current value: <strong id="${id}Value">${value}</strong></p>
      <input class="context-input" data-context-field="${id}" data-value-label="${id}Value" type="range" min="${min}" max="${max}" value="${value}" />
    </article>
  `;
}

function renderSelectField(id, label, help, options, elementId = "") {
  return `
    <label class="context-label">
      <span>${escapeHtml(label)}</span>
      ${help ? `<small>${escapeHtml(help)}</small>` : ""}
      <select ${elementId ? `id="${escapeAttr(elementId)}"` : ""} class="text-input context-input" data-context-field="${id}">
        ${options.map((option) => `<option value="${escapeAttr(slugify(option))}">${escapeHtml(option)}</option>`).join("")}
      </select>
    </label>
  `;
}

function renderDeviceModelField() {
  return `
    <label class="context-label">
      <span>Specific device model</span>
      <small>Select the closest option. Choose other / not sure if unsure.</small>
      <select id="deviceModelSelect" class="text-input context-input" data-context-field="deviceModel">
        ${DEVICE_MODEL_OPTIONS.iphone.map((option) => `<option value="${escapeAttr(slugify(option))}">${escapeHtml(option)}</option>`).join("")}
      </select>
    </label>
  `;
}

function renderDeviceModelHelp() {
  return `
    <details class="help-card">
      <summary>How to check your model</summary>
      <p><strong>iPhone:</strong> Settings → General → About → Model Name.</p>
      <p><strong>Android:</strong> Settings → About phone → Model name / Device name.</p>
      <p><strong>Laptop:</strong> macOS Apple menu → About This Mac, or Windows Settings → System → About.</p>
    </details>
  `;
}

function bindSegmentGroups() {
  document.querySelectorAll(".seg-group").forEach((group) => {
    group.querySelectorAll(".seg-chip").forEach((button) => {
      button.addEventListener("click", () => {
        group.querySelectorAll(".seg-chip").forEach((chip) => chip.classList.remove("selected"));
        button.classList.add("selected");
      });
    });
  });
}

function bindRangeLabels() {
  document.querySelectorAll("input[type='range'][data-value-label]").forEach((range) => {
    range.addEventListener("input", () => {
      const label = document.getElementById(range.dataset.valueLabel);
      if (label) label.textContent = range.value;
    });
  });
}

function bindDeviceModelSelect() {
  const platform = document.getElementById("devicePlatformSelect");
  if (!platform) return;
  platform.addEventListener("change", updateDeviceModelOptions);
  updateDeviceModelOptions();
}

function updateDeviceModelOptions() {
  const platform = document.getElementById("devicePlatformSelect");
  const model = document.getElementById("deviceModelSelect");
  if (!platform || !model) return;

  const group = modelGroupFromPlatform(platform.value);
  const options = DEVICE_MODEL_OPTIONS[group] || DEVICE_MODEL_OPTIONS.other;
  model.innerHTML = options.map((option) => `<option value="${escapeAttr(slugify(option))}">${escapeHtml(option)}</option>`).join("");
}

function modelGroupFromPlatform(value) {
  if (value === "iphone") return "iphone";
  if (value === "android_phone") return "android";
  if (value === "ipad_tablet") return "tablet";
  if (value === "laptop_desktop") return "desktop";
  return "other";
}

async function startReview() {
  state.context = collectContextAnswers();
  state.content = generateSessionContent();
  state.evidence = {};
  state.completedTasks = new Set();
  state.currentTaskIndex = -1;
  state.activeArea = "secure";
  state.selectedTransaction = null;
  state.reviewedInsights = new Set();
  state.codeInput = "";

  createSession(state.context, publicGeneratedContent(state.content));
  const permissionResult = await requestMotionPermission();
  startMotionLogging();
  logEvent("motion_logging_started", { permissionResult });

  goToTask(0);
}

function collectContextAnswers() {
  const context = {};
  document.querySelectorAll(".seg-group").forEach((group) => {
    context[group.dataset.field] = group.querySelector(".seg-chip.selected")?.dataset.value || null;
  });
  document.querySelectorAll(".context-input[data-context-field]").forEach((input) => {
    context[input.dataset.contextField] = input.value;
  });
  return context;
}

// -----------------------------------------------------------------------------
// Session content
// -----------------------------------------------------------------------------

function publicGeneratedContent(content) {
  return {
    targetMerchant: content.target.merchant,
    targetAmount: content.target.amount,
    targetCategory: content.target.category,
    targetWhen: content.target.when,
    suggestedNote: content.target.note,
    suggestedReply: content.target.reply,
    transferAmount: content.transferAmount,
    insightTarget: content.insightTarget.title,
    feedItemCount: content.feedItems.length,
    merchantOptionCount: content.merchantOptions.length,
    categoryOptionCount: content.categoryOptions.length,
    insightOptionCount: content.insights.length,
    gestureTasks: ["pots_drag_amount", "insights_swipe_cards", "secure_approval"]
  };
}

function generateSessionContent() {
  const baseTarget = randomChoice(BANKING_LIBRARY.merchants);
  const targetWhen = randomChoice(["Today", "Yesterday", "This week", "Last week", "Last month"]);
  const target = { ...baseTarget, when: targetWhen, isTarget: true, id: `target_${slugify(baseTarget.merchant)}_${slugify(targetWhen)}` };
  const insightTarget = randomChoice(buildInsightOptions(randomChoice(BANKING_LIBRARY.insightTemplates)));

  return {
    code: randomChoice(BANKING_LIBRARY.codes),
    target,
    targetItem: target,
    searchTerm: target.merchant,
    merchantOptions: placeTargetLow(buildMerchantOptions(target), (item) => item.merchant === target.merchant),
    feedItems: buildLongFeed(target),
    accounts: BANKING_LIBRARY.accounts,
    categoryOptions: placeTargetLow(buildCategoryOptions(target.category), (category) => category === target.category),
    pots: BANKING_LIBRARY.pots,
    transferAmount: randomChoice(BANKING_LIBRARY.transferAmounts),
    insights: placeTargetLow(buildInsightOptions(insightTarget), (insight) => insight.id === insightTarget.id),
    insightTarget,
    approvalPayment: { merchant: "Nottingham Coffee", amount: "GBP 4.80" },
    expectedApprovalAction: "Approve"
  };
}

function buildMerchantOptions(target) {
  const names = [
    "Amazon", "Apple", "ASOS", "Boots", "BP", "Caffe Nero", "Co-op", "Costa", "Deliveroo", "EE", "Five Guys", "Greggs", "H&M", "IKEA", "iCloud", "Lidl", "McDonald's", "National Express", "Netflix", "Nottingham Coffee", "Odeon", "Pret", "PureGym", "Rudy's Pizza", "Sainsbury's", "Shell", "Spotify", "Starbucks", "Subway", "Tesco", "The Gym Group", "Trainline", "Uber", "Unidays", "Waterstones", "Zara", "WHSmith", "Morrisons", "Aldi", "M&S", "Nando's", "Primark", "B&Q", "Currys", "Argos", "Superdrug", "Pizza Express", "Cineworld", "Lebara", "Vodafone"
  ];

  if (!names.includes(target.merchant)) names.push(target.merchant);

  return names.map((merchant, index) => {
    const match = BANKING_LIBRARY.merchants.find((item) => item.merchant === merchant) || BANKING_LIBRARY.fillerTransactions.find((item) => item.merchant === merchant) || {};
    return {
      merchant,
      category: match.category || randomChoice(["Shopping", "Food", "Travel", "Bills", "Subscription", "Groceries"]),
      icon: match.icon || merchant.slice(0, 2).toUpperCase(),
      hint: match.hint || "recent payment",
      id: `merchant_${index}_${slugify(merchant)}`
    };
  });
}

function buildCategoryOptions(targetCategory) {
  const categories = ["Automotive", "Bills", "Books", "Charity", "Coffee", "Education", "Entertainment", "Fitness", "Food", "Fuel", "Gifts", "Groceries", "Health", "Home", "Insurance", "Personal care", "Pets", "Rent", "Restaurants", "Savings", "Shopping", "Subscription", "Takeaway", "Transport", "Travel", "Utilities", "Work", "Other"];
  if (!categories.includes(targetCategory)) categories.push(targetCategory);
  return categories;
}

function buildInsightOptions(targetInsight) {
  const insights = [
    ...BANKING_LIBRARY.insightTemplates,
    { id: "groceries", title: "Groceries", body: "Supermarket spending increased this week.", icon: "GR" },
    { id: "takeaway", title: "Takeaway", body: "Takeaway orders are higher than usual.", icon: "TA" },
    { id: "fitness", title: "Fitness", body: "Your gym payment renewed this week.", icon: "FI" },
    { id: "shopping", title: "Shopping", body: "Shopping spend is spread across five merchants.", icon: "SH" },
    { id: "transport", title: "Transport", body: "Transport costs are lower this month.", icon: "TP" },
    { id: "health", title: "Health", body: "Health purchases appeared this week.", icon: "HE" },
    { id: "bills", title: "Bills", body: "Two bills are due in the next seven days.", icon: "BL" },
    { id: "savings", title: "Savings", body: "You are close to your monthly savings target.", icon: "SV" },
    { id: "weekend", title: "Weekend spending", body: "Weekend spending is above your weekday average.", icon: "WE" }
  ];
  if (targetInsight && !insights.some((insight) => insight.id === targetInsight.id)) insights.push(targetInsight);
  return insights;
}

function buildLongFeed(target) {
  const pool = [...BANKING_LIBRARY.fillerTransactions, ...BANKING_LIBRARY.merchants].filter((item) => item.merchant !== target.merchant);
  const dates = ["Today", "Yesterday", "This week", "Last week", "Last month"];
  const feed = [];

  for (let i = 0; i < 44; i += 1) {
    const source = pool[i % pool.length];
    feed.push({
      ...source,
      when: dates[(i * 2 + 1) % dates.length],
      isTarget: false,
      id: `txn_${i}_${slugify(source.merchant)}`
    });
  }

  feed.splice(Math.floor(feed.length * 0.68), 0, target);
  return feed;
}

function placeTargetLow(items, isTarget) {
  const copy = [...items];
  const targetIndex = copy.findIndex(isTarget);
  if (targetIndex < 0) return copy;
  const [target] = copy.splice(targetIndex, 1);
  copy.splice(Math.min(copy.length, Math.floor(copy.length * 0.72)), 0, target);
  return copy;
}

// -----------------------------------------------------------------------------
// Task flow
// -----------------------------------------------------------------------------

function goToTask(index) {
  if (window.currentTask && state.currentTaskIndex >= 0 && !state.completedTasks.has(window.currentTask.id)) {
    logTaskEnd(window.currentTask, state.currentTaskIndex, getEvidence(window.currentTask.id));
    state.completedTasks.add(window.currentTask.id);
  }

  state.currentTaskIndex = index;
  window.currentTaskIndex = index;
  window.currentTask = GUIDED_TASKS[index] || null;

  if (!window.currentTask) {
    renderCompletion();
    return;
  }

  state.activeArea = window.currentTask.area === "finish" ? "secure" : window.currentTask.area;
  ensureEvidence(window.currentTask.id);
  logTaskStart(window.currentTask, index);

  if (window.currentTask.type === "code") renderCode();
  else renderBankShell();
}

function renderCode() {
  window.currentScreenId = "secure_code";
  app.innerHTML = `
    <section class="passcode-screen">
      <div class="passcode-card">
        <div class="lock-badge">Lock</div>
        <p class="eyebrow">Secure login</p>
        <h1>Enter demo passcode</h1>
        <p class="muted">Copy the passcode below.</p>
        <div class="demo-code">${escapeHtml(state.content.code)}</div>
        <div class="pass-dots">${renderCodeDotsMarkup()}</div>
        <div class="keypad" data-component-id="code_keypad">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9, "Back", 0, "Clear"].map((key) => `<button class="keypad-btn" data-key="${escapeAttr(String(key))}" data-component-id="code_key_${escapeAttr(String(key))}">${escapeHtml(String(key))}</button>`).join("")}
        </div>
        <div id="codeWarning" class="task-warning" hidden></div>
      </div>
    </section>
  `;

  attachTaskElementLogging(document);
  document.querySelectorAll(".keypad-btn").forEach((button) => button.addEventListener("click", () => handleCodeKey(button.dataset.key)));
  logEvent("screen_view", { screenId: "secure_code", taskId: window.currentTask.id });
}

function handleCodeKey(key) {
  const before = state.codeInput.length;
  if (key === "Clear") state.codeInput = "";
  else if (key === "Back") state.codeInput = state.codeInput.slice(0, -1);
  else if (/^\d$/.test(key) && state.codeInput.length < 4) state.codeInput += key;

  const after = state.codeInput.length;
  logEvent("passcode_digit_tap", { componentId: `code_key_${key}`, keyClass: /^\d$/.test(key) ? "DIGIT" : "CONTROL", inputLengthBefore: before, inputLengthAfter: after, deltaLength: after - before });
  updateEvidence("unlock_code", { inputLength: after, codeCorrect: state.codeInput === state.content.code, corrections: (getEvidence("unlock_code").corrections || 0) + (key === "Back" || key === "Clear" ? 1 : 0) });
  renderCodeDots();

  if (state.codeInput.length === 4 && state.codeInput === state.content.code) {
    updateEvidence("unlock_code", { completedWithCorrectCode: true });
    setTimeout(() => goToTask(1), 200);
  } else if (state.codeInput.length === 4) {
    const warning = document.getElementById("codeWarning");
    warning.textContent = "That did not match the demo passcode. Clear and try again.";
    warning.hidden = false;
  }
}

function renderCodeDotsMarkup() {
  return [0, 1, 2, 3].map((i) => `<span class="${state.codeInput.length > i ? "filled" : ""}"></span>`).join("");
}

function renderCodeDots() {
  const dots = document.querySelector(".pass-dots");
  if (dots) dots.innerHTML = renderCodeDotsMarkup();
}

function renderBankShell() {
  const task = window.currentTask;
  window.currentScreenId = `${state.activeArea}_${task.id}`;

  app.innerHTML = `
    <section class="bank-screen">
      <header class="bank-header">
        <div>
          <p class="eyebrow">Bank app</p>
          <h1>${escapeHtml(headingForArea(state.activeArea))}</h1>
        </div>
        <button class="avatar" data-component-id="profile_button">${escapeHtml(state.identity?.participantId?.slice(1, 3) || "ID")}</button>
      </header>

      ${renderTaskBanner(task)}
      <div class="bank-content">${renderActiveArea()}</div>
      <div id="taskWarning" class="task-warning" hidden></div>

      <div class="sticky-stack">
        <button class="primary-btn" data-component-id="continue_button" id="continueBtn">Continue</button>
        ${renderBottomNav()}
      </div>
    </section>
  `;

  attachTaskElementLogging(document);
  bindAreaHandlers();
  document.getElementById("continueBtn")?.addEventListener("click", attemptContinue);
  logEvent("screen_view", { screenId: window.currentScreenId, taskId: task.id, area: state.activeArea });
}

function renderTaskBanner(task) {
  const tabLabel = headingForArea(task.area === "finish" ? "secure" : task.area);
  return `
    <div class="task-banner">
      <div>
        <p>Task ${state.currentTaskIndex + 1} of ${GUIDED_TASKS.length} · Go to ${escapeHtml(tabLabel)}</p>
        <strong>${escapeHtml(task.title)}</strong>
        <span>${escapeHtml(instructionForTask(task))}</span>
      </div>
      <div class="progress-ring">${Math.round(((state.currentTaskIndex + 1) / GUIDED_TASKS.length) * 100)}%</div>
    </div>
  `;
}

function renderBottomNav() {
  return `
    <nav class="bottom-nav">
      ${NAV_TABS.map((tab) => `<button class="nav-tab ${tab.id === state.activeArea ? "active" : ""}" data-area="${tab.id}" data-component-id="nav_${tab.id}"><span>${escapeHtml(tab.icon)}</span><small>${escapeHtml(tab.label)}</small></button>`).join("")}
    </nav>
  `;
}

function bindAreaHandlers() {
  document.querySelectorAll(".nav-tab").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeArea = button.dataset.area;
      logEvent("nav_tab_clicked", { componentId: button.dataset.componentId, area: state.activeArea });
      renderBankShell();
    });
  });

  if (state.activeArea === "home") bindHomeHandlers();
  if (state.activeArea === "activity") bindActivityHandlers();
  if (state.activeArea === "pots") bindPotsHandlers();
  if (state.activeArea === "insights") bindInsightsHandlers();
  if (state.activeArea === "secure") bindSecureHandlers();
}

function headingForArea(area) {
  return { home: "Home", activity: "Activity", pots: "Pots", insights: "Insights", secure: "Secure", finish: "Secure" }[area] || "Bank app";
}

function instructionForTask(task) {
  const target = state.content.target;
  return {
    home_balance_check: "Open Home and tap Current Account after checking the balance.",
    activity_search: `Open Activity, type ${target.merchant}, then select it from the merchant list.`,
    activity_scroll_select: `Open Activity and find the one ${target.merchant} payment from ${target.when}.`,
    transaction_category: `Open Activity and choose the ${target.category} category for the selected payment.`,
    transaction_note: `Open Activity and copy the note: ${target.note}`,
    pots_drag_amount: `Open Pots and drag the amount slider to GBP ${state.content.transferAmount}.`,
    pots_transfer: `Open Pots, select Travel Pot, type ${state.content.transferAmount}, then confirm.`,
    insights_swipe_cards: "Open Insights, swipe or scroll the cards, then select Travel.",
    insights_review: `Open Insights and select the ${state.content.insightTarget.title} insight.`,
    secure_approval: `Open Secure and approve ${state.content.approvalPayment.merchant} for ${state.content.approvalPayment.amount}.`,
    secure_reply: `Open Secure and copy: ${target.reply}`,
    finish_feeling: "Choose how the review felt."
  }[task.id] || task.title;
}

function renderActiveArea() {
  const task = window.currentTask;
  if (state.activeArea === "home") return renderHome();
  if (state.activeArea === "activity") {
    if (task.type === "typing_search") return renderActivitySearch();
    if (task.type === "transaction_feed") return renderActivityFeed();
    if (task.type === "categorise") return renderTransactionDetail(false);
    if (task.type === "guided_note") return renderTransactionDetail(true);
    return renderActivityOverview();
  }
  if (state.activeArea === "pots") {
    if (task.type === "pot_drag") return renderPotDrag();
    if (task.type === "pots_transfer") return renderPotTransfer();
    return renderPotsOverview();
  }
  if (state.activeArea === "insights") {
    if (task.type === "card_swipe") return renderCardSwipe();
    if (task.type === "insights_review") return renderInsightsList();
    return renderInsightsOverview();
  }
  if (state.activeArea === "secure") {
    if (task.type === "swipe_approval") return renderSecureApproval();
    if (task.type === "guided_reply") return renderSecureReply();
    if (task.type === "finish") return renderFinish();
    return renderSecureOverview();
  }
  return renderHome();
}

// -----------------------------------------------------------------------------
// Screen renderers
// -----------------------------------------------------------------------------

function renderHome() {
  return `
    <div class="balance-hero">
      <span>Bank app</span>
      <p>Good afternoon</p>
      <h2>GBP 2,112.77</h2>
      <small>Across demo accounts</small>
    </div>
    <div class="card-list">
      ${state.content.accounts.map((account) => `<button class="account-card ${account.accent}" data-account-id="${account.id}" data-component-id="account_${account.id}"><span><strong>${escapeHtml(account.name)}</strong><small>${escapeHtml(account.sub)}</small></span><b>${escapeHtml(account.balance)}</b></button>`).join("")}
    </div>
    <div class="mini-grid"><div class="mini-card"><span>Pots</span><strong>3 pots</strong><small>GBP 1,556 saved</small></div><div class="mini-card"><span>Alerts</span><strong>2 alerts</strong><small>Ready to review</small></div></div>
  `;
}

function renderActivityOverview() {
  return `
    <div class="section-card"><h2>Activity</h2><p class="muted">Explore recent demo payments. Use the task banner when you are ready to continue.</p></div>
    <div class="transaction-feed" data-log-scroll="true" data-component-id="activity_overview_feed">${state.content.feedItems.slice(0, 18).map((item) => renderTransactionRow(item)).join("")}</div>
  `;
}

function renderActivitySearch() {
  return `
    <div class="section-card search-card">
      <p class="muted">Find this merchant</p>
      <h2>${escapeHtml(state.content.searchTerm)}</h2>
      <label class="input-label" for="searchInput">Search transactions</label>
      <input id="searchInput" data-component-id="search_input" class="text-input" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Type merchant name" />
    </div>
    <div class="transaction-feed option-list" data-log-scroll="true" data-component-id="merchant_option_list">
      ${state.content.merchantOptions.map((option) => `<button class="txn-row merchant-option" data-merchant="${escapeAttr(option.merchant)}" data-component-id="merchant_option_${slugify(option.merchant)}"><span class="txn-icon">${escapeHtml(option.icon)}</span><span class="txn-main"><strong>${escapeHtml(option.merchant)}</strong><small>${escapeHtml(option.category)} · ${escapeHtml(option.hint)}</small></span><span class="txn-amount">View</span></button>`).join("")}
    </div>
  `;
}

function renderActivityFeed() {
  return `
    <div class="section-card"><div class="search-pill">Target: ${escapeHtml(state.content.target.merchant)} · ${escapeHtml(state.content.target.when)}</div><p class="muted">There is only one matching ${escapeHtml(state.content.target.merchant)} payment in the list. Scroll and open the one from ${escapeHtml(state.content.target.when)}.</p></div>
    <div class="transaction-feed" data-log-scroll="true" data-component-id="transaction_feed">${state.content.feedItems.map((item) => renderTransactionRow(item)).join("")}</div>
  `;
}

function renderTransactionRow(item) {
  return `
    <button class="txn-row" data-txn-id="${escapeAttr(item.id)}" data-component-id="txn_${slugify(item.id)}">
      <span class="txn-icon">${escapeHtml(item.icon || item.merchant.slice(0, 2).toUpperCase())}</span>
      <span class="txn-main"><strong>${escapeHtml(item.merchant)}</strong><small>${escapeHtml(item.when || "Today")} · ${escapeHtml(item.category || "Card")}</small></span>
      <span class="txn-amount">${escapeHtml(item.amount)}</span>
    </button>
  `;
}

function renderTransactionDetail(showNote) {
  const transaction = state.selectedTransaction || state.content.targetItem;
  if (showNote) {
    return `
      ${renderTransactionDetailCard(transaction)}
      <div class="section-card"><p class="muted">Copy this payment note</p><h2>${escapeHtml(state.content.target.note)}</h2><textarea id="noteInput" data-component-id="payment_note_input" class="text-area" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Copy note here"></textarea></div>
    `;
  }
  return `
    ${renderTransactionDetailCard(transaction)}
    <div class="section-card"><p class="muted">Choose the best category</p><h2>${escapeHtml(state.content.target.category)}</h2></div>
    <div class="transaction-feed option-list" data-log-scroll="true" data-component-id="category_option_list">${state.content.categoryOptions.map((category) => `<button class="txn-row category-option" data-category="${escapeAttr(category)}" data-component-id="category_${slugify(category)}"><span class="txn-icon">${escapeHtml(category.slice(0, 2).toUpperCase())}</span><span class="txn-main"><strong>${escapeHtml(category)}</strong><small>Payment category</small></span><span class="txn-amount">Select</span></button>`).join("")}</div>
  `;
}

function renderTransactionDetailCard(transaction) {
  return `<div class="transaction-detail-card"><span class="large-emoji">${escapeHtml(transaction.icon || "TX")}</span><h2>${escapeHtml(transaction.merchant)}</h2><h3>${escapeHtml(transaction.amount)}</h3><p>${escapeHtml(transaction.when)} · Card payment · ${escapeHtml(transaction.hint || transaction.category)}</p></div>`;
}

function renderPotsOverview() {
  return `<div class="section-card"><h2>Pots</h2><p class="muted">Explore demo savings pots.</p></div>${renderPotCards()}`;
}

function renderPotCards() {
  return `<div class="pot-list">${state.content.pots.map((pot) => `<button class="pot-card ${pot.id === "travel" ? "highlight" : ""}" data-pot-id="${pot.id}" data-component-id="pot_${pot.id}"><span>${escapeHtml(pot.icon)}</span><span><strong>${escapeHtml(pot.name)}</strong><small>${escapeHtml(pot.balance)} saved of ${escapeHtml(pot.target)}</small></span></button>`).join("")}</div>`;
}

function renderPotDrag() {
  return `
    <div class="section-card"><p class="muted">Controlled drag interaction</p><h2>Drag to GBP ${escapeHtml(state.content.transferAmount)}</h2><p class="muted">Use the thumb naturally. Release close to the target amount.</p><div class="drag-slider" data-component-id="pot_drag_slider"><div class="drag-fill" id="dragFill"></div><button class="drag-thumb" id="dragThumb" data-component-id="pot_drag_thumb">GBP 0</button></div><div class="slider-scale"><span>GBP 0</span><span>GBP 12</span></div></div>
    ${renderPotCards()}
  `;
}

function renderPotTransfer() {
  return `${renderPotCards()}<div class="section-card"><p class="muted">Manually confirm the amount</p><h2>Type GBP ${escapeHtml(state.content.transferAmount)}</h2><input id="potAmountInput" data-component-id="pot_amount_input" class="text-input" inputmode="numeric" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Enter amount again" /><button id="moveMoneyBtn" class="secondary-action" data-component-id="move_money_button">Move money</button></div>`;
}

function renderInsightsOverview() {
  return `<div class="section-card"><h2>Insights</h2><p class="muted">Explore spending cards and insight notifications.</p></div>${renderCardCarousel()}${renderInsightsListOnly()}`;
}

function renderCardSwipe() {
  return `<div class="section-card"><p class="muted">Swipe or scroll horizontally</p><h2>Select the Travel card</h2><p class="muted">Use the spending-card carousel naturally, then tap Travel.</p></div>${renderCardCarousel()}`;
}

function renderCardCarousel() {
  const cards = [
    { id: "food", title: "Food", amount: "GBP 42", body: "Small purchases this week" },
    { id: "subscriptions", title: "Subscriptions", amount: "GBP 45", body: "Recurring payments" },
    { id: "travel", title: "Travel", amount: "GBP 67", body: "Train and ride spending" }
  ];

  return `
    <div class="carousel-wrap">
      <button class="carousel-nudge" data-dir="-1" data-component-id="carousel_prev">‹</button>
      <div class="swipe-carousel" data-log-scroll="true" data-component-id="spending_card_carousel">${cards.map((card) => `<button class="spend-card ${card.id === "travel" ? "target" : ""}" data-card-id="${card.id}" data-component-id="spend_card_${card.id}"><span>${escapeHtml(card.title)}</span><strong>${escapeHtml(card.amount)}</strong><small>${escapeHtml(card.body)}</small></button>`).join("")}</div>
      <button class="carousel-nudge" data-dir="1" data-component-id="carousel_next">›</button>
    </div>
  `;
}

function renderInsightsList() {
  return `<div class="section-card"><p class="muted">Insight to review</p><h2>${escapeHtml(state.content.insightTarget.title)}</h2><p class="muted">Scroll the insight list and select the matching card.</p></div>${renderInsightsListOnly()}`;
}

function renderInsightsListOnly() {
  return `<div class="insight-list" data-log-scroll="true" data-component-id="insight_list">${state.content.insights.map((insight) => `<button class="insight-card ${state.reviewedInsights.has(insight.id) ? "selected" : ""}" data-insight-id="${escapeAttr(insight.id)}" data-component-id="insight_${slugify(insight.id)}"><span>${escapeHtml(insight.icon)}</span><strong>${escapeHtml(insight.title)}</strong><small>${escapeHtml(insight.body)}</small></button>`).join("")}</div>`;
}

function renderSecureOverview() {
  return `<div class="section-card"><h2>Secure</h2><p class="muted">Secure messages and approvals appear here.</p></div><div class="message-bubble"><p>No new secure messages yet.</p></div>`;
}

function renderSecureApproval() {
  return `<div class="approval-card"><span class="large-emoji">NC</span><p class="muted">Demo payment request</p><h2>${escapeHtml(state.content.approvalPayment.merchant)}</h2><h3>${escapeHtml(state.content.approvalPayment.amount)}</h3><div class="swipe-confirm" data-component-id="approval_swipe_track"><span>Swipe to approve</span><button id="approvalThumb" class="approval-thumb" data-component-id="approval_swipe_thumb">Approve</button></div><button class="decline-link" data-approval="Decline" data-component-id="approval_decline">Decline instead</button></div>`;
}

function renderSecureReply() {
  return `<div class="message-bubble incoming"><p>Should we save the note for ${escapeHtml(state.content.target.merchant)}?</p></div><div class="section-card"><p class="muted">Copy this secure reply</p><h2>${escapeHtml(state.content.target.reply)}</h2><textarea id="replyInput" data-component-id="secure_reply_input" class="text-area" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Copy reply here"></textarea></div>`;
}

function renderFinish() {
  return `<div class="finish-card"><span class="large-emoji">Done</span><h2>Review complete</h2><p class="muted">How did this review feel?</p><div class="chip-grid feeling-grid">${BANKING_LIBRARY.feelings.map((feeling) => `<button class="feeling-chip" data-feeling="${escapeAttr(feeling)}" data-component-id="feeling_${slugify(feeling)}">${escapeHtml(feeling)}</button>`).join("")}</div></div>`;
}

// -----------------------------------------------------------------------------
// Interaction handlers
// -----------------------------------------------------------------------------

function bindHomeHandlers() {
  document.querySelectorAll(".account-card").forEach((card) => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".account-card").forEach((item) => item.classList.remove("selected"));
      card.classList.add("selected");
      updateEvidence("home_balance_check", { accountReviewed: card.dataset.accountId === "current", selectedAccount: card.dataset.accountId });
      logEvent("account_card_selected", { componentId: card.dataset.componentId, accountId: card.dataset.accountId });
    });
  });
}

function bindActivityHandlers() {
  const task = window.currentTask;
  if (task.type === "typing_search") {
    bindTypingTask(task, document.getElementById("searchInput"), state.content.searchTerm);
    bindScrollEvidence("merchant_option_list", task.id, "merchantMaxScrollTop");
    document.querySelectorAll(".merchant-option").forEach((option) => {
      option.addEventListener("click", () => {
        document.querySelectorAll(".merchant-option").forEach((item) => item.classList.remove("selected"));
        option.classList.add("selected");
        const isTarget = option.dataset.merchant === state.content.target.merchant;
        updateEvidence(task.id, { merchantOptionSelected: isTarget, selectedMerchant: option.dataset.merchant });
        logEvent("merchant_option_selected", { componentId: option.dataset.componentId, selectedTargetMerchant: isTarget });
      });
    });
  }

  if (task.type === "transaction_feed" || task.type !== "typing_search") {
    bindScrollEvidence("transaction_feed", task.id, "feedMaxScrollTop");
    bindScrollEvidence("activity_overview_feed", task.id, "overviewFeedMaxScrollTop");
    document.querySelectorAll("[data-txn-id]").forEach((row) => {
      row.addEventListener("click", () => {
        const selected = state.content.feedItems.find((item) => item.id === row.dataset.txnId);
        if (!selected) return;
        state.selectedTransaction = selected;
        document.querySelectorAll(".txn-row").forEach((item) => item.classList.remove("selected"));
        row.classList.add("selected");
        updateEvidence("activity_scroll_select", { selectedTarget: !!selected.isTarget, selectedMerchant: selected.merchant, selectedWhen: selected.when, selectedAmount: selected.amount });
        logEvent("transaction_selected", { componentId: row.dataset.componentId, selectedTarget: !!selected.isTarget, merchant: selected.merchant, when: selected.when });
      });
    });
  }

  if (task.type === "categorise") {
    bindScrollEvidence("category_option_list", task.id, "categoryMaxScrollTop");
    document.querySelectorAll(".category-option").forEach((option) => {
      option.addEventListener("click", () => {
        document.querySelectorAll(".category-option").forEach((item) => item.classList.remove("selected"));
        option.classList.add("selected");
        const category = option.dataset.category;
        updateEvidence(task.id, { categorySelected: true, category, correctCategory: category === state.content.target.category });
        logEvent("category_selected", { componentId: option.dataset.componentId, category, correctCategory: category === state.content.target.category });
      });
    });
  }

  if (task.type === "guided_note") bindTypingTask(task, document.getElementById("noteInput"), state.content.target.note);
}

function bindPotsHandlers() {
  const task = window.currentTask;
  document.querySelectorAll(".pot-card").forEach((pot) => {
    pot.addEventListener("click", () => {
      document.querySelectorAll(".pot-card").forEach((item) => item.classList.remove("selected"));
      pot.classList.add("selected");
      updateEvidence("pots_transfer", { potSelected: pot.dataset.potId, travelPotSelected: pot.dataset.potId === "travel" });
      logEvent("pot_selected", { componentId: pot.dataset.componentId, potId: pot.dataset.potId });
    });
  });
  if (task.type === "pot_drag") bindPotDrag();
  if (task.type === "pots_transfer") {
    bindTypingTask(task, document.getElementById("potAmountInput"), state.content.transferAmount);
    document.getElementById("moveMoneyBtn")?.addEventListener("click", () => {
      updateEvidence(task.id, { moveConfirmed: true, amountLength: document.getElementById("potAmountInput")?.value.length || 0 });
      logEvent("pot_transfer_confirmed", { componentId: "move_money_button" });
    });
  }
}

function bindInsightsHandlers() {
  const task = window.currentTask;
  bindCardCarouselHandlers(task);
  if (task.type === "insights_review" || state.activeArea === "insights") {
    bindScrollEvidence("insight_list", task.id, "insightMaxScrollTop");
    document.querySelectorAll(".insight-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.dataset.insightId;
        state.reviewedInsights.add(id);
        card.classList.add("selected");
        updateEvidence("insights_review", { targetInsightTapped: id === state.content.insightTarget.id, selectedInsight: id, reviewedCount: state.reviewedInsights.size });
        logEvent("insight_card_selected", { componentId: card.dataset.componentId, isTargetInsight: id === state.content.insightTarget.id, reviewedCount: state.reviewedInsights.size });
      });
    });
  }
}

function bindCardCarouselHandlers(task) {
  const carousel = document.querySelector(".swipe-carousel");
  if (!carousel) return;
  let startX = 0;
  let startY = 0;
  let startTime = 0;

  bindHorizontalScrollEvidence(carousel, "insights_swipe_cards", "carouselMaxScrollLeft");

  carousel.addEventListener("pointerdown", (event) => {
    startX = event.clientX;
    startY = event.clientY;
    startTime = performance.now();
    logEvent("card_swipe_start", { componentId: "spending_card_carousel", x: event.clientX, y: event.clientY });
  }, { passive: true });

  carousel.addEventListener("pointerup", (event) => {
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    const durationMs = performance.now() - startTime;
    updateEvidence("insights_swipe_cards", { swiped: Math.abs(dx) > 30, dx: roundLocal(dx), dy: roundLocal(dy), durationMs: roundLocal(durationMs) });
    logEvent("card_swipe_release", { componentId: "spending_card_carousel", dx: roundLocal(dx), dy: roundLocal(dy), durationMs: roundLocal(durationMs) });
  }, { passive: true });

  document.querySelectorAll(".carousel-nudge").forEach((button) => {
    button.addEventListener("click", () => {
      carousel.scrollBy({ left: Number(button.dataset.dir) * carousel.clientWidth * 0.75, behavior: "smooth" });
      logEvent("carousel_nudge", { componentId: button.dataset.componentId, direction: Number(button.dataset.dir) });
    });
  });

  carousel.querySelectorAll(".spend-card").forEach((card) => {
    card.addEventListener("click", () => {
      carousel.querySelectorAll(".spend-card").forEach((item) => item.classList.remove("selected"));
      card.classList.add("selected");
      const targetCardSelected = card.dataset.cardId === "travel";
      updateEvidence("insights_swipe_cards", { targetCardSelected, selectedCard: card.dataset.cardId });
      logEvent("spending_card_selected", { componentId: card.dataset.componentId, cardId: card.dataset.cardId, targetCardSelected });
    });
  });
}

function bindSecureHandlers() {
  const task = window.currentTask;
  if (task.type === "swipe_approval") bindApprovalSwipe();
  if (task.type === "guided_reply") bindTypingTask(task, document.getElementById("replyInput"), state.content.target.reply);
  if (task.type === "finish") {
    document.querySelectorAll(".feeling-chip").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".feeling-chip").forEach((item) => item.classList.remove("selected"));
        button.classList.add("selected");
        updateEvidence(task.id, { finalFeelingSelected: true, feeling: button.dataset.feeling });
        logEvent("final_feeling_selected", { componentId: button.dataset.componentId, feeling: button.dataset.feeling });
        setTimeout(() => goToTask(state.currentTaskIndex + 1), 160);
      });
    });
  }
}

function bindTypingTask(task, input, target) {
  if (!input) return;
  let previousLength = input.value.length;
  input.addEventListener("input", () => {
    const inputLength = input.value.length;
    const deltaLength = inputLength - previousLength;
    previousLength = inputLength;
    const exactMatch = normaliseForValidation(input.value) === normaliseForValidation(target);
    updateEvidence(task.id, { inputLength, targetLength: target.length, deltaLengthLast: deltaLength, corrections: (getEvidence(task.id).corrections || 0) + (deltaLength < 0 ? 1 : 0), completedLength: inputLength >= target.length, exactMatch, exactCaseSensitiveMatch: input.value === target, validationMode: "case_insensitive_trimmed" });
  });
}

function bindScrollEvidence(componentId, taskId, field) {
  const element = document.querySelector(`[data-component-id='${componentId}']`);
  if (!element) return;
  element.addEventListener("scroll", () => {
    const maxScrollTop = Math.max(getEvidence(taskId)[field] || 0, element.scrollTop);
    const maxPossible = element.scrollHeight - element.clientHeight;
    updateEvidence(taskId, { [field]: maxScrollTop, [`${field}Ratio`]: maxPossible > 0 ? maxScrollTop / maxPossible : 0 });
  }, { passive: true });
}

function bindHorizontalScrollEvidence(element, taskId, field) {
  element.addEventListener("scroll", () => {
    const maxScrollLeft = Math.max(getEvidence(taskId)[field] || 0, element.scrollLeft);
    const maxPossible = element.scrollWidth - element.clientWidth;
    updateEvidence(taskId, { [field]: maxScrollLeft, [`${field}Ratio`]: maxPossible > 0 ? maxScrollLeft / maxPossible : 0 });
    logEvent("carousel_scroll", { componentId: element.dataset.componentId, scrollLeft: roundLocal(element.scrollLeft), maxScrollLeft: roundLocal(maxScrollLeft) });
  }, { passive: true });
}

function bindPotDrag() {
  const track = document.querySelector(".drag-slider");
  const thumb = document.getElementById("dragThumb");
  const fill = document.getElementById("dragFill");
  bindDragControl(track, thumb, (ratio, meta) => {
    const value = String(Math.round(ratio * 12));
    fill.style.width = `${ratio * 100}%`;
    thumb.style.left = `${ratio * 100}%`;
    thumb.textContent = `GBP ${value}`;
    updateEvidence("pots_drag_amount", { currentRatio: ratio, currentValue: value, targetValue: state.content.transferAmount, withinTolerance: Math.abs(Number(value) - Number(state.content.transferAmount)) <= 1, dragSamples: meta.samples, dragDistancePx: meta.distancePx });
  }, (ratio, meta) => {
    const value = String(Math.round(ratio * 12));
    const correctRelease = Math.abs(Number(value) - Number(state.content.transferAmount)) <= 1;
    updateEvidence("pots_drag_amount", { released: true, releasedRatio: ratio, releasedValue: value, targetValue: state.content.transferAmount, correctRelease, dragSamples: meta.samples, dragDistancePx: meta.distancePx, durationMs: meta.durationMs });
    logEvent("pot_drag_release", { componentId: "pot_drag_thumb", releasedValue: value, targetValue: state.content.transferAmount, correctRelease, dragSamples: meta.samples, durationMs: meta.durationMs });
  });
}

function bindApprovalSwipe() {
  const track = document.querySelector(".swipe-confirm");
  const thumb = document.getElementById("approvalThumb");
  bindDragControl(track, thumb, (ratio, meta) => {
    thumb.style.left = `${ratio * 100}%`;
    updateEvidence("secure_approval", { swipeRatio: ratio, swipeSamples: meta.samples });
  }, (ratio, meta) => {
    const approved = ratio > 0.78;
    thumb.style.left = approved ? "100%" : "0%";
    updateEvidence("secure_approval", { approvalSelected: approved, action: approved ? "Approve" : null, expectedAction: "Approve", correctAction: approved, swipeRatio: ratio, swipeSamples: meta.samples, durationMs: meta.durationMs, dragDistancePx: meta.distancePx });
    logEvent("approval_swipe_release", { componentId: "approval_swipe_thumb", swipeRatio: ratio, approved, swipeSamples: meta.samples, durationMs: meta.durationMs });
  });
  document.querySelector(".decline-link")?.addEventListener("click", () => {
    updateEvidence("secure_approval", { approvalSelected: true, action: "Decline", expectedAction: "Approve", correctAction: false });
    logEvent("secure_approval_selected", { componentId: "approval_decline", action: "Decline", correctAction: false });
  });
}

function bindDragControl(track, thumb, onMove, onEnd) {
  if (!track || !thumb) return;
  let active = false;
  let startTime = 0;
  let last = { x: 0, y: 0 };
  let meta = { samples: 0, distancePx: 0, durationMs: 0 };

  function ratioFromEvent(event) {
    const rect = track.getBoundingClientRect();
    return Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  }

  function down(event) {
    active = true;
    startTime = performance.now();
    last = { x: event.clientX, y: event.clientY };
    meta = { samples: 0, distancePx: 0, durationMs: 0 };
    thumb.setPointerCapture?.(event.pointerId);
    logEvent("gesture_drag_start", { componentId: thumb.dataset.componentId || null, x: event.clientX, y: event.clientY });
  }

  function move(event) {
    if (!active) return;
    const dx = event.clientX - last.x;
    const dy = event.clientY - last.y;
    meta.samples += 1;
    meta.distancePx += Math.hypot(dx, dy);
    meta.durationMs = performance.now() - startTime;
    last = { x: event.clientX, y: event.clientY };
    const ratio = ratioFromEvent(event);
    logEvent("gesture_drag_move", { componentId: thumb.dataset.componentId || null, ratio: roundLocal(ratio), sampleIndex: meta.samples, x: roundLocal(event.clientX), y: roundLocal(event.clientY) });
    onMove(ratio, meta);
  }

  function up(event) {
    if (!active) return;
    active = false;
    meta.durationMs = performance.now() - startTime;
    const ratio = ratioFromEvent(event);
    onEnd(ratio, meta);
    logEvent("gesture_drag_end", { componentId: thumb.dataset.componentId || null, ratio: roundLocal(ratio), samples: meta.samples, distancePx: roundLocal(meta.distancePx), durationMs: roundLocal(meta.durationMs) });
  }

  thumb.addEventListener("pointerdown", down);
  track.addEventListener("pointerdown", down);
  window.addEventListener("pointermove", move, { passive: true });
  window.addEventListener("pointerup", up, { passive: true });
}

function attemptContinue() {
  const warning = validateTask(window.currentTask);
  if (warning) {
    showWarning(warning);
    return;
  }
  clearWarning();
  goToTask(state.currentTaskIndex + 1);
}

function validateTask(task) {
  const evidence = getEvidence(task.id);
  switch (task.id) {
    case "home_balance_check": return evidence.accountReviewed ? null : "Go to Home and tap Current Account.";
    case "activity_search": return evidence.exactMatch && evidence.merchantOptionSelected ? null : `Go to Activity, type ${state.content.searchTerm}, then select it.`;
    case "activity_scroll_select": return evidence.selectedTarget ? null : `Go to Activity and select the ${state.content.target.merchant} payment from ${state.content.target.when}.`;
    case "transaction_category": return evidence.correctCategory ? null : `Go to Activity and choose ${state.content.target.category}.`;
    case "transaction_note": return evidence.exactMatch ? null : `Go to Activity and copy the note: ${state.content.target.note}`;
    case "pots_drag_amount": return evidence.released && evidence.correctRelease ? null : `Go to Pots and drag to GBP ${state.content.transferAmount}.`;
    case "pots_transfer": return evidence.travelPotSelected && evidence.exactMatch && evidence.moveConfirmed ? null : `Go to Pots, select Travel Pot, type ${state.content.transferAmount}, then tap Move money.`;
    case "insights_swipe_cards": return evidence.targetCardSelected ? null : "Go to Insights and select the Travel spending card.";
    case "insights_review": return evidence.targetInsightTapped ? null : `Go to Insights and select ${state.content.insightTarget.title}.`;
    case "secure_approval": return evidence.correctAction ? null : "Go to Secure and swipe the approval control.";
    case "secure_reply": return evidence.exactMatch ? null : "Go to Secure and copy the secure reply.";
    case "finish_feeling": return evidence.finalFeelingSelected ? null : "Choose how the review felt.";
    default: return null;
  }
}

function renderCompletion() {
  window.currentTask = null;
  window.currentScreenId = "complete";
  completeSession();
  const session = getSession();
  app.innerHTML = `
    <section class="intro-screen completion-screen">
      <div class="success-orb">OK</div>
      <h1>Review complete</h1>
      <p class="lead">Thanks - this session is ready for development review.</p>
      <div class="summary-card"><div><span>Participant ID</span><strong>${escapeHtml(session.participantId)}</strong></div><div><span>Session</span><strong>${escapeHtml(String(session.sessionIndex))}</strong></div><div><span>Duration</span><strong>${Math.round((session.sessionDurationMs || 0) / 1000)}s</strong></div><div><span>Events</span><strong>${session.events.length}</strong></div></div>
      ${APP_MODE === "debug" ? `<button class="primary-btn" onclick="downloadSessionJson()">Download JSON</button>` : `<p class="muted">Your session has been uploaded.</p>`}
      <button class="secondary-btn" onclick="renderContext()">Start another session</button>
    </section>
  `;
}

function showWarning(message) {
  const warning = document.getElementById("taskWarning");
  if (!warning) return;
  warning.textContent = message;
  warning.hidden = false;
}

function clearWarning() {
  const warning = document.getElementById("taskWarning");
  if (!warning) return;
  warning.textContent = "";
  warning.hidden = true;
}

function ensureEvidence(taskId) {
  if (!state.evidence[taskId]) state.evidence[taskId] = {};
}

function updateEvidence(taskId, patch) {
  ensureEvidence(taskId);
  state.evidence[taskId] = { ...state.evidence[taskId], ...patch };
}

function getEvidence(taskId) {
  ensureEvidence(taskId);
  return state.evidence[taskId];
}

function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function normaliseForValidation(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function roundLocal(value) {
  return typeof value === "number" && Number.isFinite(value) ? Number(value.toFixed(3)) : null;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

renderIntro();
