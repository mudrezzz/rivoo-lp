/* Header: mobile drawer toggle */
const burger = document.querySelector("[data-burger]");
const header = document.querySelector("[data-header]");
const drawer = document.getElementById("mobileMenu");

function toggleDrawer(open){
  const isOpen = open ?? !drawer.classList.contains("is-open");
  drawer.hidden = false;
  drawer.classList.toggle("is-open", isOpen);
  burger.classList.toggle("is-active", isOpen);
  burger.setAttribute("aria-expanded", String(isOpen));
  if(!isOpen){
    // Delay hide for transition end
    setTimeout(() => { drawer.hidden = true; }, 180);
  }
}

if (burger && drawer){
  burger.addEventListener("click", () => toggleDrawer());
  drawer.querySelectorAll("[data-link]").forEach(a => a.addEventListener("click", () => toggleDrawer(false)));
}

/* Header shadow on scroll (subtle) */
let lastY = 0;
window.addEventListener("scroll", () => {
  const y = window.scrollY || document.documentElement.scrollTop;
  const needsBorder = y > 6;
  if (needsBorder !== (lastY > 6)) {
    header.style.borderBottomColor = needsBorder ? "rgba(48,54,61,.7)" : "rgba(48,54,61,.4)";
  }
  lastY = y;
});

/* Hero metric counters */
function animateCounters() {
  const counters = document.querySelectorAll("[data-counter]");
  const options = { root: null, threshold: 0.3 };
  const obs = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10) || 0;
        let start = 0;
        const duration = 900; // ms
        const startTime = performance.now();
        const step = (now) => {
          const p = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          const val = Math.round(start + (target - start) * eased);
          el.textContent = `${val}%`;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        observer.unobserve(el);
      }
    });
  }, options);

  counters.forEach(c => obs.observe(c));
}
animateCounters();

/* Close drawer on resize up */
window.addEventListener("resize", () => {
  if (window.innerWidth > 1024 && drawer?.classList.contains("is-open")) {
    toggleDrawer(false);
  }
});


/* ===== Problem: layout labels around the ring ===== */
function layoutProblemLabels(){
  const ring = document.querySelector('.problem .problem-ring');
  if(!ring) return;

  const list = ring.querySelector('.problem-ring__labels');
  if(!list) return;

  const items = list.querySelectorAll('li');
  if(!items.length) return;

  // Радиус: 44% от меньшей стороны кольца (можно подстроить)
  const rect = ring.getBoundingClientRect();
  const radius = Math.min(rect.width, rect.height) * 0.44;

  items.forEach((el, idx) => {
    const total = items.length;
    // равномерное распределение: 360 / total
    const deg = (idx / total) * 360;
    // Поворачиваем «носиком наружу»: вычтем 90°, если хотите начать сверху
    const rot = deg - 90;

    // Раскладываем по окружности:
    // из центра -> поворот -> смещение по радиусу -> обратный поворот текста
    el.style.transform =
      `translate(-50%, -50%) rotate(${rot}deg) translate(0, ${-radius}px) rotate(${-rot}deg)`;
  });
}

// Вызываем на загрузке и при ресайзе
window.addEventListener('DOMContentLoaded', layoutProblemLabels);
window.addEventListener('load', layoutProblemLabels);
window.addEventListener('resize', layoutProblemLabels);


/* ===== Problem: animate bubbles flowing from each label to center ===== */
function layoutProblemFlow(){
  const ring  = document.querySelector('.problem .problem-ring');
  const flow  = ring?.querySelector('.problem-flow');
  const labels= ring?.querySelectorAll('.problem-ring__labels li');
  if(!ring || !flow || !labels?.length) return;

  // очистим ранее созданные частицы, если resize
  flow.querySelectorAll('.bubble').forEach(el => el.remove());

  const ringRect   = ring.getBoundingClientRect();
  const cx = ringRect.width  / 2; // центр в системе координат ring (локальной)
  const cy = ringRect.height / 2;

  // утилита перевода client -> локальные координаты кольца
  const toLocal = (clientX, clientY) => {
    const r = ring.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  };

  // из каждой метки выпустим несколько пузырьков
  const bubblesPerLabel = 4; // можно увеличить/уменьшить
  labels.forEach((label, liIdx) => {
    const lr = label.getBoundingClientRect();
    const lp = toLocal(lr.left + lr.width/2, lr.top + lr.height/2); // центр метки в локальных координатах

    // вектор от центра к метке (стартовая позиция)
    const dx = lp.x - cx;
    const dy = lp.y - cy;

    for(let i=0; i<bubblesPerLabel; i++){
      const b = document.createElement('span');
      b.className = 'bubble';

      // слегка «распушим» поток: добавим шум и варьируем размеры/скорости
      const spread = 10; // px, поперечный шум старта
      const offX = dx + (Math.random()*2 - 1) * spread;
      const offY = dy + (Math.random()*2 - 1) * spread;

      const size = 8 + Math.random()*6; // 8..14 px
      b.style.width  = `${size}px`;
      b.style.height = `${size}px`;

      // передаём стартовый вектор в CSS
      b.style.setProperty('--tx', `${offX}px`);
      b.style.setProperty('--ty', `${offY}px`);

      // случайные тайминги, сдвиги фазы и небольшая разница в длительности
      const delay = (Math.random() * 1.8).toFixed(2);         // 0..1.8s
      const dur   = (3.2 + Math.random()*2.2).toFixed(2);     // 3.2..5.4s
      b.style.animationDelay = `${delay}s`;
      b.style.animationDuration = `${dur}s`;

      flow.appendChild(b);
    }
  });
}

// первичная инициализация и обновление по ресайзу
window.addEventListener('DOMContentLoaded', layoutProblemFlow);
window.addEventListener('load', layoutProblemFlow);
window.addEventListener('resize', () => {
  // чтобы не плодить хвосты при ресайзе, полностью пересоздаём поток
  layoutProblemFlow();
});

/* ===== SOLUTION: полярное позиционирование элементов орбиты ===== */
// (function initSolutionOrbit() {
//   const root = document.querySelector('.section-solution .solution-diagram__canvas');
//   if (!root) return;

//   const canvasRect = () => root.getBoundingClientRect();
//   const toRad = (deg) => (deg * Math.PI) / 180;

//   // Функция позиционирования по data-angle / data-radius
//   const positionPolarEl = (el, radiusPercent, angleDeg, dx, dy) => {
//     const rect = canvasRect();
//     const r = (Math.min(rect.width, rect.height) / 2) * (radiusPercent / 100);
//     const cx = rect.width / 2;
//     const cy = rect.height / 2;
//     const rad = toRad(angleDeg);
//     const x = cx + r * Math.cos(rad) + dx;
//     const y = cy + r * Math.sin(rad) + dy;
//     el.style.left = `${x}px`;
//     el.style.top  = `${y}px`;
//   };


//   // Бэйджи модулей
//   const badges = root.querySelectorAll('.solution-badge');
//   badges.forEach((b) => {
//     const angle = Number(b.dataset.angle || 0);
//     const radius = Number(b.dataset.radius || 40);
//     positionPolarEl(b, radius, angle, 0, 0);
//   });

//   // Потоки (лучи) к центру — рисуем короткие сегменты, ориентируя по углу
//   const flows = root.querySelectorAll('.solution-flow');

//   // внутри initSolutionOrbit, при обработке flows
//     const centerNode = root.querySelector('.solution-node--center');
//     const coreRect = centerNode.getBoundingClientRect();

//     const cx = canvasRect().width / 1.8;
//     const cy = canvasRect().height / 2;
//     const coreHalfW = coreRect.width ;
//     const coreHalfH = coreRect.height ;

//     flows.forEach((f) => {
//     const angle = Number(f.dataset.angle || 0);
//     const len   = Number(f.dataset.length || 26);

//     // радиус до границы квадрата, а не до центра
//     const rad = (angle * Math.PI) / 180;
//     const offsetX = Math.cos(rad) * coreHalfW;
//     const offsetY = Math.sin(rad) * coreHalfH;

//     // стартовая точка стрелки — на границе квадрата
//     const startX = cx + offsetX;
//     const startY = cy + offsetY;

//     f.style.left = `${startX}px`;
//     f.style.top  = `${startY}px`;

//     f.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
//     f.style.setProperty('--flow-len', `${(Math.min(canvasRect().width, canvasRect().height) / 2) * (len / 100)}px`);
//     });

//   // Респонсив: перерасчёт на resize
//     let rafId;
//     const onResize = () => {
//     cancelAnimationFrame(rafId);
//     rafId = requestAnimationFrame(() => {
//         // пересчёт бейджей
//         badges.forEach((b) => {
//         positionPolarEl(
//             b,
//             Number(b.dataset.radius || 40),
//             Number(b.dataset.angle || 0),
//             0, 0
//         );
//         });

//         // пересчёт flows
//         const centerNode = root.querySelector('.solution-node--center');
//         const coreRect = centerNode.getBoundingClientRect();
//         const rect = canvasRect();
//         const cx = rect.width / 1.8;
//         const cy = rect.height / 2;
//         const coreHalfW = coreRect.width;
//         const coreHalfH = coreRect.height;

//         flows.forEach((f) => {
//         const angle = Number(f.dataset.angle || 0);
//         const len   = Number(f.dataset.length || 26);

//         const rad = (angle * Math.PI) / 180;
//         const offsetX = Math.cos(rad) * coreHalfW;
//         const offsetY = Math.sin(rad) * coreHalfH;

//         const startX = cx + offsetX;
//         const startY = cy + offsetY;

//         f.style.left = `${startX}px`;
//         f.style.top  = `${startY}px`;

//         f.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
//         f.style.setProperty(
//             '--flow-len',
//             `${(Math.min(rect.width, rect.height) / 2) * (len / 100)}px`
//         );
//         });
//     });
//     };

//     window.addEventListener('resize', onResize, { passive: true });

// })();


(function initSolutionOrbit() {
  const root = document.querySelector('.section-solution .solution-diagram__canvas');
  if (!root) return;

  const canvasRect = () => root.getBoundingClientRect();
  const toRad = (deg) => (deg * Math.PI) / 180;

  const badges = root.querySelectorAll('.solution-badge');
  const flows  = root.querySelectorAll('.solution-flow');

  // универсальная функция позиционирования по углу/радиусу
  const positionPolarEl = (el, radiusPercent, angleDeg, dx = 0, dy = 0) => {
    const rect = canvasRect();
    const r = (Math.min(rect.width, rect.height) / 2) * (radiusPercent / 100);
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rad = toRad(angleDeg);
    const x = cx + r * Math.cos(rad) + dx;
    const y = cy + r * Math.sin(rad) + dy;
    el.style.left = `${x}px`;
    el.style.top  = `${y}px`;
  };

  // основной пересчёт всех элементов (бейджи + стрелки)
  const layout = () => {
    const rect = canvasRect();
    const centerNode = root.querySelector('.solution-node--center');
    const coreRect = centerNode.getBoundingClientRect();

    const cx = rect.width / 1.8;
    const cy = rect.height / 2;
    const coreHalfW = coreRect.width ;
    const coreHalfH = coreRect.height;

    // Бейджи
    badges.forEach((b) => {
      const angle  = Number(b.dataset.angle || 0);
      const radius = Number(b.dataset.radius || 40);
      positionPolarEl(b, radius, angle);
    });

    // Потоки (flows)
    flows.forEach((f) => {
      const angle = Number(f.dataset.angle || 0);
      const len   = Number(f.dataset.length || 26);

      const rad = toRad(angle);
      const offsetX = Math.cos(rad) * coreHalfW;
      const offsetY = Math.sin(rad) * coreHalfH;

      const startX = cx + offsetX;
      const startY = cy + offsetY;

      f.style.left = `${startX}px`;
      f.style.top  = `${startY}px`;
      f.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
      f.style.setProperty('--flow-len', `${(Math.min(rect.width, rect.height) / 2) * (len / 100)}px`);
    });
  };

  // первичный вызов
  layout();

  // ресайз (throttle через RAF)
  let rafId;
  const onResize = () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(layout);
  };
  window.addEventListener('resize', onResize, { passive: true });
})();
