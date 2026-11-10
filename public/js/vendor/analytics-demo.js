/*
 * SIMULATED third-party analytics script.
 * Stands in for something like a real analytics tag. It is injected by
 * cookie-consent.js ONLY after the visitor allows the "analytics" category.
 * It sets one cookie and logs a page view to the console - nothing is sent anywhere.
 */
(function () {
  'use strict';
  var NAME = '_demo_analytics';
  var secure = document.body.getAttribute('data-cookie-secure') === 'true';
  var enabled = true;

  function getId() {
    var m = document.cookie.match(new RegExp('(?:^|; )' + NAME + '=([^;]*)'));
    if (m) return m[1];
    var id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    document.cookie = NAME + '=' + id + '; Max-Age=' + 365 * 24 * 3600 + '; Path=/; SameSite=Lax' + (secure ? '; Secure' : '');
    return id;
  }

  var visitorId = getId();
  console.info('[demo-analytics] page view', { visitorId: visitorId, path: location.pathname });

  window.DemoTrackers = window.DemoTrackers || {};
  window.DemoTrackers.analytics = {
    disable: function () {
      if (!enabled) return;
      enabled = false;
      console.info('[demo-analytics] disabled after consent was withdrawn');
    },
  };
})();
