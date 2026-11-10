/*
 * Header navigation + small global UI helpers.
 * Loaded WITHOUT `defer` so the `js` class is applied before first paint
 * (prevents the mobile menu flashing open); DOM work waits for DOMContentLoaded.
 */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('site-nav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Escape closes the mobile menu and returns focus to the toggle.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Reset state when resizing up to desktop.
    var mq = window.matchMedia('(min-width: 768px)');
    var onChange = function () { if (mq.matches) setOpen(false); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
  }

  function initAlerts() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-dismiss-alert]');
      if (btn) {
        var alert = btn.closest('.alert');
        if (alert) alert.remove();
      }
      if (e.target.closest('[data-history-back]')) {
        history.back();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initAlerts();
  });
})();
