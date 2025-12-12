document.addEventListener("DOMContentLoaded", () => {
    const header = document.querySelector(".site-header");
    const navToggle = document.getElementById("nav-toggle");
    const navLinks = document.getElementById("nav-links");
    const yearSpan = document.getElementById("year");
    const themeToggle = document.getElementById("themeToggle");

    /* ------------------------------
       THEME LOADING / TOGGLE
    ------------------------------ */
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
    }

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");

            localStorage.setItem(
                "theme",
                document.body.classList.contains("dark-mode")
                    ? "dark"
                    : "light"
            );
        });
    }

    /* ------------------------------
       Sticky header shadow
    ------------------------------ */
    const handleScrollHeader = () => {
        if (!header) return;
        header.classList.toggle("is-scrolled", window.scrollY > 4);
    };
    window.addEventListener("scroll", handleScrollHeader);
    handleScrollHeader();

    /* ------------------------------
       Mobile nav
    ------------------------------ */
    if (navToggle && navLinks) {
        navToggle.addEventListener("click", () => {
            navLinks.classList.toggle("is-open");
        });

        navLinks.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                navLinks.classList.remove("is-open");
            });
        });
    }

    /* ------------------------------
       Smooth scroll
    ------------------------------ */
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", (e) => {
            const targetId = anchor.getAttribute("href");
            if (!targetId || targetId === "#") return;

            const targetEl = document.querySelector(targetId);
            if (!targetEl) return;

            e.preventDefault();

            const offsetTop =
                targetEl.getBoundingClientRect().top +
                window.scrollY -
                80;

            window.scrollTo({
                top: offsetTop,
                behavior: "smooth",
            });
        });
    });

    /* ------------------------------
       Footer year
    ------------------------------ */
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    /* ------------------------------
       Scroll reveal animations
    ------------------------------ */
    const animatedEls = document.querySelectorAll("[data-animate]");
    if (animatedEls.length) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15 }
        );

        animatedEls.forEach((el) => observer.observe(el));
    }

    /* ------------------------------
       Parallax
    ------------------------------ */
    const parallaxEls = document.querySelectorAll("[data-parallax]");
    const handleParallax = () => {
        if (!parallaxEls.length) return;

        const scrollY = window.scrollY;
        parallaxEls.forEach((el) => {
            el.style.transform = `translateY(${scrollY * -0.07}px)`;
        });
    };
    window.addEventListener("scroll", handleParallax);
    handleParallax();

    /* ------------------------------
       Contact form
       IMPORTANT:
       - Netlify handles submission
       - Do NOT intercept submit
       - Do NOT use preventDefault
    ------------------------------ */
});
