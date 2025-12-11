document.addEventListener("DOMContentLoaded", () => {
    const header = document.querySelector(".site-header");
    const navToggle = document.getElementById("nav-toggle");
    const navLinks = document.getElementById("nav-links");
    const yearSpan = document.getElementById("year");

    // Sticky header shadow
    const handleScroll = () => {
        if (!header) return;
        if (window.scrollY > 4) {
            header.classList.add("is-scrolled");
        } else {
            header.classList.remove("is-scrolled");
        }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();

    // Mobile nav
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

    // Smooth scroll for same-page anchors
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", (e) => {
            const targetId = anchor.getAttribute("href");
            if (!targetId || targetId === "#") return;

            const targetEl = document.querySelector(targetId);
            if (!targetEl) return;

            e.preventDefault();
            const offsetTop = targetEl.getBoundingClientRect().top + window.scrollY - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: "smooth"
            });
        });
    });

    // Footer year
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Basic fake submit handler for contact form (front-end only)
    const contactForm = document.getElementById("contact-form");
    if (contactForm) {
        contactForm.addEventListener("submit", (e) => {
            e.preventDefault();
            alert("Thanks for reaching out. We’ll review your message and respond shortly.");
            contactForm.reset();
        });
    }
});
