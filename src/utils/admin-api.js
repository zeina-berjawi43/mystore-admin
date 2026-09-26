import axios from 'axios';
import { sessionStorageAdapter } from './session-storage';
import { createAuthTransport } from './auth-transport';
export const authTransport = createAuthTransport(sessionStorageAdapter, window.fetch.bind(window), () => window.location.replace('/login'));
export const authorizedFetch = authTransport.fetch;
export default axios.create({ timeout: 60000, adapter: 'fetch', env: { fetch: authorizedFetch, Request: null, Response: null } });

// A remembered login is shared by tabs. Reload mounted admin state on logout or
// account replacement; session-only tabs keep their own independent session.
window.addEventListener('storage', event => {
  if ((event.key === 'refreshToken' || event.key === null) && sessionStorage.getItem('rememberMe') !== 'false') window.location.reload();
});
// A restored back/forward-cache document must re-run route/session checks.
window.addEventListener('pageshow', event => {
  if (event.persisted) window.location.reload();
});
