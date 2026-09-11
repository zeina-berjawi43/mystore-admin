import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL =
  "https://mystore-backend-u6ey.onrender.com";

function AddAdmin() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters"
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const accessToken =
      localStorage.getItem("accessToken");

    if (!accessToken) {
      setError(
        "You are not logged in as an admin"
      );
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/auth/admin/add`,
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        },
        {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
        }
      );

      console.log(
        "ADD ADMIN RESPONSE:",
        response.data
      );

      setMessage(
        response.data?.message ||
          "Admin added successfully"
      );

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.log(
        "ADD ADMIN ERROR:",
        error
      );

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        setError(
          error.response?.data?.message ||
            "You are not authorized to add an admin."
        );
        return;
      }

      setError(
        error.response?.data?.message ||
          "Error adding admin"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-admin-page">
      <div className="add-admin-header">
        <div>
          <h1>Add Admin</h1>
          <p>
            Create a new administrator account.
          </p>
        </div>
      </div>

      <div className="add-admin-card">
        <form
          className="add-admin-form"
          onSubmit={handleSubmit}
        >
          <div className="add-admin-form-group">
            <label htmlFor="admin-name">
              Name
            </label>

            <input
              id="admin-name"
              type="text"
              placeholder="Enter admin name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              autoComplete="name"
            />
          </div>

          <div className="add-admin-form-group">
            <label htmlFor="admin-email">
              Email
            </label>

            <input
              id="admin-email"
              type="email"
              placeholder="Enter admin email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              autoCapitalize="none"
              autoComplete="email"
            />
          </div>

          <div className="add-admin-form-group">
            <label htmlFor="admin-password">
              Password
            </label>

            <input
              id="admin-password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              autoComplete="new-password"
            />
          </div>

          <div className="add-admin-form-group">
            <label htmlFor="admin-confirm-password">
              Confirm Password
            </label>

            <input
              id="admin-confirm-password"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="add-admin-error">
              {error}
            </div>
          )}

          {message && (
            <div className="add-admin-success">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="add-admin-submit"
            disabled={loading}
          >
            {loading
              ? "Adding Admin..."
              : "Add Admin"}
          </button>
        </form>

        <button
          type="button"
          className="add-admin-back"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default AddAdmin;