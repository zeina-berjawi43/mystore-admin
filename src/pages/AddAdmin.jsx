
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL =
 "https://mystore-backend-u6ey.onrender.com";

function AddAdmin() {
  const navigate = useNavigate();

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  // ============================================================
  // ADD ADMIN
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    // ==========================================================
    // VALIDATION
    // ==========================================================

    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError(
        "Please fill in all fields"
      );

      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters"
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match"
      );

      return;
    }

    // ==========================================================
    // TOKEN
    // ==========================================================

    const accessToken =
      localStorage.getItem(
        "accessToken"
      );

    if (!accessToken) {
      setError(
        "You are not logged in as an admin"
      );

      return;
    }

    try {
      setLoading(true);

      // ========================================================
      // API REQUEST
      // ========================================================

      const response =
        await axios.post(
          `${API_URL}/auth/admin/add`,
          {
            name: name.trim(),
            email:
              email.trim().toLowerCase(),
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

      // ========================================================
      // SUCCESS
      // ========================================================

      setMessage(
        response.data?.message ||
          "Admin added successfully"
      );

      // Clear form
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

    } catch (error) {
      console.log(
        "ADD ADMIN ERROR:",
        error
      );

      // ========================================================
      // TOKEN / AUTH ERROR
      // ========================================================

      if (
        error.response?.status ===
          401 ||
        error.response?.status ===
          403
      ) {
        setError(
          error.response?.data?.message ||
            "You are not authorized to add an admin."
        );

        return;
      }

      // ========================================================
      // BACKEND ERROR
      // ========================================================

      setError(
        error.response?.data?.message ||
          "Error adding admin"
      );

    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        style={{
          marginBottom: "25px",
        }}
      >

        <h1
          style={{
            margin: 0,
            fontSize: "28px",
          }}
        >
          Add Admin
        </h1>

        <p
          style={{
            marginTop: "8px",
            color: "#777",
          }}
        >
          Create a new administrator
          account.
        </p>

      </div>


      {/* ======================================================
          CARD
      ====================================================== */}

      <div
        style={{
          background: "#fff",
          padding: "30px",
          borderRadius: "12px",
          boxShadow:
            "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >

        <form
          onSubmit={handleSubmit}
        >

          {/* ==================================================
              NAME
          ================================================== */}

          <div
            className="input-group"
          >

            <label>
              Name
            </label>

            <input
              type="text"
              placeholder="Enter admin name"
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
              autoComplete="name"
            />

          </div>


          {/* ==================================================
              EMAIL
          ================================================== */}

          <div
            className="input-group"
          >

            <label>
              Email
            </label>

            <input
              type="email"
              placeholder="Enter admin email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              autoCapitalize="none"
              autoComplete="email"
            />

          </div>


          {/* ==================================================
              PASSWORD
          ================================================== */}

          <div
            className="input-group"
          >

            <label>
              Password
            </label>

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              autoComplete="new-password"
            />

          </div>


          {/* ==================================================
              CONFIRM PASSWORD
          ================================================== */}

          <div
            className="input-group"
          >

            <label>
              Confirm Password
            </label>

            <input
              type="password"
              placeholder="Confirm password"
              value={
                confirmPassword
              }
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              autoComplete="new-password"
            />

          </div>


          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (
            <div
              className="error-message"
              style={{
                marginBottom: "15px",
              }}
            >
              {error}
            </div>
          )}


          {/* ==================================================
              SUCCESS
          ================================================== */}

          {message && (
            <div
              style={{
                padding: "12px",
                marginBottom: "15px",
                borderRadius: "6px",
                background: "#e8f7e8",
                color: "#246b24",
                fontSize: "14px",
              }}
            >
              {message}
            </div>
          )}


          {/* ==================================================
              BUTTON
          ================================================== */}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "5px",
            }}
          >
            {loading
              ? "Adding Admin..."
              : "Add Admin"}
          </button>

        </form>


        {/* ====================================================
            BACK
        ==================================================== */}

        <button
          type="button"
          onClick={() =>
            navigate("/dashboard")
          }
          style={{
            width: "100%",
            marginTop: "15px",
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Back to Dashboard
        </button>

      </div>

    </div>
  );
}

export default AddAdmin;