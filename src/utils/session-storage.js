const keys = ['accessToken', 'refreshToken', 'adminToken', 'token', 'user', 'isLoggedIn', 'rememberMe'];
// Remove credentials persisted by the old session-only implementation.
if (localStorage.getItem('rememberMe') === 'false') keys.forEach(key => localStorage.removeItem(key));
const active = () => sessionStorage.getItem('rememberMe') === 'false' ? sessionStorage : localStorage;
const locked = operation => typeof navigator !== 'undefined' && navigator.locks
  ? navigator.locks.request('bstore-admin-session', operation) : Promise.resolve().then(operation);
export const sessionStorageAdapter = {
  withRefreshLock(operation) {
    return typeof navigator !== 'undefined' && navigator.locks
      ? navigator.locks.request('bstore-admin-refresh', operation) : operation();
  },
  commitAccess(expected, token) {
    return locked(() => {
      if (this.getItem('refreshToken') !== expected) return false;
      this.setItem('accessToken', token); return true;
    });
  },
  clearSession(expected) {
    return locked(() => {
      if (this.getItem('refreshToken') !== expected) return false;
      this.clear(); return true;
    });
  },
  getItem: key => (keys.includes(key) ? active() : localStorage).getItem(key),
  setItem: (key, value) => (keys.includes(key) ? active() : localStorage).setItem(key, value),
  removeItem(key) {
    if (keys.includes(key)) { localStorage.removeItem(key); sessionStorage.removeItem(key); }
    else localStorage.removeItem(key);
  },
  clear() { keys.forEach(key => { localStorage.removeItem(key); sessionStorage.removeItem(key); }); },
};
export function saveSession(data, remember) {
  return locked(() => {
    sessionStorageAdapter.clear();
    const storage = remember ? localStorage : sessionStorage;
    Object.entries({ ...data, rememberMe: String(remember), isLoggedIn: 'true' })
      .forEach(([key, value]) => storage.setItem(key, value));
  });
}
