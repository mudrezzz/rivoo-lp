/* ==========================================================================
   RIVOO Landing — JS for HEADER • HERO • PROBLEM
   - Mobile nav (burger + sheet)
   - Accessible open/close, focus trap, ESC/resize handling
   ========================================================================== */

(function () {
  const mqDesktop = window.matchMedia("(min-width: 981px)");
  const burger = document.querySelector(".burger");
  const sheet = document.getElementById("mobile-sheet");
  if (!burger || !sheet) return;

  let lastFocused = null;
  const focusableSelectors =
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const openSheet = () => {
    if (sheet.classList.contains("open")) return;
    lastFocused = document.activeElement;
    sheet.classList.add("open");
    burger.setAttribute("aria-expanded", "true");
    sheet.setAttribute("aria-modal", "true");
    sheet.setAttribute("role", "dialog");

    // Move focus to first focusable element inside the sheet
    const first = sheet.querySelector(focusableSelectors);
    if (first) first.focus();

    // Enable focus trap
    document.addEventListener("keydown", trapTab, true);
    document.addEventListener("keydown", onEsc, true);
    document.addEventListener("click", onClickOutside, true);
  };

  const closeSheet = () => {
    if (!sheet.classList.contains("open")) return;
    sheet.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    sheet.removeAttribute("aria-modal");

    // Remove listeners
    document.removeEventListener("keydown", trapTab, true);
    document.removeEventListener("keydown", onEsc, true);
    document.removeEventListener("click", onClickOutside, true);

    // Restore focus
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    } else {
      burger.focus();
    }
  };

  const toggleSheet = () => {
    if (sheet.classList.contains("open")) {
      closeSheet();
    } else {
      openSheet();
    }
  };

  const trapTab = (e) => {
    if (e.key !== "Tab") return;
    const focusables = sheet.querySelectorAll(focusableSelectors);
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const onEsc = (e) => {
    if (e.key === "Escape") {
      closeSheet();
    }
  };

  const onClickOutside = (e) => {
    if (!sheet.classList.contains("open")) return;
    const inSheet = e.target.closest(".sheet");
    const inBurger = e.target.closest(".burger");
    if (!inSheet && !inBurger) {
      closeSheet();
    }
  };

  // Open/close via burger
  burger.addEventListener("click", toggleSheet);

  // Close when clicking a link in the sheet
  sheet.addEventListener("click", (e) => {
    const link = e.target.closest("a[href]");
    if (link) {
      // Allow navigation, but close the sheet immediately
      closeSheet();
    }
  });

  // Auto-close on switching to desktop layout
  const handleDesktopChange = () => {
    if (mqDesktop.matches) {
      closeSheet();
    }
  };
  mqDesktop.addEventListener("change", handleDesktopChange);

  // Defensive: close on page hide
  window.addEventListener("pageshow", () => closeSheet());
})();


/* ==========================================================================
   RESULTS ("Результат") — scroll reveal
   Append to rivoo.js (do not replace existing code)
   ========================================================================== */
(function () {
  const section = document.querySelector('section[aria-labelledby="res-title"]');
  if (!section) return;

  // Respect reduced-motion
  const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // What to animate inside the section
  const targets = Array.from(
    section.querySelectorAll(
      '.grid .badge, .kpis .kpi, .ctaRow .btn, .ctaRow .aside'
    )
  );

  if (!targets.length) return;

  // If user prefers reduced motion — show immediately
  if (prefersReduce || !("IntersectionObserver" in window)) {
    targets.forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    return;
  }

  // Initial state
  targets.forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(10px)";
    el.style.willChange = "opacity, transform";
    el.style.transition = "opacity 500ms ease, transform 500ms ease";
  });

  // Reveal with stagger when section enters the viewport
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        // Staggered reveal
        targets.forEach((el, i) => {
          el.style.transitionDelay = `${i * 70}ms`;
          requestAnimationFrame(() => {
            el.style.opacity = "1";
            el.style.transform = "none";
          });
        });

        // One-shot
        io.disconnect();
      });
    },
    { root: null, threshold: 0.2 }
  );

  io.observe(section);
})();
