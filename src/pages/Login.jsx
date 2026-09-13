import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL =
  "https://mystore-backend-u6ey.onrender.com";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/auth/admin/login`,
        {
          email: email.trim().toLowerCase(),
          password,
        }
      );

      const {
        user,
        accessToken,
        refreshToken,
      } = response.data;

      if (!user || user.role !== "admin") {
        setError(
          "Access denied. Admin account required."
        );
        return;
      }

      if (!accessToken || !refreshToken) {
        setError(
          "Login failed. Authentication tokens are missing."
        );
        return;
      }

      // ========================================================
      // SAVE AUTH DATA
      // ========================================================
      //
      // Tokens are always written to localStorage so every other
      // page (which reads localStorage directly) keeps working
      // unchanged. "Remember me" is implemented separately via the
      // "rememberMe" flag below + the one-time check at the top of
      // App.jsx: if this is a brand new browser session and
      // rememberMe was "false", the app wipes the saved session
      // before rendering, effectively logging the user out once
      // they close and reopen the browser (but NOT on a simple
      // page refresh, since sessionStorage survives refreshes).
      // ========================================================

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("rememberMe", rememberMe ? "true" : "false");

      navigate("/dashboard");
    } catch (error) {
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
        <div className="login-icon">🔐</div>

        <div className="login-header">
          <h1>BStore</h1>
          <p>Admin Panel</p>
        </div>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form
          className="login-form"
          onSubmit={handleLogin}
        >
          <div className="login-form-group">
            <label htmlFor="email">Email</label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter admin email"
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="login-form-group">
            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <label className="login-remember-row">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading}
            />
            <span>Remember me</span>
          </label>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="login-footer">
          <span>BStore Admin Panel</span>
        </div>
      </div>
    </div>
  );
}

export default Login;
