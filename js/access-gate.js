(function() {
  'use strict';
  const STORAGE_KEY = 'pgct_license_key_hash';
  // Local test set only. Replace with backend verification in production/real monetization.
  const VALID_LICENSE_KEYS = [
    'MGP-2026-UNLOCK',
    'MGP-DEMO-ACCESS'
  ];

  function sha1(str) {
    return crypto.subtle.digest('SHA-1', new TextEncoder().encode(str))
      .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join(''));
  }

  async function validKey(raw) {
    if (!raw || !raw.trim()) return false;
    return VALID_LICENSE_KEYS.includes(raw.trim());
  }

  function isUnlockedSync() {
    try { return !!localStorage.getItem(STORAGE_KEY); } catch { return false; }
  }

  async function unlock(raw) {
    const h = await sha1(raw.trim());
    localStorage.setItem(STORAGE_KEY, h);
  }

  async function init() {
    if (isUnlockedSync()) return;
    const form = document.getElementById('access-form');
    const err = document.getElementById('access-error');
    if (!form) return;
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
        document.getElementById('screen-access-unlock').classList.remove('active');
        window.location.reload();
      } else {
        err.textContent = 'Invalid license key. Contact support.';
      }
    };
  }

  window.ACCESS_GATE = {
    init,
    validKey,
    isUnlockedSync,
    unlock,
    sha1
  };

  if (!window.ACCESS_GATE.isUnlockedSync()) {
    const boundInit = () => window.ACCESS_GATE.init();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boundInit);
    } else {
      boundInit();
    }
  }
})();
