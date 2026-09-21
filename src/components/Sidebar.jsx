import { useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useNavigate } from "react-router-dom";
import { clearAuth } from "../utils/auth";

// ============================================================
// LOGOUT CONFIRM MODAL
// ============================================================

function LogoutConfirmModal({ onCancel, onConfirm }) {
  return createPortal(
    <div
      className="logout-confirm-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <div className="logout-confirm-modal">
        <div className="logout-confirm-icon">🚪</div>

        <h3>Log out?</h3>

        <p>
          Are you sure you want to log out of the admin panel?
        </p>

        <div className="logout-confirm-actions">
          <button
            type="button"
            className="logout-confirm-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            type="button"
            className="logout-confirm-submit"
            onClick={onConfirm}
          >
            Logout
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ============================================================
// SIDEBAR
// ============================================================

function Sidebar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();

  const [showLogoutConfirm, setShowLogoutConfirm] =
    useState(false);

  // ==========================================================
  // MENU ITEMS
  // ==========================================================

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: "📊",
    },
    {
      name: "Orders",
      path: "/orders",
      icon: "📦",
    },
    {
      name: "Products",
      path: "/products",
      icon: "🛍️",
    },
    {
      name: "Customers",
      path: "/users",
      icon: "👥",
    },
    {
      name: "Phone Verification",
      path: "/phone-verification",
      icon: "📱",
    },
    {
      name: "Departments",
      path: "/departments",
      icon: "🏬",
    },
    {
      name: "Categories",
      path: "/categories",
      icon: "🗂️",
    },
    {
      name: "Brands",
      path: "/brands",
      icon: "🏷️",
    },
    {
      name: "Slideshow",
      path: "/slideshow",
      icon: "🖼️",
    },
    {
      name: "Notifications",
      path: "/notifications",
      icon: "🔔",
    },
  ];

  // ==========================================================
  // CLOSE MOBILE SIDEBAR
  // ==========================================================

  const closeMobileSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    }
  };

  // ==========================================================
  // ADD ADMIN
  // ==========================================================

  const handleAddAdmin = () => {
    closeMobileSidebar();
    navigate("/add-admin");
  };

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const confirmLogout = () => {
    clearAuth();

    setIsOpen(false);
    setShowLogoutConfirm(false);

    navigate("/login", {
      replace: true,
    });
  };

  const sidebarClassName = isOpen
    ? "sidebar sidebar-open"
    : "sidebar";

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <aside className={sidebarClassName}>
      {/* LOGO */}

      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          🛍️
        </div>

        <div className="sidebar-logo-text">
          <h2>BStore</h2>
          <span>Admin Panel</span>
        </div>
      </div>

      {/* MAIN MENU */}

      <nav
        className="sidebar-menu"
        aria-label="Main navigation"
      >
        <p className="sidebar-section-title">
          MAIN MENU
        </p>

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={closeMobileSidebar}
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active"
                : "sidebar-link"
            }
          >
            <span className="sidebar-icon">
              {item.icon}
            </span>

            <span className="sidebar-link-text">
              {item.name}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* BOTTOM ACTIONS */}

      <div className="sidebar-bottom">
        <button
          type="button"
          className="sidebar-link sidebar-add-admin"
          onClick={handleAddAdmin}
        >
          <span className="sidebar-icon">
            👤➕
          </span>

          <span className="sidebar-link-text">
            Add Admin
          </span>
        </button>

        <button
          type="button"
          className="sidebar-logout"
          onClick={() =>
            setShowLogoutConfirm(true)
          }
          aria-label="Logout"
        >
          <span className="sidebar-icon">
            🚪
          </span>

          <span className="sidebar-link-text">
            Logout
          </span>
        </button>
      </div>

      {/* LOGOUT CONFIRMATION */}

      {showLogoutConfirm && (
        <LogoutConfirmModal
          onCancel={() =>
            setShowLogoutConfirm(false)
          }
          onConfirm={confirmLogout}
        />
      )}
    </aside>
  );
}

export default Sidebar;