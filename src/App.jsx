
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

// ============================================================
// COMPONENTS
// ============================================================

import Sidebar from "./components/Sidebar";

// ============================================================
// PROTECTED ROUTE
// ============================================================

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("accessToken");

  let user = null;

  try {
    user = JSON.parse(
      localStorage.getItem("user") || "null"
    );
  } catch (error) {
    console.log("USER PARSE ERROR:", error);
    user = null;
  }

  // ==========================================================
  // CHECK LOGIN + ADMIN
  // ==========================================================

  if (
    !token ||
    !user ||
    user.role !== "admin"
  ) {
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
// ADMIN LAYOUT
// ============================================================

function AdminLayout({ children }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div
      className={`admin-layout ${
        isOpen ? "sidebar-is-open" : ""
      }`}
    >

      {/* ====================================================
          SIDEBAR
      ==================================================== */}

      <Sidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />

      {/* ====================================================
          SIDEBAR TOGGLE
      ==================================================== */}

      <button
        type="button"
        className={`sidebar-toggle ${
          isOpen ? "sidebar-toggle-open" : ""
        }`}
        onClick={() =>
          setIsOpen((prev) => !prev)
        }
        aria-label="Toggle sidebar"
      >
        {isOpen ? "✕" : "☰"}
      </button>

      {/* ====================================================
          MAIN CONTENT
      ==================================================== */}

      <main className="admin-content">
        {children}
      </main>

    </div>
  );
}

// ============================================================
// APP
// ============================================================

function App() {
  return (
    <BrowserRouter>

      <Routes>

<Route path="/notifications" element={ <ProtectedRoute> <AdminLayout> <Notifications /> </AdminLayout> </ProtectedRoute> } />

<Route
  path="/slideshow"
  element={
    <ProtectedRoute>
      <AdminLayout>
        <Slideshow />
      </AdminLayout>
    </ProtectedRoute>
  }
/>
        {/* ==================================================
            LOGIN
        ================================================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        {/* ==================================================
            DASHBOARD
        ================================================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* ==================================================
            PRODUCTS
        ================================================== */}

        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Products />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* ==================================================
            CATEGORIES
        ================================================== */}

        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Categories />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* ==================================================
            BRANDS
        ================================================== */}

        <Route
          path="/brands"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Brands />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* ==================================================
            ORDERS
        ================================================== */}

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Orders />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        

        {/* ==================================================
            USERS
        ================================================== */}

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Users />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* ==================================================
            DEFAULT
        ================================================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
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
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
  
}



// ============================================================
// EXPORT
// ============================================================

export default App;

