
import React, { useState } from "react";
import {
  subscribeToWebPush,
} from "../utils/webPush";

const API_URL = import.meta.env.VITE_API_URL;

function Notifications() {
  // ============================================================
  // SEND NOTIFICATION
  // ============================================================

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [loading, setLoading] = useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  // ============================================================
  // WEB PUSH
  // ============================================================

  const [notificationPermission, setNotificationPermission] =
    useState(
      "Notification" in window
        ? Notification.permission
        : "unsupported"
    );

  const [enablingNotifications, setEnablingNotifications] =
    useState(false);

  const [notificationEnabledMessage, setNotificationEnabledMessage] =
    useState("");

  // ============================================================
  // ENABLE ADMIN WEB NOTIFICATIONS
  // ============================================================

  const handleEnableNotifications = async () => {
    setNotificationEnabledMessage("");
    setErrorMessage("");

    const accessToken =
      localStorage.getItem("accessToken");

    if (!accessToken) {
      setErrorMessage(
        "You are not authenticated. Please login again."
      );

      return;
    }

    try {
      setEnablingNotifications(true);

      await subscribeToWebPush(accessToken);

      setNotificationPermission(
        Notification.permission
      );

      setNotificationEnabledMessage(
        "Notifications enabled successfully."
      );

    } catch (error) {
      console.error(
        "ENABLE NOTIFICATIONS ERROR:",
        error
      );

      setNotificationPermission(
        "Notification" in window
          ? Notification.permission
          : "unsupported"
      );

      setErrorMessage(
        error.message ||
        "Failed to enable notifications."
      );

    } finally {
      setEnablingNotifications(false);
    }
  };

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
          ADMIN BROWSER NOTIFICATIONS
      ====================================================== */}

      <div className="notifications-card">

        <div className="notification-field">

          <label>
            Admin Browser Notifications
          </label>

          <p>
            Enable browser notifications to receive
            new notifications even when the Admin Website
            is not open.
          </p>

        </div>


        {/* ====================================================
            NOTIFICATION STATUS
        ==================================================== */}

        {notificationPermission === "granted" && (

          <div className="notification-success">
            Browser notifications are enabled.
          </div>

        )}


        {notificationPermission === "denied" && (

          <div className="notification-error">
            Browser notifications are blocked.
            Please allow notifications from your browser
            settings.
          </div>

        )}


        {notificationEnabledMessage && (

          <div className="notification-success">
            {notificationEnabledMessage}
          </div>

        )}


        {/* ====================================================
            ENABLE BUTTON
        ==================================================== */}

        {notificationPermission !== "granted" && (

          <button
            type="button"
            className="notification-send-button"
            onClick={handleEnableNotifications}
            disabled={enablingNotifications}
          >

            {enablingNotifications
              ? "Enabling..."
              : "🔔 Enable Notifications"
            }

          </button>

        )}

      </div>


      {/* ======================================================
          SEND NOTIFICATION CARD
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