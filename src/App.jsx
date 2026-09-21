import React, { useEffect } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "./App.css";

// WEB PUSH
import { subscribeToWebPush } from "./utils/webPush";
import { getToken, getCurrentUser } from "./utils/auth";

// PAGES
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Brands from "./pages/Brands";
import Orders from "./pages/Orders";
import Users from "./pages/Users";
import Slideshow from "./pages/Slideshow";
import Notifications from "./pages/Notifications";
import PhoneVerification from "./pages/PhoneVerification";
import AddAdmin from "./pages/AddAdmin";
import Invoice from "./pages/Invoice";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DeleteAccount from "./pages/DeleteAccount";
// LAYOUT
import AdminLayout from "./layouts/AdminLayout";

// ============================================================
// "REMEMBER ME" ENFORCEMENT
// ============================================================
//
// Runs once, the moment this module is first loaded (i.e. once
// per browser tab). sessionStorage survives page refreshes but is
// cleared when the tab/browser is closed - so if this is a brand
// new session AND the user didn't check "remember me" at login,
// we clear the saved auth data now, before anything renders.
// A normal refresh within the same tab is unaffected.
// ============================================================

(function enforceRememberMe() {
  const alreadyRanThisSession = sessionStorage.getItem(
    "bstoreSessionActive"
  );

  if (!alreadyRanThisSession) {
    sessionStorage.setItem("bstoreSessionActive", "true");

    const rememberMe = localStorage.getItem("rememberMe");

    if (rememberMe === "false") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("rememberMe");
    }
  }
})();

// ============================================================
// AUTO SYNC WEB PUSH
// ============================================================

function AutoSyncWebPush() {
  useEffect(() => {
    const syncNotifications = async () => {
      try {
        const accessToken = getToken();

        if (!accessToken) {
          return;
        }

        const user = getCurrentUser();

        if (!user || user.role !== "admin") {
          return;
        }

        if (
          !("Notification" in window) ||
          !("serviceWorker" in navigator) ||
          !("PushManager" in window)
        ) {
          return;
        }

        const permission = Notification.permission;

        if (permission !== "granted") {
          return;
        }

        const subscription = await subscribeToWebPush(accessToken);

        if (!subscription || !subscription.endpoint) {
          console.log("WEB PUSH AUTO SYNC: No valid subscription returned.");
        }
      } catch (error) {
        console.error("WEB PUSH AUTO SYNC ERROR:", error);
      }
    };

    syncNotifications();
  }, []);

  return null;
}

// ============================================================
// PROTECTED ADMIN ROUTE
// ============================================================
//
// NOTE: this check only controls what renders in the browser.
// It does not (and cannot) replace real authorization checks on
// the backend - anyone can edit localStorage and bypass this.
// Make sure every admin API route independently verifies the
// token + role server-side.
// ============================================================

function ProtectedRoute({ children }) {
  const token = getToken();
  const user = getCurrentUser();

  if (!token || !user || user.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// ============================================================
// APP
// ============================================================

function App() {
  return (
    <BrowserRouter>
      <AutoSyncWebPush />

      <Routes>
        {/* PUBLIC */}
        <Route path="/login" element={<Login />} />

        {/* PROTECTED ADMIN AREA */}
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/invoices/:invoiceId" element={<Invoice />} />
          <Route path="/products" element={<Products />} />
          <Route path="/users" element={<Users />} />
          <Route
            path="/phone-verification"
            element={<PhoneVerification />}
          />
          <Route path="/add-admin" element={<AddAdmin />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/slideshow" element={<Slideshow />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>

        {/* DEFAULT / UNKNOWN */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
        <Route
  path="/privacy-policy"
  element={<PrivacyPolicy />}
/>

<Route
  path="/delete-account"
  element={<DeleteAccount />}
/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
