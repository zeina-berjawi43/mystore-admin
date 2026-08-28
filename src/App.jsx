import React from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "./App.css";

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

import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AddAdmin from "./pages/AddAdmin";

// ============================================================
// LAYOUT
// ============================================================

import AdminLayout from "./layouts/AdminLayout";

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
      <Routes>

        {/* ==================================================
            PUBLIC ROUTES
        ================================================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password/:token"
          element={<ResetPassword />}
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