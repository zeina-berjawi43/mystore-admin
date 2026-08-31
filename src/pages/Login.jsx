import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL =
  "https://mystore-backend-u6ey.onrender.com";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // LOGIN
  // ============================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    // ==========================================================
    // VALIDATION
    // ==========================================================

    if (!email.trim() || !password) {
      setError("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      // ========================================================
      // ADMIN LOGIN
      // ========================================================

      const response = await axios.post(
        `${API_URL}/auth/admin/login`,
        {
          email: email.trim().toLowerCase(),
          password,
        }
      );

      console.log(
        "ADMIN LOGIN RESPONSE:",
        response.data
      );

      const {
        user,
        accessToken,
        refreshToken,
      } = response.data;

      // ========================================================
      // CHECK ADMIN
      // ========================================================

      if (!user || user.role !== "admin") {
        setError(
          "Access denied. Admin account required."
        );

        return;
      }

      // ========================================================
      // CHECK TOKENS
      // ========================================================

      if (!accessToken || !refreshToken) {
        setError(
          "Login failed. Authentication tokens are missing."
        );

        return;
      }

      // ========================================================
      // SAVE AUTH DATA
      // ========================================================

      localStorage.setItem(
        "accessToken",
        accessToken
      );

      localStorage.setItem(
        "refreshToken",
        refreshToken
      );

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      localStorage.setItem(
        "isLoggedIn",
        "true"
      );

      // ========================================================
      // GO DASHBOARD
      // ========================================================

      navigate("/dashboard");

    } catch (error) {
      console.log(
        "ADMIN LOGIN ERROR:",
        error
      );

      // ========================================================
      // SERVER ERROR
      // ========================================================

      if (error.response) {
        setError(
          error.response.data?.message ||
            "Login failed"
        );
      }

      // ========================================================
      // NETWORK ERROR
      // ========================================================

      else {
        setError(
          "Cannot connect to the server"
        );
      }

    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="login-page">

      <div className="login-card">

        {/* ====================================================
            ICON
        ==================================================== */}

        <div className="login-icon">
          🔐
        </div>

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="login-header">

          <h1>
            BStore
          </h1>

          <p>
            Admin Panel
          </p>

        </div>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        {/* ====================================================
            FORM
        ==================================================== */}

        <form
          className="login-form"
          onSubmit={handleLogin}
        >

          {/* ==================================================
              EMAIL
          ================================================== */}

          <div className="login-form-group">

            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="Enter admin email"
              autoComplete="email"
              disabled={loading}
            />

          </div>

          {/* ==================================================
              PASSWORD
          ================================================== */}

          <div className="login-form-group">

            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Enter password"
              autoComplete="current-password"
              disabled={loading}
            />

          </div>

          {/* ==================================================
              FORGOT PASSWORD
          ================================================== */}

          <div className="login-forgot">

            <button
              type="button"
              onClick={() =>
                navigate("/forgot-password")
              }
              disabled={loading}
            >
              Forgot Password?
            </button>

          </div>

          {/* ==================================================
              LOGIN BUTTON
          ================================================== */}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >

            {loading
              ? "Logging in..."
              : "Login"}

          </button>

        </form>

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <div className="login-footer">

          <span>
            BStore Admin Panel
          </span>

        </div>

      </div>

    </div>
  );
}

export default Login;
