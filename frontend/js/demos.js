document.addEventListener("DOMContentLoaded", () => {
    const filterButtons = document.querySelectorAll(".pill-filter");
    const demoCards = document.querySelectorAll(".demo-card");

    if (!filterButtons.length || !demoCards.length) return;

    // Filter by type
    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const filter = button.dataset.filter || "all";

            // Active button styling
            filterButtons.forEach((btn) => btn.classList.remove("is-active"));
            button.classList.add("is-active");

            demoCards.forEach((card) => {
                const type = card.dataset.type;
                const matches = filter === "all" || filter === type;
                card.style.display = matches ? "block" : "none";
            });
        });
    });

    // Click to highlight demo
    demoCards.forEach((card) => {
        card.addEventListener("click", () => {
            demoCards.forEach((c) => c.classList.remove("is-active"));
            card.classList.add("is-active");
        });
    });
});
