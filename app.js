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
  codeInput: "",
  drag: {},
  swipe: {}
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
    "iPhone 13 Pro Max",
    "iPhone 13 Pro",
    "iPhone 13",
    "iPhone 13 mini",
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
    "Samsung Galaxy S25 Edge",
    "Samsung Galaxy Z Fold 7",
    "Samsung Galaxy Z Flip 7",
    "Samsung Galaxy A series",
    "Google Pixel 10 Pro XL",
    "Google Pixel 10 Pro",
    "Google Pixel 10",
    "Google Pixel 10a",
    "Google Pixel 10 Pro Fold",
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
  tablet: [
    "iPad Pro",
    "iPad Air",
    "iPad mini",
    "Standard iPad",
    "Samsung Galaxy Tab",
    "Other Android tablet",
    "Other tablet / not sure"
  ],
  desktop: [
    "MacBook trackpad",
    "MacBook with mouse",
    "Windows laptop trackpad",
    "Windows laptop with mouse",
    "Desktop with mouse",
    "Desktop with trackpad",
    "Other laptop/desktop"
  ],
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
      <p class="lead">
        This study is designed to collect pseudonymised behavioural interaction data for academic research into
        <strong>continuous authentication</strong>.
      </p>

      <article class="info-card">
        <h2>What you will do</h2>
        <p>You will complete a short guided banking-style app session.</p>
        <p><strong>1. Search and selection tasks:</strong> type, scroll through lists, find matching payments, categories and insights.</p>
        <p><strong>2. Banking interaction tasks:</strong> tap accounts, drag a pot slider, swipe cards, swipe to approve, and type short prompted notes.</p>
      </article>

      <article class="info-card">
        <h2>What to expect</h2>
        <p>The full session should take around <strong>2-3 minutes</strong>.</p>
        <p>Before the tasks, you will answer a few quick context questions such as time of day, fatigue, posture, input method, device model and environment.</p>
        <p>At the end, you will see your results and your <strong>Participant ID</strong>.</p>
      </article>

      <article class="info-card">
        <h2>Important instructions</h2>
        <p>Please complete the tasks naturally, using your normal typing, scrolling, tapping, dragging and swiping behaviour.</p>
        <p>For typed prompts, only type the text shown in the app. Do not type personal information.</p>
        <p>Please do not take part while driving or in any unsafe situation.</p>
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
      <p class="lead">
        This study collects pseudonymised behavioural, contextual and device interaction data from short banking-style tasks
        for academic research into behavioural biometrics and continuous authentication.
      </p>

      <article class="info-card">
        <h2>What will be collected</h2>
        <p>We collect data generated while you use this study, including:</p>
        <p><strong>Typing data:</strong> key press and release timings, input length, corrections, pauses and typed prompt completion metadata. User-entered text content is not stored in the exported session file.</p>
        <p><strong>Tap, pointer and touch data:</strong> tap timing, hit outcomes, pointer/touch movement, scroll behaviour, drag paths, swipe paths, touch-contact information where available, and target interaction timing.</p>
        <p><strong>Motion/orientation data:</strong> phone movement and orientation where your browser/device supports it and permission is granted.</p>
        <p><strong>Context data:</strong> your selected time of day, fatigue, input method, device family/model, posture, hand use, focus and environment.</p>
        <p><strong>Device/browser data:</strong> browser user agent, platform, screen size, pixel ratio, timezone offset, Participant ID, session ID and session timing metadata.</p>
      </article>

      <article class="info-card">
        <h2>Important note about typed text</h2>
        <p><strong>Do not type personal information, passwords, email addresses, phone numbers or sensitive information.</strong></p>
        <p>The app only asks for short generated prompts such as merchant names, payment notes and secure replies. The exported session is designed to store behavioural metadata rather than your raw typed content.</p>
      </article>

      <article class="info-card">
        <h2>What is not intended to be collected</h2>
        <p>We do not ask for your name or email address as part of the study task.</p>
        <p>We do not collect geolocation. The banking data shown in the app is fake demo content.</p>
        <p>Because behavioural data, device metadata and session identifiers are recorded, this study should be understood as collecting <strong>pseudonymised</strong> rather than fully anonymous data.</p>
      </article>

      <article class="info-card">
        <h2>How your data is used</h2>
        <p>Your data will be used for academic research on behavioural biometrics, continuous authentication and related machine learning analysis.</p>
        <p>Uploaded or downloaded session files may be processed into derived research datasets and statistical features for analysis, modelling and dissertation reporting.</p>
      </article>

      <article class="info-card">
        <h2>Voluntary participation and withdrawal</h2>
        <p>Participation is voluntary. You can stop at any time by closing the page before finishing.</p>
        <p>If you later wish to withdraw uploaded data, quote the <strong>Participant ID</strong> shown on the Results screen.</p>
        <p><strong>18+ only.</strong></p>
      </article>

      <p class="muted">Do not take part while driving or in any unsafe situation.</p>

      <label class="check-row">
        <input id="consentAge" type="checkbox" />
        <span>I am 18 or over, I understand what data may be collected, and I agree to take part.</span>
      </label>

      <article class="info-card">
        <p><strong>Browser requirement:</strong> please complete this study in a normal Safari or Chrome tab.</p>
        <p class="muted">Do not use private/incognito mode. Private browsing can interfere with persistent browser storage, which is needed to keep the same Participant ID on this device across sessions.</p>
      </article>

      <label class="check-row">
        <input id="consentBrowser" type="checkbox" />
        <span>I confirm that I am not using a private/incognito browser window.</span>
      </label>

      <button id="consentNext" class="primary-btn" disabled>Continue</button>
    </section>
  `;

  const consentAge = document.getElementById("consentAge");
  const consentBrowser = document.getElementById("consentBrowser");
  const nextButton = document.getElementById("consentNext");

  function updateConsentButton() {
    nextButton.disabled = !(consentAge.checked && consentBrowser.checked);
  }

  consentAge.addEventListener("change", updateConsentButton);
  consentBrowser.addEventListener("change", updateConsentButton);
  nextButton.addEventListener("click", renderContext);
}

function renderContext() {
  state.identity = ensureIdentity();
  window.currentScreenId = "context";

  app.innerHTML = `
    <section class="intro-screen compact-intro">
      <h1>Context Before You Start</h1>
      <p class="lead">
        These questions help us understand whether behaviour changes across different situations and devices.
        Please answer based on how you feel <strong>right now</strong>.
      </p>

      ${renderSegmentGroup("timeOfDay", "Time of day", ["Morning", "Afternoon", "Evening", "Night"])}
      ${renderRangeGroup("fatigue", "Fatigue", "Rate how tired you feel right now, from 1 = very alert to 5 = very tired.", 1, 5, 3)}
      ${renderRangeGroup("focusLevel", "Focus", "Rate how focused you feel right now, from 1 = distracted to 5 = very focused.", 1, 5, 3)}

      <article class="info-card">
        <h2>Device-aware CA</h2>
        <p class="muted">Device model matters because screen size, touch sampling, keyboard layout and motion sensors can change behavioural biometrics.</p>
        ${renderSelectField(
          "devicePlatform",
          "Device type / platform",
          "Choose the device family you are using for this session.",
          ["iPhone", "Android phone", "iPad / tablet", "Laptop / desktop", "Other / not sure"],
          "devicePlatformSelect"
        )}
        ${renderDeviceModelField()}
        ${renderDeviceModelHelp()}
      </article>

      <article class="info-card">
        <h2>Input and environment</h2>
        ${renderSelectField("inputDevice", "Input device", "Choose the main input method you are using to interact with the screen.", ["Touch", "Trackpad", "Mouse", "Keyboard and trackpad", "Keyboard and mouse", "Other"])}
        ${renderSelectField("movement", "Vibration / movement", "For example: sitting still, walking, on a train, or in a moving vehicle.", ["None", "Slight movement", "Walking / moving", "Public transport / vehicle", "Other"])}
        ${renderSelectField("environmentNoise", "Environment noise", null, ["Quiet", "Normal", "Noisy", "Very noisy"])}
        ${renderSelectField("privacy", "Privacy of setting", null, ["Private", "Shared room", "Public place", "Other people nearby"])}
        ${renderSelectField("alcohol", "Alcohol", "This is optional and used only as pseudonymised context for the research dataset.", ["No", "Yes - small amount", "Yes - moderate amount", "Prefer not to say"])}
        ${renderSelectField("caffeine", "Caffeine in last 2 hours", null, ["No", "Yes", "Prefer not to say"])}
      </article>

      ${renderSegmentGroup("posture", "Posture", ["Sitting", "Standing", "Walking / moving"])}
      ${renderSegmentGroup("handUse", "Hand use", ["Two-handed", "One-handed right", "One-handed left"])}
      ${renderSegmentGroup("dominantHand", "Dominant hand", ["Right", "Left", "Ambidextrous"])}
      ${renderSegmentGroup("phoneGrip", "Phone / device position", ["Held in hand", "On desk / table", "Laptop keyboard", "External keyboard", "Other"])}

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
        ${options
          .map(
            (option, index) => `
              <button
                type="button"
                class="seg-chip ${index === 0 ? "selected" : ""}"
                data-value="${escapeAttr(slugify(option))}"
              >${escapeHtml(option)}</button>
            `
          )
          .join("")}
      </div>
    </fieldset>
  `;
}

function renderRangeGroup(id, label, help, min, max, value) {
  return `
    <article class="info-card">
      <h2>${escapeHtml(label)}</h2>
      <p class="muted">${escapeHtml(help)}</p>
      <p class="muted">Current value: <strong id="${id}Value">${value}</strong></p>
      <input
        class="context-input"
        data-context-field="${id}"
        data-value-label="${id}Value"
        type="range"
        min="${min}"
        max="${max}"
        value="${value}"
      />
    </article>
  `;
}

function renderSelectField(id, label, help, options, elementId = "") {
  return `
    <label class="context-label">
      <span>${escapeHtml(label)}</span>
      ${help ? `<small>${escapeHtml(help)}</small>` : ""}
      <select
        ${elementId ? `id="${escapeAttr(elementId)}"` : ""}
        class="text-input context-input"
        data-context-field="${id}"
      >
        ${options.map((option) => `<option value="${escapeAttr(slugify(option))}">${escapeHtml(option)}</option>`).join("")}
      </select>
    </label>
  `;
}

function renderDeviceModelField() {
  return `
    <label class="context-label">
      <span>Specific device model</span>
      <small>Select the closest model. Choose "other / not sure" if you are unsure.</small>
      <select id="deviceModelSelect" class="text-input context-input" data-context-field="deviceModel">
        ${DEVICE_MODEL_OPTIONS.iphone
          .map((option) => `<option value="${escapeAttr(slugify(option))}">${escapeHtml(option)}</option>`)
          .join("")}
      </select>
    </label>
  `;
}

function renderDeviceModelHelp() {
  return `
    <div class="inline-note">
      <strong>How to check your model</strong>
      <span>
        iPhone: Settings → General → About → Model Name.<br />
        Android: Settings → About phone → Model name / Device name.<br />
        Laptop: macOS Apple menu → About This Mac, or Windows Settings → System → About.
      </span>
    </div>
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
  const platformSelect = document.getElementById("devicePlatformSelect");
  if (!platformSelect) return;

  platformSelect.addEventListener("change", updateDeviceModelOptions);
  updateDeviceModelOptions();
}

function updateDeviceModelOptions() {
  const platformSelect = document.getElementById("devicePlatformSelect");
  const modelSelect = document.getElementById("deviceModelSelect");

  if (!platformSelect || !modelSelect) return;

  const optionGroup = modelGroupFromPlatform(platformSelect.value);
  const options = DEVICE_MODEL_OPTIONS[optionGroup] || DEVICE_MODEL_OPTIONS.other;

  modelSelect.innerHTML = options
    .map((option) => `<option value="${escapeAttr(slugify(option))}">${escapeHtml(option)}</option>`)
    .join("");
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
  state.reviewedInsights = new Set();
  state.codeInput = "";
  state.drag = {};
  state.swipe = {};

  createSession(state.context, publicGeneratedContent(state.content));

  const permissionResult = await requestMotionPermission();
  startMotionLogging();
  logEvent("motion_logging_started", { permissionResult });

  goToTask(0);
}

function collectContextAnswers() {
  const context = {};

  document.querySelectorAll(".seg-group").forEach((group) => {
    const selected = group.querySelector(".seg-chip.selected");
    context[group.dataset.field] = selected?.dataset.value || null;
  });

  document.querySelectorAll(".context-input[data-context-field]").forEach((input) => {
    context[input.dataset.contextField] = input.value;
  });

  return context;
}

// -----------------------------------------------------------------------------
// Session content generation
// -----------------------------------------------------------------------------

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
    feedItemCount: content.feedItems.length,
    merchantOptionCount: content.merchantOptions.length,
    categoryOptionCount: content.categoryOptions.length,
    insightOptionCount: content.insights.length,
    gestureTasks: ["pots_drag_amount", "insights_swipe_cards", "secure_approval"]
  };
}

function generateSessionContent() {
  const target = randomChoice(BANKING_LIBRARY.merchants);
  const code = randomChoice(BANKING_LIBRARY.codes);
  const transferAmount = randomChoice(BANKING_LIBRARY.transferAmounts);
  const insightTarget = randomChoice(BANKING_LIBRARY.insightTemplates);

  return {
    code,
    target,
    searchTerm: target.merchant,
    merchantOptions: placeTargetLow(buildMerchantOptions(target), (item) => item.merchant === target.merchant),
    feedItems: buildLongFeed(target),
    accounts: BANKING_LIBRARY.accounts,
    categories: BANKING_LIBRARY.categories,
    categoryOptions: placeTargetLow(buildCategoryOptions(target.category), (category) => category === target.category),
    pots: BANKING_LIBRARY.pots,
    transferAmount,
    insights: placeTargetLow(buildInsightOptions(insightTarget), (insight) => insight.id === insightTarget.id),
    insightTarget,
    approvalPayment: {
      merchant: "Nottingham Coffee",
      amount: "GBP 4.80"
    },
    expectedApprovalAction: "Approve"
  };
}

function buildMerchantOptions(target) {
  const merchantNames = [
    "Amazon",
    "Apple",
    "ASOS",
    "Boots",
    "BP",
    "Caffe Nero",
    "Co-op",
    "Costa",
    "Deliveroo",
    "EE",
    "Five Guys",
    "Greggs",
    "H&M",
    "IKEA",
    "iCloud",
    "Lidl",
    "McDonald's",
    "National Express",
    "Netflix",
    "Nottingham Coffee",
    "Odeon",
    "Pret",
    "PureGym",
    "Rudy's Pizza",
    "Sainsbury's",
    "Shell",
    "Spotify",
    "Starbucks",
    "Subway",
    "Tesco",
    "The Gym Group",
    "Trainline",
    "Uber",
    "Unidays",
    "Waterstones",
    "Zara",
    "WHSmith",
    "Morrisons",
    "Aldi",
    "M&S",
    "Nando's",
    "Primark",
    "B&Q",
    "Currys",
    "Argos",
    "Superdrug",
    "Pizza Express",
    "Cineworld",
    "Lebara",
    "Vodafone"
  ];

  if (!merchantNames.includes(target.merchant)) merchantNames.push(target.merchant);

  return merchantNames.map((merchant, index) => {
    const knownMerchant =
      BANKING_LIBRARY.merchants.find((item) => item.merchant === merchant) ||
      BANKING_LIBRARY.fillerTransactions.find((item) => item.merchant === merchant) ||
      {};

    return {
      merchant,
      category: knownMerchant.category || randomChoice(["Shopping", "Food", "Travel", "Bills", "Subscription", "Groceries"]),
      icon: knownMerchant.icon || merchant.slice(0, 2).toUpperCase(),
      hint: knownMerchant.hint || "recent payment",
      id: `merchant_${index}_${slugify(merchant)}`
    };
  });
}

function buildCategoryOptions(targetCategory) {
  const categories = [
    "Automotive",
    "Bills",
    "Books",
    "Charity",
    "Coffee",
    "Education",
    "Entertainment",
    "Fitness",
    "Food",
    "Fuel",
    "Gifts",
    "Groceries",
    "Health",
    "Home",
    "Insurance",
    "Personal care",
    "Pets",
    "Rent",
    "Restaurants",
    "Savings",
    "Shopping",
    "Subscription",
    "Takeaway",
    "Transport",
    "Travel",
    "Utilities",
    "Work",
    "Other"
  ];

  if (!categories.includes(targetCategory)) categories.push(targetCategory);
  return categories;
}

function buildInsightOptions(targetInsight) {
  const insights = [
    ...BANKING_LIBRARY.insightTemplates,
    { id: "groceries", title: "Groceries", body: "Supermarket spending increased this week.", answer: "Groceries", icon: "GR" },
    { id: "takeaway", title: "Takeaway", body: "Takeaway orders are higher than usual.", answer: "Takeaway", icon: "TA" },
    { id: "fitness", title: "Fitness", body: "Your gym payment renewed this week.", answer: "Fitness", icon: "FI" },
    { id: "shopping", title: "Shopping", body: "Shopping spend is spread across five merchants.", answer: "Shopping", icon: "SH" },
    { id: "transport", title: "Transport", body: "Transport costs are lower this month.", answer: "Transport", icon: "TP" },
    { id: "health", title: "Health", body: "Health purchases appeared this week.", answer: "Health", icon: "HE" },
    { id: "bills", title: "Bills", body: "Two bills are due in the next seven days.", answer: "Bills", icon: "BL" },
    { id: "savings", title: "Savings", body: "You are close to your monthly savings target.", answer: "Savings", icon: "SV" },
    { id: "cash", title: "Cash withdrawals", body: "You made one cash withdrawal this month.", answer: "Cash", icon: "CA" },
    { id: "weekend", title: "Weekend spending", body: "Weekend spending is above your weekday average.", answer: "Weekend", icon: "WE" }
  ];

  if (!insights.some((insight) => insight.id === targetInsight.id)) insights.push(targetInsight);
  return insights;
}

function buildLongFeed(target) {
  const sourcePool = [...BANKING_LIBRARY.fillerTransactions, ...BANKING_LIBRARY.merchants];
  const dateLabels = ["Today", "Yesterday", "This week", "This week", "Last week", "Last week", "Last month", "Last month", "Last month"];
  const feedItems = [];

  for (let index = 0; index < 46; index += 1) {
    const source = sourcePool[index % sourcePool.length];
    const amount = source.amount || `GBP ${(3 + ((index * 7) % 54) + 0.49).toFixed(2)}`;

    feedItems.push({
      ...source,
      amount,
      when: dateLabels[index % dateLabels.length],
      isTarget: false,
      id: `txn_${index}_${slugify(source.merchant)}_${index}`
    });
  }

  const targetItem = {
    ...target,
    when: "Last month",
    isTarget: true,
    id: `txn_target_${slugify(target.merchant)}`
  };

  const insertIndex = Math.floor(feedItems.length * 0.78);
  feedItems.splice(insertIndex, 0, targetItem);
  return feedItems;
}

function placeTargetLow(items, isTarget) {
  const copy = [...items];
  const targetIndex = copy.findIndex(isTarget);

  if (targetIndex < 0) return copy;

  const [target] = copy.splice(targetIndex, 1);
  const insertIndex = Math.min(copy.length, Math.floor(copy.length * 0.78));
  copy.splice(insertIndex, 0, target);
  return copy;
}

// -----------------------------------------------------------------------------
// Task flow and shell rendering
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

  if (window.currentTask.type === "code") {
    renderCode();
  } else {
    renderBankShell();
  }
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
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9, "Back", 0, "Clear"]
            .map(
              (key) => `
                <button
                  class="keypad-btn"
                  data-key="${escapeAttr(String(key))}"
                  data-component-id="code_key_${escapeAttr(String(key))}"
                >${escapeHtml(String(key))}</button>
              `
            )
            .join("")}
        </div>
        <div id="codeWarning" class="task-warning" hidden></div>
      </div>
    </section>
  `;

  attachTaskElementLogging(document);
  document.querySelectorAll(".keypad-btn").forEach((button) => {
    button.addEventListener("click", () => handleCodeKey(button.dataset.key));
  });

  logEvent("screen_view", {
    screenId: "secure_code",
    taskId: window.currentTask.id
  });
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

function handleCodeKey(key) {
  const inputLengthBefore = state.codeInput.length;

  if (key === "Clear") {
    state.codeInput = "";
  } else if (key === "Back") {
    state.codeInput = state.codeInput.slice(0, -1);
  } else if (/^\d$/.test(key) && state.codeInput.length < 4) {
    state.codeInput += key;
  }

  const inputLengthAfter = state.codeInput.length;

  logEvent("passcode_digit_tap", {
    componentId: `code_key_${key}`,
    keyClass: /^\d$/.test(key) ? "DIGIT" : "CONTROL",
    inputLengthBefore,
    inputLengthAfter,
    deltaLength: inputLengthAfter - inputLengthBefore
  });

  updateEvidence("unlock_code", {
    inputLength: inputLengthAfter,
    targetLength: state.content.code.length,
    corrections: (getEvidence("unlock_code").corrections || 0) + (key === "Back" || key === "Clear" ? 1 : 0),
    codeCorrect: state.codeInput === state.content.code
  });

  renderCodeDots();

  if (state.codeInput.length !== 4) return;

  if (state.codeInput === state.content.code) {
    updateEvidence("unlock_code", { completedWithCorrectCode: true });
    setTimeout(() => goToTask(1), 180);
  } else {
    const warning = document.getElementById("codeWarning");
    warning.textContent = "That did not match the demo passcode. Clear and try again.";
    warning.hidden = false;
  }
}

function renderBankShell() {
  const task = window.currentTask;
  window.currentScreenId = `${state.activeArea}_${task.id}`;

  app.innerHTML = `
    <section class="bank-screen">
      <header class="bank-header">
        <div>
          <p class="eyebrow">Bank app</p>
          <h1>${headingForArea(state.activeArea)}</h1>
        </div>
        <button class="avatar" data-component-id="profile_button">
          ${escapeHtml(state.identity?.participantId?.slice(1, 3) || "ID")}
        </button>
      </header>

      <div class="review-banner">
        <div>
          <p>${task.id === "finish_feeling" ? "Final check" : `Review step ${state.currentTaskIndex + 1} of ${GUIDED_TASKS.length}`}</p>
          <strong>${escapeHtml(task.title)}</strong>
          <span>${instructionForTask(task)}</span>
        </div>
        <div class="progress-ring">${Math.round(((state.currentTaskIndex + 1) / GUIDED_TASKS.length) * 100)}%</div>
      </div>

      <div class="bank-content">${renderAreaContent(task)}</div>
      <div id="taskWarning" class="task-warning" hidden></div>
      ${task.type === "finish" ? "" : `<button class="primary-btn sticky-action" data-component-id="continue_button" id="continueBtn">Continue</button>`}
      ${renderBottomNav()}
    </section>
  `;

  attachTaskElementLogging(document);
  bindAreaHandlers(task);
  document.getElementById("continueBtn")?.addEventListener("click", attemptContinue);

  logEvent("screen_view", {
    screenId: window.currentScreenId,
    taskId: task.id,
    area: state.activeArea
  });
}

function renderBottomNav() {
  return `
    <nav class="bottom-nav">
      ${NAV_TABS
        .map(
          (tab) => `
            <button
              class="nav-tab ${tab.id === state.activeArea ? "active" : ""}"
              data-area="${tab.id}"
              data-component-id="nav_${tab.id}"
            >
              <span>${escapeHtml(tab.icon)}</span>
              <small>${escapeHtml(tab.label)}</small>
            </button>
          `
        )
        .join("")}
    </nav>
  `;
}

function headingForArea(area) {
  return {
    home: "Home",
    activity: "Activity",
    pots: "Pots",
    insights: "Insights",
    secure: "Secure"
  }[area] || "Bank app";
}

function instructionForTask(task) {
  const target = state.content.target;

  return {
    home_balance_check: "Tap the Current Account card after checking the balance.",
    activity_search: `Type ${target.merchant}, then scroll the merchant results and select it.`,
    activity_scroll_select: `Search the long feed and open ${target.merchant} from last month.`,
    transaction_category: `Scroll the category list and select ${target.category}.`,
    transaction_note: `Copy this note: ${target.note}`,
    pots_drag_amount: `Drag the slider to GBP ${state.content.transferAmount}.`,
    pots_transfer: `Manually type GBP ${state.content.transferAmount}, select Travel Pot, then confirm.`,
    insights_swipe_cards: "Swipe the spending cards horizontally until the Travel card is selected.",
    insights_review: `Scroll insights and tap: ${state.content.insightTarget.title}.`,
    secure_approval: `Swipe to approve ${state.content.approvalPayment.merchant} for ${state.content.approvalPayment.amount}.`,
    secure_reply: `Copy: ${target.reply}`,
    finish_feeling: "Choose how this review felt."
  }[task.id] || task.title;
}

function renderAreaContent(task) {
  switch (task.type) {
    case "tap_account":
      return renderHome();
    case "typing_search":
      return renderActivitySearch();
    case "transaction_feed":
      return renderActivityFeed();
    case "categorise":
      return renderTransactionDetail(false);
    case "guided_note":
      return renderTransactionDetail(true);
    case "pot_drag":
      return renderPotDrag();
    case "pots_transfer":
      return renderPots();
    case "card_swipe":
      return renderCardSwipe();
    case "insights_review":
      return renderInsights();
    case "swipe_approval":
      return renderSecureSwipeApproval();
    case "guided_reply":
      return renderSecureReply();
    case "finish":
      return renderFinish();
    default:
      return "<p>Unknown step.</p>";
  }
}

// -----------------------------------------------------------------------------
// Banking app screen renderers
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
      ${state.content.accounts
        .map(
          (account) => `
            <button class="account-card ${account.accent}" data-account-id="${account.id}" data-component-id="account_${account.id}">
              <span>
                <strong>${escapeHtml(account.name)}</strong>
                <small>${escapeHtml(account.sub)}</small>
              </span>
              <b>${escapeHtml(account.balance)}</b>
            </button>
          `
        )
        .join("")}
    </div>

    <div class="mini-grid">
      <div class="mini-card"><span>Pots</span><strong>3 pots</strong><small>GBP 1,556 saved</small></div>
      <div class="mini-card"><span>Alerts</span><strong>2 alerts</strong><small>Ready to review</small></div>
    </div>
  `;
}

function renderActivitySearch() {
  return `
    <div class="section-card search-card">
      <p class="muted">Find this merchant</p>
      <h2>${escapeHtml(state.content.searchTerm)}</h2>
      <label class="input-label" for="searchInput">Search transactions</label>
      <input
        id="searchInput"
        data-component-id="search_input"
        class="text-input"
        autocomplete="off"
        autocapitalize="none"
        spellcheck="false"
        placeholder="Type merchant name"
      />
    </div>

    <div class="transaction-feed option-list" data-log-scroll="true" data-component-id="merchant_option_list">
      ${state.content.merchantOptions
        .map(
          (option) => `
            <button
              class="txn-row merchant-option"
              data-merchant="${escapeAttr(option.merchant)}"
              data-component-id="merchant_option_${slugify(option.merchant)}"
            >
              <span class="txn-icon">${escapeHtml(option.icon)}</span>
              <span class="txn-main">
                <strong>${escapeHtml(option.merchant)}</strong>
                <small>${escapeHtml(option.category)} · ${escapeHtml(option.hint)}</small>
              </span>
              <span class="txn-amount">View</span>
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

function renderActivityFeed() {
  return `
    <div class="section-card">
      <div class="search-pill">Target: ${escapeHtml(state.content.searchTerm)}</div>
      <p class="muted">This is a longer activity feed. Scroll down to last month and open the matching payment.</p>
    </div>

    <div class="transaction-feed" data-log-scroll="true" data-component-id="transaction_feed">
      ${state.content.feedItems.map((item) => renderTransactionRow(item, true)).join("")}
    </div>
  `;
}

function renderTransactionRow(item, interactive) {
  return `
    <button
      class="txn-row"
      ${interactive ? `data-txn-id="${escapeAttr(item.id)}"` : "disabled"}
      data-component-id="txn_${slugify(item.merchant)}"
    >
      <span class="txn-icon">${escapeHtml(item.icon || "TX")}</span>
      <span class="txn-main">
        <strong>${escapeHtml(item.merchant)}</strong>
        <small>${escapeHtml(item.when || "Today")} · ${escapeHtml(item.category || "Card")}</small>
      </span>
      <span class="txn-amount">${escapeHtml(item.amount)}</span>
    </button>
  `;
}

function renderTransactionDetail(showNote) {
  const target = state.content.target;
  const selectedCategory = getEvidence("transaction_category").category || null;

  if (showNote) {
    return `
      <div class="transaction-detail-card">
        <span class="large-emoji">${escapeHtml(target.icon)}</span>
        <h2>${escapeHtml(target.merchant)}</h2>
        <h3>${escapeHtml(target.amount)}</h3>
        <p>Last month · Card payment · ${escapeHtml(target.hint)}</p>
      </div>

      <div class="section-card">
        <p class="muted">Copy this payment note</p>
        <h2>${escapeHtml(target.note)}</h2>
        <textarea
          id="noteInput"
          data-component-id="payment_note_input"
          class="text-area"
          autocomplete="off"
          spellcheck="false"
          placeholder="Copy note here"
        ></textarea>
      </div>
    `;
  }

  return `
    <div class="transaction-detail-card">
      <span class="large-emoji">${escapeHtml(target.icon)}</span>
      <h2>${escapeHtml(target.merchant)}</h2>
      <h3>${escapeHtml(target.amount)}</h3>
      <p>Last month · Card payment · ${escapeHtml(target.hint)}</p>
    </div>

    <div class="section-card">
      <p class="muted">Scroll categories and choose the best match</p>
      <h2>${escapeHtml(target.category)}</h2>
    </div>

    <div class="transaction-feed option-list" data-log-scroll="true" data-component-id="category_option_list">
      ${state.content.categoryOptions
        .map(
          (category) => `
            <button
              class="txn-row category-option ${selectedCategory === category ? "selected" : ""}"
              data-category="${escapeAttr(category)}"
              data-component-id="category_${slugify(category)}"
            >
              <span class="txn-icon">${escapeHtml(category.slice(0, 2).toUpperCase())}</span>
              <span class="txn-main"><strong>${escapeHtml(category)}</strong><small>Payment category</small></span>
              <span class="txn-amount">Select</span>
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

function renderPotDrag() {
  return `
    <div class="section-card">
      <p class="muted">Controlled drag interaction</p>
      <h2>Drag to GBP ${escapeHtml(state.content.transferAmount)}</h2>
      <p class="muted">Use the thumb rather than tapping the end. This captures path, speed and release accuracy.</p>

      <div class="drag-slider" data-component-id="pot_drag_slider">
        <div class="drag-fill" id="dragFill"></div>
        <button class="drag-thumb" id="dragThumb" data-component-id="pot_drag_thumb" aria-label="Drag amount">GBP 0</button>
      </div>

      <div class="slider-scale"><span>GBP 0</span><span>GBP 12</span></div>
    </div>

    ${renderPotCards()}
  `;
}

function renderPotCards() {
  return `
    <div class="pot-list">
      ${state.content.pots
        .map(
          (pot) => `
            <button class="pot-card ${pot.id === "travel" ? "highlight" : ""}" data-pot-id="${pot.id}" data-component-id="pot_${pot.id}">
              <span>${escapeHtml(pot.icon)}</span>
              <span>
                <strong>${escapeHtml(pot.name)}</strong>
                <small>${escapeHtml(pot.balance)} saved of ${escapeHtml(pot.target)}</small>
              </span>
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

function renderPots() {
  return `
    ${renderPotCards()}

    <div class="section-card">
      <p class="muted">Manually confirm the amount</p>
      <h2>Type GBP ${escapeHtml(state.content.transferAmount)}</h2>
      <input
        id="potAmountInput"
        data-component-id="pot_amount_input"
        class="text-input"
        inputmode="numeric"
        autocomplete="off"
        placeholder="Enter amount again"
      />
      <button id="moveMoneyBtn" class="secondary-action" data-component-id="move_money_button">Move money</button>
    </div>
  `;
}

function renderCardSwipe() {
  const cards = [
    { id: "food", title: "Food", amount: "GBP 42", body: "Small purchases this week" },
    { id: "travel", title: "Travel", amount: "GBP 67", body: "Train and ride spending" },
    { id: "subscriptions", title: "Subscriptions", amount: "GBP 45", body: "Recurring payments" }
  ];

  return `
    <div class="section-card">
      <p class="muted">Swipe horizontally</p>
      <h2>Select the Travel card</h2>
      <p class="muted">Make a clear horizontal swipe across the cards, then tap Travel. This task now requires pointer movement, not only carousel scroll.</p>
    </div>

    <div class="swipe-carousel" data-log-scroll="true" data-component-id="spending_card_carousel">
      ${cards
        .map(
          (card) => `
            <button
              class="spend-card ${card.id === "travel" ? "target" : ""}"
              data-card-id="${card.id}"
              data-component-id="spend_card_${card.id}"
            >
              <span>${escapeHtml(card.title)}</span>
              <strong>${escapeHtml(card.amount)}</strong>
              <small>${escapeHtml(card.body)}</small>
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

function renderInsights() {
  return `
    <div class="section-card">
      <p class="muted">Notification to find</p>
      <h2>${escapeHtml(state.content.insightTarget.title)}</h2>
      <p class="muted">Scroll the insight list and select the matching card.</p>
    </div>

    <div class="insight-list" data-log-scroll="true" data-component-id="insight_list">
      ${state.content.insights
        .map(
          (insight) => `
            <button
              class="insight-card ${state.reviewedInsights.has(insight.id) ? "selected" : ""}"
              data-insight-id="${insight.id}"
              data-component-id="insight_${insight.id}"
            >
              <span>${escapeHtml(insight.icon)}</span>
              <strong>${escapeHtml(insight.title)}</strong>
              <small>${escapeHtml(insight.body)}</small>
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

function renderSecureSwipeApproval() {
  return `
    <div class="approval-card">
      <span class="large-emoji">NC</span>
      <p class="muted">Demo payment request</p>
      <h2>${escapeHtml(state.content.approvalPayment.merchant)}</h2>
      <h3>${escapeHtml(state.content.approvalPayment.amount)}</h3>

      <div class="swipe-confirm" data-component-id="approval_swipe_track">
        <span>Swipe to approve</span>
        <button id="approvalThumb" class="approval-thumb" data-component-id="approval_swipe_thumb">Approve</button>
      </div>

      <button class="decline-link" data-approval="Decline" data-component-id="approval_decline">Decline instead</button>
    </div>
  `;
}

function renderSecureReply() {
  const target = state.content.target;

  return `
    <div class="message-bubble incoming">
      <p>Should we save the note for ${escapeHtml(target.merchant)}?</p>
    </div>

    <div class="section-card">
      <p class="muted">Copy this secure reply</p>
      <h2>${escapeHtml(target.reply)}</h2>
      <textarea
        id="replyInput"
        data-component-id="secure_reply_input"
        class="text-area"
        autocomplete="off"
        spellcheck="false"
        placeholder="Copy reply here"
      ></textarea>
    </div>
  `;
}

function renderFinish() {
  return `
    <div class="finish-card">
      <span class="large-emoji">Done</span>
      <h2>Review complete</h2>
      <p class="muted">How did this review feel?</p>

      <div class="chip-grid feeling-grid">
        ${BANKING_LIBRARY.feelings
          .map(
            (feeling) => `
              <button class="feeling-chip" data-feeling="${escapeAttr(feeling)}" data-component-id="feeling_${slugify(feeling)}">
                ${escapeHtml(feeling)}
              </button>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// Interaction binding and task validation
// -----------------------------------------------------------------------------

function bindAreaHandlers(task) {
  bindBottomNavigationGuards();

  if (task.type === "tap_account") bindAccountSelection(task);
  if (task.type === "typing_search") bindMerchantSearchTask(task);
  if (["guided_note", "guided_reply"].includes(task.type)) bindTypingTask(task);
  if (task.type === "transaction_feed") bindTransactionFeed(task);
  if (task.type === "categorise") bindCategorySelection(task);
  if (task.type === "pot_drag") bindPotDrag();
  if (task.type === "pots_transfer") bindPotsTransfer(task);
  if (task.type === "card_swipe") bindCardSwipe();
  if (task.type === "insights_review") bindInsightReview(task);
  if (task.type === "swipe_approval") bindApprovalSwipe();
  if (task.type === "finish") bindFinalFeeling(task);
}

function bindBottomNavigationGuards() {
  document.querySelectorAll(".nav-tab").forEach((button) => {
    button.addEventListener("click", () => {
      logEvent("nav_tab_clicked", {
        componentId: button.dataset.componentId,
        area: button.dataset.area,
        activeArea: state.activeArea
      });

      if (button.dataset.area !== state.activeArea) {
        showWarning("Follow the highlighted review step first - the rest of the app will open as you progress.");
      }
    });
  });
}

function bindAccountSelection(task) {
  document.querySelectorAll(".account-card").forEach((card) => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".account-card").forEach((item) => item.classList.remove("selected"));
      card.classList.add("selected");

      updateEvidence(task.id, {
        accountReviewed: card.dataset.accountId === "current",
        selectedAccount: card.dataset.accountId
      });

      logEvent("account_card_selected", {
        componentId: card.dataset.componentId,
        accountId: card.dataset.accountId
      });
    });
  });
}

function bindMerchantSearchTask(task) {
  bindTypingTask(task);
  bindScrollEvidence("merchant_option_list", "activity_search", "merchantMaxScrollTop");

  document.querySelectorAll(".merchant-option").forEach((option) => {
    option.addEventListener("click", () => {
      document.querySelectorAll(".merchant-option").forEach((item) => item.classList.remove("selected"));
      option.classList.add("selected");

      const maxScrollTop = getEvidence("activity_search").merchantMaxScrollTop || 0;
      const isTargetMerchant = option.dataset.merchant === state.content.target.merchant;
      const scrollRequirementMet = maxScrollTop > 220;

      updateEvidence("activity_search", {
        merchantOptionSelected: isTargetMerchant,
        selectedMerchant: option.dataset.merchant,
        merchantScrollRequirementMet: scrollRequirementMet
      });

      logEvent("merchant_option_selected", {
        componentId: option.dataset.componentId,
        selectedTargetMerchant: isTargetMerchant,
        merchantScrollRequirementMet: scrollRequirementMet
      });
    });
  });
}

function bindTransactionFeed(task) {
  bindScrollEvidence("transaction_feed", task.id, "feedMaxScrollTop");

  document.querySelectorAll("[data-txn-id]").forEach((row) => {
    row.addEventListener("click", () => {
      const selectedItem = state.content.feedItems.find((item) => item.id === row.dataset.txnId);
      const maxScrollTop = getEvidence(task.id).feedMaxScrollTop || 0;
      const selectedTarget = !!selectedItem?.isTarget;
      const scrollRequirementMet = maxScrollTop > 260;

      state.selectedTransaction = selectedItem;
      document.querySelectorAll(".txn-row").forEach((item) => item.classList.remove("selected"));
      row.classList.add("selected");

      updateEvidence(task.id, {
        selectedTarget,
        selectedMerchantIsGeneratedTarget: selectedTarget,
        selectedCategory: selectedItem?.category || null,
        feedScrollRequirementMet: scrollRequirementMet
      });

      logEvent("transaction_selected", {
        componentId: row.dataset.componentId,
        selectedTarget,
        merchantIsGeneratedTarget: selectedTarget,
        feedScrollRequirementMet: scrollRequirementMet
      });

      if (selectedTarget && scrollRequirementMet) setTimeout(() => goToTask(state.currentTaskIndex + 1), 220);
    });
  });
}

function bindCategorySelection(task) {
  bindScrollEvidence("category_option_list", task.id, "categoryMaxScrollTop");

  document.querySelectorAll(".category-option").forEach((option) => {
    option.addEventListener("click", () => {
      document.querySelectorAll(".category-option").forEach((item) => item.classList.remove("selected"));
      option.classList.add("selected");

      const category = option.dataset.category;
      const maxScrollTop = getEvidence(task.id).categoryMaxScrollTop || 0;
      const correctCategory = category === state.content.target.category;
      const scrollRequirementMet = maxScrollTop > 150;

      updateEvidence(task.id, {
        categorySelected: true,
        category,
        expectedCategory: state.content.target.category,
        correctCategory,
        categoryScrollRequirementMet: scrollRequirementMet
      });

      logEvent("category_selected", {
        componentId: option.dataset.componentId,
        category,
        correctCategory,
        categoryScrollRequirementMet: scrollRequirementMet
      });
    });
  });
}

function bindPotsTransfer(task) {
  document.querySelectorAll(".pot-card").forEach((pot) => {
    pot.addEventListener("click", () => {
      document.querySelectorAll(".pot-card").forEach((item) => item.classList.remove("selected"));
      pot.classList.add("selected");

      updateEvidence(task.id, {
        potSelected: pot.dataset.potId,
        travelPotSelected: pot.dataset.potId === "travel"
      });

      logEvent("pot_selected", {
        componentId: pot.dataset.componentId,
        potId: pot.dataset.potId
      });
    });
  });

  bindTypingTask(task, document.getElementById("potAmountInput"), state.content.transferAmount);

  document.getElementById("moveMoneyBtn")?.addEventListener("click", () => {
    updateEvidence(task.id, {
      moveConfirmed: true,
      amountLength: document.getElementById("potAmountInput")?.value.length || 0
    });

    logEvent("pot_transfer_confirmed", {
      componentId: "move_money_button",
      expectedAmountLength: state.content.transferAmount.length
    });
  });
}

function bindInsightReview(task) {
  bindScrollEvidence("insight_list", task.id, "insightMaxScrollTop");

  document.querySelectorAll(".insight-card").forEach((card) => {
    card.addEventListener("click", () => {
      const insightId = card.dataset.insightId;
      const maxScrollTop = getEvidence(task.id).insightMaxScrollTop || 0;
      const isTargetInsight = insightId === state.content.insightTarget.id;
      const scrollRequirementMet = maxScrollTop > 120;

      state.reviewedInsights.add(insightId);
      card.classList.add("selected");

      updateEvidence(task.id, {
        targetInsightTapped: isTargetInsight,
        reviewedCount: state.reviewedInsights.size,
        insightScrollRequirementMet: scrollRequirementMet
      });

      logEvent("insight_card_selected", {
        componentId: card.dataset.componentId,
        isTargetInsight,
        reviewedCount: state.reviewedInsights.size,
        insightScrollRequirementMet: scrollRequirementMet
      });
    });
  });
}

function bindFinalFeeling(task) {
  document.querySelectorAll(".feeling-chip").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".feeling-chip").forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");

      updateEvidence(task.id, {
        finalFeelingSelected: true,
        feeling: button.dataset.feeling
      });

      logEvent("final_feeling_selected", {
        componentId: button.dataset.componentId,
        feeling: button.dataset.feeling
      });

      goToTask(state.currentTaskIndex + 1);
    });
  });
}

function bindTypingTask(task, inputOverride = null, targetOverride = null) {
  const input = inputOverride || document.querySelector("input, textarea");
  if (!input) return;

  const target = targetOverride || expectedTextForTask(task);
  let previousLength = input.value.length;

  input.addEventListener("input", () => {
    const inputLength = input.value.length;
    const deltaLength = inputLength - previousLength;
    const corrections = (getEvidence(task.id).corrections || 0) + (deltaLength < 0 ? 1 : 0);
    const exactMatch = normaliseForValidation(input.value) === normaliseForValidation(target);

    previousLength = inputLength;

    updateEvidence(task.id, {
      inputLength,
      targetLength: target.length,
      deltaLengthLast: deltaLength,
      corrections,
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

  element.addEventListener(
    "scroll",
    () => {
      const maxScrollTop = Math.max(getEvidence(taskId)[field] || 0, element.scrollTop);
      const maxPossibleScroll = element.scrollHeight - element.clientHeight;

      updateEvidence(taskId, {
        [field]: maxScrollTop,
        [`${field}Ratio`]: maxPossibleScroll > 0 ? maxScrollTop / maxPossibleScroll : 0
      });
    },
    { passive: true }
  );
}

// -----------------------------------------------------------------------------
// Gesture controls
// -----------------------------------------------------------------------------

function bindPotDrag() {
  const track = document.querySelector(".drag-slider");
  const thumb = document.getElementById("dragThumb");
  const fill = document.getElementById("dragFill");

  bindDragControl(
    track,
    thumb,
    (ratio, meta) => {
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
    },
    (ratio, meta) => {
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
    }
  );
}

function bindApprovalSwipe() {
  const track = document.querySelector(".swipe-confirm");
  const thumb = document.getElementById("approvalThumb");

  bindDragControl(
    track,
    thumb,
    (ratio, meta) => {
      thumb.style.left = `${ratio * 100}%`;

      updateEvidence("secure_approval", {
        swipeRatio: ratio,
        swipeSamples: meta.samples
      });
    },
    (ratio, meta) => {
      const approved = ratio > 0.82;
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

      if (approved) setTimeout(() => goToTask(state.currentTaskIndex + 1), 220);
    }
  );

  document.querySelector(".decline-link")?.addEventListener("click", () => {
    updateEvidence("secure_approval", {
      approvalSelected: true,
      action: "Decline",
      expectedAction: "Approve",
      correctAction: false
    });

    logEvent("secure_approval_selected", {
      componentId: "approval_decline",
      action: "Decline",
      correctAction: false
    });
  });
}

function bindCardSwipe() {
  const carousel = document.querySelector(".swipe-carousel");
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let maxHorizontalDistance = 0;
  let maxScrollLeft = 0;

  carousel.addEventListener(
    "scroll",
    () => {
      maxScrollLeft = Math.max(maxScrollLeft, carousel.scrollLeft);
      updateEvidence("insights_swipe_cards", { carouselMaxScrollLeft: maxScrollLeft });
    },
    { passive: true }
  );

  carousel.addEventListener(
    "pointerdown",
    (event) => {
      startX = event.clientX;
      startY = event.clientY;
      startTime = performance.now();
      maxHorizontalDistance = 0;

      updateEvidence("insights_swipe_cards", {
        swiped: false,
        swipeMovementRequirementMet: false
      });

      logEvent("card_swipe_start", {
        componentId: "spending_card_carousel",
        x: event.clientX,
        y: event.clientY
      });
    },
    { passive: true }
  );

  carousel.addEventListener(
    "pointermove",
    (event) => {
      maxHorizontalDistance = Math.max(maxHorizontalDistance, Math.abs(event.clientX - startX));
      updateEvidence("insights_swipe_cards", { maxHorizontalDistancePx: maxHorizontalDistance });
    },
    { passive: true }
  );

  carousel.addEventListener(
    "pointerup",
    (event) => {
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      const durationMs = performance.now() - startTime;
      const absDx = Math.max(Math.abs(dx), maxHorizontalDistance);
      const realHorizontalSwipe = absDx > 80 && Math.abs(dx) > Math.abs(dy) * 1.4;

      updateEvidence("insights_swipe_cards", {
        swiped: realHorizontalSwipe,
        dx: roundLocal(dx),
        dy: roundLocal(dy),
        durationMs: roundLocal(durationMs),
        maxHorizontalDistancePx: roundLocal(absDx),
        swipeMovementRequirementMet: realHorizontalSwipe
      });

      logEvent("card_swipe_release", {
        componentId: "spending_card_carousel",
        dx: roundLocal(dx),
        dy: roundLocal(dy),
        durationMs: roundLocal(durationMs),
        absDx: roundLocal(absDx),
        realHorizontalSwipe
      });
    },
    { passive: true }
  );

  carousel.querySelectorAll(".spend-card").forEach((card) => {
    card.addEventListener("click", () => {
      carousel.querySelectorAll(".spend-card").forEach((item) => item.classList.remove("selected"));
      card.classList.add("selected");

      const targetCardSelected = card.dataset.cardId === "travel";
      const swipeMovementRequirementMet = !!getEvidence("insights_swipe_cards").swipeMovementRequirementMet;

      updateEvidence("insights_swipe_cards", {
        targetCardSelected,
        selectedCard: card.dataset.cardId,
        swipeMovementRequirementMet
      });

      logEvent("spending_card_selected", {
        componentId: card.dataset.componentId,
        cardId: card.dataset.cardId,
        targetCardSelected,
        swipeMovementRequirementMet
      });
    });
  });
}

function bindDragControl(track, thumb, onMove, onEnd) {
  if (!track || !thumb) return;

  let active = false;
  let startTime = 0;
  let lastPoint = { x: 0, y: 0 };
  let meta = { samples: 0, distancePx: 0, durationMs: 0 };

  function ratioFromEvent(event) {
    const rect = track.getBoundingClientRect();
    return Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  }

  function handlePointerDown(event) {
    active = true;
    startTime = performance.now();
    lastPoint = { x: event.clientX, y: event.clientY };
    meta = { samples: 0, distancePx: 0, durationMs: 0 };

    thumb.setPointerCapture?.(event.pointerId);

    logEvent("gesture_drag_start", {
      componentId: thumb.dataset.componentId || null,
      x: event.clientX,
      y: event.clientY
    });
  }

  function handlePointerMove(event) {
    if (!active) return;

    const dx = event.clientX - lastPoint.x;
    const dy = event.clientY - lastPoint.y;

    meta.samples += 1;
    meta.distancePx += Math.hypot(dx, dy);
    meta.durationMs = performance.now() - startTime;
    lastPoint = { x: event.clientX, y: event.clientY };

    const ratio = ratioFromEvent(event);

    logEvent("gesture_drag_move", {
      componentId: thumb.dataset.componentId || null,
      ratio: roundLocal(ratio),
      sampleIndex: meta.samples,
      x: roundLocal(event.clientX),
      y: roundLocal(event.clientY)
    });

    onMove(ratio, meta);
  }

  function handlePointerUp(event) {
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
  }

  thumb.addEventListener("pointerdown", handlePointerDown);
  track.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("pointerup", handlePointerUp, { passive: true });
}

function expectedTextForTask(task) {
  if (task.id === "activity_search") return state.content.searchTerm;
  if (task.id === "transaction_note") return state.content.target.note;
  if (task.id === "secure_reply") return state.content.target.reply;
  if (task.id === "pots_transfer") return state.content.transferAmount;
  return "";
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
    case "home_balance_check":
      return evidence.accountReviewed ? null : "Tap the Current Account card to continue.";
    case "activity_search":
      return evidence.exactMatch && evidence.merchantOptionSelected && evidence.merchantScrollRequirementMet
        ? null
        : `Type ${state.content.searchTerm}, scroll the merchant list, then select it.`;
    case "activity_scroll_select":
      return evidence.selectedTarget && evidence.feedScrollRequirementMet
        ? null
        : `Scroll down the long feed and tap the ${state.content.target.merchant} payment from last month.`;
    case "transaction_category":
      return evidence.correctCategory && evidence.categoryScrollRequirementMet
        ? null
        : `Scroll the category list and choose ${state.content.target.category}.`;
    case "transaction_note":
      return evidence.exactMatch ? null : `Copy the note: ${state.content.target.note}`;
    case "pots_drag_amount":
      return evidence.released && evidence.correctRelease ? null : `Drag the slider to GBP ${state.content.transferAmount}.`;
    case "pots_transfer":
      return evidence.travelPotSelected && evidence.exactMatch && evidence.moveConfirmed
        ? null
        : `Select Travel Pot, manually type ${state.content.transferAmount}, then tap Move money.`;
    case "insights_swipe_cards":
      return evidence.targetCardSelected && evidence.swiped && evidence.swipeMovementRequirementMet
        ? null
        : "Make a clear horizontal swipe first, then select Travel.";
    case "insights_review":
      return evidence.targetInsightTapped && evidence.insightScrollRequirementMet
        ? null
        : `Scroll the insights and tap ${state.content.insightTarget.title}.`;
    case "secure_approval":
      return evidence.correctAction ? null : "Swipe the approval control to the end.";
    case "secure_reply":
      return evidence.exactMatch ? null : "Copy the secure reply.";
    default:
      return null;
  }
}

// -----------------------------------------------------------------------------
// Completion and utilities
// -----------------------------------------------------------------------------

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

      <div class="summary-card">
        <div><span>Anonymous ID</span><strong>${escapeHtml(session.participantId)}</strong></div>
        <div><span>Session</span><strong>${escapeHtml(String(session.sessionIndex))}</strong></div>
        <div><span>Duration</span><strong>${Math.round((session.sessionDurationMs || 0) / 1000)}s</strong></div>
        <div><span>Events</span><strong>${session.events.length}</strong></div>
      </div>

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
  state.evidence[taskId] = {
    ...state.evidence[taskId],
    ...patch
  };
}

function getEvidence(taskId) {
  ensureEvidence(taskId);
  return state.evidence[taskId];
}

function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffleArray(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function normaliseForValidation(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
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
