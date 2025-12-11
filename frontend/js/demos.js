document.addEventListener("DOMContentLoaded", () => {
    const filterButtons = document.querySelectorAll(".pill-filter");
    const demoCards = document.querySelectorAll(".demo-card");

    if (!filterButtons.length || !demoCards.length) return;

    /* Filter by type */
    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const filter = button.dataset.filter || "all";

            filterButtons.forEach((btn) => btn.classList.remove("is-active"));
            button.classList.add("is-active");

            demoCards.forEach((card) => {
                const type = card.dataset.type;
                const matches = filter === "all" || filter === type;
                card.style.display = matches ? "block" : "none";
            });

            const grid = document.getElementById("demo-grid");
            if (grid && window.innerWidth < 900) {
                const top = grid.getBoundingClientRect().top + window.scrollY - 90;
                window.scrollTo({ top, behavior: "smooth" });
            }
        });
    });

    /* Click to highlight demo */
    demoCards.forEach((card) => {
        card.addEventListener("click", () => {
            demoCards.forEach((c) => c.classList.remove("is-active"));
            card.classList.add("is-active");
        });
    });
});
