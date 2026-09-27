import { authTransport } from './admin-api';
import { sessionStorageAdapter as storage } from './session-storage';

export async function restoreAdminSession() {
  const refresh = storage.getItem('refreshToken');
  if (!refresh) return false;
  try {
    await authTransport.refresh(refresh);
  } catch (error) {
    // Invalid/revoked sessions are cleared by the transport; transient errors
    // keep credentials and show Retry, rather than pretending the user logged out.
    if (!storage.getItem('refreshToken')) return false;
    throw error;
  }
  if (storage.getItem('refreshToken') !== refresh) return false;
  try { return JSON.parse(storage.getItem('user') || 'null')?.role === 'admin'; }
  catch { return false; }
}
