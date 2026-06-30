const app = document.getElementById("app");

if (!app) {
  throw new Error("Missing required #app root element.");
}

const CONTENT_SET_COUNT = 2;
const EXPECTED_TASK_COUNT = 26;
const RECENT_TARGET_KEY = "bbdc_recent_targets_v3";
const RECENT_TARGET_LIMIT = 10;

const state = {
  identity: null,
  context: {},
  contentSets: [],
  contentSetIndex: 0,
  content: null,
  tasks: [],
  evidence: {},
  completedTasks: new Set(),
  currentTaskIndex: -1,
  activeArea: "secure",
  selectedTransaction: null,
  reviewedInsights: new Set(),
  codeInput: ""
};

let screenController = new AbortController();
let bottomStackObserver = null;
let libraryExtended = false;
let startingSession = false;
let advancingTask = false;
let passcodeAdvancing = false;
let finishingSession = false;

const EXTRA_MERCHANTS = [
  ["Costa", "GBP 4.35", "Coffee", "coffee before lecture", "Yes, please mark this as coffee.", "CO", "coffee purchase"],
  ["Caffe Nero", "GBP 5.10", "Coffee", "morning coffee", "Yes, please save this as coffee.", "CN", "coffee purchase"],
  ["Greggs", "GBP 3.80", "Food", "quick lunch", "Yes, please tag this as lunch.", "GR", "bakery purchase"],
  ["Deliveroo", "GBP 16.74", "Takeaway", "evening takeaway", "Yes, please categorise this as takeaway.", "DE", "delivery order"],
  ["Lidl", "GBP 21.46", "Groceries", "weekly shop", "Yes, please mark this as groceries.", "LI", "supermarket shop"],
  ["Aldi", "GBP 18.29", "Groceries", "food shop", "Yes, please tag this as groceries.", "AL", "supermarket shop"],
  ["Sainsbury's", "GBP 12.62", "Groceries", "top up shop", "Yes, please save this as groceries.", "SA", "supermarket shop"],
  ["Shell", "GBP 38.55", "Fuel", "petrol refill", "Yes, please tag this as fuel.", "SH", "fuel payment"],
  ["BP", "GBP 42.10", "Fuel", "fuel stop", "Yes, please mark this as fuel.", "BP", "petrol station"],
  ["National Express", "GBP 11.20", "Travel", "coach ticket", "Yes, please add this to travel.", "NE", "coach ticket"],
  ["Rudy's Pizza", "GBP 17.90", "Restaurants", "pizza with friends", "Yes, please save this as restaurants.", "RP", "restaurant payment"],
  ["Odeon", "GBP 13.50", "Entertainment", "cinema ticket", "Yes, please tag this as entertainment.", "OD", "cinema ticket"],
  ["Amazon", "GBP 22.99", "Shopping", "online order", "Yes, please save this as shopping.", "AM", "online purchase"],
  ["ASOS", "GBP 34.80", "Shopping", "clothes order", "Yes, please mark this as shopping.", "AS", "clothing order"],
  ["Waterstones", "GBP 9.99", "Books", "book purchase", "Yes, please save this as books.", "WA", "book shop"],
  ["EE", "GBP 28.00", "Bills", "phone bill", "Yes, please keep this as a bill.", "EE", "phone bill"],
  ["The Gym Group", "GBP 20.99", "Fitness", "gym membership", "Yes, please tag this as fitness.", "TG", "membership payment"],
  ["Superdrug", "GBP 8.40", "Personal care", "toiletries", "Yes, please save this as personal care.", "SD", "personal care"],
  ["WHSmith", "GBP 6.25", "Books", "stationery and book", "Yes, please save this as books.", "WH", "stationery purchase"],
  ["Pizza Express", "GBP 19.40", "Restaurants", "meal out", "Yes, please mark this as restaurants.", "PE", "restaurant payment"]
].map(([merchant, amount, category, note, reply, icon, hint]) => ({ merchant, amount, category, note, reply, icon, hint }));

const EXTRA_INSIGHTS = [
  ["fuel", "Fuel", "Fuel spending increased after two recent trips.", "FU"],
  ["books", "Books", "Bookshop purchases appeared this week.", "BK"],
  ["coffee", "Coffee", "Coffee spend is above your usual weekly average.", "CF"],
  ["entertainment", "Entertainment", "Cinema and streaming payments were detected.", "EN"],
  ["takeaway", "Takeaway", "Takeaway orders are higher than last week.", "TA"],
  ["restaurants", "Restaurants", "Restaurant spending is up this weekend.", "RS"],
  ["groceries", "Groceries", "Supermarket spending increased this week.", "GR"],
  ["shopping", "Shopping", "Shopping spend is spread across several merchants.", "SH"]
].map(([id, title, body, icon]) => ({ id, title, body, icon }));

const EXTRA_CATEGORIES = [
  "Travel", "Food", "Groceries", "Subscription", "Shopping", "Bills", "Health", "Fitness",
  "Entertainment", "Takeaway", "Fuel", "Books", "Coffee", "Restaurants", "Personal care", "Other"
];

const SPENDING_CARDS = [
  { id: "food", title: "Food", amount: "GBP 42", body: "Food and coffee spending" },
  { id: "subscriptions", title: "Subscriptions", amount: "GBP 45", body: "Recurring payments" },
  { id: "shopping", title: "Shopping", amount: "GBP 31", body: "Recent card payments" },
  { id: "travel", title: "Travel", amount: "GBP 67", body: "Train and ride spending" },
  { id: "groceries", title: "Groceries", amount: "GBP 54", body: "Supermarket spending" },
  { id: "bills", title: "Bills", amount: "GBP 83", body: "Upcoming regular bills" },
  { id: "fitness", title: "Fitness", amount: "GBP 21", body: "Gym and activity payments" },
  { id: "entertainment", title: "Entertainment", amount: "GBP 26", body: "Cinema and streaming" }
];

const DEVICE_MODEL_OPTIONS = {
  iphone: [
    "iPhone 17e",
    "iPhone 17",
    "iPhone 17 Pro",
    "iPhone 17 Pro Max",
    "iPhone Air",
    "iPhone 16e",
    "iPhone 16",
    "iPhone 16 Plus",
    "iPhone 16 Pro",
    "iPhone 16 Pro Max",
    "iPhone 15",
    "iPhone 15 Plus",
    "iPhone 15 Pro",
    "iPhone 15 Pro Max",
    "iPhone 14",
    "iPhone 14 Plus",
    "iPhone 14 Pro",
    "iPhone 14 Pro Max",
    "iPhone 13 / 13 mini",
    "iPhone 13 Pro / Pro Max",
    "Older iPhone",
    "Other iPhone / not sure"
  ],
  android: [
    "Samsung Galaxy S range",
    "Samsung Galaxy S Ultra",
    "Samsung Galaxy Z Fold",
    "Samsung Galaxy Z Flip",
    "Samsung Galaxy A range",
    "Google Pixel standard",
    "Google Pixel Pro",
    "OnePlus",
    "Xiaomi / Redmi / POCO",
    "Oppo",
    "Honor",
    "Motorola",
    "Sony Xperia",
    "Nothing Phone",
    "Other Android / not sure"
  ],
  tablet: [
    "iPad mini",
    "iPad",
    "iPad Air",
    "iPad Pro 11 inch",
    "iPad Pro 12.9 / 13 inch",
    "Samsung Galaxy Tab",
    "Other tablet / not sure"
  ],
  desktop: [
    "MacBook trackpad",
    "Mac desktop with mouse / trackpad",
    "Windows laptop trackpad",
    "Windows laptop with mouse",
    "Desktop with mouse",
    "Other laptop/desktop"
  ],
  other: ["Other device", "Not sure"]
};

window.currentTask = null;
window.currentTaskIndex = null;
window.currentScreenId = "intro";
window.currentActiveArea = "secure";

function resetScreenListeners() {
  screenController.abort();
  screenController = new AbortController();
  if (bottomStackObserver) bottomStackObserver.disconnect();
  bottomStackObserver = null;
}

function addScreenListener(target, type, handler, options = {}) {
  if (!target) return;
  target.addEventListener(type, handler, { ...options, signal: screenController.signal });
}

function updateBottomStackHeight() {
  const stack = document.querySelector(".sticky-stack");
  if (!stack) return;
  document.documentElement.style.setProperty("--bottom-stack-height", `${Math.ceil(stack.getBoundingClientRect().height || 158)}px`);
}

function observeBottomStack() {
  const stack = document.querySelector(".sticky-stack");
  if (!stack) return;
  if ("ResizeObserver" in window) {
    bottomStackObserver = new ResizeObserver(updateBottomStackHeight);
    bottomStackObserver.observe(stack);
  }
  requestAnimationFrame(updateBottomStackHeight);
}

function renderIntro() {
  resetScreenListeners();
  state.identity = ensureIdentity();
  window.currentScreenId = "intro";

  app.innerHTML = `
    <section class="intro-screen compact-intro">
      <h1>Behavioural Biometrics Study</h1>
      <p class="lead">Complete one guided demo banking review of up to <strong>26 steps</strong>. It usually takes around <strong>3–6 minutes</strong>.</p>

      <article class="info-card">
        <h2>What you will do</h2>
        <p>Use a fake banking interface to check demo accounts, search fake transactions, scroll lists, drag a savings-pot slider, swipe an approval control and copy short prompted text.</p>
      </article>

      <article class="info-card">
        <h2>What is collected</h2>
        <p>Behavioural metadata such as tap timing, touch/pointer movement, scroll behaviour, typing rhythm, drag/swipe movement, optional motion/orientation, context answers and device/browser information.</p>
      </article>

      <article class="info-card">
        <h2>Privacy</h2>
        <p>Do not enter real banking details or personal information. Raw typed content is not stored; only timing, length, correction and interaction metadata are recorded.</p>
      </article>

      <button id="introNext" class="primary-btn" type="button">Continue to Consent</button>
    </section>`;

  addScreenListener(document.getElementById("introNext"), "click", renderConsent);
}

function renderConsent() {
  resetScreenListeners();
  window.currentScreenId = "consent";

  app.innerHTML = `
    <section class="intro-screen compact-intro">
      <h1>Consent</h1>
      <p class="lead">This study collects pseudonymised behavioural, contextual and device interaction data from a fake banking interface for academic research into behavioural biometrics and continuous authentication.</p>

      <article class="info-card">
        <h2>What will be collected</h2>
        <p><strong>Typing metadata:</strong> key timing, input length, correction behaviour and editing rhythm. Raw typed content is not stored.</p>
        <p><strong>Interaction metadata:</strong> touch, pointer, scroll, drag, swipe, navigation and task-completion events.</p>
        <p><strong>Device/context metadata:</strong> motion/orientation where available, time of day, fatigue, focus, posture, hand use, movement, environment, device model, browser, screen size, Participant ID, session ID and timing.</p>
      </article>

      <article class="info-card">
        <h2>What is not collected</h2>
        <p>The app does not ask for real banking details, passwords, names, email addresses, phone numbers or addresses. Geolocation is not collected. Data is pseudonymised rather than fully anonymous.</p>
      </article>

      <article class="info-card">
        <h2>Use and withdrawal</h2>
        <p>Data may be processed into derived research datasets and statistical features for modelling and dissertation reporting. Participation is voluntary; you can stop before finishing by closing the page.</p>
        <p>To withdraw uploaded data, contact the study lead with the <strong>Participant ID</strong> shown on the completion screen. <strong>18+ only.</strong></p>
      </article>

      <label class="check-row"><input id="consentAge" type="checkbox" /><span>I am 18 or over, I understand what data may be collected, and I agree to take part.</span></label>
      <label class="check-row"><input id="consentBrowser" type="checkbox" /><span>I am using a normal Safari or Chrome tab, not private/incognito mode.</span></label>
      <button id="consentNext" class="primary-btn" type="button" disabled>Continue</button>
    </section>`;

  const age = document.getElementById("consentAge");
  const browser = document.getElementById("consentBrowser");
  const next = document.getElementById("consentNext");
  const update = () => { next.disabled = !(age.checked && browser.checked); };

  addScreenListener(age, "change", update);
  addScreenListener(browser, "change", update);
  addScreenListener(next, "click", renderContext);
}

function renderContext() {
  resetScreenListeners();
  window.currentScreenId = "context";

  app.innerHTML = `
    <section class="intro-screen compact-intro context-screen">
      <h1>Context Before You Start</h1>
      ${renderSegmentGroup("timeOfDay", "Time of day", ["Morning", "Afternoon", "Evening", "Night"])}
      ${renderRangeGroup("fatigue", "Fatigue", "1 = alert, 5 = tired", 1, 5, 3)}
      ${renderRangeGroup("focusLevel", "Focus", "1 = distracted, 5 = focused", 1, 5, 3)}
      <article class="info-card form-card">
        <h2>Device and environment</h2>
        ${renderSelectField("devicePlatform", "Device type", ["iPhone", "Android phone", "iPad / tablet", "Laptop / desktop", "Other / not sure"], "devicePlatformSelect")}
        ${renderDeviceModelField()}
        ${renderSelectField("inputDevice", "Input method", ["Touch", "Trackpad", "Mouse", "Keyboard and trackpad", "Keyboard and mouse", "Other"])}
        ${renderSelectField("movement", "Movement", ["None", "Slight movement", "Walking / moving", "Public transport / vehicle", "Other"])}
        ${renderSelectField("environmentNoise", "Environment noise", ["Quiet", "Normal", "Noisy", "Very noisy"])}
        ${renderSelectField("privacy", "Privacy of setting", ["Private", "Shared room", "Public place", "Other people nearby"])}
        ${renderSelectField("alcohol", "Alcohol", ["None", "Low", "Medium", "High"])}
        ${renderSelectField("caffeine", "Caffeine", ["None", "Low", "Medium", "High"])}
      </article>
      ${renderSegmentGroup("posture", "Posture", ["Sitting", "Standing", "Walking / moving"])}
      ${renderSegmentGroup("handUse", "Hand use", ["Two-handed", "One-handed right", "One-handed left"])}
      <button class="primary-btn" id="startReview" type="button">Open bank app</button>
    </section>`;

  bindSegmentGroups();
  bindRangeLabels();
  bindDeviceModelSelect();
  addScreenListener(document.getElementById("startReview"), "click", startReview);
}

function renderSegmentGroup(id, label, options) {
  return `
    <fieldset class="seg-group info-card" data-field="${escapeAttr(id)}">
      <legend><h2>${escapeHtml(label)}</h2></legend>
      <div class="seg-row">
        ${options.map((option, index) => `<button type="button" class="seg-chip ${index === 0 ? "selected" : ""}" data-value="${escapeAttr(slugify(option))}">${escapeHtml(option)}</button>`).join("")}
      </div>
    </fieldset>`;
}

function renderRangeGroup(id, label, help, min, max, value) {
  return `
    <article class="info-card range-card">
      <h2>${escapeHtml(label)}</h2>
      <p class="muted">${escapeHtml(help)}</p>
      <p class="muted">Current value: <strong id="${escapeAttr(id)}Value">${value}</strong></p>
      <input class="context-input" data-context-field="${escapeAttr(id)}" data-value-label="${escapeAttr(id)}Value" type="range" min="${min}" max="${max}" value="${value}" />
    </article>`;
}

function renderSelectField(id, label, options, elementId = "") {
  return `
    <label class="context-label">
      <span>${escapeHtml(label)}</span>
      <select ${elementId ? `id="${escapeAttr(elementId)}"` : ""} class="text-input context-input" data-context-field="${escapeAttr(id)}">
        ${options.map((option) => `<option value="${escapeAttr(slugify(option))}">${escapeHtml(option)}</option>`).join("")}
      </select>
    </label>`;
}

function renderDeviceModelField() {
  return `
    <label class="context-label">
      <span>Specific device model</span>
      <select id="deviceModelSelect" class="text-input context-input" data-context-field="deviceModel">
        ${DEVICE_MODEL_OPTIONS.iphone.map((option) => `<option value="${escapeAttr(slugify(option))}">${escapeHtml(option)}</option>`).join("")}
      </select>
      <small>Use Settings → General → About on iPhone, Settings → About phone on Android, or system settings on laptop/desktop if unsure.</small>
    </label>`;
}

function bindSegmentGroups() {
  document.querySelectorAll(".seg-group").forEach((group) => {
    group.querySelectorAll(".seg-chip").forEach((button) => {
      button.setAttribute("aria-pressed", button.classList.contains("selected") ? "true" : "false");

      addScreenListener(button, "click", () => {
        group.querySelectorAll(".seg-chip").forEach((chip) => {
          chip.classList.remove("selected");
          chip.setAttribute("aria-pressed", "false");
        });

        button.classList.add("selected");
        button.setAttribute("aria-pressed", "true");
      });
    });
  });
}

function bindRangeLabels() {
  document.querySelectorAll("input[type='range'][data-value-label]").forEach((range) => {
    addScreenListener(range, "input", () => {
      const label = document.getElementById(range.dataset.valueLabel);
      if (label) label.textContent = range.value;
    });
  });
}

function bindDeviceModelSelect() {
  const platform = document.getElementById("devicePlatformSelect");
  if (!platform) return;
  addScreenListener(platform, "change", updateDeviceModelOptions);
  updateDeviceModelOptions();
}

function updateDeviceModelOptions() {
  const platform = document.getElementById("devicePlatformSelect");
  const model = document.getElementById("deviceModelSelect");
  if (!platform || !model) return;
  const options = DEVICE_MODEL_OPTIONS[modelGroupFromPlatform(platform.value)] || DEVICE_MODEL_OPTIONS.other;
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
  if (startingSession) return;
  startingSession = true;

  const startButton = document.getElementById("startReview");
  if (startButton) startButton.disabled = true;

  try {
    state.identity = ensureIdentity();
    state.context = collectContextAnswers();
    state.contentSets = generateContentSets(CONTENT_SET_COUNT);
    state.contentSetIndex = 0;
    state.content = state.contentSets[0];
    state.tasks = buildTaskSequence(state.contentSets.length);
    state.evidence = {};
    state.completedTasks = new Set();
    state.currentTaskIndex = -1;
    state.activeArea = "secure";
    state.selectedTransaction = null;
    state.reviewedInsights = new Set();
    state.codeInput = "";

    window.GUIDED_TASKS = state.tasks.map((task) => ({ ...task }));
    window.currentActiveArea = state.activeArea;

    createSession(state.context, publicGeneratedContent());

    let permissionResult = "not_requested";

    try {
      permissionResult = await requestMotionPermission();
    } catch (error) {
      permissionResult = "error";
      logEvent("motion_permission_error", {
        message: error?.message || "Unknown motion permission error"
      });
    }

    startMotionLogging();
    logEvent("motion_logging_started", { permissionResult });

    try {
      if (window.bbdcFirebase) await window.bbdcFirebase.ensureIdentity(state.identity?.participantId || null);
    } catch (e) {
      console.warn("Firebase identity unavailable; using local identity", e);
    }

    goToTask(0);
  } catch (error) {
    console.error(error);
    app.innerHTML = `
      <section class="intro-screen compact-intro">
        <h1>Could not start session</h1>
        <p class="lead">The banking review could not be started. Please refresh and try again.</p>
        <p class="muted">${escapeHtml(error?.message || "Unknown error")}</p>
      </section>`;
  } finally {
    startingSession = false;
  }
}

function collectContextAnswers() {
  const context = {};

  document.querySelectorAll(".seg-group").forEach((group) => {
    context[group.dataset.field] = group.querySelector(".seg-chip.selected")?.dataset.value || null;
  });

  document.querySelectorAll(".context-input[data-context-field]").forEach((input) => {
    context[input.dataset.contextField] = input.value;
  });

  context.consentVersion = typeof CONSENT_VERSION !== "undefined" ? CONSENT_VERSION : "p2_consent_2026_06_30";
  context.consentAccepted = true;
  context.browserRequirementAccepted = true;

  return context;
}

function publicGeneratedContent() {
  return {
    taskSequenceMode: "single_sequence_repeated_tasks_different_content",
    totalTaskInstanceCount: state.tasks.length,
    contentSetCount: state.contentSets.length,
    repeatedTaskIds: state.tasks
      .filter((task) => task.occurrenceNumber > 1)
      .map((task) => task.id),
    contentSets: state.contentSets.map((content, index) => ({
      contentSetIndex: index,
      targetMerchant: content.target.merchant,
      targetAmount: content.target.amount,
      targetCategory: content.target.category,
      targetWhen: content.target.when,
      transferAmount: content.transferAmount,
      insightTarget: content.insightTarget.title,
      spendingCardTarget: content.spendingCardTarget.title,
      approvalMerchant: content.approvalPayment.merchant,
      approvalAmount: content.approvalPayment.amount,
      feedItemCount: content.feedItems.length,
      merchantOptionCount: content.merchantOptions.length,
      categoryOptionCount: content.categoryOptions.length,
      insightOptionCount: content.insights.length,
      spendingCardCount: content.spendingCards.length
    })),
    randomization: {
      contentPool: `expanded_single_${state.tasks.length}_task_sequence`,
      contentSetsGeneratedUpfront: true,
      avoidsRecentLocalTargets: true,
      recentWindow: RECENT_TARGET_LIMIT
    },
    gestureTasks: ["pots_drag_amount", "insights_swipe_cards", "secure_approval"]
  };
}

function buildTaskSequence(contentSetCount) {
  const tasks = [];
  const occurrenceCounts = new Map();

  const skipOnRepeatedContent = new Set([
    "unlock_code",
    "home_balance_check",
    "home_explore_cards",
    "finish_feeling"
  ]);

  for (let contentSetIndex = 0; contentSetIndex < contentSetCount; contentSetIndex += 1) {
    GUIDED_TASKS.forEach((task, baseTaskIndex) => {
      if (task.id === "finish_feeling") return;
      if (contentSetIndex > 0 && skipOnRepeatedContent.has(task.id)) return;

      addTaskInstance(tasks, occurrenceCounts, task, baseTaskIndex, contentSetIndex);
    });
  }

  const finalTask = GUIDED_TASKS.find((task) => task.id === "finish_feeling");

  if (!finalTask) {
    throw new Error("Missing required finish_feeling task.");
  }

  addTaskInstance(tasks, occurrenceCounts, finalTask, GUIDED_TASKS.indexOf(finalTask), contentSetCount - 1);

  if (tasks.length !== EXPECTED_TASK_COUNT) {
    throw new Error(`Expected ${EXPECTED_TASK_COUNT} tasks, generated ${tasks.length}.`);
  }

  return tasks;
}

function addTaskInstance(tasks, occurrenceCounts, task, baseTaskIndex, contentSetIndex) {
  const occurrenceNumber = (occurrenceCounts.get(task.id) || 0) + 1;
  occurrenceCounts.set(task.id, occurrenceNumber);

  tasks.push({
    ...task,
    baseId: task.id,
    id: `${task.id}_${String(occurrenceNumber).padStart(2, "0")}`,
    occurrenceNumber,
    contentSetIndex,
    baseTaskIndex,
    globalTaskIndex: tasks.length
  });
}

function generateContentSets(count) {
  return Array.from({ length: count }, (_, index) => generateContent(index));
}

function generateContent(contentSetIndex = 0) {
  extendBankingLibrary();

  const recent = readRecentTargets();
  const recentMerchants = recent.map((item) => item.targetMerchant).filter(Boolean);
  const recentInsights = recent.map((item) => item.insightTargetId).filter(Boolean);
  const recentSpendingCards = recent.map((item) => item.spendingCardTargetId).filter(Boolean);

  const target = {
    ...pickAvoidingRecent(BANKING_LIBRARY.merchants, recentMerchants, (item) => item.merchant)
  };

  target.when = randomChoice(["Today", "Yesterday", "This week", "Last week", "Last month"]);
  target.isTarget = true;
  target.id = `target_${contentSetIndex + 1}_${slugify(target.merchant)}_${Date.now().toString(36)}`;

  const insightTarget = pickAvoidingRecent(buildInsightOptions(), recentInsights, (item) => item.id);
  const spendingCardTarget = pickAvoidingRecent(SPENDING_CARDS, recentSpendingCards, (item) => item.id);
  const approvalPayment = buildApprovalPayment(target.merchant);

  const content = {
    contentSetIndex,
    code: randomChoice(BANKING_LIBRARY.codes),
    target,
    searchTerm: target.merchant,
    filterTarget: target.category,
    merchantOptions: placeTargetLow(buildMerchantOptions(target), (item) => item.merchant === target.merchant),
    feedItems: buildLongFeed(target),
    accounts: BANKING_LIBRARY.accounts,
    categoryOptions: placeTargetLow(buildCategoryOptions(target.category), (category) => category === target.category),
    pots: BANKING_LIBRARY.pots,
    transferAmount: randomChoice(BANKING_LIBRARY.transferAmounts),
    insights: placeTargetLow(buildInsightOptions(), (insight) => insight.id === insightTarget.id),
    insightTarget,
    spendingCards: placeTargetLow(shuffle(SPENDING_CARDS), (card) => card.id === spendingCardTarget.id),
    spendingCardTarget,
    approvalPayment
  };

  rememberRecentTarget({
    targetMerchant: target.merchant,
    targetCategory: target.category,
    targetWhen: target.when,
    spendingCardTargetId: spendingCardTarget.id,
    insightTargetId: insightTarget.id,
    approvalMerchant: approvalPayment.merchant,
    createdAt: new Date().toISOString()
  });

  return content;
}

function extendBankingLibrary() {
  if (libraryExtended) return;

  BANKING_LIBRARY.merchants = uniqueBy(
    [...BANKING_LIBRARY.merchants, ...EXTRA_MERCHANTS],
    (item) => item.merchant
  );

  BANKING_LIBRARY.fillerTransactions = uniqueBy(
    [...BANKING_LIBRARY.fillerTransactions, ...EXTRA_MERCHANTS],
    (item) => item.merchant
  );

  BANKING_LIBRARY.insightTemplates = uniqueBy(
    [...BANKING_LIBRARY.insightTemplates, ...EXTRA_INSIGHTS],
    (item) => item.id
  );

  BANKING_LIBRARY.categories = uniqueBy(
    [...BANKING_LIBRARY.categories, ...EXTRA_CATEGORIES],
    (item) => item
  );

  BANKING_LIBRARY.codes = uniqueBy(
    [...BANKING_LIBRARY.codes, "2758", "8164", "3907", "5429"],
    (item) => item
  );

  BANKING_LIBRARY.transferAmounts = uniqueBy(
    [...BANKING_LIBRARY.transferAmounts, "6", "8", "9", "11"],
    (item) => item
  );

  libraryExtended = true;
}

function buildApprovalPayment(targetMerchant) {
  const options = BANKING_LIBRARY.fillerTransactions.filter((item) => item.merchant !== targetMerchant);
  const payment = randomChoice(options.length ? options : BANKING_LIBRARY.fillerTransactions);

  return {
    merchant: payment.merchant,
    amount: payment.amount,
    icon: payment.icon || payment.merchant.slice(0, 2).toUpperCase()
  };
}

function buildMerchantOptions(target) {
  const merchantNames = uniqueBy(
    [
      ...BANKING_LIBRARY.merchants.map((item) => item.merchant),
      ...BANKING_LIBRARY.fillerTransactions.map((item) => item.merchant),
      target.merchant
    ],
    (merchant) => merchant
  );

  return shuffle(merchantNames).map((merchant, index) => {
    const match =
      BANKING_LIBRARY.merchants.find((item) => item.merchant === merchant) ||
      BANKING_LIBRARY.fillerTransactions.find((item) => item.merchant === merchant) ||
      {};

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
  return shuffle(
    uniqueBy(
      [
        "Automotive", "Bills", "Books", "Charity", "Coffee", "Education", "Entertainment",
        "Fitness", "Food", "Fuel", "Groceries", "Health", "Home", "Personal care",
        "Restaurants", "Shopping", "Subscription", "Takeaway", "Transport", "Travel",
        "Utilities", "Other", ...EXTRA_CATEGORIES, ...BANKING_LIBRARY.categories, targetCategory
      ],
      (item) => item
    )
  );
}

function buildInsightOptions() {
  return shuffle(
    uniqueBy(
      [
        ...BANKING_LIBRARY.insightTemplates,
        ...EXTRA_INSIGHTS,
        {
          id: "weekend",
          title: "Weekend spending",
          body: "Weekend spending is above your weekday average.",
          icon: "WE"
        },
        {
          id: "savings",
          title: "Savings",
          body: "You are close to your monthly savings target.",
          icon: "SV"
        }
      ],
      (item) => item.id
    )
  );
}

function buildLongFeed(target) {
  const pool = shuffle(
    [...BANKING_LIBRARY.fillerTransactions, ...BANKING_LIBRARY.merchants]
      .filter((item) => item.merchant !== target.merchant)
  );

  const dates = ["Today", "Yesterday", "This week", "Last week", "Last month"];
  const feed = [];

  for (let index = 0; index < 56; index += 1) {
    const source = pool[index % pool.length];
    feed.push({
      ...source,
      when: randomChoice(dates),
      isTarget: false,
      id: `txn_${index}_${slugify(source.merchant)}`
    });
  }

  const targetPosition = Math.floor(feed.length * (0.55 + Math.random() * 0.3));
  feed.splice(targetPosition, 0, target);

  return feed;
}

function placeTargetLow(items, isTarget) {
  const copy = [...items];
  const targetIndex = copy.findIndex(isTarget);

  if (targetIndex < 0) return copy;

  const [target] = copy.splice(targetIndex, 1);
  const insertIndex = Math.min(copy.length, Math.floor(copy.length * (0.62 + Math.random() * 0.24)));
  copy.splice(insertIndex, 0, target);

  return copy;
}

function goToTask(index) {
  if (window.currentTask && state.currentTaskIndex >= 0 && !state.completedTasks.has(window.currentTask.id)) {
    logTaskEnd(window.currentTask, state.currentTaskIndex, getEvidence(window.currentTask.id));
    state.completedTasks.add(window.currentTask.id);
  }

  state.currentTaskIndex = index;
  window.currentTaskIndex = index;

  const nextTask = state.tasks[index] || null;
  window.currentTask = nextTask;

  if (!nextTask) {
    renderCompletion();
    return;
  }

  if (state.contentSetIndex !== nextTask.contentSetIndex) {
    activateContentSet(nextTask.contentSetIndex);
  }

  state.activeArea = nextTask.area === "finish" ? "secure" : nextTask.area;
  window.currentActiveArea = state.activeArea;

  ensureEvidence(nextTask.id);
  logTaskStart(nextTask, index);

  if (nextTask.type === "code") renderCode();
  else renderBankShell();
}

function activateContentSet(contentSetIndex) {
  state.contentSetIndex = contentSetIndex;
  state.content = state.contentSets[contentSetIndex];
  state.selectedTransaction = null;
  state.reviewedInsights = new Set();
  state.codeInput = "";
}

function renderCode() {
  resetScreenListeners();
  window.currentScreenId = "secure_code";
  window.currentActiveArea = "secure";

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
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9, "Back", 0, "Clear"].map((key) => `
            <button class="keypad-btn" type="button" data-key="${escapeAttr(String(key))}" data-component-id="code_key_${escapeAttr(String(key))}">
              ${escapeHtml(String(key))}
            </button>
          `).join("")}
        </div>
        <div id="codeWarning" class="task-warning" hidden></div>
      </div>
    </section>`;

  attachTaskElementLogging(document);

  document.querySelectorAll(".keypad-btn").forEach((button) => {
    addScreenListener(button, "click", () => handleCodeKey(button.dataset.key));
  });

  logEvent("screen_view", {
    screenId: "secure_code",
    taskId: window.currentTask.id,
    baseTaskId: baseTaskId(window.currentTask),
    contentSetIndex: state.contentSetIndex,
    area: "secure"
  });
}

function handleCodeKey(key) {
  if (passcodeAdvancing) return;

  const beforeLength = state.codeInput.length;

  if (key === "Clear") state.codeInput = "";
  else if (key === "Back") state.codeInput = state.codeInput.slice(0, -1);
  else if (/^\d$/.test(key) && state.codeInput.length < 4) state.codeInput += key;

  const afterLength = state.codeInput.length;

  logEvent("passcode_digit_tap", {
    componentId: `code_key_${key}`,
    keyClass: /^\d$/.test(key) ? "DIGIT" : "CONTROL",
    inputLengthBefore: beforeLength,
    inputLengthAfter: afterLength,
    deltaLength: afterLength - beforeLength,
    contentSetIndex: state.contentSetIndex
  });

  updateEvidence("unlock_code", {
    inputLength: afterLength,
    codeCorrect: state.codeInput === state.content.code,
    corrections: (getEvidence("unlock_code").corrections || 0) + (key === "Back" || key === "Clear" ? 1 : 0)
  });

  renderCodeDots();

  if (state.codeInput.length === 4 && state.codeInput === state.content.code) {
    passcodeAdvancing = true;
    updateEvidence("unlock_code", { completedWithCorrectCode: true });

    setTimeout(() => {
      passcodeAdvancing = false;
      goToTask(state.currentTaskIndex + 1);
    }, 200);
  } else if (state.codeInput.length === 4) {
    const warning = document.getElementById("codeWarning");
    if (warning) {
      warning.textContent = "That did not match the demo passcode. Clear and try again.";
      warning.hidden = false;
    }
  }
}

function renderCodeDotsMarkup() {
  return [0, 1, 2, 3]
    .map((index) => `<span class="${state.codeInput.length > index ? "filled" : ""}"></span>`)
    .join("");
}

function renderCodeDots() {
  const dots = document.querySelector(".pass-dots");
  if (dots) dots.innerHTML = renderCodeDotsMarkup();
}

function renderBankShell() {
  resetScreenListeners();

  const task = window.currentTask;
  window.currentActiveArea = state.activeArea;
  window.currentScreenId = `${state.activeArea}_${task.id}`;

  app.innerHTML = `
    <section class="bank-screen">
      <header class="bank-header">
        <div>
          <p class="eyebrow">Bank app</p>
          <h1>${escapeHtml(headingForArea(state.activeArea))}</h1>
        </div>
        <button class="avatar" type="button" data-component-id="profile_button">${escapeHtml(state.identity?.participantId?.slice(1, 3) || "ID")}</button>
      </header>

      ${renderTaskBanner(task)}

      <div class="bank-content">
        ${renderActiveArea()}
      </div>

      <div id="taskWarning" class="task-warning" hidden></div>

      <div class="sticky-stack">
        <button class="primary-btn" type="button" data-component-id="continue_button" id="continueBtn">Continue</button>
        ${renderBottomNav()}
      </div>
    </section>`;

  attachTaskElementLogging(document);
  bindAreaHandlers();
  addScreenListener(document.getElementById("continueBtn"), "click", attemptContinue);
  observeBottomStack();

  logEvent("screen_view", {
    screenId: window.currentScreenId,
    taskId: task.id,
    baseTaskId: baseTaskId(task),
    contentSetIndex: state.contentSetIndex,
    area: state.activeArea
  });
}

function renderTaskBanner(task) {
  const targetArea = task.area === "finish" ? "secure" : task.area;
  const tabLabel = headingForArea(targetArea);

  return `
    <div class="task-banner" role="status" aria-live="polite">
      <div>
        <p>Task ${state.currentTaskIndex + 1} of ${state.tasks.length} · Go to ${escapeHtml(tabLabel)}</p>
        <strong>${escapeHtml(task.title)}</strong>
        <span>${escapeHtml(instructionForTask(task))}</span>
      </div>
      <div class="progress-ring">${Math.round(((state.currentTaskIndex + 1) / state.tasks.length) * 100)}%</div>
    </div>`;
}

function renderBottomNav() {
  return `
    <nav class="bottom-nav" aria-label="Bank app sections">
      ${NAV_TABS.map((tab) => `
        <button class="nav-tab ${tab.id === state.activeArea ? "active" : ""}" type="button" data-area="${escapeAttr(tab.id)}" data-component-id="nav_${escapeAttr(tab.id)}">
          <span>${escapeHtml(tab.icon)}</span>
          <small>${escapeHtml(tab.label)}</small>
        </button>
      `).join("")}
    </nav>`;
}

function bindAreaHandlers() {
  document.querySelectorAll(".nav-tab").forEach((button) => {
    addScreenListener(button, "click", () => {
      state.activeArea = button.dataset.area;
      window.currentActiveArea = state.activeArea;
      logEvent("nav_tab_clicked", {
        componentId: button.dataset.componentId,
        area: state.activeArea,
        contentSetIndex: state.contentSetIndex
      });
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
  return {
    home: "Home",
    activity: "Activity",
    pots: "Pots",
    insights: "Insights",
    secure: "Secure",
    finish: "Secure"
  }[area] || "Bank app";
}

function instructionForTask(task) {
  const target = state.content.target;
  const baseId = baseTaskId(task);

  const instructions = {
    home_balance_check: "Open Home and tap Current Account after checking the balance.",
    home_explore_cards: "Open Home and tap each account card once.",
    activity_search: `Open Activity, type ${target.merchant}, then select it from the merchant list.`,
    activity_filter_review: `Open Activity and select the ${state.content.filterTarget} filter chip.`,
    activity_scroll_select: `Open Activity and find the one ${target.merchant} payment from ${target.when}.`,
    transaction_category: `Open Activity and choose the ${target.category} category for the selected payment.`,
    transaction_note: `Open Activity and copy the note: ${target.note}`,
    pots_drag_amount: `Open Pots and drag the amount slider to GBP ${state.content.transferAmount}.`,
    pots_transfer: `Open Pots, select Travel Pot, type ${state.content.transferAmount}, then confirm.`,
    insights_swipe_cards: `Open Insights, scroll the spending cards horizontally, then select ${state.content.spendingCardTarget.title}.`,
    insights_review: `Open Insights and select the ${state.content.insightTarget.title} insight.`,
    secure_approval: `Open Secure and approve ${state.content.approvalPayment.merchant} for ${state.content.approvalPayment.amount}.`,
    secure_reply: `Open Secure and copy: ${target.reply}`,
    finish_feeling: "Choose how the full review felt."
  };

  return instructions[baseId] || task.title;
}

function renderActiveArea() {
  const task = window.currentTask;

  if (state.activeArea === "home") return renderHome(task.type === "home_explore");

  if (state.activeArea === "activity") {
    if (task.type === "typing_search") return renderActivitySearch();
    if (task.type === "activity_filter") return renderActivityFilter();
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

  return renderHome(false);
}

function renderHome(showPrompt = false) {
  return `
    <div class="balance-hero">
      <span>Bank app</span>
      <p>Good afternoon</p>
      <h2>GBP 2,112.77</h2>
      <small>Across demo accounts</small>
    </div>

    ${showPrompt ? `
      <div class="section-card">
        <h2>Tap all account cards</h2>
        <p class="muted">This adds natural exploration taps before continuing.</p>
      </div>
    ` : ""}

    <div class="card-list">
      ${state.content.accounts.map((account) => `
        <button class="account-card ${escapeAttr(account.accent)}" type="button" data-account-id="${escapeAttr(account.id)}" data-component-id="account_${escapeAttr(account.id)}">
          <span>
            <strong>${escapeHtml(account.name)}</strong>
            <small>${escapeHtml(account.sub)}</small>
          </span>
          <b>${escapeHtml(account.balance)}</b>
        </button>
      `).join("")}
    </div>

    <div class="mini-grid">
      <div class="mini-card"><span>Pots</span><strong>3 pots</strong><small>GBP 1,556 saved</small></div>
      <div class="mini-card"><span>Alerts</span><strong>2 alerts</strong><small>Ready to review</small></div>
    </div>`;
}

function renderActivityOverview() {
  return `
    <div class="section-card">
      <h2>Activity</h2>
      <p class="muted">Recent demo transactions.</p>
    </div>
    <div class="transaction-feed" data-log-scroll="true" data-component-id="activity_overview_feed">
      ${state.content.feedItems.slice(0, 24).map((item) => renderTransactionRow(item)).join("")}
    </div>`;
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
      ${state.content.merchantOptions.map((option) => `
        <button class="txn-row merchant-option" type="button" data-merchant="${escapeAttr(option.merchant)}" data-component-id="merchant_option_${escapeAttr(slugify(option.merchant))}">
          <span class="txn-icon">${escapeHtml(option.icon)}</span>
          <span class="txn-main">
            <strong>${escapeHtml(option.merchant)}</strong>
            <small>${escapeHtml(option.category)} · ${escapeHtml(option.hint)}</small>
          </span>
          <span class="txn-amount">View</span>
        </button>
      `).join("")}
    </div>`;
}

function renderActivityFilter() {
  const options = uniqueBy([...EXTRA_CATEGORIES, state.content.filterTarget], (item) => item);

  return `
    <div class="section-card">
      <p class="muted">Select this filter</p>
      <h2>${escapeHtml(state.content.filterTarget)}</h2>
    </div>
    <div class="seg-row" data-component-id="activity_filter_chips">
      ${options.map((filter) => `
        <button type="button" class="seg-chip filter-chip" data-filter="${escapeAttr(filter)}" data-component-id="filter_${escapeAttr(slugify(filter))}">
          ${escapeHtml(filter)}
        </button>
      `).join("")}
    </div>
    <div class="transaction-feed" data-log-scroll="true" data-component-id="activity_filter_feed">
      ${state.content.feedItems.slice(0, 24).map((item) => renderTransactionRow(item)).join("")}
    </div>`;
}

function renderActivityFeed() {
  return `
    <div class="section-card">
      <div class="search-pill">Target: ${escapeHtml(state.content.target.merchant)} · ${escapeHtml(state.content.target.when)}</div>
      <p class="muted">There is only one matching payment in the list. Scroll and open it.</p>
    </div>
    <div class="transaction-feed" data-log-scroll="true" data-component-id="transaction_feed">
      ${state.content.feedItems.map((item) => renderTransactionRow(item)).join("")}
    </div>`;
}

function renderTransactionRow(item) {
  return `
    <button class="txn-row" type="button" data-txn-id="${escapeAttr(item.id)}" data-component-id="txn_${escapeAttr(slugify(item.id))}">
      <span class="txn-icon">${escapeHtml(item.icon || item.merchant.slice(0, 2).toUpperCase())}</span>
      <span class="txn-main">
        <strong>${escapeHtml(item.merchant)}</strong>
        <small>${escapeHtml(item.when || "Today")} · ${escapeHtml(item.category || "Card")}</small>
      </span>
      <span class="txn-amount">${escapeHtml(item.amount)}</span>
    </button>`;
}

function renderTransactionDetail(showNote) {
  const transaction = state.selectedTransaction || state.content.target;

  if (showNote) {
    return `
      ${renderTransactionDetailCard(transaction)}
      <div class="section-card">
        <p class="muted">Copy this payment note</p>
        <h2>${escapeHtml(state.content.target.note)}</h2>
        <textarea id="noteInput" data-component-id="payment_note_input" class="text-area" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Copy note here"></textarea>
      </div>`;
  }

  return `
    ${renderTransactionDetailCard(transaction)}
    <div class="section-card">
      <p class="muted">Choose the best category</p>
      <h2>${escapeHtml(state.content.target.category)}</h2>
    </div>
    <div class="transaction-feed option-list" data-log-scroll="true" data-component-id="category_option_list">
      ${state.content.categoryOptions.map((category) => `
        <button class="txn-row category-option" type="button" data-category="${escapeAttr(category)}" data-component-id="category_${escapeAttr(slugify(category))}">
          <span class="txn-icon">${escapeHtml(category.slice(0, 2).toUpperCase())}</span>
          <span class="txn-main"><strong>${escapeHtml(category)}</strong><small>Payment category</small></span>
          <span class="txn-amount">Select</span>
        </button>
      `).join("")}
    </div>`;
}

function renderTransactionDetailCard(transaction) {
  return `
    <div class="transaction-detail-card">
      <span class="large-emoji">${escapeHtml(transaction.icon || "TX")}</span>
      <h2>${escapeHtml(transaction.merchant)}</h2>
      <h3>${escapeHtml(transaction.amount)}</h3>
      <p>${escapeHtml(transaction.when || "Today")} · Card payment · ${escapeHtml(transaction.hint || transaction.category || "Transaction")}</p>
    </div>`;
}

function renderPotsOverview() {
  return `
    <div class="section-card">
      <h2>Pots</h2>
      <p class="muted">Explore demo savings pots.</p>
    </div>
    ${renderPotCards()}`;
}

function renderPotCards() {
  return `
    <div class="pot-list">
      ${state.content.pots.map((pot) => `
        <button class="pot-card ${pot.id === "travel" ? "highlight" : ""}" type="button" data-pot-id="${escapeAttr(pot.id)}" data-component-id="pot_${escapeAttr(pot.id)}">
          <span>${escapeHtml(pot.icon)}</span>
          <span>
            <strong>${escapeHtml(pot.name)}</strong>
            <small>${escapeHtml(pot.balance)} saved of ${escapeHtml(pot.target)}</small>
          </span>
        </button>
      `).join("")}
    </div>`;
}

function renderPotDrag() {
  return `
    <div class="section-card">
      <p class="muted">Controlled drag interaction</p>
      <h2>Drag to GBP ${escapeHtml(state.content.transferAmount)}</h2>
      <div class="drag-slider" data-component-id="pot_drag_slider">
        <div class="drag-fill" id="dragFill"></div>
        <button class="drag-thumb" id="dragThumb" type="button" data-component-id="pot_drag_thumb">GBP 0</button>
      </div>
      <div class="slider-scale"><span>GBP 0</span><span>GBP 12</span></div>
    </div>
    ${renderPotCards()}`;
}

function renderPotTransfer() {
  return `
    ${renderPotCards()}
    <div class="section-card">
      <p class="muted">Manually confirm the amount</p>
      <h2>Type GBP ${escapeHtml(state.content.transferAmount)}</h2>
      <input id="potAmountInput" data-component-id="pot_amount_input" class="text-input" inputmode="numeric" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Enter amount again" />
      <button id="moveMoneyBtn" class="secondary-action" type="button" data-component-id="move_money_button">Move money</button>
    </div>`;
}

function renderInsightsOverview() {
  return `
    <div class="section-card">
      <h2>Insights</h2>
      <p class="muted">Explore spending cards and insight notifications.</p>
    </div>
    ${renderCardCarousel()}
    ${renderInsightsListOnly()}`;
}

function renderCardSwipe() {
  return `
    <div class="section-card">
      <p class="muted">Horizontal card movement</p>
      <h2>Select the ${escapeHtml(state.content.spendingCardTarget.title)} card</h2>
      <p class="muted">Scroll the spending-card row horizontally, then tap ${escapeHtml(state.content.spendingCardTarget.title)}.</p>
    </div>
    ${renderCardCarousel()}`;
}

function renderCardCarousel() {
  return `
    <div class="swipe-carousel scroll-only-carousel" data-log-scroll="true" data-component-id="spending_card_carousel">
      ${state.content.spendingCards.map((card) => `
        <button class="spend-card" type="button" data-card-id="${escapeAttr(card.id)}" data-component-id="spend_card_${escapeAttr(slugify(card.id))}">
          <span>${escapeHtml(card.title)}</span>
          <strong>${escapeHtml(card.amount)}</strong>
          <small>${escapeHtml(card.body)}</small>
        </button>
      `).join("")}
    </div>`;
}

function renderInsightsList() {
  return `
    <div class="section-card">
      <p class="muted">Insight to review</p>
      <h2>${escapeHtml(state.content.insightTarget.title)}</h2>
      <p class="muted">Scroll the insight list and select the matching card.</p>
    </div>
    ${renderInsightsListOnly()}`;
}

function renderInsightsListOnly() {
  return `
    <div class="insight-list" data-log-scroll="true" data-component-id="insight_list">
      ${state.content.insights.map((insight) => `
        <button class="insight-card ${state.reviewedInsights.has(insight.id) ? "selected" : ""}" type="button" data-insight-id="${escapeAttr(insight.id)}" data-component-id="insight_${escapeAttr(slugify(insight.id))}">
          <span>${escapeHtml(insight.icon)}</span>
          <strong>${escapeHtml(insight.title)}</strong>
          <small>${escapeHtml(insight.body)}</small>
        </button>
      `).join("")}
    </div>`;
}

function renderSecureOverview() {
  return `
    <div class="section-card">
      <h2>Secure</h2>
      <p class="muted">Secure messages and approvals appear here.</p>
    </div>
    <div class="message-bubble"><p>No new secure messages yet.</p></div>`;
}

function renderSecureApproval() {
  const payment = state.content.approvalPayment;
  const icon = payment.icon || payment.merchant.slice(0, 2).toUpperCase();

  return `
    <div class="approval-card">
      <span class="large-emoji">${escapeHtml(icon)}</span>
      <p class="muted">Demo payment request</p>
      <h2>${escapeHtml(payment.merchant)}</h2>
      <h3>${escapeHtml(payment.amount)}</h3>
      <div class="swipe-confirm" data-component-id="approval_swipe_track">
        <span>Swipe to approve</span>
        <button id="approvalThumb" class="approval-thumb" type="button" data-component-id="approval_swipe_thumb">Approve</button>
      </div>
      <button class="decline-link" type="button" data-component-id="approval_decline">Decline instead</button>
    </div>`;
}

function renderSecureReply() {
  return `
    <div class="message-bubble incoming">
      <p>Should we save the note for ${escapeHtml(state.content.target.merchant)}?</p>
    </div>
    <div class="section-card">
      <p class="muted">Copy this secure reply</p>
      <h2>${escapeHtml(state.content.target.reply)}</h2>
      <textarea id="replyInput" data-component-id="secure_reply_input" class="text-area" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Copy reply here"></textarea>
    </div>`;
}

function renderFinish() {
  return `
    <div class="finish-card">
      <span class="large-emoji">Done</span>
      <h2>Final check</h2>
      <p class="muted">How did the full review feel?</p>
      <div class="chip-grid feeling-grid">
        ${BANKING_LIBRARY.feelings.map((feeling) => `
          <button class="feeling-chip" type="button" data-feeling="${escapeAttr(feeling)}" data-component-id="feeling_${escapeAttr(slugify(feeling))}">
            ${escapeHtml(feeling)}
          </button>
        `).join("")}
      </div>
    </div>`;
}

function bindHomeHandlers() {
  const task = window.currentTask;
  const activeBaseId = baseTaskId(task);

  document.querySelectorAll(".account-card").forEach((card) => {
    addScreenListener(card, "click", () => {
      card.classList.add("selected");

      if (activeBaseId === "home_balance_check") {
        updateEvidence(task.id, {
          accountReviewed: card.dataset.accountId === "current",
          selectedAccount: card.dataset.accountId
        });
      }

      if (activeBaseId === "home_explore_cards") {
        const explored = new Set(getEvidence(task.id).exploredAccounts || []);
        explored.add(card.dataset.accountId);

        updateEvidence(task.id, {
          exploredAccounts: [...explored],
          exploredCount: explored.size,
          allAccountsExplored: explored.size >= state.content.accounts.length
        });
      }

      logEvent("account_card_selected", {
        componentId: card.dataset.componentId,
        accountId: card.dataset.accountId,
        activeTaskId: task?.id || null,
        activeBaseTaskId: activeBaseId,
        contentSetIndex: state.contentSetIndex
      });
    });
  });
}

function bindActivityHandlers() {
  const task = window.currentTask;

  bindScrollEvidence("transaction_feed", task.id, "feedMaxScrollTop");
  bindScrollEvidence("activity_overview_feed", task.id, "overviewFeedMaxScrollTop");
  bindScrollEvidence("activity_filter_feed", task.id, "filterFeedMaxScrollTop");
  bindScrollEvidence("merchant_option_list", task.id, "merchantMaxScrollTop");
  bindScrollEvidence("category_option_list", task.id, "categoryMaxScrollTop");

  if (task.type === "typing_search") {
    bindTypingTask(task, document.getElementById("searchInput"), state.content.searchTerm);

    document.querySelectorAll(".merchant-option").forEach((option) => {
      addScreenListener(option, "click", () => {
        document.querySelectorAll(".merchant-option").forEach((item) => item.classList.remove("selected"));
        option.classList.add("selected");

        const isTarget = option.dataset.merchant === state.content.target.merchant;

        updateEvidence(task.id, {
          merchantOptionSelected: isTarget,
          selectedMerchant: option.dataset.merchant
        });

        logEvent("merchant_option_selected", {
          componentId: option.dataset.componentId,
          selectedTargetMerchant: isTarget,
          activeTaskId: task.id,
          contentSetIndex: state.contentSetIndex
        });
      });
    });
  }

  if (task.type === "activity_filter") {
    document.querySelectorAll(".filter-chip").forEach((chip) => {
      addScreenListener(chip, "click", () => {
        document.querySelectorAll(".filter-chip").forEach((item) => item.classList.remove("selected"));
        chip.classList.add("selected");

        const correctFilter = chip.dataset.filter === state.content.filterTarget;

        updateEvidence(task.id, {
          filterSelected: chip.dataset.filter,
          correctFilter
        });

        logEvent("activity_filter_selected", {
          componentId: chip.dataset.componentId,
          filter: chip.dataset.filter,
          correctFilter,
          activeTaskId: task.id,
          contentSetIndex: state.contentSetIndex
        });
      });
    });
  }

  document.querySelectorAll("[data-txn-id]").forEach((row) => {
    addScreenListener(row, "click", () => {
      const selected = state.content.feedItems.find((item) => item.id === row.dataset.txnId);
      if (!selected) return;

      state.selectedTransaction = selected;
      document.querySelectorAll(".txn-row").forEach((item) => item.classList.remove("selected"));
      row.classList.add("selected");

      if (task.type === "transaction_feed") {
        updateEvidence(task.id, {
          selectedTarget: !!selected.isTarget,
          selectedMerchant: selected.merchant,
          selectedWhen: selected.when,
          selectedAmount: selected.amount
        });
      }

      logEvent("transaction_selected", {
        componentId: row.dataset.componentId,
        selectedTarget: !!selected.isTarget,
        merchant: selected.merchant,
        when: selected.when,
        activeTaskId: task.id,
        activeTaskType: task.type,
        contentSetIndex: state.contentSetIndex
      });
    });
  });

  if (task.type === "categorise") {
    document.querySelectorAll(".category-option").forEach((option) => {
      addScreenListener(option, "click", () => {
        document.querySelectorAll(".category-option").forEach((item) => item.classList.remove("selected"));
        option.classList.add("selected");

        const category = option.dataset.category;

        updateEvidence(task.id, {
          categorySelected: true,
          category,
          correctCategory: category === state.content.target.category
        });

        logEvent("category_selected", {
          componentId: option.dataset.componentId,
          category,
          correctCategory: category === state.content.target.category,
          activeTaskId: task.id,
          contentSetIndex: state.contentSetIndex
        });
      });
    });
  }

  if (task.type === "guided_note") {
    bindTypingTask(task, document.getElementById("noteInput"), state.content.target.note);
  }
}

function bindPotsHandlers() {
  const task = window.currentTask;

  document.querySelectorAll(".pot-card").forEach((pot) => {
    addScreenListener(pot, "click", () => {
      document.querySelectorAll(".pot-card").forEach((item) => item.classList.remove("selected"));
      pot.classList.add("selected");

      if (task.type === "pots_transfer") {
        updateEvidence(task.id, {
          potSelected: pot.dataset.potId,
          travelPotSelected: pot.dataset.potId === "travel"
        });
      }

      logEvent("pot_selected", {
        componentId: pot.dataset.componentId,
        potId: pot.dataset.potId,
        activeTaskId: task.id,
        activeTaskType: task.type,
        contentSetIndex: state.contentSetIndex
      });
    });
  });

  if (task.type === "pot_drag") bindPotDrag(task);

  if (task.type === "pots_transfer") {
    bindTypingTask(task, document.getElementById("potAmountInput"), state.content.transferAmount);

    const moveButton = document.getElementById("moveMoneyBtn");
    addScreenListener(moveButton, "click", () => {
      updateEvidence(task.id, {
        moveConfirmed: true,
        amountLength: document.getElementById("potAmountInput")?.value.length || 0
      });

      logEvent("pot_transfer_confirmed", {
        componentId: "move_money_button",
        activeTaskId: task.id,
        contentSetIndex: state.contentSetIndex
      });

      moveButton.textContent = "Money moved";
      moveButton.classList.add("confirmed", "selected");
    });
  }
}

function bindInsightsHandlers() {
  const task = window.currentTask;

  bindCardCarouselHandlers(task);
  bindScrollEvidence("insight_list", task.id, "insightMaxScrollTop");

  document.querySelectorAll(".insight-card").forEach((card) => {
    addScreenListener(card, "click", () => {
      const insightId = card.dataset.insightId;
      state.reviewedInsights.add(insightId);
      card.classList.add("selected");

      if (task.type === "insights_review") {
        updateEvidence(task.id, {
          targetInsightTapped: insightId === state.content.insightTarget.id,
          selectedInsight: insightId,
          reviewedCount: state.reviewedInsights.size
        });
      }

      logEvent("insight_card_selected", {
        componentId: card.dataset.componentId,
        isTargetInsight: insightId === state.content.insightTarget.id,
        reviewedCount: state.reviewedInsights.size,
        activeTaskId: task.id,
        activeTaskType: task.type,
        contentSetIndex: state.contentSetIndex
      });
    });
  });
}

function bindCardCarouselHandlers(task = window.currentTask) {
  const carousel = document.querySelector(".swipe-carousel");
  if (!carousel) return;

  const targetId = state.content.spendingCardTarget?.id;
  const isCardSwipeTask = task?.type === "card_swipe";

  if (isCardSwipeTask) {
    bindHorizontalScrollEvidence(carousel, task.id, "carouselMaxScrollLeft");
  }

  carousel.querySelectorAll(".spend-card").forEach((card) => {
    addScreenListener(card, "click", () => {
      carousel.querySelectorAll(".spend-card").forEach((item) => item.classList.remove("selected"));
      card.classList.add("selected");

      const evidence = isCardSwipeTask ? getEvidence(task.id) : {};
      const liveScrollLeft = Math.max(carousel.scrollLeft || 0, evidence.carouselMaxScrollLeft || 0);
      const targetCardSelected = card.dataset.cardId === targetId;

      if (isCardSwipeTask) {
        updateEvidence(task.id, {
          swiped: liveScrollLeft > 20,
          targetCardSelected,
          selectedCard: card.dataset.cardId,
          targetCardId: targetId,
          carouselMaxScrollLeftAtSelection: roundLocal(liveScrollLeft)
        });
      }

      logEvent("spending_card_selected", {
        componentId: card.dataset.componentId,
        cardId: card.dataset.cardId,
        targetCardId: targetId,
        targetCardSelected,
        carouselMaxScrollLeft: roundLocal(liveScrollLeft),
        activeTaskId: task?.id || null,
        activeTaskType: task?.type || null,
        contentSetIndex: state.contentSetIndex
      });

      if (isCardSwipeTask) {
        logEvent("card_swipe_summary", {
          componentId: "spending_card_carousel",
          selectedCard: card.dataset.cardId,
          targetCardId: targetId,
          targetCardSelected,
          swiped: liveScrollLeft > 20,
          maxScrollLeft: roundLocal(liveScrollLeft),
          maxScrollLeftRatio: carousel.scrollWidth > carousel.clientWidth
            ? roundLocal(liveScrollLeft / (carousel.scrollWidth - carousel.clientWidth))
            : 0,
          activeTaskId: task.id,
          contentSetIndex: state.contentSetIndex
        });
      }
    });
  });
}

function bindSecureHandlers() {
  const task = window.currentTask;

  if (task.type === "swipe_approval") bindApprovalSwipe(task);
  if (task.type === "guided_reply") bindTypingTask(task, document.getElementById("replyInput"), state.content.target.reply);

  if (task.type === "finish") {
    document.querySelectorAll(".feeling-chip").forEach((button) => {
      addScreenListener(button, "click", () => {
        if (finishingSession) return;
        finishingSession = true;

        document.querySelectorAll(".feeling-chip").forEach((item) => {
          item.classList.remove("selected");
          item.disabled = true;
        });
        button.classList.add("selected");

        updateEvidence(task.id, {
          finalFeelingSelected: true,
          feeling: button.dataset.feeling
        });

        logEvent("final_feeling_selected", {
          componentId: button.dataset.componentId,
          feeling: button.dataset.feeling
        });

        setTimeout(() => {
          finishingSession = false;
          goToTask(state.currentTaskIndex + 1);
        }, 160);
      });
    });
  }
}

function bindTypingTask(task, input, targetText) {
  if (!input) return;

  let previousLength = input.value.length;

  addScreenListener(input, "input", () => {
    const inputLength = input.value.length;
    const deltaLength = inputLength - previousLength;
    previousLength = inputLength;

    updateEvidence(task.id, {
      inputLength,
      targetLength: targetText.length,
      deltaLengthLast: deltaLength,
      corrections: (getEvidence(task.id).corrections || 0) + (deltaLength < 0 ? 1 : 0),
      completedLength: inputLength >= targetText.length,
      exactMatch: normaliseForValidation(input.value) === normaliseForValidation(targetText),
      exactCaseSensitiveMatch: input.value === targetText,
      validationMode: "case_insensitive_trimmed"
    });
  });
}

function bindScrollEvidence(componentId, taskId, fieldName) {
  const element = document.querySelector(`[data-component-id='${componentId}']`);
  if (!element) return;

  addScreenListener(element, "scroll", () => {
    updateScrollEvidence(taskId, fieldName, element.scrollTop, element.scrollHeight - element.clientHeight);
  }, { passive: true });
}

function bindHorizontalScrollEvidence(element, taskId, fieldName) {
  addScreenListener(element, "scroll", () => {
    const evidence = updateScrollEvidence(taskId, fieldName, element.scrollLeft, element.scrollWidth - element.clientWidth);

    logEvent("carousel_scroll", {
      componentId: element.dataset.componentId,
      scrollLeft: roundLocal(element.scrollLeft),
      maxScrollLeft: roundLocal(evidence[fieldName]),
      contentSetIndex: state.contentSetIndex
    });
  }, { passive: true });
}

function updateScrollEvidence(taskId, fieldName, rawValue, rawMax) {
  const value = Math.max(0, Number(rawValue) || 0);
  const max = Math.max(0, Number(rawMax) || 0);
  const ratio = max > 0 ? clamp01(value / max) : 0;
  const evidence = getEvidence(taskId);

  updateEvidence(taskId, {
    [fieldName]: Math.max(Number(evidence[fieldName] || 0), value),
    [`${fieldName}Ratio`]: Math.max(Number(evidence[`${fieldName}Ratio`] || 0), ratio)
  });

  return getEvidence(taskId);
}

function bindPotDrag(task = window.currentTask) {
  const track = document.querySelector(".drag-slider");
  const thumb = document.getElementById("dragThumb");
  const fill = document.getElementById("dragFill");
  const taskId = task?.id || "pots_drag_amount";

  bindDragControl(
    track,
    thumb,
    (ratio, meta) => {
      const value = String(Math.round(ratio * 12));
      fill.style.width = `${ratio * 100}%`;
      thumb.style.left = `${ratio * 100}%`;
      thumb.textContent = `GBP ${value}`;

      updateEvidence(taskId, {
        currentRatio: ratio,
        currentValue: value,
        targetValue: state.content.transferAmount,
        withinTolerance: Math.abs(Number(value) - Number(state.content.transferAmount)) <= 1,
        dragSamples: meta.samples,
        dragDistancePx: meta.distancePx
      });
    },
    (ratio, meta) => {
      const value = String(Math.round(ratio * 12));
      const correctRelease = Math.abs(Number(value) - Number(state.content.transferAmount)) <= 1;

      updateEvidence(taskId, {
        released: true,
        releasedRatio: ratio,
        releasedValue: value,
        targetValue: state.content.transferAmount,
        correctRelease,
        dragSamples: meta.samples,
        dragDistancePx: meta.distancePx,
        durationMs: meta.durationMs
      });

      logEvent("pot_drag_release", {
        componentId: "pot_drag_thumb",
        releasedValue: value,
        targetValue: state.content.transferAmount,
        correctRelease,
        activeTaskId: taskId,
        durationMs: meta.durationMs
      });
    }
  );
}

function bindApprovalSwipe(task = window.currentTask) {
  const track = document.querySelector(".swipe-confirm");
  const thumb = document.getElementById("approvalThumb");
  const taskId = task?.id || "secure_approval";

  bindDragControl(
    track,
    thumb,
    (ratio) => {
      thumb.style.left = `${ratio * 100}%`;
      updateEvidence(taskId, { swipeRatio: ratio });
    },
    (ratio, meta) => {
      const approved = ratio > 0.78;
      thumb.style.left = approved ? "100%" : "0%";

      updateEvidence(taskId, {
        approvalSelected: approved,
        action: approved ? "Approve" : null,
        expectedAction: "Approve",
        correctAction: approved,
        swipeRatio: ratio,
        durationMs: meta.durationMs,
        dragDistancePx: meta.distancePx
      });

      logEvent("approval_swipe_release", {
        componentId: "approval_swipe_thumb",
        swipeRatio: ratio,
        approved,
        activeTaskId: taskId,
        durationMs: meta.durationMs
      });
    }
  );

  addScreenListener(document.querySelector(".decline-link"), "click", () => {
    updateEvidence(taskId, {
      approvalSelected: true,
      action: "Decline",
      expectedAction: "Approve",
      correctAction: false
    });

    logEvent("secure_approval_selected", {
      componentId: "approval_decline",
      action: "Decline",
      correctAction: false,
      activeTaskId: taskId
    });
  });
}

function bindDragControl(track, thumb, onMove, onEnd) {
  if (!track || !thumb) return;

  let active = false;
  let startTime = 0;
  let lastPoint = { x: 0, y: 0 };
  let meta = { samples: 0, distancePx: 0, durationMs: 0 };

  const ratioFromEvent = (event) => {
    const rect = track.getBoundingClientRect();
    return clamp01((event.clientX - rect.left) / rect.width);
  };

  const start = (event) => {
    if (active) return;

    event.preventDefault();

    active = true;
    startTime = performance.now();
    lastPoint = { x: event.clientX, y: event.clientY };
    meta = { samples: 0, distancePx: 0, durationMs: 0 };
    thumb.setPointerCapture?.(event.pointerId);

    logEvent("gesture_drag_start", {
      componentId: thumb.dataset.componentId || null,
      pointerType: event.pointerType ?? null,
      x: event.clientX,
      y: event.clientY
    });
  };

  const move = (event) => {
    if (!active) return;

    const dx = event.clientX - lastPoint.x;
    const dy = event.clientY - lastPoint.y;
    meta.samples += 1;
    meta.distancePx += Math.hypot(dx, dy);
    meta.durationMs = performance.now() - startTime;
    lastPoint = { x: event.clientX, y: event.clientY };

    onMove(ratioFromEvent(event), meta);
  };

  const end = (event) => {
    if (!active) return;

    active = false;
    meta.durationMs = performance.now() - startTime;
    onEnd(ratioFromEvent(event), meta);

    logEvent("gesture_drag_end", {
      componentId: thumb.dataset.componentId || null,
      pointerType: event.pointerType ?? null,
      samples: meta.samples,
      distancePx: roundLocal(meta.distancePx),
      durationMs: roundLocal(meta.durationMs)
    });
  };

  addScreenListener(thumb, "pointerdown", start);
  addScreenListener(track, "pointerdown", start);
  addScreenListener(window, "pointermove", move, { passive: true });
  addScreenListener(window, "pointerup", end, { passive: true });
  addScreenListener(window, "pointercancel", end, { passive: true });
}

function attemptContinue() {
  if (advancingTask) return;

  const warning = validateTask(window.currentTask);

  if (warning) {
    showWarning(warning);
    return;
  }

  advancingTask = true;
  clearWarning();

  try {
    goToTask(state.currentTaskIndex + 1);
  } finally {
    setTimeout(() => {
      advancingTask = false;
    }, 250);
  }
}

function validateTask(task) {
  const evidence = getEvidence(task.id);

  switch (baseTaskId(task)) {
    case "home_balance_check":
      return evidence.accountReviewed ? null : "Go to Home and tap Current Account.";

    case "home_explore_cards":
      return evidence.allAccountsExplored ? null : "Go to Home and tap each account card once.";

    case "activity_search":
      return evidence.exactMatch && evidence.merchantOptionSelected
        ? null
        : `Go to Activity, type ${state.content.searchTerm}, then select it.`;

    case "activity_filter_review":
      return evidence.correctFilter
        ? null
        : `Go to Activity and select the ${state.content.filterTarget} filter.`;

    case "activity_scroll_select":
      return evidence.selectedTarget
        ? null
        : `Go to Activity and select the ${state.content.target.merchant} payment from ${state.content.target.when}.`;

    case "transaction_category":
      return evidence.correctCategory
        ? null
        : `Go to Activity and choose ${state.content.target.category}.`;

    case "transaction_note":
      return evidence.exactMatch
        ? null
        : `Go to Activity and copy the note: ${state.content.target.note}`;

    case "pots_drag_amount":
      return evidence.released && evidence.correctRelease
        ? null
        : `Go to Pots and drag to GBP ${state.content.transferAmount}.`;

    case "pots_transfer":
      return evidence.travelPotSelected && evidence.exactMatch && evidence.moveConfirmed
        ? null
        : `Go to Pots, select Travel Pot, type ${state.content.transferAmount}, then tap Move money.`;

    case "insights_swipe_cards":
      return evidence.targetCardSelected &&
        (evidence.swiped || (evidence.carouselMaxScrollLeft || 0) > 20 || (evidence.carouselMaxScrollLeftAtSelection || 0) > 20)
        ? null
        : `Go to Insights, scroll the cards horizontally, then tap ${state.content.spendingCardTarget.title}.`;

    case "insights_review":
      return evidence.targetInsightTapped
        ? null
        : `Go to Insights and select ${state.content.insightTarget.title}.`;

    case "secure_approval":
      return evidence.correctAction ? null : "Go to Secure and swipe the approval control.";

    case "secure_reply":
      return evidence.exactMatch ? null : "Go to Secure and copy the secure reply.";

    case "finish_feeling":
      return evidence.finalFeelingSelected ? null : "Choose how the review felt.";

    default:
      return null;
  }
}

function renderCompletion() {
  resetScreenListeners();
  window.currentTask = null;
  window.currentScreenId = "complete";

  try {
    completeSession();
  } catch (error) {
    console.error(error);
    app.innerHTML = `
      <section class="intro-screen completion-screen">
        <h1>Session finalisation error</h1>
        <p class="lead">The session reached the end, but could not be finalised cleanly.</p>
        <p class="muted">${escapeHtml(error?.message || "Unknown error")}</p>
        <button class="secondary-btn" type="button" id="startAnotherBtn">Start another session</button>
      </section>`;

    addScreenListener(document.getElementById("startAnotherBtn"), "click", renderContext);
    return;
  }

  const session = getSession();

  if (!session) {
    app.innerHTML = `
      <section class="intro-screen completion-screen">
        <h1>Session error</h1>
        <p class="lead">The session could not be found after completion. Please refresh and try again.</p>
        <button class="secondary-btn" type="button" id="startAnotherBtn">Start another session</button>
      </section>`;

    addScreenListener(document.getElementById("startAnotherBtn"), "click", renderContext);
    return;
  }

  app.innerHTML = `
    <section class="intro-screen completion-screen">
      <div class="success-orb">OK</div>
      <h1>Review complete</h1>
      <p class="lead">Thanks — your ${state.tasks.length}-task session is complete.</p>
      <div class="summary-card">
        <div><span>Participant ID</span><strong>${escapeHtml(session.participantId)}</strong></div>
        <div><span>Session</span><strong>${escapeHtml(String(session.sessionIndex))}</strong></div>
        <div><span>Duration</span><strong>${Math.round((session.sessionDurationMs || 0) / 1000)}s</strong></div>
        <div><span>Events</span><strong>${session.events.length}</strong></div>
      </div>
      <p id="uploadStatus" class="muted">Preparing upload…</p>
      <button class="secondary-btn" type="button" id="retryUploadBtn" hidden>Retry upload</button>
      <button class="secondary-btn" type="button" id="startAnotherBtn" disabled>Start another session</button>
    </section>`;

  const startAnotherBtn = document.getElementById("startAnotherBtn");
  const retryUploadBtn = document.getElementById("retryUploadBtn");

  addScreenListener(startAnotherBtn, "click", renderContext);

  async function attemptUpload() {
    const s = (typeof getSession === "function") ? getSession() : null;
    const statusEl = document.getElementById("uploadStatus");

    if (!s || !s.sessionId || !statusEl) return;

    if (!window.bbdcFirebase) {
      statusEl.textContent = "Upload unavailable. Please check your internet connection and try again.";
      retryUploadBtn.hidden = false;
      startAnotherBtn.disabled = false;
      return;
    }

    try {
      retryUploadBtn.hidden = true;
      startAnotherBtn.disabled = true;
      statusEl.textContent = "Uploading…";

      await window.bbdcFirebase.uploadSessionToFirebase(s);

      statusEl.textContent = "Uploaded. Thank you.";
      startAnotherBtn.disabled = false;
    } catch (e) {
      console.error("UPLOAD_ERROR", e);
      statusEl.textContent = "Upload failed. Please check your internet connection, keep this page open, and tap Retry upload.";
      retryUploadBtn.hidden = false;
      startAnotherBtn.disabled = false;
    }
  }

  addScreenListener(retryUploadBtn, "click", attemptUpload);
  attemptUpload();
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

function resolveTaskId(taskId) {
  const raw = String(taskId || "");
  if (/_\d{2}$/.test(raw)) return raw;

  const matchingTask = state.tasks.find((task) =>
    task.baseId === raw && task.contentSetIndex === state.contentSetIndex
  );

  return matchingTask ? matchingTask.id : raw;
}

function baseTaskId(taskOrId) {
  if (taskOrId && typeof taskOrId === "object") {
    return taskOrId.baseId || String(taskOrId.id || "").replace(/_\d{2}$/, "");
  }

  return String(taskOrId || "").replace(/_\d{2}$/, "");
}

function ensureEvidence(taskId) {
  const resolved = resolveTaskId(taskId);
  if (!state.evidence[resolved]) state.evidence[resolved] = {};
}

function updateEvidence(taskId, patch) {
  const resolved = resolveTaskId(taskId);
  ensureEvidence(resolved);
  state.evidence[resolved] = { ...state.evidence[resolved], ...patch };
}

function getEvidence(taskId) {
  const resolved = resolveTaskId(taskId);
  ensureEvidence(resolved);
  return state.evidence[resolved];
}

function readRecentTargets() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_TARGET_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function rememberRecentTarget(entry) {
  try {
    const recent = readRecentTargets();
    recent.unshift(entry);
    localStorage.setItem(RECENT_TARGET_KEY, JSON.stringify(recent.slice(0, RECENT_TARGET_LIMIT)));
  } catch (_) {
    // localStorage may be unavailable in private browsing or restricted browser modes.
  }
}

function pickAvoidingRecent(items, recentValues, valueOf) {
  const fresh = items.filter((item) => !recentValues.includes(valueOf(item)));
  return randomChoice(fresh.length ? fresh : items);
}

function uniqueBy(items, key) {
  const seen = new Set();

  return items.filter((item) => {
    const value = key(item);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function randomChoice(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("randomChoice called with an empty array.");
  }

  return items[Math.floor(Math.random() * items.length)];
}

function normaliseForValidation(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function roundLocal(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? Number(value.toFixed(3))
    : null;
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