/*
 * Client-side form validation (UX only - the server re-validates everything).
 * Rules mirror src/utils/validation.ts.
 *
 * Forms opt in with data-validate="login" | "register". Errors are rendered
 * into the <p id="field-<name>-error"> element referenced by aria-describedby,
 * and aria-invalid is toggled so screen readers announce the state.
 */
(function () {
  'use strict';

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function byteLength(str) {
    return new TextEncoder().encode(str).length;
  }

  var rules = {
    fullName: function (v) {
      v = v.trim();
      if (!v) return 'Full name is required.';
      if (v.length < 2 || v.length > 100) return 'Full name must be between 2 and 100 characters.';
      if (/[<>]/.test(v)) return 'Full name contains invalid characters.';
      return '';
    },
    email: function (v) {
      v = v.trim();
      if (!v) return 'Email address is required.';
      if (v.length > 254 || !EMAIL_RE.test(v)) return 'Enter a valid email address.';
      return '';
    },
    // Registration password policy
    password: function (v) {
      if (!v) return 'Password is required.';
      if (v.length < 8) return 'Password must be at least 8 characters.';
      if (byteLength(v) > 72) return 'Password is too long (max 72 bytes).';
      if (!/[A-Za-z]/.test(v) || !/[0-9]/.test(v)) return 'Password must contain at least one letter and one number.';
      return '';
    },
    // Login: presence only (never reveal policy on login)
    loginPassword: function (v) {
      return v ? '' : 'Password is required.';
    },
    confirmPassword: function (v, form) {
      if (!v) return 'Please confirm your password.';
      var pw = form.elements.namedItem('password');
      if (pw && pw.value !== v) return 'Passwords do not match.';
      return '';
    },
  };

  var formRules = {
    login: { email: rules.email, password: rules.loginPassword },
    register: {
      fullName: rules.fullName,
      email: rules.email,
      password: rules.password,
      confirmPassword: rules.confirmPassword,
    },
  };

  function setError(input, message) {
    var errorEl = document.getElementById(input.id + '-error');
    if (errorEl) errorEl.textContent = message;
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
    var field = input.closest('.form-field');
    if (field) field.classList.toggle('has-error', !!message);
  }

  function validateField(form, name, ruleSet) {
    var input = form.elements.namedItem(name);
    if (!input || !ruleSet[name]) return true;
    var msg = ruleSet[name](input.value, form);
    setError(input, msg);
    return !msg;
  }

  function initForm(form) {
    var ruleSet = formRules[form.getAttribute('data-validate')];
    if (!ruleSet) return;
    var touched = {};

    Object.keys(ruleSet).forEach(function (name) {
      var input = form.elements.namedItem(name);
      if (!input) return;

      // Validate on blur once the user has interacted; re-validate live after that.
      input.addEventListener('blur', function () {
        if (input.value !== '' || touched[name]) {
          touched[name] = true;
          validateField(form, name, ruleSet);
        }
      });
      input.addEventListener('input', function () {
        if (touched[name]) validateField(form, name, ruleSet);
        // Keep "confirm password" in sync while editing the password.
        if (name === 'password' && touched.confirmPassword) validateField(form, 'confirmPassword', ruleSet);
      });
    });

    form.addEventListener('submit', function (e) {
      var firstInvalid = null;
      Object.keys(ruleSet).forEach(function (name) {
        touched[name] = true;
        if (!validateField(form, name, ruleSet) && !firstInvalid) {
          firstInvalid = form.elements.namedItem(name);
        }
      });

      if (firstInvalid) {
        e.preventDefault();
        firstInvalid.focus();
        return;
      }

      // Prevent double submits.
      var submit = form.querySelector('[type="submit"]');
      if (submit) {
        submit.setAttribute('aria-disabled', 'true');
        submit.disabled = true;
      }
    });
  }

  function initPasswordToggles() {
    document.querySelectorAll('[data-toggle-password]').forEach(function (btn) {
      var input = document.getElementById(btn.getAttribute('data-toggle-password'));
      if (!input) return;
      btn.addEventListener('click', function () {
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.textContent = show ? 'Hide' : 'Show';
        btn.setAttribute('aria-pressed', String(show));
        btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('form[data-validate]').forEach(initForm);
    initPasswordToggles();

    // If the server returned errors, move focus to the first invalid field.
    var serverInvalid = document.querySelector('form[data-validate] [aria-invalid="true"]');
    if (serverInvalid) serverInvalid.focus();
  });
})();
