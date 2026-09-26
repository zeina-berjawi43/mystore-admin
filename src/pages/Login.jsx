import { saveSession } from '../utils/session-storage';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/admin-api";

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
      await saveSession({ accessToken, refreshToken, user: JSON.stringify(user) }, rememberMe);

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
