import { authTransport } from "./admin-api";
import { sessionStorageAdapter } from './session-storage';
// ============================================================
// SHARED AUTH HELPERS
// ============================================================
//
// Previously getToken()/getHeaders() were copy-pasted (with small
// variations) into ~9 different page files. Now every page imports
// from here so there is exactly one implementation to fix/update.
// ============================================================

export const getToken = () => {
  const token =
    sessionStorageAdapter.getItem("accessToken") ||
    sessionStorageAdapter.getItem("adminToken") ||
    sessionStorageAdapter.getItem("token") ||
    "";

  return token.replace(/^Bearer\s+/i, "").trim();
};

export const getAuthHeaders = () => {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Admin authentication token was not found. Please login again."
    );
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

// For fetch()-based calls that also need Content-Type: application/json
export const getJsonHeaders = () => ({
  "Content-Type": "application/json",
  ...getAuthHeaders(),
});

export const getCurrentUser = () => {
  try {
    return JSON.parse(sessionStorageAdapter.getItem("user") || "null");
  } catch {
    return null;
  }
};

export const isAdminLoggedIn = () => {
  const token = getToken();
  const user = getCurrentUser();

  return Boolean(token && user && user.role === "admin");
};

export const clearAuth = () => authTransport.logout().catch(() => {
  console.warn('Server logout unavailable; local credentials cleared.');
});
