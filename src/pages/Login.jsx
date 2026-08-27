import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL =
  "https://mystore-backend-u6ey.onrender.com";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    // ========================================================
    // VALIDATION
    // ========================================================

    if (!email || !password) {
      setError(
        "Please enter email and password"
      );

      return;
    }

    try {
      setLoading(true);

      // ======================================================
      // ADMIN LOGIN
      // ======================================================

      const response =
        await axios.post(
          `${API_URL}/auth/admin/login`,
          {
            email,
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

      // ======================================================
      // CHECK ADMIN
      // ======================================================

      if (user.role !== "admin") {
        setError(
          "Access denied. Admin account required."
        );

        return;
      }

      // ======================================================
      // SAVE DATA
      // ======================================================

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

      // ======================================================
      // GO DASHBOARD
      // ======================================================

      navigate("/dashboard");

    } catch (error) {
      console.log(
        "ADMIN LOGIN ERROR:",
        error
      );

      if (error.response) {
        setError(
          error.response.data?.message ||
            "Login failed"
        );
      } else {
        setError(
          "Cannot connect to the server"
        );
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-card">

        <div className="login-icon">
          🔐
        </div>

        <h1>
          Admin Panel
        </h1>

        <p className="login-subtitle">
          Sign in to manage your store
        </p>

        <form
          onSubmit={handleLogin}
        >

          {/* EMAIL */}

          <div className="input-group">

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

          {/* PASSWORD */}

          <div className="input-group">

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
              autoComplete="current-password"
            />

          </div>

          {/* ERROR */}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* BUTTON */}

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Sign In"}
          </button>

        </form>

      </div>

    </div>
  );
}

export default Login;
