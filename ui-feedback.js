document.addEventListener(
  "click",
  (event) => {
    const target = event.target.closest(
      "button, .account-card, .txn-row, .pot-card, .insight-card, .spend-card, .seg-chip, .feeling-chip, .secondary-action, .primary-btn, .nav-tab, .carousel-nudge"
    );

    if (!target) return;

    target.classList.add("clicked-feedback");

    if (target.id === "moveMoneyBtn") {
      target.classList.add("confirmed");
      target.textContent = "Money moved";
      target.setAttribute("aria-pressed", "true");
      return;
    }

    window.setTimeout(() => {
      target.classList.remove("clicked-feedback");
    }, 260);
  },
  true
);
