
import React, { useState } from "react";

const API_URL = "https://mystore-backend-u6ey.onrender.com";

function Notifications() {

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [loading, setLoading] = useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");


  // ============================================================
  // SEND NOTIFICATION
  // ============================================================

  const handleSendNotification = async () => {

    setSuccessMessage("");
    setErrorMessage("");


    // ==========================================================
    // VALIDATION
    // ==========================================================

    const cleanTitle = title.trim();
    const cleanBody = body.trim();


    if (!cleanTitle) {

      setErrorMessage(
        "Please enter a notification title."
      );

      return;
    }


    if (!cleanBody) {

      setErrorMessage(
        "Please enter a notification message."
      );

      return;
    }


    // ==========================================================
    // GET ADMIN ACCESS TOKEN
    // ==========================================================

    const accessToken =
      localStorage.getItem("accessToken");


    if (!accessToken) {

      setErrorMessage(
        "You are not authenticated. Please login again."
      );

      return;
    }


    try {

      setLoading(true);


      // ========================================================
      // SEND TO BACKEND
      // ========================================================

      const response = await fetch(
        `${API_URL}/admin/send-offer-notification`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Authorization:
              `Bearer ${accessToken}`,
          },

          body: JSON.stringify({
            title: cleanTitle,
            body: cleanBody,
          }),
        }
      );


      const data =
        await response.json();


      // ========================================================
      // HANDLE ERROR
      // ========================================================

      if (!response.ok) {

        throw new Error(
          data.message ||
          "Failed to send notification."
        );

      }


      // ========================================================
      // SUCCESS
      // ========================================================

      setSuccessMessage(
        `Notification sent successfully to ${data.sent || 0} user(s).`
      );


      setTitle("");
      setBody("");


      console.log(
        "NOTIFICATION RESPONSE:",
        data
      );


    } catch (error) {

      console.log(
        "SEND NOTIFICATION ERROR:",
        error
      );


      setErrorMessage(
        error.message ||
        "Failed to send notification. Please try again."
      );


    } finally {

      setLoading(false);

    }

  };


  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="notifications-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="notifications-header">

        <div>

          <h1>
            Send Offer Notification
          </h1>

          <p>
            Send an offer notification to all users.
          </p>

        </div>

      </div>


      {/* ======================================================
          CARD
      ====================================================== */}

      <div className="notifications-card">

        {/* ====================================================
            TITLE
        ==================================================== */}

        <div className="notification-field">

          <label>
            Notification Title
          </label>

          <input
            type="text"
            value={title}
            onChange={(event) => {

              setTitle(
                event.target.value
              );

              setSuccessMessage("");
              setErrorMessage("");

            }}
            placeholder="Example: Special Offer 🎉"
            disabled={loading}
          />

        </div>


        {/* ====================================================
            MESSAGE
        ==================================================== */}

        <div className="notification-field">

          <label>
            Notification Message
          </label>

          <textarea
            value={body}
            onChange={(event) => {

              setBody(
                event.target.value
              );

              setSuccessMessage("");
              setErrorMessage("");

            }}
            placeholder="Example: Get 20% off today!"
            rows={5}
            disabled={loading}
          />

        </div>


        {/* ====================================================
            ERROR
        ==================================================== */}

        {errorMessage && (

          <div className="notification-error">
            {errorMessage}
          </div>

        )}


        {/* ====================================================
            SUCCESS
        ==================================================== */}

        {successMessage && (

          <div className="notification-success">
            {successMessage}
          </div>

        )}


        {/* ====================================================
            SEND BUTTON
        ==================================================== */}

        <button
          type="button"
          className="notification-send-button"
          onClick={handleSendNotification}
          disabled={loading}
        >

          {loading
            ? "Sending..."
            : "Send Notification"
          }

        </button>

      </div>

    </div>
  );
}


export default Notifications;

