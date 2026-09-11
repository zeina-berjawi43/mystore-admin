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
      name: "Phone Verification",
      path: "/phone-verification",
      icon: "📱",
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

  const handleLogout = () => {
    const confirmed = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmed) {
      return;
    }

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("isLoggedIn");

    setIsOpen(false);

    navigate("/login", {
      replace: true,
    });
  };

  const closeMobileSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    }
  };

  const handleAddAdmin = () => {
    closeMobileSidebar();
    navigate("/add-admin");
  };

  const sidebarClassName = isOpen
    ? "sidebar sidebar-open"
    : "sidebar";

  return (
    <aside className={sidebarClassName}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🛍️</div>

        <div className="sidebar-logo-text">
          <h2>BStore</h2>
          <span>Admin Panel</span>
        </div>
      </div>

      <nav className="sidebar-menu">
        <p className="sidebar-section-title">MAIN MENU</p>

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

      <div className="sidebar-bottom">
        <button
          type="button"
          className="sidebar-link sidebar-add-admin"
          onClick={handleAddAdmin}
        >
          <span className="sidebar-icon">👤➕</span>

          <span className="sidebar-link-text">
            Add Admin
          </span>
        </button>

        <button
          type="button"
          className="sidebar-logout"
          onClick={handleLogout}
        >
          <span className="sidebar-icon">🚪</span>

          <span className="sidebar-link-text">
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;