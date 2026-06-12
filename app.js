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

let screenController = new AbortController();
let bottomStackObserver = null;
let libraryExtended = false;

const RECENT_TARGET_KEY = "bbdc_recent_targets_v2";
const RECENT_TARGET_LIMIT = 10;

const DEVICE_MODEL_OPTIONS = {
  iphone: [
    "iPhone 17e", "iPhone 17 Pro Max", "iPhone 17 Pro", "iPhone Air", "iPhone 17",
    "iPhone 16e", "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16",
    "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
    "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
    "iPhone 13 series", "iPhone 12 series or older", "Other iPhone / not sure"
  ],
  android: [
    "Samsung Galaxy S26 Ultra", "Samsung Galaxy S26+", "Samsung Galaxy S26",
    "Samsung Galaxy S25 Ultra", "Samsung Galaxy S25+", "Samsung Galaxy S25",
    "Samsung Galaxy Z Fold 7", "Samsung Galaxy Z Flip 7", "Samsung Galaxy A series",
    "Google Pixel 10 Pro XL", "Google Pixel 10 Pro", "Google Pixel 10", "Google Pixel 10a",
    "Google Pixel 9 / 9 Pro series", "OnePlus 15", "OnePlus 13 / 13R",
    "Xiaomi / Redmi / POCO phone", "Oppo phone", "Honor phone", "Motorola phone",
    "Sony Xperia phone", "Nothing Phone", "Other Android / not sure"
  ],
  tablet: ["iPad Pro", "iPad Air", "iPad mini", "Standard iPad", "Samsung Galaxy Tab", "Other tablet / not sure"],
  desktop: ["MacBook trackpad", "MacBook with mouse", "Windows laptop trackpad", "Windows laptop with mouse", "Desktop with mouse", "Other laptop/desktop"],
  other: ["Other device", "Not sure"]
};

const ACTIVITY_FILTERS = [
  "Travel", "Food", "Groceries", "Subscription", "Shopping", "Bills", "Health", "Fitness",
  "Entertainment", "Takeaway", "Fuel", "Books", "Home", "Coffee", "Transport", "Restaurants",
  "Personal care", "Utilities", "Other"
];

const EXTRA_MERCHANTS = [
  { merchant: "Costa", amount: "GBP 4.35", category: "Coffee", note: "coffee before lecture", reply: "Yes, please mark this as coffee.", icon: "CO", hint: "coffee purchase" },
  { merchant: "Caffe Nero", amount: "GBP 5.10", category: "Coffee", note: "morning coffee", reply: "Yes, please save this as coffee.", icon: "CN", hint: "coffee purchase" },
  { merchant: "Greggs", amount: "GBP 3.80", category: "Food", note: "quick lunch", reply: "Yes, please tag this as lunch.", icon: "GR", hint: "bakery purchase" },
  { merchant: "Deliveroo", amount: "GBP 16.74", category: "Takeaway", note: "evening takeaway", reply: "Yes, please categorise this as takeaway.", icon: "DE", hint: "delivery order" },
  { merchant: "Lidl", amount: "GBP 21.46", category: "Groceries", note: "weekly shop", reply: "Yes, please mark this as groceries.", icon: "LI", hint: "supermarket shop" },
  { merchant: "Aldi", amount: "GBP 18.29", category: "Groceries", note: "food shop", reply: "Yes, please tag this as groceries.", icon: "AL", hint: "supermarket shop" },
  { merchant: "Sainsbury's", amount: "GBP 12.62", category: "Groceries", note: "top up shop", reply: "Yes, please save this as groceries.", icon: "SA", hint: "supermarket shop" },
  { merchant: "Shell", amount: "GBP 38.55", category: "Fuel", note: "petrol refill", reply: "Yes, please tag this as fuel.", icon: "SH", hint: "fuel payment" },
  { merchant: "BP", amount: "GBP 42.10", category: "Fuel", note: "fuel stop", reply: "Yes, please mark this as fuel.", icon: "BP", hint: "petrol station" },
  { merchant: "National Express", amount: "GBP 11.20", category: "Travel", note: "coach ticket", reply: "Yes, please add this to travel.", icon: "NE", hint: "coach ticket" },
  { merchant: "Rudy's Pizza", amount: "GBP 17.90", category: "Restaurants", note: "pizza with friends", reply: "Yes, please save this as restaurants.", icon: "RP", hint: "restaurant payment" },
  { merchant: "Odeon", amount: "GBP 13.50", category: "Entertainment", note: "cinema ticket", reply: "Yes, please tag this as entertainment.", icon: "OD", hint: "cinema ticket" },
  { merchant: "Cineworld", amount: "GBP 12.99", category: "Entertainment", note: "film ticket", reply: "Yes, please mark this as entertainment.", icon: "CW", hint: "cinema ticket" },
  { merchant: "Amazon", amount: "GBP 22.99", category: "Shopping", note: "online order", reply: "Yes, please save this as shopping.", icon: "AM", hint: "online purchase" },
  { merchant: "ASOS", amount: "GBP 34.80", category: "Shopping", note: "clothes order", reply: "Yes, please mark this as shopping.", icon: "AS", hint: "clothing order" },
  { merchant: "Zara", amount: "GBP 41.95", category: "Shopping", note: "new shirt", reply: "Yes, please tag this as shopping.", icon: "ZA", hint: "clothing purchase" },
  { merchant: "Waterstones", amount: "GBP 9.99", category: "Books", note: "book purchase", reply: "Yes, please save this as books.", icon: "WA", hint: "book shop" },
  { merchant: "EE", amount: "GBP 28.00", category: "Bills", note: "phone bill", reply: "Yes, please keep this as a bill.", icon: "EE", hint: "phone bill" },
  { merchant: "Vodafone", amount: "GBP 24.50", category: "Bills", note: "mobile contract", reply: "Yes, please categorise this as bills.", icon: "VO", hint: "mobile bill" },
  { merchant: "The Gym Group", amount: "GBP 20.99", category: "Fitness", note: "gym membership", reply: "Yes, please tag this as fitness.", icon: "TG", hint: "membership payment" },
  { merchant: "Superdrug", amount: "GBP 8.40", category: "Personal care", note: "toiletries", reply: "Yes, please save this as personal care.", icon: "SD", hint: "personal care" },
  { merchant: "IKEA", amount: "GBP 32.50", category: "Home", note: "desk lamp", reply: "Yes, please mark this as home.", icon: "IK", hint: "homeware purchase" },
  { merchant: "WHSmith", amount: "GBP 6.25", category: "Books", note: "stationery and book", reply: "Yes, please save this as books.", icon: "WH", hint: "stationery purchase" },
  { merchant: "Pizza Express", amount: "GBP 19.40", category: "Restaurants", note: "meal out", reply: "Yes, please mark this as restaurants.", icon: "PE", hint: "restaurant payment" }
];

const EXTRA_INSIGHTS = [
  { id: "fuel", title: "Fuel", body: "Fuel spending increased after two recent trips.", icon: "FU" },
  { id: "books", title: "Books", body: "Bookshop purchases appeared this week.", icon: "BK" },
  { id: "coffee", title: "Coffee", body: "Coffee spend is above your usual weekly average.", icon: "CF" },
  { id: "entertainment", title: "Entertainment", body: "Cinema and streaming payments were detected.", icon: "EN" },
  { id: "takeaway", title: "Takeaway", body: "Takeaway orders are higher than last week.", icon: "TA" },
  { id: "home", title: "Home", body: "Homeware purchases were added this month.", icon: "HM" },
  { id: "restaurants", title: "Restaurants", body: "Restaurant spending is up this weekend.", icon: "RS" },
  { id: "bills", title: "Bills", body: "Two bills are due in the next seven days.", icon: "BL" },
  { id: "groceries", title: "Groceries", body: "Supermarket spending increased this week.", icon: "GR" },
  { id: "shopping", title: "Shopping", body: "Shopping spend is spread across five merchants.", icon: "SH" }
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

window.currentTask = null;
window.currentTaskIndex = null;
window.currentScreenId = "intro";
window.currentActiveArea = "home";

function resetScreenListeners() {
  screenController.abort();
  screenController = new AbortController();
  if (bottomStackObserver) bottomStackObserver.disconnect();
}

function addScreenListener(target, type, handler, options = {}) {
  if (!target) return;
  target.addEventListener(type, handler, { ...options, signal: screenController.signal });
}

function updateBottomStackHeight() {
  const stack = document.querySelector(".sticky-stack");
  if (!stack) return;
  const height = Math.ceil(stack.getBoundingClientRect().height || 158);
  document.documentElement.style.setProperty("--bottom-stack-height", `${height}px`);
}

function observeBottomStack() {
  const stack = document.querySelector(".sticky-stack");
  if (!stack || !("ResizeObserver" in window)) {
    requestAnimationFrame(updateBottomStackHeight);
    return;
  }
  bottomStackObserver = new ResizeObserver(updateBottomStackHeight);
  bottomStackObserver.observe(stack);
  requestAnimationFrame(updateBottomStackHeight);
}

function renderIntro() {
  resetScreenListeners();
  state.identity = ensureIdentity();
  window.currentScreenId = "intro";
  app.innerHTML = `
    <section class="intro-screen compact-intro">
      <h1>Behavioural Biometrics Study</h1>
      <p class="lead">This study collects pseudonymised behavioural interaction data for academic research into continuous authentication.</p>
      <article class="info-card"><h2>What you will do</h2><p>Use a demo bank app naturally. You can move around the bottom menu like a normal app, but complete each highlighted task before finishing.</p><p><strong>Tasks include:</strong> checking balances, exploring cards, searching and filtering transactions, scrolling lists, typing short prompts, dragging a pot slider, moving a spending-card carousel and approving a demo payment.</p></article>
      <article class="info-card"><h2>What to expect</h2><p>The full session should take around <strong>2-3 minutes</strong>. It is better to behave naturally than to rush.</p><p>Before the app opens, you will answer context questions about your device, environment, posture, fatigue and focus.</p></article>
      <article class="info-card"><h2>Important instructions</h2><p>Use normal typing, scrolling, tapping, dragging and swiping behaviour.</p><p>Only type the short prompted text shown in the app. Do not type personal information.</p><p>Do not take part while driving or in any unsafe situation.</p></article>
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
      <p class="lead">This study collects pseudonymised behavioural, contextual and device interaction data from short banking-style tasks.</p>
      <article class="info-card"><h2>What will be collected</h2><p><strong>Typing metadata:</strong> key timing, input length, pauses and corrections. Raw typed content is not stored in the exported session file.</p><p><strong>Touch/pointer metadata:</strong> taps, scrolls, drag paths, swipe movement, target selection timing and touch-contact fields where available.</p><p><strong>Device and context:</strong> device/browser metadata, screen size, selected device model, posture, hand use, focus, fatigue and environment.</p><p><strong>Motion/orientation:</strong> phone motion and orientation where supported and permission is granted.</p></article>
      <article class="info-card"><h2>What is not intended to be collected</h2><p>No name, email address, password, location or real banking data is requested. The bank content is fake demo content.</p><p>Because device metadata and a Participant ID are recorded, this study should be understood as <strong>pseudonymised</strong>, not fully anonymous.</p></article>
      <article class="info-card"><h2>How your data is used</h2><p>Your session may be processed into derived features for academic research, modelling and dissertation reporting on behavioural biometrics and continuous authentication.</p><p>Participation is voluntary. You can stop at any time by closing the page before finishing. If you later wish to withdraw uploaded data, quote the Participant ID shown on the Results screen.</p><p><strong>18+ only.</strong></p></article>
      <label class="check-row"><input id="consentAge" type="checkbox" /><span>I am 18 or over, I understand what data may be collected, and I agree to take part.</span></label>
      <label class="check-row"><input id="consentBrowser" type="checkbox" /><span>I confirm that I am using a normal Safari or Chrome tab, not private/incognito mode.</span></label>
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
      <p class="lead">Answer based on how you feel right now. These fields help interpret behavioural changes across devices and situations.</p>
      ${renderSegmentGroup("timeOfDay", "Time of day", ["Morning", "Afternoon", "Evening", "Night"])}
      ${renderRangeGroup("fatigue", "Fatigue", "1 = very alert, 5 = very tired", 1, 5, 3)}
      ${renderRangeGroup("focusLevel", "Focus", "1 = distracted, 5 = very focused", 1, 5, 3)}
      <article class="info-card form-card"><h2>Device-aware CA</h2><p class="muted">Device model matters because screen size, touch sampling, keyboard layout and sensors can affect behavioural biometrics.</p>${renderSelectField("devicePlatform", "Device type / platform", "Choose your device family.", ["iPhone", "Android phone", "iPad / tablet", "Laptop / desktop", "Other / not sure"], "devicePlatformSelect")}${renderDeviceModelField()}${renderDeviceModelHelp()}</article>
      <article class="info-card form-card"><h2>Input and environment</h2>${renderSelectField("inputDevice", "Input method", "Choose the main input method.", ["Touch", "Trackpad", "Mouse", "Keyboard and trackpad", "Keyboard and mouse", "Other"])}${renderSelectField("movement", "Movement", "For example sitting still, walking, train, bus or car passenger.", ["None", "Slight movement", "Walking / moving", "Public transport / vehicle", "Other"])}${renderSelectField("environmentNoise", "Environment noise", null, ["Quiet", "Normal", "Noisy", "Very noisy"])}${renderSelectField("privacy", "Privacy of setting", null, ["Private", "Shared room", "Public place", "Other people nearby"])}${renderSelectField("alcohol", "Alcohol", null, ["No", "Yes - small amount", "Yes - moderate amount", "Prefer not to say"])}${renderSelectField("caffeine", "Caffeine in last 2 hours", null, ["No", "Yes", "Prefer not to say"])}</article>
      ${renderSegmentGroup("posture", "Posture", ["Sitting", "Standing", "Walking / moving"])}
      ${renderSegmentGroup("handUse", "Hand use", ["Two-handed", "One-handed right", "One-handed left"])}
      ${renderSegmentGroup("dominantHand", "Dominant hand", ["Right", "Left", "Ambidextrous"])}
      ${renderSegmentGroup("devicePosition", "Phone / device position", ["Held in hand", "On desk / table", "Laptop keyboard", "External keyboard", "Other"])}
      <button class="primary-btn" id="startReview" type="button">Open bank app</button>
    </section>`;
  bindSegmentGroups();
  bindRangeLabels();
  bindDeviceModelSelect();
  addScreenListener(document.getElementById("startReview"), "click", startReview);
}

function renderSegmentGroup(id, label, options) {
  return `<fieldset class="seg-group info-card" data-field="${id}"><legend><h2>${escapeHtml(label)}</h2></legend><div class="seg-row">${options.map((option, index) => `<button type="button" class="seg-chip ${index === 0 ? "selected" : ""}" data-value="${escapeAttr(slugify(option))}">${escapeHtml(option)}</button>`).join("")}</div></fieldset>`;
}

function renderRangeGroup(id, label, help, min, max, value) {
  return `<article class="info-card range-card"><h2>${escapeHtml(label)}</h2><p class="muted">${escapeHtml(help)}</p><p class="muted">Current value: <strong id="${id}Value">${value}</strong></p><input class="context-input" data-context-field="${id}" data-value-label="${id}Value" type="range" min="${min}" max="${max}" value="${value}" /></article>`;
}

function renderSelectField(id, label, help, options, elementId = "") {
  return `<label class="context-label"><span>${escapeHtml(label)}</span>${help ? `<small>${escapeHtml(help)}</small>` : ""}<select ${elementId ? `id="${escapeAttr(elementId)}"` : ""} class="text-input context-input" data-context-field="${id}">${options.map((option) => `<option value="${escapeAttr(slugify(option))}">${escapeHtml(option)}</option>`).join("")}</select></label>`;
}

function renderDeviceModelField() {
  return `<label class="context-label"><span>Specific device model</span><small>Select the closest option. Choose other / not sure if unsure.</small><select id="deviceModelSelect" class="text-input context-input" data-context-field="deviceModel">${DEVICE_MODEL_OPTIONS.iphone.map((option) => `<option value="${escapeAttr(slugify(option))}">${escapeHtml(option)}</option>`).join("")}</select></label>`;
}

function renderDeviceModelHelp() {
  return `<details class="help-card"><summary>How to check your model</summary><p><strong>iPhone:</strong> Settings → General → About → Model Name.</p><p><strong>Android:</strong> Settings → About phone → Model name / Device name.</p><p><strong>Laptop:</strong> macOS Apple menu → About This Mac, or Windows Settings → System → About.</p></details>`;
}

function bindSegmentGroups() {
  document.querySelectorAll(".seg-group").forEach((group) => group.querySelectorAll(".seg-chip").forEach((button) => addScreenListener(button, "click", () => {
    group.querySelectorAll(".seg-chip").forEach((chip) => chip.classList.remove("selected"));
    button.classList.add("selected");
  })));
}

function bindRangeLabels() {
  document.querySelectorAll("input[type='range'][data-value-label]").forEach((range) => addScreenListener(range, "input", () => {
    const label = document.getElementById(range.dataset.valueLabel);
    if (label) label.textContent = range.value;
  }));
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
  state.identity = ensureIdentity();
  state.context = collectContextAnswers();
  state.content = generateSessionContent();
  state.evidence = {};
  state.completedTasks = new Set();
  state.currentTaskIndex = -1;
  state.activeArea = "secure";
  state.selectedTransaction = null;
  state.reviewedInsights = new Set();
  state.codeInput = "";
  window.currentActiveArea = state.activeArea;
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

function publicGeneratedContent(content) {
  return {
    targetMerchant: content.target.merchant,
    targetAmount: content.target.amount,
    targetCategory: content.target.category,
    targetWhen: content.target.when,
    suggestedNote: content.target.note,
    suggestedReply: content.target.reply,
    transferAmount: content.transferAmount,
    filterTarget: content.filterTarget,
    insightTarget: content.insightTarget.title,
    spendingCardTarget: content.spendingCardTarget.title,
    spendingCardTargetId: content.spendingCardTarget.id,
    approvalMerchant: content.approvalPayment.merchant,
    approvalAmount: content.approvalPayment.amount,
    feedItemCount: content.feedItems.length,
    merchantOptionCount: content.merchantOptions.length,
    categoryOptionCount: content.categoryOptions.length,
    insightOptionCount: content.insights.length,
    spendingCardCount: content.spendingCards.length,
    randomization: {
      contentPool: "expanded_v2_in_app_js",
      avoidsRecentLocalTargets: true,
      recentWindow: RECENT_TARGET_LIMIT
    },
    gestureTasks: ["pots_drag_amount", "insights_swipe_cards", "secure_approval"]
  };
}

function generateSessionContent() {
  extendBankingLibrary();

  const recent = readRecentTargets();
  const recentMerchants = recent.map((item) => item.targetMerchant).filter(Boolean);
  const recentCards = recent.map((item) => item.spendingCardTargetId).filter(Boolean);
  const recentInsights = recent.map((item) => item.insightTargetId).filter(Boolean);

  const baseTarget = pickAvoidingRecent(BANKING_LIBRARY.merchants, recentMerchants, (item) => item.merchant);
  const targetWhen = randomChoice(["Today", "Yesterday", "This week", "Last week", "Last month"]);
  const target = {
    ...baseTarget,
    when: targetWhen,
    isTarget: true,
    id: `target_${slugify(baseTarget.merchant)}_${slugify(targetWhen)}_${Date.now().toString(36)}`
  };

  const insightPool = buildInsightOptions();
  const insightTarget = pickAvoidingRecent(insightPool, recentInsights, (item) => item.id);
  const spendingCardTarget = pickAvoidingRecent(SPENDING_CARDS, recentCards, (item) => item.id);
  const approvalPayment = buildRandomApprovalPayment(target.merchant);
  const transferAmount = randomChoice(BANKING_LIBRARY.transferAmounts);

  const content = {
    code: randomChoice(BANKING_LIBRARY.codes),
    target,
    targetItem: target,
    searchTerm: target.merchant,
    filterTarget: target.category,
    merchantOptions: placeTargetLow(buildMerchantOptions(target), (item) => item.merchant === target.merchant),
    feedItems: buildLongFeed(target),
    accounts: BANKING_LIBRARY.accounts,
    categoryOptions: placeTargetLow(buildCategoryOptions(target.category), (category) => category === target.category),
    pots: BANKING_LIBRARY.pots,
    transferAmount,
    insights: placeTargetLow(buildInsightOptions(), (insight) => insight.id === insightTarget.id),
    insightTarget,
    spendingCards: placeTargetLow(shuffle(SPENDING_CARDS), (card) => card.id === spendingCardTarget.id),
    spendingCardTarget,
    approvalPayment,
    expectedApprovalAction: "Approve"
  };

  rememberRecentTarget({
    targetMerchant: target.merchant,
    targetCategory: target.category,
    targetWhen,
    spendingCardTargetId: spendingCardTarget.id,
    insightTargetId: insightTarget.id,
    approvalMerchant: approvalPayment.merchant,
    createdAt: new Date().toISOString()
  });

  return content;
}

function extendBankingLibrary() {
  if (libraryExtended) return;
  BANKING_LIBRARY.merchants = uniqueBy([...BANKING_LIBRARY.merchants, ...EXTRA_MERCHANTS], (item) => item.merchant);
  BANKING_LIBRARY.fillerTransactions = uniqueBy([...BANKING_LIBRARY.fillerTransactions, ...EXTRA_MERCHANTS], (item) => item.merchant);
  BANKING_LIBRARY.insightTemplates = uniqueBy([...BANKING_LIBRARY.insightTemplates, ...EXTRA_INSIGHTS], (item) => item.id);
  BANKING_LIBRARY.categories = uniqueBy([...BANKING_LIBRARY.categories, ...ACTIVITY_FILTERS], (item) => item);
  BANKING_LIBRARY.codes = uniqueBy([...BANKING_LIBRARY.codes, "2758", "8164", "3907", "5429"], (item) => item);
  BANKING_LIBRARY.transferAmounts = uniqueBy([...BANKING_LIBRARY.transferAmounts, "6", "8", "9", "11"], (item) => item);
  libraryExtended = true;
}

function buildRandomApprovalPayment(targetMerchant) {
  const options = BANKING_LIBRARY.fillerTransactions.filter((item) => item.merchant !== targetMerchant);
  const payment = randomChoice(options.length ? options : BANKING_LIBRARY.fillerTransactions);
  return {
    merchant: payment.merchant,
    amount: payment.amount,
    icon: payment.icon || payment.merchant.slice(0, 2).toUpperCase()
  };
}

function buildMerchantOptions(target) {
  const baseNames = [
    "Amazon", "Apple", "ASOS", "Boots", "BP", "Caffe Nero", "Co-op", "Costa", "Deliveroo", "EE",
    "Five Guys", "Greggs", "H&M", "IKEA", "iCloud", "Lidl", "McDonald's", "National Express",
    "Netflix", "Nottingham Coffee", "Odeon", "Pret", "PureGym", "Rudy's Pizza", "Sainsbury's",
    "Shell", "Spotify", "Starbucks", "Subway", "Tesco", "The Gym Group", "Trainline", "Uber",
    "Unidays", "Waterstones", "Zara", "WHSmith", "Morrisons", "Aldi", "M&S", "Nando's", "Primark",
    "B&Q", "Currys", "Argos", "Superdrug", "Pizza Express", "Cineworld", "Lebara", "Vodafone"
  ];
  const names = uniqueBy([
    ...baseNames,
    ...BANKING_LIBRARY.merchants.map((item) => item.merchant),
    ...BANKING_LIBRARY.fillerTransactions.map((item) => item.merchant),
    target.merchant
  ], (item) => item);

  return shuffle(names).map((merchant, index) => {
    const match = BANKING_LIBRARY.merchants.find((item) => item.merchant === merchant) ||
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
  const categories = uniqueBy([
    "Automotive", "Bills", "Books", "Charity", "Coffee", "Education", "Entertainment", "Fitness", "Food",
    "Fuel", "Gifts", "Groceries", "Health", "Home", "Insurance", "Personal care", "Pets", "Rent",
    "Restaurants", "Savings", "Shopping", "Subscription", "Takeaway", "Transport", "Travel", "Utilities",
    "Work", "Other", ...ACTIVITY_FILTERS, targetCategory
  ], (item) => item);
  return shuffle(categories);
}

function buildInsightOptions(targetInsight = null) {
  const insights = uniqueBy([
    ...BANKING_LIBRARY.insightTemplates,
    ...EXTRA_INSIGHTS,
    { id: "weekend", title: "Weekend spending", body: "Weekend spending is above your weekday average.", icon: "WE" },
    { id: "savings", title: "Savings", body: "You are close to your monthly savings target.", icon: "SV" }
  ], (item) => item.id);
  if (targetInsight && !insights.some((insight) => insight.id === targetInsight.id)) insights.push(targetInsight);
  return shuffle(insights);
}

function buildLongFeed(target) {
  const pool = shuffle([...BANKING_LIBRARY.fillerTransactions, ...BANKING_LIBRARY.merchants].filter((item) => item.merchant !== target.merchant));
  const dates = ["Today", "Yesterday", "This week", "Last week", "Last month"];
  const feed = [];
  for (let i = 0; i < 56; i += 1) {
    const source = pool[i % pool.length];
    feed.push({
      ...source,
      when: randomChoice(dates),
      isTarget: false,
      id: `txn_${i}_${slugify(source.merchant)}`
    });
  }
  const insertRatio = 0.55 + Math.random() * 0.3;
  feed.splice(Math.floor(feed.length * insertRatio), 0, target);
  return feed;
}

function placeTargetLow(items, isTarget) {
  const copy = [...items];
  const targetIndex = copy.findIndex(isTarget);
  if (targetIndex < 0) return copy;
  const [target] = copy.splice(targetIndex, 1);
  copy.splice(Math.min(copy.length, Math.floor(copy.length * (0.62 + Math.random() * 0.24))), 0, target);
  return copy;
}

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
  window.currentActiveArea = state.activeArea;
  ensureEvidence(window.currentTask.id);
  logTaskStart(window.currentTask, index);
  if (window.currentTask.type === "code") renderCode();
  else renderBankShell();
}

function renderCode() {
  resetScreenListeners();
  window.currentScreenId = "secure_code";
  window.currentActiveArea = "secure";
  app.innerHTML = `<section class="passcode-screen"><div class="passcode-card"><div class="lock-badge">Lock</div><p class="eyebrow">Secure login</p><h1>Enter demo passcode</h1><p class="muted">Copy the passcode below.</p><div class="demo-code">${escapeHtml(state.content.code)}</div><div class="pass-dots">${renderCodeDotsMarkup()}</div><div class="keypad" data-component-id="code_keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, "Back", 0, "Clear"].map((key) => `<button class="keypad-btn" type="button" data-key="${escapeAttr(String(key))}" data-component-id="code_key_${escapeAttr(String(key))}">${escapeHtml(String(key))}</button>`).join("")}</div><div id="codeWarning" class="task-warning" hidden></div></div></section>`;
  attachTaskElementLogging(document);
  document.querySelectorAll(".keypad-btn").forEach((button) => addScreenListener(button, "click", () => handleCodeKey(button.dataset.key)));
  logEvent("screen_view", { screenId: "secure_code", taskId: window.currentTask.id, area: "secure" });
}

function handleCodeKey(key) {
  const before = state.codeInput.length;
  if (key === "Clear") state.codeInput = "";
  else if (key === "Back") state.codeInput = state.codeInput.slice(0, -1);
  else if (/^\d$/.test(key) && state.codeInput.length < 4) state.codeInput += key;
  const after = state.codeInput.length;
  logEvent("passcode_digit_tap", {
    componentId: `code_key_${key}`,
    keyClass: /^\d$/.test(key) ? "DIGIT" : "CONTROL",
    inputLengthBefore: before,
    inputLengthAfter: after,
    deltaLength: after - before
  });
  updateEvidence("unlock_code", {
    inputLength: after,
    codeCorrect: state.codeInput === state.content.code,
    corrections: (getEvidence("unlock_code").corrections || 0) + (key === "Back" || key === "Clear" ? 1 : 0)
  });
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
  resetScreenListeners();
  const task = window.currentTask;
  window.currentActiveArea = state.activeArea;
  window.currentScreenId = `${state.activeArea}_${task.id}`;
  app.innerHTML = `<section class="bank-screen"><header class="bank-header"><div><p class="eyebrow">Bank app</p><h1>${escapeHtml(headingForArea(state.activeArea))}</h1></div><button class="avatar" type="button" data-component-id="profile_button">${escapeHtml(state.identity?.participantId?.slice(1, 3) || "ID")}</button></header>${renderTaskBanner(task)}<div class="bank-content">${renderActiveArea()}</div><div id="taskWarning" class="task-warning" hidden></div><div class="sticky-stack"><button class="primary-btn" type="button" data-component-id="continue_button" id="continueBtn">Continue</button>${renderBottomNav()}</div></section>`;
  attachTaskElementLogging(document);
  bindAreaHandlers();
  addScreenListener(document.getElementById("continueBtn"), "click", attemptContinue);
  observeBottomStack();
  logEvent("screen_view", { screenId: window.currentScreenId, taskId: task.id, area: state.activeArea });
}

function renderTaskBanner(task) {
  const tabLabel = headingForArea(task.area === "finish" ? "secure" : task.area);
  return `<div class="task-banner" role="status" aria-live="polite"><div><p>Task ${state.currentTaskIndex + 1} of ${GUIDED_TASKS.length} · Go to ${escapeHtml(tabLabel)}</p><strong>${escapeHtml(task.title)}</strong><span>${escapeHtml(instructionForTask(task))}</span></div><div class="progress-ring">${Math.round(((state.currentTaskIndex + 1) / GUIDED_TASKS.length) * 100)}%</div></div>`;
}

function renderBottomNav() {
  return `<nav class="bottom-nav">${NAV_TABS.map((tab) => `<button class="nav-tab ${tab.id === state.activeArea ? "active" : ""}" type="button" data-area="${tab.id}" data-component-id="nav_${tab.id}"><span>${escapeHtml(tab.icon)}</span><small>${escapeHtml(tab.label)}</small></button>`).join("")}</nav>`;
}

function bindAreaHandlers() {
  document.querySelectorAll(".nav-tab").forEach((button) => {
    addScreenListener(button, "click", () => {
      state.activeArea = button.dataset.area;
      window.currentActiveArea = state.activeArea;
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
  const cardTitle = state.content.spendingCardTarget?.title || "Travel";
  return {
    home_balance_check: "Open Home and tap Current Account after checking the balance.",
    home_explore_cards: "Open Home and tap each account card once.",
    activity_search: `Open Activity, type ${target.merchant}, then select it from the merchant list.`,
    activity_filter_review: `Open Activity and select the ${state.content.filterTarget} filter chip.`,
    activity_scroll_select: `Open Activity and find the one ${target.merchant} payment from ${target.when}.`,
    transaction_category: `Open Activity and choose the ${target.category} category for the selected payment.`,
    transaction_note: `Open Activity and copy the note: ${target.note}`,
    pots_drag_amount: `Open Pots and drag the amount slider to GBP ${state.content.transferAmount}.`,
    pots_transfer: `Open Pots, select Travel Pot, type ${state.content.transferAmount}, then confirm.`,
    insights_swipe_cards: `Open Insights, scroll the spending cards horizontally, then select ${cardTitle}.`,
    insights_review: `Open Insights and select the ${state.content.insightTarget.title} insight.`,
    secure_approval: `Open Secure and approve ${state.content.approvalPayment.merchant} for ${state.content.approvalPayment.amount}.`,
    secure_reply: `Open Secure and copy: ${target.reply}`,
    finish_feeling: "Choose how the review felt."
  }[task.id] || task.title;
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
  return `<div class="balance-hero"><span>Bank app</span><p>Good afternoon</p><h2>GBP 2,112.77</h2><small>Across demo accounts</small></div>${showPrompt ? `<div class="section-card"><h2>Tap all account cards</h2><p class="muted">This adds natural exploration taps before continuing.</p></div>` : ""}<div class="card-list">${state.content.accounts.map((account) => `<button class="account-card ${account.accent}" type="button" data-account-id="${account.id}" data-component-id="account_${account.id}"><span><strong>${escapeHtml(account.name)}</strong><small>${escapeHtml(account.sub)}</small></span><b>${escapeHtml(account.balance)}</b></button>`).join("")}</div><div class="mini-grid"><div class="mini-card"><span>Pots</span><strong>3 pots</strong><small>GBP 1,556 saved</small></div><div class="mini-card"><span>Alerts</span><strong>2 alerts</strong><small>Ready to review</small></div></div>`;
}

function renderActivityOverview() {
  return `<div class="section-card"><h2>Activity</h2><p class="muted">Recent demo transactions.</p></div><div class="transaction-feed" data-log-scroll="true" data-component-id="activity_overview_feed">${state.content.feedItems.slice(0, 24).map((item) => renderTransactionRow(item)).join("")}</div>`;
}

function renderActivityFilter() {
  const filters = uniqueBy([...ACTIVITY_FILTERS, state.content.filterTarget], (item) => item);
  return `<div class="section-card"><p class="muted">Select this filter</p><h2>${escapeHtml(state.content.filterTarget)}</h2><p class="muted">Tap the matching filter chip, then continue.</p></div><div class="seg-row" data-component-id="activity_filter_chips">${filters.map((filter) => `<button type="button" class="seg-chip filter-chip" data-filter="${escapeAttr(filter)}" data-component-id="filter_${slugify(filter)}">${escapeHtml(filter)}</button>`).join("")}</div><div class="transaction-feed" data-log-scroll="true" data-component-id="activity_filter_feed">${state.content.feedItems.slice(0, 24).map((item) => renderTransactionRow(item)).join("")}</div>`;
}

function renderActivitySearch() {
  return `<div class="section-card search-card"><p class="muted">Find this merchant</p><h2>${escapeHtml(state.content.searchTerm)}</h2><label class="input-label" for="searchInput">Search transactions</label><input id="searchInput" data-component-id="search_input" class="text-input" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Type merchant name" /></div><div class="transaction-feed option-list" data-log-scroll="true" data-component-id="merchant_option_list">${state.content.merchantOptions.map((option) => `<button class="txn-row merchant-option" type="button" data-merchant="${escapeAttr(option.merchant)}" data-component-id="merchant_option_${slugify(option.merchant)}"><span class="txn-icon">${escapeHtml(option.icon)}</span><span class="txn-main"><strong>${escapeHtml(option.merchant)}</strong><small>${escapeHtml(option.category)} · ${escapeHtml(option.hint)}</small></span><span class="txn-amount">View</span></button>`).join("")}</div>`;
}

function renderActivityFeed() {
  return `<div class="section-card"><div class="search-pill">Target: ${escapeHtml(state.content.target.merchant)} · ${escapeHtml(state.content.target.when)}</div><p class="muted">There is only one matching ${escapeHtml(state.content.target.merchant)} payment in the list. Scroll and open the one from ${escapeHtml(state.content.target.when)}.</p></div><div class="transaction-feed" data-log-scroll="true" data-component-id="transaction_feed">${state.content.feedItems.map((item) => renderTransactionRow(item)).join("")}</div>`;
}

function renderTransactionRow(item) {
  return `<button class="txn-row" type="button" data-txn-id="${escapeAttr(item.id)}" data-component-id="txn_${slugify(item.id)}"><span class="txn-icon">${escapeHtml(item.icon || item.merchant.slice(0, 2).toUpperCase())}</span><span class="txn-main"><strong>${escapeHtml(item.merchant)}</strong><small>${escapeHtml(item.when || "Today")} · ${escapeHtml(item.category || "Card")}</small></span><span class="txn-amount">${escapeHtml(item.amount)}</span></button>`;
}

function renderTransactionDetail(showNote) {
  const transaction = state.selectedTransaction || state.content.targetItem;
  if (showNote) {
    return `${renderTransactionDetailCard(transaction)}<div class="section-card"><p class="muted">Copy this payment note</p><h2>${escapeHtml(state.content.target.note)}</h2><textarea id="noteInput" data-component-id="payment_note_input" class="text-area" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Copy note here"></textarea></div>`;
  }
  return `${renderTransactionDetailCard(transaction)}<div class="section-card"><p class="muted">Choose the best category</p><h2>${escapeHtml(state.content.target.category)}</h2></div><div class="transaction-feed option-list" data-log-scroll="true" data-component-id="category_option_list">${state.content.categoryOptions.map((category) => `<button class="txn-row category-option" type="button" data-category="${escapeAttr(category)}" data-component-id="category_${slugify(category)}"><span class="txn-icon">${escapeHtml(category.slice(0, 2).toUpperCase())}</span><span class="txn-main"><strong>${escapeHtml(category)}</strong><small>Payment category</small></span><span class="txn-amount">Select</span></button>`).join("")}</div>`;
}

function renderTransactionDetailCard(transaction) {
  return `<div class="transaction-detail-card"><span class="large-emoji">${escapeHtml(transaction.icon || "TX")}</span><h2>${escapeHtml(transaction.merchant)}</h2><h3>${escapeHtml(transaction.amount)}</h3><p>${escapeHtml(transaction.when)} · Card payment · ${escapeHtml(transaction.hint || transaction.category)}</p></div>`;
}

function renderPotsOverview() {
  return `<div class="section-card"><h2>Pots</h2><p class="muted">Explore demo savings pots.</p></div>${renderPotCards()}`;
}

function renderPotCards() {
  return `<div class="pot-list">${state.content.pots.map((pot) => `<button class="pot-card ${pot.id === "travel" ? "highlight" : ""}" type="button" data-pot-id="${pot.id}" data-component-id="pot_${pot.id}"><span>${escapeHtml(pot.icon)}</span><span><strong>${escapeHtml(pot.name)}</strong><small>${escapeHtml(pot.balance)} saved of ${escapeHtml(pot.target)}</small></span></button>`).join("")}</div>`;
}

function renderPotDrag() {
  return `<div class="section-card"><p class="muted">Controlled drag interaction</p><h2>Drag to GBP ${escapeHtml(state.content.transferAmount)}</h2><p class="muted">Use the thumb naturally. Release close to the target amount.</p><div class="drag-slider" data-component-id="pot_drag_slider"><div class="drag-fill" id="dragFill"></div><button class="drag-thumb" id="dragThumb" type="button" data-component-id="pot_drag_thumb">GBP 0</button></div><div class="slider-scale"><span>GBP 0</span><span>GBP 12</span></div></div>${renderPotCards()}`;
}

function renderPotTransfer() {
  return `${renderPotCards()}<div class="section-card"><p class="muted">Manually confirm the amount</p><h2>Type GBP ${escapeHtml(state.content.transferAmount)}</h2><input id="potAmountInput" data-component-id="pot_amount_input" class="text-input" inputmode="numeric" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Enter amount again" /><button id="moveMoneyBtn" class="secondary-action" type="button" data-component-id="move_money_button">Move money</button></div>`;
}

function renderInsightsOverview() {
  return `<div class="section-card"><h2>Insights</h2><p class="muted">Explore spending cards and insight notifications.</p></div>${renderCardCarousel()}${renderInsightsListOnly()}`;
}

function renderCardSwipe() {
  const target = state.content.spendingCardTarget || { title: "Travel" };
  return `<div class="section-card"><p class="muted">Horizontal card movement</p><h2>Select the ${escapeHtml(target.title)} card</h2><p class="muted">Scroll the spending-card row horizontally, then tap ${escapeHtml(target.title)}.</p></div>${renderCardCarousel()}`;
}

function renderCardCarousel() {
  const cards = state.content.spendingCards || SPENDING_CARDS;
  return `<div class="swipe-carousel scroll-only-carousel" data-log-scroll="true" data-component-id="spending_card_carousel">${cards.map((card) => `<button class="spend-card" type="button" data-card-id="${escapeAttr(card.id)}" data-component-id="spend_card_${slugify(card.id)}"><span>${escapeHtml(card.title)}</span><strong>${escapeHtml(card.amount)}</strong><small>${escapeHtml(card.body)}</small></button>`).join("")}</div>`;
}

function renderInsightsList() {
  return `<div class="section-card"><p class="muted">Insight to review</p><h2>${escapeHtml(state.content.insightTarget.title)}</h2><p class="muted">Scroll the insight list and select the matching card.</p></div>${renderInsightsListOnly()}`;
}

function renderInsightsListOnly() {
  return `<div class="insight-list" data-log-scroll="true" data-component-id="insight_list">${state.content.insights.map((insight) => `<button class="insight-card ${state.reviewedInsights.has(insight.id) ? "selected" : ""}" type="button" data-insight-id="${escapeAttr(insight.id)}" data-component-id="insight_${slugify(insight.id)}"><span>${escapeHtml(insight.icon)}</span><strong>${escapeHtml(insight.title)}</strong><small>${escapeHtml(insight.body)}</small></button>`).join("")}</div>`;
}

function renderSecureOverview() {
  return `<div class="section-card"><h2>Secure</h2><p class="muted">Secure messages and approvals appear here.</p></div><div class="message-bubble"><p>No new secure messages yet.</p></div>`;
}

function renderSecureApproval() {
  const icon = state.content.approvalPayment.icon || state.content.approvalPayment.merchant.slice(0, 2).toUpperCase();
  return `<div class="approval-card"><span class="large-emoji">${escapeHtml(icon)}</span><p class="muted">Demo payment request</p><h2>${escapeHtml(state.content.approvalPayment.merchant)}</h2><h3>${escapeHtml(state.content.approvalPayment.amount)}</h3><div class="swipe-confirm" data-component-id="approval_swipe_track"><span>Swipe to approve</span><button id="approvalThumb" class="approval-thumb" type="button" data-component-id="approval_swipe_thumb">Approve</button></div><button class="decline-link" type="button" data-approval="Decline" data-component-id="approval_decline">Decline instead</button></div>`;
}

function renderSecureReply() {
  return `<div class="message-bubble incoming"><p>Should we save the note for ${escapeHtml(state.content.target.merchant)}?</p></div><div class="section-card"><p class="muted">Copy this secure reply</p><h2>${escapeHtml(state.content.target.reply)}</h2><textarea id="replyInput" data-component-id="secure_reply_input" class="text-area" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Copy reply here"></textarea></div>`;
}

function renderFinish() {
  return `<div class="finish-card"><span class="large-emoji">Done</span><h2>Review complete</h2><p class="muted">How did this review feel?</p><div class="chip-grid feeling-grid">${BANKING_LIBRARY.feelings.map((feeling) => `<button class="feeling-chip" type="button" data-feeling="${escapeAttr(feeling)}" data-component-id="feeling_${slugify(feeling)}">${escapeHtml(feeling)}</button>`).join("")}</div></div>`;
}

function bindHomeHandlers() {
  document.querySelectorAll(".account-card").forEach((card) => addScreenListener(card, "click", () => {
    card.classList.add("selected");
    updateEvidence("home_balance_check", {
      accountReviewed: card.dataset.accountId === "current",
      selectedAccount: card.dataset.accountId
    });
    const explored = new Set(getEvidence("home_explore_cards").exploredAccounts || []);
    explored.add(card.dataset.accountId);
    updateEvidence("home_explore_cards", {
      exploredAccounts: [...explored],
      exploredCount: explored.size,
      allAccountsExplored: explored.size >= state.content.accounts.length
    });
    logEvent("account_card_selected", { componentId: card.dataset.componentId, accountId: card.dataset.accountId });
  }));
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
    document.querySelectorAll(".merchant-option").forEach((option) => addScreenListener(option, "click", () => {
      document.querySelectorAll(".merchant-option").forEach((item) => item.classList.remove("selected"));
      option.classList.add("selected");
      const isTarget = option.dataset.merchant === state.content.target.merchant;
      updateEvidence(task.id, { merchantOptionSelected: isTarget, selectedMerchant: option.dataset.merchant });
      logEvent("merchant_option_selected", { componentId: option.dataset.componentId, selectedTargetMerchant: isTarget });
    }));
  }

  if (task.type === "activity_filter") {
    document.querySelectorAll(".filter-chip").forEach((chip) => addScreenListener(chip, "click", () => {
      document.querySelectorAll(".filter-chip").forEach((item) => item.classList.remove("selected"));
      chip.classList.add("selected");
      const correctFilter = chip.dataset.filter === state.content.filterTarget;
      updateEvidence(task.id, { filterSelected: chip.dataset.filter, correctFilter });
      logEvent("activity_filter_selected", { componentId: chip.dataset.componentId, filter: chip.dataset.filter, correctFilter });
    }));
  }

  document.querySelectorAll("[data-txn-id]").forEach((row) => addScreenListener(row, "click", () => {
    const selected = state.content.feedItems.find((item) => item.id === row.dataset.txnId);
    if (!selected) return;
    state.selectedTransaction = selected;
    document.querySelectorAll(".txn-row").forEach((item) => item.classList.remove("selected"));
    row.classList.add("selected");
    updateEvidence("activity_scroll_select", {
      selectedTarget: !!selected.isTarget,
      selectedMerchant: selected.merchant,
      selectedWhen: selected.when,
      selectedAmount: selected.amount
    });
    logEvent("transaction_selected", {
      componentId: row.dataset.componentId,
      selectedTarget: !!selected.isTarget,
      merchant: selected.merchant,
      when: selected.when
    });
  }));

  if (task.type === "categorise") {
    document.querySelectorAll(".category-option").forEach((option) => addScreenListener(option, "click", () => {
      document.querySelectorAll(".category-option").forEach((item) => item.classList.remove("selected"));
      option.classList.add("selected");
      const category = option.dataset.category;
      updateEvidence(task.id, { categorySelected: true, category, correctCategory: category === state.content.target.category });
      logEvent("category_selected", { componentId: option.dataset.componentId, category, correctCategory: category === state.content.target.category });
    }));
  }

  if (task.type === "guided_note") bindTypingTask(task, document.getElementById("noteInput"), state.content.target.note);
}

function bindPotsHandlers() {
  const task = window.currentTask;
  document.querySelectorAll(".pot-card").forEach((pot) => addScreenListener(pot, "click", () => {
    document.querySelectorAll(".pot-card").forEach((item) => item.classList.remove("selected"));
    pot.classList.add("selected");
    updateEvidence("pots_transfer", { potSelected: pot.dataset.potId, travelPotSelected: pot.dataset.potId === "travel" });
    logEvent("pot_selected", { componentId: pot.dataset.componentId, potId: pot.dataset.potId });
  }));

  if (task.type === "pot_drag") bindPotDrag();

  if (task.type === "pots_transfer") {
    bindTypingTask(task, document.getElementById("potAmountInput"), state.content.transferAmount);
    const moveButton = document.getElementById("moveMoneyBtn");
    addScreenListener(moveButton, "click", () => {
      updateEvidence(task.id, { moveConfirmed: true, amountLength: document.getElementById("potAmountInput")?.value.length || 0 });
      logEvent("pot_transfer_confirmed", { componentId: "move_money_button" });
      moveButton.textContent = "Money moved";
      moveButton.classList.add("confirmed", "selected");
    });
  }
}

function bindInsightsHandlers() {
  const task = window.currentTask;
  bindCardCarouselHandlers();
  bindScrollEvidence("insight_list", task.id, "insightMaxScrollTop");
  document.querySelectorAll(".insight-card").forEach((card) => addScreenListener(card, "click", () => {
    const id = card.dataset.insightId;
    state.reviewedInsights.add(id);
    card.classList.add("selected");
    updateEvidence("insights_review", {
      targetInsightTapped: id === state.content.insightTarget.id,
      selectedInsight: id,
      reviewedCount: state.reviewedInsights.size
    });
    logEvent("insight_card_selected", {
      componentId: card.dataset.componentId,
      isTargetInsight: id === state.content.insightTarget.id,
      reviewedCount: state.reviewedInsights.size
    });
  }));
}

function bindCardCarouselHandlers() {
  const carousel = document.querySelector(".swipe-carousel");
  if (!carousel) return;

  const targetId = state.content.spendingCardTarget?.id || "travel";
  bindHorizontalScrollEvidence(carousel, "insights_swipe_cards", "carouselMaxScrollLeft");

  requestAnimationFrame(() => {
    carousel.scrollLeft = 0;
    updateEvidence("insights_swipe_cards", {
      carouselResetToStart: true,
      swiped: false,
      targetCardSelected: false,
      selectedCard: null,
      targetCardId: targetId,
      targetCardTitle: state.content.spendingCardTarget?.title || "Travel"
    });
  });

  let gesture = null;
  let lastSummaryAt = 0;
  const supportsPointer = "PointerEvent" in window;

  const start = (event, source) => {
    gesture = {
      source,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      startTime: performance.now(),
      pathLengthPx: 0,
      samples: 0,
      maxAbsDx: 0,
      maxAbsDy: 0
    };
    logEvent("card_swipe_start", {
      componentId: "spending_card_carousel",
      source,
      targetCardId: targetId,
      x: roundLocal(event.clientX),
      y: roundLocal(event.clientY)
    });
  };

  const move = (event) => {
    if (!gesture) return;
    const dxStep = event.clientX - gesture.lastX;
    const dyStep = event.clientY - gesture.lastY;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    gesture.pathLengthPx += Math.hypot(dxStep, dyStep);
    gesture.samples += 1;
    gesture.lastX = event.clientX;
    gesture.lastY = event.clientY;
    gesture.maxAbsDx = Math.max(gesture.maxAbsDx, Math.abs(dx));
    gesture.maxAbsDy = Math.max(gesture.maxAbsDy, Math.abs(dy));
  };

  const finish = (event, reason) => {
    if (!gesture) return;
    move(event);
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    const durationMs = Math.max(1, performance.now() - gesture.startTime);
    const displacementPx = Math.hypot(dx, dy);
    const pathLengthPx = Math.max(displacementPx, gesture.pathLengthPx);
    const horizontalSwipe = Math.abs(dx) >= 25 || gesture.maxAbsDx >= 25 || carousel.scrollLeft > 20;
    const summary = {
      componentId: "spending_card_carousel",
      source: gesture.source,
      reason,
      targetCardId: targetId,
      dx: roundLocal(dx),
      dy: roundLocal(dy),
      durationMs: roundLocal(durationMs),
      pathLengthPx: roundLocal(pathLengthPx),
      meanSpeedPxPerMs: roundLocal(pathLengthPx / durationMs),
      straightness: pathLengthPx > 0 ? roundLocal(displacementPx / pathLengthPx) : null,
      samples: gesture.samples,
      horizontalSwipe
    };

    const existing = getEvidence("insights_swipe_cards");
    const usefulSummary = pathLengthPx > 1 || !existing.pathLengthPx;
    if (usefulSummary) updateEvidence("insights_swipe_cards", { swiped: horizontalSwipe, swipeDetectionMethod: gesture.source, ...summary });
    logEvent("card_swipe_summary", summary);
    lastSummaryAt = performance.now();
    gesture = null;
  };

  if (supportsPointer) {
    addScreenListener(carousel, "pointerdown", (event) => start(event, "pointer"), { passive: true });
    addScreenListener(carousel, "pointermove", move, { passive: true });
    addScreenListener(carousel, "pointerup", (event) => finish(event, "pointerup"), { passive: true });
    addScreenListener(carousel, "pointercancel", (event) => finish(event, "pointercancel"), { passive: true });
  } else {
    addScreenListener(carousel, "touchstart", (event) => { const touch = event.changedTouches?.[0]; if (touch) start(touch, "touch"); }, { passive: true });
    addScreenListener(carousel, "touchmove", (event) => { const touch = event.changedTouches?.[0]; if (touch) move(touch); }, { passive: true });
    addScreenListener(carousel, "touchend", (event) => { const touch = event.changedTouches?.[0]; if (touch) finish(touch, "touchend"); }, { passive: true });
    addScreenListener(carousel, "touchcancel", (event) => { const touch = event.changedTouches?.[0]; if (touch) finish(touch, "touchcancel"); }, { passive: true });
  }

  carousel.querySelectorAll(".spend-card").forEach((card) => addScreenListener(card, "click", () => {
    carousel.querySelectorAll(".spend-card").forEach((item) => item.classList.remove("selected"));
    card.classList.add("selected");
    const evidence = getEvidence("insights_swipe_cards");
    const liveScrollLeft = Math.max(carousel.scrollLeft || 0, evidence.carouselMaxScrollLeft || 0);
    if (!evidence.swiped && liveScrollLeft > 20 && performance.now() - lastSummaryAt > 120) recordCarouselMovementSummary("carousel_scroll", liveScrollLeft, null);
    const targetCardSelected = card.dataset.cardId === targetId;
    updateEvidence("insights_swipe_cards", {
      targetCardSelected,
      selectedCard: card.dataset.cardId,
      targetCardId: targetId,
      carouselScrollLeftAtSelection: roundLocal(carousel.scrollLeft),
      carouselMaxScrollLeftAtSelection: roundLocal(liveScrollLeft)
    });
    logEvent("spending_card_selected", {
      componentId: card.dataset.componentId,
      cardId: card.dataset.cardId,
      targetCardId: targetId,
      targetCardSelected,
      carouselScrollLeft: roundLocal(carousel.scrollLeft),
      carouselMaxScrollLeft: roundLocal(liveScrollLeft)
    });
  }));
}

function recordCarouselMovementSummary(source, dx, durationMs) {
  const pathLengthPx = Math.abs(Number(dx) || 0);
  const summary = {
    componentId: "spending_card_carousel",
    source,
    reason: "scroll_before_selection",
    dx: roundLocal(dx),
    dy: 0,
    durationMs: durationMs == null ? null : roundLocal(durationMs),
    pathLengthPx: roundLocal(pathLengthPx),
    meanSpeedPxPerMs: durationMs ? roundLocal(pathLengthPx / durationMs) : null,
    straightness: pathLengthPx > 0 ? 1 : null,
    samples: null,
    horizontalSwipe: pathLengthPx > 20
  };
  updateEvidence("insights_swipe_cards", { swiped: pathLengthPx > 20, swipeDetectionMethod: source, ...summary });
  logEvent("card_swipe_summary", summary);
}

function bindSecureHandlers() {
  const task = window.currentTask;
  if (task.type === "swipe_approval") bindApprovalSwipe();
  if (task.type === "guided_reply") bindTypingTask(task, document.getElementById("replyInput"), state.content.target.reply);
  if (task.type === "finish") {
    document.querySelectorAll(".feeling-chip").forEach((button) => addScreenListener(button, "click", () => {
      document.querySelectorAll(".feeling-chip").forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");
      updateEvidence(task.id, { finalFeelingSelected: true, feeling: button.dataset.feeling });
      logEvent("final_feeling_selected", { componentId: button.dataset.componentId, feeling: button.dataset.feeling });
      setTimeout(() => goToTask(state.currentTaskIndex + 1), 160);
    }));
  }
}

function bindTypingTask(task, input, target) {
  if (!input) return;
  let previousLength = input.value.length;
  addScreenListener(input, "input", () => {
    const inputLength = input.value.length;
    const deltaLength = inputLength - previousLength;
    previousLength = inputLength;
    const exactMatch = normaliseForValidation(input.value) === normaliseForValidation(target);
    updateEvidence(task.id, {
      inputLength,
      targetLength: target.length,
      deltaLengthLast: deltaLength,
      corrections: (getEvidence(task.id).corrections || 0) + (deltaLength < 0 ? 1 : 0),
      completedLength: inputLength >= target.length,
      exactMatch,
      exactCaseSensitiveMatch: input.value === target,
      validationMode: "case_insensitive_trimmed"
    });
  });
}

function bindScrollEvidence(componentId, taskId, field) {
  const element = document.querySelector(`[data-component-id='${componentId}']`);
  if (!element) return;
  addScreenListener(element, "scroll", () => {
    updateScrollEvidenceFromCurrentGeometry(taskId, field, element.scrollTop, element.scrollHeight - element.clientHeight);
  }, { passive: true });
}

function bindHorizontalScrollEvidence(element, taskId, field) {
  addScreenListener(element, "scroll", () => {
    const evidence = updateScrollEvidenceFromCurrentGeometry(taskId, field, element.scrollLeft, element.scrollWidth - element.clientWidth);
    logEvent("carousel_scroll", {
      componentId: element.dataset.componentId,
      scrollLeft: roundLocal(element.scrollLeft),
      maxScrollLeft: roundLocal(evidence[field]),
      scrollLeftRatio: roundLocal(evidence[`${field}CurrentRatio`]),
      maxScrollLeftRatio: roundLocal(evidence[`${field}Ratio`]),
      scrollGeometryChanged: evidence[`${field}ScrollGeometryChanged`]
    });
  }, { passive: true });
}

function updateScrollEvidenceFromCurrentGeometry(taskId, field, rawScrollValue, rawMaxPossible) {
  const scrollValue = Math.max(0, Number(rawScrollValue) || 0);
  const maxPossibleCurrent = Math.max(0, Number(rawMaxPossible) || 0);
  const currentRatioRaw = maxPossibleCurrent > 0 ? scrollValue / maxPossibleCurrent : 0;
  const currentRatio = clamp01(currentRatioRaw);
  const evidence = getEvidence(taskId);
  const previousMaxPossible = Number(evidence[`${field}MaxPossibleObserved`] || 0);
  const previousMaxRatio = Number(evidence[`${field}Ratio`] || 0);
  const previousMaxScrollValue = Number(evidence[field] || 0);
  const historicalMaxAgainstCurrentRatioRaw = maxPossibleCurrent > 0 ? Math.max(previousMaxScrollValue, scrollValue) / maxPossibleCurrent : 0;
  const geometryChanged = Boolean(evidence[`${field}ScrollGeometryChanged`]) ||
    (previousMaxPossible > 0 && Math.abs(previousMaxPossible - maxPossibleCurrent) > 2) ||
    historicalMaxAgainstCurrentRatioRaw > 1.0001;

  updateEvidence(taskId, {
    [field]: Math.max(previousMaxScrollValue, scrollValue),
    [`${field}Current`]: roundLocal(scrollValue),
    [`${field}MaxPossibleCurrent`]: roundLocal(maxPossibleCurrent),
    [`${field}MaxPossibleObserved`]: roundLocal(Math.max(previousMaxPossible, maxPossibleCurrent)),
    [`${field}Ratio`]: Math.max(previousMaxRatio, currentRatio),
    [`${field}CurrentRatio`]: currentRatio,
    [`${field}RatioRaw`]: currentRatioRaw,
    [`${field}HistoricalMaxAgainstCurrentRatioRaw`]: historicalMaxAgainstCurrentRatioRaw,
    [`${field}ScrollGeometryChanged`]: geometryChanged
  });
  return getEvidence(taskId);
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
    updateEvidence("pots_drag_amount", {
      currentRatio: ratio,
      currentValue: value,
      targetValue: state.content.transferAmount,
      withinTolerance: Math.abs(Number(value) - Number(state.content.transferAmount)) <= 1,
      dragSamples: meta.samples,
      dragDistancePx: meta.distancePx
    });
  }, (ratio, meta) => {
    const value = String(Math.round(ratio * 12));
    const correctRelease = Math.abs(Number(value) - Number(state.content.transferAmount)) <= 1;
    updateEvidence("pots_drag_amount", {
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
      dragSamples: meta.samples,
      durationMs: meta.durationMs
    });
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
    updateEvidence("secure_approval", {
      approvalSelected: approved,
      action: approved ? "Approve" : null,
      expectedAction: "Approve",
      correctAction: approved,
      swipeRatio: ratio,
      swipeSamples: meta.samples,
      durationMs: meta.durationMs,
      dragDistancePx: meta.distancePx
    });
    logEvent("approval_swipe_release", {
      componentId: "approval_swipe_thumb",
      swipeRatio: ratio,
      approved,
      swipeSamples: meta.samples,
      durationMs: meta.durationMs
    });
  });
  addScreenListener(document.querySelector(".decline-link"), "click", () => {
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

  const ratioFromEvent = (event) => {
    const rect = track.getBoundingClientRect();
    return clamp01((event.clientX - rect.left) / rect.width);
  };

  const down = (event) => {
    active = true;
    startTime = performance.now();
    last = { x: event.clientX, y: event.clientY };
    meta = { samples: 0, distancePx: 0, durationMs: 0 };
    thumb.setPointerCapture?.(event.pointerId);
    logEvent("gesture_drag_start", { componentId: thumb.dataset.componentId || null, x: event.clientX, y: event.clientY });
  };

  const move = (event) => {
    if (!active) return;
    const dx = event.clientX - last.x;
    const dy = event.clientY - last.y;
    meta.samples += 1;
    meta.distancePx += Math.hypot(dx, dy);
    meta.durationMs = performance.now() - startTime;
    last = { x: event.clientX, y: event.clientY };
    const ratio = ratioFromEvent(event);
    logEvent("gesture_drag_move", {
      componentId: thumb.dataset.componentId || null,
      ratio: roundLocal(ratio),
      sampleIndex: meta.samples,
      x: roundLocal(event.clientX),
      y: roundLocal(event.clientY)
    });
    onMove(ratio, meta);
  };

  const up = (event) => {
    if (!active) return;
    active = false;
    meta.durationMs = performance.now() - startTime;
    const ratio = ratioFromEvent(event);
    onEnd(ratio, meta);
    logEvent("gesture_drag_end", {
      componentId: thumb.dataset.componentId || null,
      ratio: roundLocal(ratio),
      samples: meta.samples,
      distancePx: roundLocal(meta.distancePx),
      durationMs: roundLocal(meta.durationMs)
    });
  };

  addScreenListener(thumb, "pointerdown", down);
  addScreenListener(track, "pointerdown", down);
  addScreenListener(window, "pointermove", move, { passive: true });
  addScreenListener(window, "pointerup", up, { passive: true });
  addScreenListener(window, "pointercancel", up, { passive: true });
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
  const cardTitle = state.content.spendingCardTarget?.title || "Travel";
  switch (task.id) {
    case "home_balance_check": return evidence.accountReviewed ? null : "Go to Home and tap Current Account.";
    case "home_explore_cards": return evidence.allAccountsExplored ? null : "Go to Home and tap each account card once.";
    case "activity_search": return evidence.exactMatch && evidence.merchantOptionSelected ? null : `Go to Activity, type ${state.content.searchTerm}, then select it.`;
    case "activity_filter_review": return evidence.correctFilter ? null : `Go to Activity and select the ${state.content.filterTarget} filter.`;
    case "activity_scroll_select": return evidence.selectedTarget ? null : `Go to Activity and select the ${state.content.target.merchant} payment from ${state.content.target.when}.`;
    case "transaction_category": return evidence.correctCategory ? null : `Go to Activity and choose ${state.content.target.category}.`;
    case "transaction_note": return evidence.exactMatch ? null : `Go to Activity and copy the note: ${state.content.target.note}`;
    case "pots_drag_amount": return evidence.released && evidence.correctRelease ? null : `Go to Pots and drag to GBP ${state.content.transferAmount}.`;
    case "pots_transfer": return evidence.travelPotSelected && evidence.exactMatch && evidence.moveConfirmed ? null : `Go to Pots, select Travel Pot, type ${state.content.transferAmount}, then tap Move money.`;
    case "insights_swipe_cards": return evidence.targetCardSelected && (evidence.swiped || (evidence.carouselMaxScrollLeftAtSelection || 0) > 20 || (evidence.carouselMaxScrollLeft || 0) > 20) ? null : `Go to Insights, scroll the cards horizontally, then tap ${cardTitle}.`;
    case "insights_review": return evidence.targetInsightTapped ? null : `Go to Insights and select ${state.content.insightTarget.title}.`;
    case "secure_approval": return evidence.correctAction ? null : "Go to Secure and swipe the approval control.";
    case "secure_reply": return evidence.exactMatch ? null : "Go to Secure and copy the secure reply.";
    case "finish_feeling": return evidence.finalFeelingSelected ? null : "Choose how the review felt.";
    default: return null;
  }
}

function renderCompletion() {
  resetScreenListeners();
  window.currentTask = null;
  window.currentScreenId = "complete";
  completeSession();
  const session = getSession();
  app.innerHTML = `<section class="intro-screen completion-screen"><div class="success-orb">OK</div><h1>Review complete</h1><p class="lead">Thanks - this session is ready for development review.</p><div class="summary-card"><div><span>Participant ID</span><strong>${escapeHtml(session.participantId)}</strong></div><div><span>Session</span><strong>${escapeHtml(String(session.sessionIndex))}</strong></div><div><span>Duration</span><strong>${Math.round((session.sessionDurationMs || 0) / 1000)}s</strong></div><div><span>Events</span><strong>${session.events.length}</strong></div></div>${APP_MODE === "debug" ? `<button class="primary-btn" type="button" id="downloadJsonBtn">Download JSON</button>` : `<p class="muted">Your session has been uploaded.</p>`}<button class="secondary-btn" type="button" id="startAnotherBtn">Start another session</button></section>`;
  addScreenListener(document.getElementById("downloadJsonBtn"), "click", downloadSessionJson);
  addScreenListener(document.getElementById("startAnotherBtn"), "click", renderContext);
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
    // Some private/restrictive browser modes can block storage. Randomisation still works for this session.
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
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
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

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function roundLocal(value) {
  return typeof value === "number" && Number.isFinite(value) ? Number(value.toFixed(3)) : null;
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

renderIntro();
