import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL =
  "https://mystore-backend-u6ey.onrender.com";

function ForgotPassword() {
  const navigate =
    useNavigate();

  const [email, setEmail] =
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

      if (!email) {
        setError(
          "Please enter your email"
        );

        return;
      }

      try {
        setLoading(true);

        const response =
          await axios.post(
            `${API_URL}/auth/admin/forgot-password`,
            {
              email,
            }
          );

        setMessage(
          response.data.message
        );

      } catch (error) {
        console.log(
          "FORGOT PASSWORD ERROR:",
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
          🔑
        </div>

        <h1>
          Forgot Password
        </h1>

        <p className="login-subtitle">
          Enter your admin email and
          we will send you a reset link.
        </p>

        <form
          onSubmit={
            handleSubmit
          }
        >

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
              ? "Sending..."
              : "Send Reset Link"}
          </button>

        </form>


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
          Back to Login
        </button>

      </div>

    </div>
  );
}

export default ForgotPassword;