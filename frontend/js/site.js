document.addEventListener("DOMContentLoaded", () => {
    const header = document.querySelector(".site-header");
    const navToggle = document.getElementById("nav-toggle");
    const navLinks = document.getElementById("nav-links");
    const yearSpan = document.getElementById("year");

    /* Sticky header */
    const handleScrollHeader = () => {
        if (window.scrollY > 4) header.classList.add("is-scrolled");
        else header.classList.remove("is-scrolled");
    };
    window.addEventListener("scroll", handleScrollHeader);
    handleScrollHeader();

    /* Mobile nav */
    if (navToggle && navLinks) {
        navToggle.addEventListener("click", () => {
            navLinks.classList.toggle("is-open"));
        });

        navLinks.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => navLinks.classList.remove("is-open"));
        });
    }

    /* Smooth scroll */
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", (e) => {
            const targetId = anchor.getAttribute("href");
            if (!targetId || targetId === "#") return;

            const el = document.querySelector(targetId);
            if (!el) return;

            e.preventDefault();
            const offsetTop = el.getBoundingClientRect().top + window.scrollY - 80;
            window.scrollTo({ top: offsetTop, behavior: "smooth" });
        });
    });

    /* Footer year */
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    /* Animations */
    const animatedEls = document.querySelectorAll("[data-animate]");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    animatedEls.forEach((el) => observer.observe(el));

    /* Parallax */
    const parallaxEls = document.querySelectorAll("[data-parallax]");
    window.addEventListener("scroll", () => {
        const scrollY = window.scrollY;
        parallaxEls.forEach((el) => {
            const offset = scrollY * 0.18;
            el.style.transform = `translateY(${offset * -0.4}px)`;
        });
    });

    /* Contact form */
    const contactForm = document.getElementById("contact-form");
    if (contactForm) {
        contactForm.addEventListener("submit", (e) => {
            e.preventDefault();
            alert("Thanks for reaching out. We’ll review your message and respond shortly.");
            contactForm.reset();
        });
    }

    /* --------------------------------
       FIXED THEME TOGGLE
    -------------------------------- */
    const toggle = document.getElementById("themeToggle");

    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
    }

    if (toggle) {
        toggle.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");

            if (document.body.classList.contains("dark-mode")) {
                localStorage.setItem("theme", "dark");
            } else {
                localStorage.setItem("theme", "light");
            }
        });
    }
});
