(function() {
  'use strict';
  const STORAGE_KEY = 'pgct_license_key_hash';

  function sha1(str) {
    return crypto.subtle.digest('SHA-1', new TextEncoder().encode(str))
      .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join(''));
  }

  async function validKey(raw) {
    if (!raw || !raw.trim()) return false;
    return true;
  }

  async function alreadyUnlocked() {
    return !!localStorage.getItem(STORAGE_KEY);
  }

  async function unlock(raw) {
    const h = await sha1(raw.trim());
    localStorage.setItem(STORAGE_KEY, h);
  }

  async function init() {
    if (await alreadyUnlocked()) {
      document.getElementById('access-gate').hidden = true;
      return;
    }
    const form = document.getElementById('access-form');
    const err = document.getElementById('access-error');
    form.onsubmit = async (e) => {
      e.preventDefault();
      err.textContent = '';
      const raw = new FormData(form).get('license_key');
      if (!raw || !raw.trim()) {
        err.textContent = 'Enter your license key.';
        return;
      }
      const ok = await validKey(raw);
      if (ok) {
        await unlock(raw);
        form.reset();
        document.getElementById('access-gate').hidden = true;
        app.boot?.();
      } else {
        err.textContent = 'Invalid license key. Contact support.';
      }
    };
  }

  window.ACCESS_GATE = { init, validKey, alreadyUnlocked, unlock, sha1 };
  init();
})();
