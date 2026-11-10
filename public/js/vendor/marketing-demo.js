/*
 * SIMULATED third-party advertising script.
 * Injected by cookie-consent.js ONLY after the visitor allows the "marketing"
 * category. Sets one cookie and logs to the console - nothing is sent anywhere.
 */
(function () {
  'use strict';
  var NAME = '_demo_marketing';
  var secure = document.body.getAttribute('data-cookie-secure') === 'true';
  var enabled = true;

  if (!new RegExp('(?:^|; )' + NAME + '=').test(document.cookie)) {
    var id = Math.random().toString(36).slice(2);
    document.cookie = NAME + '=' + id + '; Max-Age=' + 90 * 24 * 3600 + '; Path=/; SameSite=Lax' + (secure ? '; Secure' : '');
  }
  console.info('[demo-marketing] ad tracker loaded');

  window.DemoTrackers = window.DemoTrackers || {};
  window.DemoTrackers.marketing = {
    disable: function () {
      if (!enabled) return;
      enabled = false;
      console.info('[demo-marketing] disabled after consent was withdrawn');
    },
  };
})();
