import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";

function AdminLayout() {

  const [isOpen, setIsOpen] = useState(false);


  return (
    <div className="admin-layout">

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <Sidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />


      {/* ======================================================
          HAMBURGER
      ====================================================== */}

      <button
        type="button"
        className={`sidebar-toggle ${
          isOpen ? "toggle-open" : ""
        }`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={
          isOpen
            ? "Close sidebar"
            : "Open sidebar"
        }
        aria-expanded={isOpen}
      >

        {isOpen ? "✕" : "☰"}

      </button>


      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="admin-content">

        <Outlet />

      </main>

    </div>
  );
}

export default AdminLayout;
