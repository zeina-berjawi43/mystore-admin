import { NavLink, useNavigate } from "react-router-dom";

function Sidebar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();

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
      name: "Users",
      path: "/users",
      icon: "👥",
    },
    {
      name: "Add Admin",
      path: "/add-admin",
      icon: "👤➕",
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

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("isLoggedIn");

    setIsOpen(false);

    navigate("/login");
  };

  // ============================================================
  // MOBILE NAVIGATION
  // ============================================================

  const handleNavigation = () => {
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    }
  };

  return (
    <aside
      className={`sidebar ${
        isOpen ? "sidebar-open" : ""
      }`}
    >

      {/* ======================================================
          LOGO
      ====================================================== */}

      <div className="sidebar-logo">

        <div className="sidebar-logo-icon">
          🛍️
        </div>

        <div className="sidebar-logo-text">

          <h2>
            MyStore
          </h2>

          <span>
            Admin Panel
          </span>

        </div>

      </div>


      {/* ======================================================
          MENU
      ====================================================== */}

      <nav className="sidebar-menu">

        <p className="sidebar-section-title">
          MAIN MENU
        </p>

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleNavigation}
            className={({ isActive }) =>
              `sidebar-link ${
                isActive ? "active" : ""
              }`
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


      {/* ======================================================
          LOGOUT
      ====================================================== */}

      <div className="sidebar-bottom">

        <button
          type="button"
          className="sidebar-logout"
          onClick={handleLogout}
        >

          <span className="sidebar-icon">
            🚪
          </span>

          <span className="sidebar-link-text">
            Logout
          </span>

        </button>

      </div>

    </aside>
  );
}

export default Sidebar;