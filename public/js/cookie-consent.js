/*
 * GDPR cookie consent manager.
 *
 * Key rules implemented here:
 *  - Nothing optional runs and no consent cookie is written until the visitor
 *    makes an explicit choice (Accept all / Reject non-essential / Save my choices).
 *  - Closing the dialog, scrolling or ignoring the banner is NOT consent.
 *  - Optional checkboxes are never pre-ticked for a first-time visitor.
 *  - Optional scripts (/js/vendor/*) are injected only for consented categories.
 *  - Withdrawing consent deletes the related cookies immediately.
 *  - A new policy version invalidates old consent, so the banner reappears.
 *
 * Public API (for other scripts): window.CookieConsent.get(), .open(), and a
 * "cookieconsent:change" event on document.
 */
(function () {
  'use strict';

  var body = document.body;
  var COOKIE_NAME = body.getAttribute('data-consent-cookie') || 'cookie_consent';
  var MAX_AGE_DAYS = parseInt(body.getAttribute('data-consent-max-age-days'), 10) || 180;
  var POLICY_VERSION = body.getAttribute('data-cookie-policy-version') || '1';
  var SECURE = body.getAttribute('data-cookie-secure') === 'true';

  /** Optional categories: which script to load and which cookies to delete on withdrawal. */
  var CATEGORIES = {
    analytics: { script: '/js/vendor/analytics-demo.js', cookies: ['_demo_analytics'] },
    marketing: { script: '/js/vendor/marketing-demo.js', cookies: ['_demo_marketing'] },
  };

  var banner, dialog, form, lastFocus;
  var loadedScripts = {};

  // ---------- cookie helpers ----------
  function readCookie(name) {
    var parts = document.cookie ? document.cookie.split('; ') : [];
    for (var i = 0; i < parts.length; i++) {
      var idx = parts[i].indexOf('=');
      if (parts[i].slice(0, idx) === name) return parts[i].slice(idx + 1);
    }
    return null;
  }

  function writeCookie(name, value, maxAgeSeconds) {
    var c = name + '=' + value + '; Max-Age=' + maxAgeSeconds + '; Path=/; SameSite=Lax';
    if (SECURE) c += '; Secure';
    document.cookie = c;
  }

  function deleteCookie(name) {
    document.cookie = name + '=; Max-Age=0; Path=/; SameSite=Lax';
  }

  /** RFC 4122 v4 UUID; crypto.randomUUID only exists in secure contexts, so build it ourselves. */
  function uuid() {
    var b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    var h = Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }

  // ---------- consent state ----------
  /** Returns the stored consent, or null if none/invalid/outdated policy version. */
  function getConsent() {
    var raw = readCookie(COOKIE_NAME);
    if (!raw) return null;
    try {
      var c = JSON.parse(decodeURIComponent(raw));
      if (!c || c.v !== POLICY_VERSION || typeof c.analytics !== 'boolean' || typeof c.marketing !== 'boolean') {
        return null;
      }
      return c;
    } catch (e) {
      return null;
    }
  }

  function saveConsent(prefs, action) {
    var previous = getConsent();
    var consent = {
      v: POLICY_VERSION,
      id: (previous && previous.id) || uuid(),
      necessary: true,
      analytics: !!prefs.analytics,
      marketing: !!prefs.marketing,
      ts: new Date().toISOString(),
    };
    writeCookie(COOKIE_NAME, encodeURIComponent(JSON.stringify(consent)), MAX_AGE_DAYS * 24 * 60 * 60);
    recordOnServer(consent, action);
    applyConsent(consent);
    hideBanner();
    closeDialog();
    announce('Your cookie preferences have been saved.');
    document.dispatchEvent(new CustomEvent('cookieconsent:change', { detail: consent }));
  }

  /** Send an anonymous proof-of-consent record. Failure must never block the user. */
  function recordOnServer(consent, action) {
    var meta = document.querySelector('meta[name="csrf-token"]');
    if (!window.fetch || !meta) return;
    fetch('/api/consent', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': meta.getAttribute('content') },
      body: JSON.stringify({
        consentId: consent.id,
        analytics: consent.analytics,
        marketing: consent.marketing,
        action: action,
      }),
    }).catch(function () { /* ignore network errors */ });
  }

  /** Load scripts for allowed categories; delete cookies for refused ones. */
  function applyConsent(consent) {
    Object.keys(CATEGORIES).forEach(function (key) {
      var cat = CATEGORIES[key];
      if (consent && consent[key]) {
        if (!loadedScripts[key]) {
          var s = document.createElement('script');
          s.src = cat.script;
          s.async = true;
          document.head.appendChild(s);
          loadedScripts[key] = true;
        }
      } else {
        cat.cookies.forEach(deleteCookie);
        if (window.DemoTrackers && window.DemoTrackers[key]) window.DemoTrackers[key].disable();
      }
    });
    updateSummaries(consent);
  }

  // ---------- UI ----------
  function showBanner() { if (banner) banner.hidden = false; }
  function hideBanner() { if (banner) banner.hidden = true; }

  function openDialog() {
    if (!dialog) return;
    var consent = getConsent();
    // Reflect existing choices; first-time visitors see everything optional OFF.
    Object.keys(CATEGORIES).forEach(function (key) {
      var input = form.elements.namedItem(key);
      if (input) input.checked = !!(consent && consent[key]);
    });
    lastFocus = document.activeElement;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    var first = form.querySelector('input:not([disabled])');
    if (first) first.focus();
  }

  function closeDialog() {
    if (!dialog || !dialog.open) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  function updateSummaries(consent) {
    document.querySelectorAll('[data-consent-value]').forEach(function (el) {
      var key = el.getAttribute('data-consent-value');
      el.textContent = !consent ? 'Not set' : consent[key] ? 'Allowed' : 'Refused';
    });
  }

  /** Polite screen-reader announcement. */
  var liveRegion;
  function announce(text) {
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.className = 'visually-hidden';
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      document.body.appendChild(liveRegion);
    }
    liveRegion.textContent = '';
    setTimeout(function () { liveRegion.textContent = text; }, 50);
  }

  function handleAction(action) {
    if (action === 'accept') saveConsent({ analytics: true, marketing: true }, 'accept_all');
    else if (action === 'reject') saveConsent({ analytics: false, marketing: false }, 'reject_all');
    else if (action === 'customize') openDialog();
    else if (action === 'close') closeDialog(); // closing is not consent; banner stays if no choice yet
  }

  function init() {
    banner = document.getElementById('cookie-banner');
    dialog = document.getElementById('cookie-preferences');
    form = document.getElementById('cookie-preferences-form');

    document.addEventListener('click', function (e) {
      var actionBtn = e.target.closest('[data-consent-action]');
      if (actionBtn) {
        e.preventDefault();
        handleAction(actionBtn.getAttribute('data-consent-action'));
        return;
      }
      var opener = e.target.closest('[data-open-cookie-settings]');
      if (opener) {
        e.preventDefault();
        openDialog();
      }
    });

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        saveConsent(
          {
            analytics: form.elements.namedItem('analytics').checked,
            marketing: form.elements.namedItem('marketing').checked,
          },
          'custom',
        );
      });
    }

    if (dialog) {
      dialog.addEventListener('close', function () {
        if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
      });
      // Click on the backdrop closes (without saving).
      dialog.addEventListener('click', function (e) {
        if (e.target === dialog) closeDialog();
      });
    }

    var consent = getConsent();
    if (!consent) {
      // Clean up leftovers from an outdated policy version, then ask again.
      if (readCookie(COOKIE_NAME)) deleteCookie(COOKIE_NAME);
      applyConsent(null);
      showBanner();
    } else {
      applyConsent(consent);
    }

    // Deep link from footer when JS loads after navigation to /cookies#manage
    if (location.hash === '#manage' && location.pathname === '/cookies') openDialog();
  }

  window.CookieConsent = {
    get: getConsent,
    open: function () { openDialog(); },
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
