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

/* ==========================================================================
   DEMO MODAL — Yandex Forms embed
   - Открытие по клику на: a[href="#demo"], .hd-cta, [data-open-demo]
   - Закрытие по кнопке [data-close-demo], клику по фоне, ESC
   - Фокус-менеджмент и лёгкая доступность
   - Снятие "loading" с обёртки iframe после загрузки формы
   ========================================================================== */
(function () {
  const modal   = document.getElementById('demo-modal');
  const overlay = document.getElementById('demo-modal-overlay');
  if (!modal || !overlay) return;

  // триггеры открытия/закрытия
  const openers = Array.from(document.querySelectorAll('a[href="#demo"], .hd-cta, [data-open-demo]'));
  const closers = Array.from(modal.querySelectorAll('[data-close-demo]'));

  // элементы внутри модалки
  const panel  = modal.querySelector('.panel');
  const wrap   = modal.querySelector('.iframe-wrap'); // для прелоадера
  const iframe = modal.querySelector('#ya-form');

  // состояние фокуса (для возврата)
  let lastFocused = null;

  // селектор фокусируемых элементов
  const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

  function openModal(e) {
    if (e) e.preventDefault();
    lastFocused = document.activeElement;

    // показать
    modal.hidden = false;
    overlay.hidden = false;
    //modal.style.display = 'flex';
    //overlay.style.display = 'block';
    modal.classList.add('is-open');
    document.body.classList.add('modal-open');

    // фокус на первый доступный элемент
    const first = modal.querySelector(FOCUSABLE);
    first && first.focus();

    // слушатели
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('click', onOutsideClick, true);
  }

  function closeModal() {
    // скрыть
    modal.hidden = true;
    overlay.hidden = true;
    //modal.style.display = 'none';
    //overlay.style.display = 'none';
    modal.classList.remove('is-open');
    document.body.classList.remove('modal-open');

    // снять слушатели
    document.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('click', onOutsideClick, true);

    // вернуть фокус
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
  }

  function onKeyDown(ev) {
    // ESC закрывает
    if (ev.key === 'Escape') {
      ev.preventDefault();
      closeModal();
      return;
    }
    // trap TAB внутри модалки
    if (ev.key === 'Tab') {
      const nodes = Array.from(modal.querySelectorAll(FOCUSABLE)).filter(el => el.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0];
      const last  = nodes[nodes.length - 1];
      if (ev.shiftKey && document.activeElement === first) {
        ev.preventDefault();
        last.focus();
      } else if (!ev.shiftKey && document.activeElement === last) {
        ev.preventDefault();
        first.focus();
      }
    }
  }

  function onOutsideClick(ev) {
    // клик по фону/оверлею — закрыть
    const inPanel  = ev.target.closest('.panel');
    const isOpener = ev.target.closest('a[href="#demo"], .hd-cta, [data-open-demo]');
    if (!inPanel && !isOpener && modal.style.display === 'flex') {
      closeModal();
    }
  }

  // Убрать состояние "loading" после загрузки формы
  function onIframeLoad() {
    wrap && wrap.classList.remove('loading');
  }

  // (опционально) поддержка авто-ресайза через postMessage от формы
  function onMessage(e) {
    try {
      if (!e || !e.data) return;
      if (typeof e.data === 'object' && e.data.type === 'ya-form' && e.data.height && iframe) {
        const h = Math.max(520, Math.min(e.data.height, 1400));
        iframe.style.minHeight = h + 'px';
      }
    } catch (_) {}
  }

  // навешиваем обработчики
  openers.forEach(el => el.addEventListener('click', openModal));
  closers.forEach(el => el.addEventListener('click', closeModal));
  overlay.addEventListener('click', closeModal);
  iframe && iframe.addEventListener('load', onIframeLoad);
  window.addEventListener('message', onMessage);
})();


/* ==== Open any video link in new tab (robust, class-agnostic) ==== */
(function () {
  // Нормализуем URL (чинит 'ttps://', добавляет https:// если забыли)
  function normalizeUrl(u) {
    if (!u) return null;
    let url = u.trim();
    if (/^ttps?:\/\//i.test(url)) url = 'h' + url;        // ttps:// -> https://
    if (!/^[a-z]+:\/\//i.test(url)) url = 'https://' + url; // без схемы -> https://
    try { return new URL(url).toString(); } catch { return null; }
  }

  // Не мешаем Ctrl/Cmd/Shift/Alt кликам (пусть ведут себя стандартно)
  function hasModifier(e) {
    return e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0;
  }

  document.addEventListener('click', function (e) {
    const a = e.target.closest('a');
    if (!a) return;

    // Целимся в ссылки с data-video-url ИЛИ с href="#video"
    const isVideoAnchor = a.hasAttribute('data-video-url') || a.getAttribute('href') === '#video';
    if (!isVideoAnchor) return;

    // Если модификаторы — выходим (пусть откроется как обычно)
    if (hasModifier(e)) return;

    const raw = a.getAttribute('data-video-url') || '';   // желательно всегда задавать data-video-url
    const url = normalizeUrl(raw);
    if (!url) {
      // fallback: если нет/битый data-video-url — ничего не ломаем, позволяем перейти по #video
      console.warn('[video-open] некорректный data-video-url у элемента:', a);
      return;
    }

    // Наше открытие и блокировка дефолтного перехода
    e.preventDefault();
    window.open(url, '_blank', 'noopener,noreferrer');
  }, true); // capture=true, чтобы ловить до других обработчиков
})();


