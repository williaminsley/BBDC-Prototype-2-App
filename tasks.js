const TASKS = [
  {
    id: "unlock_bank",
    title: "Unlock Pulse Bank",
    subtitle: "Press and hold to open your private review.",
    type: "hold",
    targetTimeSec: 8
  },
  {
    id: "account_overview",
    title: "Check your accounts",
    subtitle: "Review today’s balances and continue.",
    type: "account_overview",
    targetTimeSec: 12
  },
  {
    id: "search_transaction",
    title: "Search transactions",
    subtitle: "Type the exact merchant shown below.",
    type: "typing_search",
    targetTimeSec: 20
  },
  {
    id: "open_transaction",
    title: "Open the transaction",
    subtitle: "Scroll through recent activity and tap the matching payment.",
    type: "transaction_feed",
    targetTimeSec: 25
  },
  {
    id: "categorise_transaction",
    title: "Categorise payment",
    subtitle: "Choose the category that best fits this transaction.",
    type: "categorise",
    targetTimeSec: 15
  },
  {
    id: "transaction_note",
    title: "Add payment note",
    subtitle: "Copy the suggested note into the box.",
    type: "guided_note",
    targetTimeSec: 25
  },
  {
    id: "review_insights",
    title: "Review spending insights",
    subtitle: "Tap each card to review your banking insights.",
    type: "review_cards",
    targetTimeSec: 20
  },
  {
    id: "choose_action",
    title: "Choose next action",
    subtitle: "Select the banking action you want Pulse to prioritise.",
    type: "choose_action",
    targetTimeSec: 15
  },
  {
    id: "secure_message",
    title: "Reply to secure message",
    subtitle: "Copy the suggested reply into the box.",
    type: "guided_reply",
    targetTimeSec: 30
  },
  {
    id: "finish_review",
    title: "Finish review",
    subtitle: "Confirm how the session felt.",
    type: "finish",
    targetTimeSec: 15
  }
];

const BANKING_CONTENT = {
  accounts: [
    { name: "Current account", balance: "£1,284.20", change: "+£240.00" },
    { name: "Savings pot", balance: "£3,950.00", change: "+£25.00" },
    { name: "Travel card", balance: "£186.45", change: "-£14.70" }
  ],
  merchants: [
    { merchant: "PureGym", amount: "£14.70", category: "Fitness", note: "monthly membership", reply: "Yes, please save this for later." },
    { merchant: "Trainline", amount: "£25.17", category: "Travel", note: "train to Manchester", reply: "Yes, please add this to travel." },
    { merchant: "Spotify", amount: "£12.40", category: "Subscription", note: "music subscription", reply: "Yes, please keep this reminder." },
    { merchant: "Pret", amount: "£6.19", category: "Food", note: "lunch near campus", reply: "Yes, please mark this as food." },
    { merchant: "Uber", amount: "£6.04", category: "Travel", note: "ride to station", reply: "Yes, please tag this as travel." },
    { merchant: "Boots", amount: "£37.03", category: "Health", note: "pharmacy purchase", reply: "Yes, please save the receipt." },
    { merchant: "Tesco", amount: "£5.96", category: "Groceries", note: "weekly groceries", reply: "Yes, please mark as groceries." },
    { merchant: "Apple", amount: "£29.97", category: "Shopping", note: "icloud storage", reply: "Yes, please keep this subscription." }
  ],
  categories: ["Travel", "Food", "Fitness", "Subscription", "Groceries", "Health", "Shopping", "Other"],
  insights: [
    { title: "Subscriptions", body: "You have 3 recurring payments this month." },
    { title: "Travel spend", body: "Travel is slightly higher than last week." },
    { title: "Food & coffee", body: "Small purchases added up to £42 this week." }
  ],
  actions: [
    "Review subscriptions",
    "Set travel budget",
    "Track food spend",
    "Save receipt"
  ],
  feelings: ["Easy", "Normal", "Distracted", "Rushed"]
};
