import { sessionStorageAdapter } from '../utils/session-storage';

import { useEffect, useState } from "react";
import axios from "../utils/admin-api";
import Pagination from "../components/Pagination";

const API_URL = "https://mystore-backend-u6ey.onrender.com";

// /users/admin/all returns customer firstName/lastName and admin/legacy name.
const getUserName = (user) => {
  const fullName = [user.firstName, user.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  const name = user.name?.trim() || "";
  return user.role === "admin" ? name || fullName : fullName || name;
};

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    role: "user",
  });

  // ============================================================
  // TOKEN
  // ============================================================

  const getToken = () => {
    return sessionStorageAdapter.getItem("accessToken");
  };

  // ============================================================
  // GET USERS
  // ============================================================

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      const response = await axios.get(
        `${API_URL}/users/admin/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: { _t: Date.now() },
        }
      );

      setUsers(response.data.users || []);
    } catch (error) {
      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        sessionStorageAdapter.clear();
        window.location.href = "/login";
        return;
      }

      setError(
        error.response?.data?.message ||
          "Cannot load users"
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchUsers();
  }, []);

  // ============================================================
  // FORM CHANGE
  // ============================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ============================================================
  // OPEN EDIT
  // ============================================================

  const openEditModal = (user) => {
    setEditingUser(user);

    setForm({
      name: getUserName(user),
      email: user.email || "",
      password: "",
      phone: user.phone || "",
      address: user.address || "",
      role: user.role || "user",
    });

    setShowModal(true);
  };

  // ============================================================
  // CLOSE MODAL
  // ============================================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingUser(null);

    setForm({
      name: "",
      email: "",
      password: "",
      phone: "",
      address: "",
      role: "user",
    });
  };

  // ============================================================
  // UPDATE USER
  // ============================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      alert("Name and email are required.");
      return;
    }

    try {
      setSaving(true);

      const token = getToken();

      const body = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        role: form.role,
      };

      if (form.password.trim()) {
        body.password = form.password;
      }

      const response = await axios.put(
        `${API_URL}/users/admin/${editingUser._id}`,
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(
        response.data.message ||
          "User updated successfully."
      );

      closeModal();

      await fetchUsers();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Error updating user"
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETE USER
  // ============================================================

  const handleDelete = async (user) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${getUserName(user)}"?`
    );

    if (!confirmed) return;

    try {
      const token = getToken();

      const response = await axios.delete(
        `${API_URL}/users/admin/${user._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(
        response.data.message ||
          "User deleted successfully."
      );

      await fetchUsers();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Error deleting user"
      );
    }
  };

  // ============================================================
  // FILTER USERS
  // ============================================================

  const filteredUsers = users.filter((user) => {
    const searchText = search
      .trim()
      .toLowerCase();

    const matchesSearch =
      !searchText ||
      getUserName(user)
        .toLowerCase()
        .includes(searchText) ||
      user.name
        ?.toLowerCase()
        .includes(searchText) ||
      user.email
        ?.toLowerCase()
        .includes(searchText) ||
      user.phone
        ?.toLowerCase()
        .includes(searchText);

    const matchesRole =
      !roleFilter ||
      user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // ============================================================
  // PAGINATION
  // ============================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / pageSize)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedUsers = filteredUsers.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="users-loading">
        <div className="users-spinner"></div>

        <p>Loading users...</p>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="users-page">

      {/* HEADER */}
      <div className="users-header">
        <div>
          <h1>Users</h1>

          <p>
            Manage registered users and administrators.
          </p>
        </div>

        <button
          type="button"
          className="users-refresh-button"
          onClick={fetchUsers}
        >
          Refresh
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="users-error">
          <strong>Error</strong>
          <span>{error}</span>

          <button onClick={fetchUsers}>
            Try Again
          </button>
        </div>
      )}

      {/* FILTERS */}
      <div className="users-filters">
        <div className="users-search">
          <span>🔍</span>

          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <select
          value={roleFilter}
          onChange={(event) =>
            setRoleFilter(event.target.value)
          }
        >
          <option value="">All Roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
        </select>

        {(search || roleFilter) && (
          <button
            type="button"
            className="users-clear-button"
            onClick={() => {
              setSearch("");
              setRoleFilter("");
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* COUNT */}
      <div className="users-count">
        <span>
          {filteredUsers.length} user
          {filteredUsers.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* TABLE */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Phone</th>
              <th>OTP</th>
              <th>OTP Expires</th>
              <th>Address</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan="8" className="users-empty">
                  <div>
                    <span>👥</span>
                    <h3>No users found</h3>
                    <p>Try changing your search or filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">
                        {getUserName(user).charAt(0).toUpperCase() || "U"}
                      </div>

                      <div>
                        <strong>{getUserName(user) || "—"}</strong>
                        <small>{user.email || "—"}</small>
                      </div>
                    </div>
                  </td>

                  <td>{user.phone || "—"}</td>

                  <td>
                    {user.whatsappOtp ? (
                      <span className="user-otp">
                        {user.whatsappOtp}
                      </span>
                    ) : (
                      <span className="user-no-otp">—</span>
                    )}
                  </td>

                  <td>
                    {user.whatsappOtpExpires
                      ? new Date(
                          user.whatsappOtpExpires
                        ).toLocaleString()
                      : "—"}
                  </td>

                  <td>{user.address || "—"}</td>

                  <td>
                    <span
                      className={`user-role ${
                        user.role === "admin"
                          ? "admin"
                          : "user"
                      }`}
                    >
                      {user.role === "admin" ? "Admin" : "User"}
                    </span>
                  </td>

                  <td>
                    {user.createdAt
                      ? new Date(
                          user.createdAt
                        ).toLocaleDateString()
                      : "—"}
                  </td>

                  <td>
                    <div className="user-actions">
                      <button
                        type="button"
                        className="user-edit-button"
                        onClick={() => openEditModal(user)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="user-delete-button"
                        onClick={() => handleDelete(user)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={safeCurrentPage}
        totalItems={filteredUsers.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        itemLabel="users"
      />

      {/* EDIT MODAL */}
      {showModal && (
        <div
          className="user-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="user-modal">
            <div className="user-modal-header">
              <div>
                <h2>Edit User</h2>
                <p>Update user information.</p>
              </div>

              <button
                type="button"
                className="user-modal-close"
                onClick={closeModal}
              >
                ✕
              </button>
            </div>

            <form
              className="user-form"
              onSubmit={handleSubmit}
            >
              <div className="user-form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="user-form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="user-form-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Leave empty to keep current password"
                />
              </div>

              <div className="user-form-group">
                <label>Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="user-form-group">
                <label>Address</label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              <div className="user-form-group">
                <label>Role</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="user-form-actions">
                <button
                  type="button"
                  className="user-cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="user-save-button"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
