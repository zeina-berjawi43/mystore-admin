
import React, { useEffect } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "./App.css";

// ============================================================
// WEB PUSH
// ============================================================

import {
  subscribeToWebPush,
} from "./utils/webPush";

// ============================================================
// PAGES
// ============================================================

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

// ============================================================
// LAYOUT
// ============================================================

import AdminLayout from "./layouts/AdminLayout";

// ============================================================
// AUTOMATIC ADMIN WEB PUSH SYNC
// ============================================================

function AutoSyncWebPush() {
  useEffect(() => {
    const syncNotifications = async () => {
      try {
        // ------------------------------------------------------
        // GET ADMIN TOKEN
        // ------------------------------------------------------

        const accessToken =
          localStorage.getItem("accessToken");

        if (!accessToken) {
          console.log(
            "WEB PUSH AUTO SYNC: No admin token."
          );

          return;
        }

        // ------------------------------------------------------
        // CHECK USER
        // ------------------------------------------------------

        let user = null;

        try {
          user = JSON.parse(
            localStorage.getItem("user") || "null"
          );
        } catch (error) {
          console.log(
            "WEB PUSH AUTO SYNC: User parse error:",
            error
          );

          return;
        }

        if (!user || user.role !== "admin") {
          console.log(
            "WEB PUSH AUTO SYNC: Current user is not admin."
          );

          return;
        }

        // ------------------------------------------------------
        // CHECK BROWSER SUPPORT
        // ------------------------------------------------------

        if (
          !("Notification" in window) ||
          !("serviceWorker" in navigator) ||
          !("PushManager" in window)
        ) {
          console.log(
            "WEB PUSH AUTO SYNC: Browser does not support Web Push."
          );

          return;
        }

        // ------------------------------------------------------
        // CHECK PERMISSION
        // ------------------------------------------------------

        const permission =
          Notification.permission;

        console.log(
          "WEB PUSH AUTO SYNC: Permission:",
          permission
        );

        // ------------------------------------------------------
        // BLOCKED
        // ------------------------------------------------------

        if (permission === "denied") {
          console.log(
            "WEB PUSH AUTO SYNC: Notifications are blocked."
          );

          return;
        }

        // ------------------------------------------------------
        // DEFAULT
        //
        // Browser requires user interaction before allowing
        // permission in many situations.
        //
        // The manual button in Notifications page remains
        // available for this case.
        // ------------------------------------------------------

        if (permission === "default") {
          console.log(
            "WEB PUSH AUTO SYNC: Permission not granted yet. Waiting for user action."
          );

          return;
        }

        // ------------------------------------------------------
        // GRANTED
        //
        // Automatically register / sync.
        // ------------------------------------------------------

        if (permission === "granted") {
          console.log(
            "WEB PUSH AUTO SYNC: Permission already granted."
          );

          console.log(
            "WEB PUSH AUTO SYNC: Starting automatic sync..."
          );

          const subscription =
            await subscribeToWebPush(
              accessToken
            );

          if (
            subscription &&
            subscription.endpoint
          ) {
            console.log(
              "✅ WEB PUSH AUTO SYNC: Subscription synced successfully."
            );

            console.log(
              "WEB PUSH AUTO SYNC: Endpoint:",
              subscription.endpoint
            );
          } else {
            console.log(
              "⚠️ WEB PUSH AUTO SYNC: No valid subscription returned."
            );
          }
        }

      } catch (error) {
        console.error(
          "❌ WEB PUSH AUTO SYNC ERROR:",
          error
        );
      }
    };

    syncNotifications();

  }, []);

  return null;
}

// ============================================================
// PROTECTED ADMIN ROUTE
// ============================================================

function ProtectedRoute({ children }) {
  const token =
    localStorage.getItem("accessToken");

  let user = null;

  try {
    user = JSON.parse(
      localStorage.getItem("user") || "null"
    );
  } catch (error) {
    console.log(
      "USER PARSE ERROR:",
      error
    );

    user = null;
  }

  // ==========================================================
  // CHECK LOGIN
  // ==========================================================

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // ==========================================================
  // CHECK ADMIN
  // ==========================================================

  if (!user || user.role !== "admin") {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}

// ============================================================
// APP
// ============================================================

function App() {
  return (
    <BrowserRouter>

      {/* ======================================================
          AUTOMATIC WEB PUSH SYNC
      ====================================================== */}

      <AutoSyncWebPush />

      <Routes>

        {/* ==================================================
            PUBLIC ROUTES
        ================================================== */}

        <Route
          path="/login"
          element={<Login />}
        />


        {/* ==================================================
            PROTECTED ADMIN AREA
        ================================================== */}

        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >

          {/* ==================================================
              DASHBOARD
          ================================================== */}

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />


          {/* ==================================================
              ORDERS
          ================================================== */}

          <Route
            path="/orders"
            element={<Orders />}
          />


          {/* ==================================================
              PRODUCTS
          ================================================== */}

          <Route
            path="/products"
            element={<Products />}
          />


          {/* ==================================================
              USERS
          ================================================== */}

          <Route
            path="/users"
            element={<Users />}
          />


          {/* ==================================================
              PHONE VERIFICATION / OTP
          ================================================== */}

          <Route
            path="/phone-verification"
            element={<PhoneVerification />}
          />


          {/* ==================================================
              ADD ADMIN
          ================================================== */}

          <Route
            path="/add-admin"
            element={<AddAdmin />}
          />


          {/* ==================================================
              CATEGORIES
          ================================================== */}

          <Route
            path="/categories"
            element={<Categories />}
          />


          {/* ==================================================
              BRANDS
          ================================================== */}

          <Route
            path="/brands"
            element={<Brands />}
          />


          {/* ==================================================
              SLIDESHOW
          ================================================== */}

          <Route
            path="/slideshow"
            element={<Slideshow />}
          />


          {/* ==================================================
              NOTIFICATIONS
          ================================================== */}

          <Route
            path="/notifications"
            element={<Notifications />}
          />

        </Route>


        {/* ==================================================
            DEFAULT
        ================================================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />


        {/* ==================================================
            UNKNOWN ROUTE
        ================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;