/* ========================================
   FRAME STUDIO — App Logic
   ======================================== */

'use strict';

const App = (() => {
  function initHeader() {
    const h = document.getElementById('header');
    if (!h) return;
    const fn = () => h.classList.toggle('scrolled', window.scrollY > 10);
    window.addEventListener('scroll', fn, { passive: true });
    fn();
  }

  function initMobileMenu() {
    const btn = document.getElementById('menuBtn');
    const nav = document.getElementById('mainNav');
    if (!btn || !nav) return;

    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open);
    });

    nav.querySelectorAll('.nav__link').forEach(l => {
      l.addEventListener('click', () => {
        nav.classList.remove('open');
        btn.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function showToast(msg, type = 'info', dur = 3500) {
    const c = document.getElementById('toastContainer');
    if (!c) return;
    const t = document.createElement('div');
    t.className = `toast toast--${type}`;
    t.setAttribute('role', 'alert');
    const icons = {
      success: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.3"/><path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      error: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.3"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
      info: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.3"/><path d="M8 7v3.5M8 5v.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>'
    };
    t.innerHTML = icons[type] || icons.info;
    const span = document.createElement('span');
    span.textContent = msg;
    t.appendChild(span);
    c.appendChild(t);
    setTimeout(() => {
      t.classList.add('removing');
      t.addEventListener('animationend', () => t.remove());
    }, dur);
  }

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const tgt = document.querySelector(a.getAttribute('href'));
        if (tgt) { e.preventDefault(); tgt.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      });
    });
  }

  function initRevealAnimations() {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.style.animationPlayState = 'running';
          obs.unobserve(en.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.feature-card, .step-card, .about-card').forEach(el => {
      el.style.animationPlayState = 'paused';
      obs.observe(el);
    });
  }

  function init() {
    initHeader();
    initMobileMenu();
    initSmoothScroll();
    initRevealAnimations();
  }

  return { init, showToast };
})();

document.addEventListener('DOMContentLoaded', App.init);