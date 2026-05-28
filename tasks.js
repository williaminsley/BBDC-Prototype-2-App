const TASKS = [
  {
    id: "hold_to_start",
    title: "Hold to start",
    subtitle: "Press and hold to begin today’s review.",
    type: "hold",
    targetTimeSec: 10,
    minEvidence: { holdEnds: 1 }
  },
  {
    id: "swipe_intro",
    title: "Review intro cards",
    subtitle: "Swipe or click at least two cards to preview today’s activity.",
    type: "swipe_intro",
    targetTimeSec: 20,
    minEvidence: { cardsReviewed: 2 }
  },
  {
    id: "search_activity",
    title: "Search activity",
    subtitle: "Search for the highlighted item.",
    type: "typing_search",
    targetTimeSec: 25,
    minEvidence: { inputLength: 2 }
  },
  {
    id: "scroll_find",
    title: "Find an item",
    subtitle: "Scroll through the feed and open the target item.",
    type: "scroll_find",
    targetTimeSec: 25,
    minEvidence: { selectedTarget: true }
  },
  {
    id: "categorise_item",
    title: "Categorise item",
    subtitle: "Choose the most suitable category.",
    type: "categorise",
    targetTimeSec: 15,
    minEvidence: { categorySelected: true }
  },
  {
    id: "add_note",
    title: "Add a short note",
    subtitle: "Add 2–5 words. Text content is not stored.",
    type: "typing_note",
    targetTimeSec: 30,
    minEvidence: { inputLength: 4 }
  },
  {
    id: "reorder_priorities",
    title: "Choose top priority",
    subtitle: "Drag a card or click the priority that matters most today.",
    type: "drag_reorder",
    targetTimeSec: 25,
    minEvidence: { prioritySelected: true }
  },
  {
    id: "swipe_decisions",
    title: "Review suggestions",
    subtitle: "Swipe cards left or right, or use the decision buttons.",
    type: "swipe_decisions",
    targetTimeSec: 25,
    minEvidence: { decisions: 2 }
  },
  {
    id: "reply_message",
    title: "Reply to message",
    subtitle: "Type a short reply. Text content is not stored.",
    type: "typing_reply",
    targetTimeSec: 35,
    minEvidence: { inputLength: 6 }
  },
  {
    id: "final_checkin",
    title: "Final check-in",
    subtitle: "Tell us how the session felt.",
    type: "final_checkin",
    targetTimeSec: 20,
    minEvidence: { finalFeeling: true }
  }
];

const ROTATING_CONTENT = {
  searchTerms: ["travel", "coffee", "gym", "train", "spotify", "rent"],
  merchants: ["Trainline", "Pret", "Tesco", "Spotify", "Uber", "PureGym", "Apple", "Boots"],
  categories: ["Travel", "Food", "Bills", "Shopping", "Health", "Other"],
  priorities: ["Save more", "Track travel", "Review subscriptions", "Reply later"],
  suggestions: [
    "Subscription reminder",
    "Travel spend insight",
    "Budget alert",
    "Message follow-up"
  ],
  messagePrompts: [
    "Can you add a quick note about this?",
    "Can you confirm what this was for?",
    "Should we save this for later?",
    "Can you add a short update?"
  ],
  feelings: ["Easy", "Normal", "Distracted", "Rushed"]
};