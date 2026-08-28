import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";

function AdminLayout() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`admin-layout ${
        isOpen ? "sidebar-is-open" : ""
      }`}
    >
      <Sidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />

      <button
        type="button"
        className={`sidebar-toggle ${
          isOpen ? "toggle-open" : ""
        }`}
        onClick={() =>
          setIsOpen((previous) => !previous)
        }
        aria-label={
          isOpen
            ? "Close sidebar"
            : "Open sidebar"
        }
        aria-expanded={isOpen}
      >
        {isOpen ? "✕" : "☰"}
      </button>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;