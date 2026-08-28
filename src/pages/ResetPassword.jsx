import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const API_URL =
  "https://mystore-backend-u6ey.onrender.com";

function ResetPassword() {
  const navigate =
    useNavigate();

  const { token } =
    useParams();

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

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      setMessage("");
      setError("");

      if (
        !password ||
        !confirmPassword
      ) {
        setError(
          "Please enter both passwords"
        );

        return;
      }

      if (
        password.length < 6
      ) {
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

      try {
        setLoading(true);

        const response =
          await axios.post(
            `${API_URL}/auth/admin/reset-password/${token}`,
            {
              password,
              confirmPassword,
            }
          );

        setMessage(
          response.data.message
        );

        setPassword("");
        setConfirmPassword("");

      } catch (error) {
        console.log(
          "RESET PASSWORD ERROR:",
          error
        );

        setError(
          error.response
            ?.data?.message ||
            "Something went wrong"
        );

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
          Reset Password
        </h1>

        <p className="login-subtitle">
          Create a new password
          for your admin account.
        </p>

        <form
          onSubmit={
            handleSubmit
          }
        >

          {/* NEW PASSWORD */}

          <div className="input-group">

            <label>
              New Password
            </label>

            <input
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              autoComplete="new-password"
            />

          </div>


          {/* CONFIRM PASSWORD */}

          <div className="input-group">

            <label>
              Confirm Password
            </label>

            <input
              type="password"
              placeholder="Confirm new password"
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


          {error && (
            <div className="error-message">
              {error}
            </div>
          )}


          {message && (
            <div
              style={{
                padding:
                  "12px",
                marginBottom:
                  "15px",
                borderRadius:
                  "6px",
                background:
                  "#e8f7e8",
                color:
                  "#246b24",
                fontSize:
                  "14px",
              }}
            >
              {message}
            </div>
          )}


          <button
            type="submit"
            disabled={
              loading
            }
          >
            {loading
              ? "Resetting..."
              : "Reset Password"}
          </button>

        </form>


        {message && (
          <button
            type="button"
            onClick={() =>
              navigate("/")
            }
            style={{
              marginTop:
                "15px",
              background:
                "none",
              border:
                "none",
              cursor:
                "pointer",
              textDecoration:
                "underline",
            }}
          >
            Go to Login
          </button>
        )}

      </div>

    </div>
  );
}

export default ResetPassword;