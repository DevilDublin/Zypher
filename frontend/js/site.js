/* --------------------------------------------------
   ZYPHER BASE JS
-------------------------------------------------- */

/* --------------------------
   FIRST VISIT INTRO CHECK
--------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    const hasVisited = localStorage.getItem("visited");

    // If no intro element exists on this page, skip.
    const intro = document.querySelector(".intro");

    if (!hasVisited) {
        localStorage.setItem("visited", "true");
        if (intro) {
            intro.style.display = "flex";
            setTimeout(() => intro.classList.add("fade-out"), 2500);
            setTimeout(() => (intro.style.display = "none"), 3500);
        }
    } else {
        if (intro) intro.style.display = "none";
    }

    // Fade-in effect for page content
    document.body.classList.add("fade-start");
    setTimeout(() => {
        document.body.classList.add("fade-in");
    }, 80);
});

/* --------------------------
   THEME TOGGLE (Diamond)
--------------------------- */

const themeToggle = document.getElementById("theme-toggle");

if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("alt-theme");

        // Store theme in localStorage
        if (document.body.classList.contains("alt-theme")) {
            localStorage.setItem("theme", "alt");
        } else {
            localStorage.setItem("theme", "default");
        }
    });
}

// Apply saved theme on load
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "alt") {
    document.body.classList.add("alt-theme");
}

/* --------------------------------------------------
   NAVBAR SCROLL SHADOW
-------------------------------------------------- */

window.addEventListener("scroll", () => {
    const nav = document.querySelector("nav");
    if (window.scrollY > 15) {
        nav.classList.add("nav-shadow");
    } else {
        nav.classList.remove("nav-shadow");
    }
});

/* --------------------------------------------------
   PLACEHOLDER FOR FUTURE DEMO INTERACTIONS
-------------------------------------------------- */

function comingSoon() {
    alert("Voice Demo coming soon — awaiting Twilio + recording setup!");
}
