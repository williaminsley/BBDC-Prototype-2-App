const GUIDED_TASKS = [
  { id: "unlock_code", area: "secure", type: "code", title: "Unlock bank app", expectedSeconds: 12 },
  { id: "home_balance_check", area: "home", type: "tap_account", title: "Check your balance", expectedSeconds: 14 },
  { id: "activity_search", area: "activity", type: "typing_search", title: "Search payment history", expectedSeconds: 22 },
  { id: "activity_scroll_select", area: "activity", type: "transaction_feed", title: "Find the payment", expectedSeconds: 28 },
  { id: "transaction_category", area: "activity", type: "categorise", title: "Categorise payment", expectedSeconds: 15 },
  { id: "transaction_note", area: "activity", type: "guided_note", title: "Add suggested note", expectedSeconds: 26 },
  { id: "pots_transfer", area: "pots", type: "pots_transfer", title: "Move money to a pot", expectedSeconds: 24 },
  { id: "insights_review", area: "insights", type: "insights_review", title: "Review insights", expectedSeconds: 25 },
  { id: "secure_approval", area: "secure", type: "approval", title: "Approve demo payment", expectedSeconds: 14 },
  { id: "secure_reply", area: "secure", type: "guided_reply", title: "Reply to secure message", expectedSeconds: 30 },
  { id: "finish_feeling", area: "finish", type: "finish", title: "Finish review", expectedSeconds: 12 }
];

const NAV_TABS = [
  { id: "home", label: "Home", icon: "Home" },
  { id: "activity", label: "Activity", icon: "Card" },
  { id: "pots", label: "Pots", icon: "Pot" },
  { id: "insights", label: "Insights", icon: "Tip" },
  { id: "secure", label: "Secure", icon: "Lock" }
];

const BANKING_LIBRARY = {
  accounts: [
    { id: "current", name: "Current Account", balance: "GBP 1,284.20", sub: "Available now", accent: "coral" },
    { id: "bills", name: "Bills Account", balance: "GBP 642.12", sub: "Next bill tomorrow", accent: "blue" },
    { id: "travel", name: "Travel Card", balance: "GBP 186.45", sub: "Ready for trips", accent: "teal" }
  ],
  merchants: [
    { merchant: "PureGym", amount: "GBP 14.70", category: "Fitness", note: "monthly membership", reply: "Yes, please save this as fitness.", icon: "PG", hint: "membership payment" },
    { merchant: "Trainline", amount: "GBP 25.17", category: "Travel", note: "train to Manchester", reply: "Yes, please add this to travel.", icon: "TR", hint: "ticket purchase" },
    { merchant: "Spotify", amount: "GBP 12.40", category: "Subscription", note: "music subscription", reply: "Yes, please keep this reminder.", icon: "SP", hint: "monthly subscription" },
    { merchant: "Pret", amount: "GBP 6.19", category: "Food", note: "lunch near campus", reply: "Yes, please mark this as food.", icon: "PR", hint: "food and coffee" },
    { merchant: "Uber", amount: "GBP 6.04", category: "Travel", note: "ride to station", reply: "Yes, please tag this as travel.", icon: "UB", hint: "short ride" },
    { merchant: "Boots", amount: "GBP 37.03", category: "Health", note: "pharmacy purchase", reply: "Yes, please save the receipt.", icon: "BT", hint: "health purchase" },
    { merchant: "Tesco", amount: "GBP 5.96", category: "Groceries", note: "weekly groceries", reply: "Yes, please mark as groceries.", icon: "TS", hint: "small shop" },
    { merchant: "Apple", amount: "GBP 29.97", category: "Subscription", note: "icloud storage", reply: "Yes, please keep this subscription.", icon: "AP", hint: "cloud storage" }
  ],
  fillerTransactions: [
    { merchant: "Sainsbury's", amount: "GBP 18.42", category: "Groceries", icon: "SA", when: "Today" },
    { merchant: "Nottingham Coffee", amount: "GBP 4.80", category: "Food", icon: "NC", when: "Yesterday" },
    { merchant: "Amazon", amount: "GBP 22.99", category: "Shopping", icon: "AM", when: "Yesterday" },
    { merchant: "Waterstones", amount: "GBP 9.99", category: "Shopping", icon: "WA", when: "This week" },
    { merchant: "National Express", amount: "GBP 11.20", category: "Travel", icon: "NE", when: "This week" },
    { merchant: "Deliveroo", amount: "GBP 16.74", category: "Food", icon: "DE", when: "This week" },
    { merchant: "Co-op", amount: "GBP 7.35", category: "Groceries", icon: "CO", when: "Last week" },
    { merchant: "IKEA", amount: "GBP 32.50", category: "Home", icon: "IK", when: "Last week" },
    { merchant: "Odeon", amount: "GBP 13.50", category: "Entertainment", icon: "OD", when: "Last week" },
    { merchant: "EE", amount: "GBP 28.00", category: "Bills", icon: "EE", when: "Last month" },
    { merchant: "iCloud", amount: "GBP 2.99", category: "Subscription", icon: "IC", when: "Last month" },
    { merchant: "Rudy's Pizza", amount: "GBP 17.90", category: "Food", icon: "RP", when: "Last month" }
  ],
  categories: ["Travel", "Food", "Fitness", "Subscription", "Groceries", "Health", "Shopping", "Bills", "Other"],
  pots: [
    { id: "travel", name: "Travel Pot", balance: "GBP 186.45", target: "GBP 500", icon: "TR" },
    { id: "holiday", name: "Holiday Pot", balance: "GBP 420.00", target: "GBP 900", icon: "HO" },
    { id: "emergency", name: "Emergency Pot", balance: "GBP 950.00", target: "GBP 1,500", icon: "EM" }
  ],
  insightTemplates: [
    { id: "subscriptions", title: "Subscriptions", body: "Spotify and iCloud renew this week.", answer: "Subscriptions", icon: "SU" },
    { id: "travel", title: "Travel", body: "Trainline spending is up this month.", answer: "Travel", icon: "TR" },
    { id: "bill", title: "Upcoming bill", body: "Phone bill is due tomorrow.", answer: "Phone bill", icon: "BI" },
    { id: "coffee", title: "Food and coffee", body: "Small purchases total GBP 42 this week.", answer: "Food and coffee", icon: "FC" }
  ],
  feelings: ["Easy", "Normal", "Distracted", "Rushed"],
  codes: ["4826", "2841", "7395", "1586", "6042", "9317"],
  transferAmounts: ["5", "7", "10", "12"]
};
