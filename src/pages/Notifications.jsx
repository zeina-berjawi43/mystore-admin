
import React, { useEffect, useState } from "react";
import {
  subscribeToWebPush,
} from "../utils/webPush";

const API_URL =
  import.meta.env.VITE_API_URL;

function Notifications() {

  // ============================================================
  // SEND NOTIFICATION
  // ============================================================

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  // ============================================================
  // WEB PUSH
  // ============================================================

  const [
    notificationPermission,
    setNotificationPermission,
  ] = useState(
    "Notification" in window
      ? Notification.permission
      : "unsupported"
  );

  const [pushSubscribed, setPushSubscribed] =
    useState(false);

  const [checkingPush, setCheckingPush] =
    useState(true);

  const [
    enablingNotifications,
    setEnablingNotifications,
  ] = useState(false);

  const [
    notificationEnabledMessage,
    setNotificationEnabledMessage,
  ] = useState("");

  // ============================================================
  // CHECK BROWSER PUSH SUBSCRIPTION
  // ============================================================

  const checkPushSubscription =
    async () => {

      try {

        setCheckingPush(true);

        // ------------------------------------------------------
        // CHECK SUPPORT
        // ------------------------------------------------------

        if (
          !("Notification" in window) ||
          !("serviceWorker" in navigator) ||
          !("PushManager" in window)
        ) {

          setPushSubscribed(false);

          setNotificationPermission(
            "unsupported"
          );

          return;
        }

        // ------------------------------------------------------
        // PERMISSION
        // ------------------------------------------------------

        setNotificationPermission(
          Notification.permission
        );

        // ------------------------------------------------------
        // SERVICE WORKER
        // ------------------------------------------------------

        const registration =
          await navigator.serviceWorker.getRegistration(
            "/service-worker.js"
          );

        if (!registration) {

          console.log(
            "WEB PUSH: No service worker registration found."
          );

          setPushSubscribed(false);

          return;
        }

        // ------------------------------------------------------
        // GET SUBSCRIPTION
        // ------------------------------------------------------

        const subscription =
          await registration.pushManager.getSubscription();

        console.log(
          "WEB PUSH CHECK - Subscription:",
          subscription
        );

        console.log(
          "WEB PUSH CHECK - Endpoint:",
          subscription?.endpoint
        );

        if (subscription) {

          setPushSubscribed(true);

          console.log(
            "WEB PUSH CHECK: Browser push subscription exists."
          );

        } else {

          setPushSubscribed(false);

          console.log(
            "WEB PUSH CHECK: Browser has NO push subscription."
          );
        }

      } catch (error) {

        console.error(
          "WEB PUSH CHECK ERROR:",
          error
        );

        setPushSubscribed(false);

      } finally {

        setCheckingPush(false);
      }
    };

  // ============================================================
  // INITIAL CHECK
  // ============================================================

  useEffect(() => {

    checkPushSubscription();

  }, []);

  // ============================================================
  // ENABLE / SYNC ADMIN WEB NOTIFICATIONS
  // ============================================================

  const handleEnableNotifications =
    async () => {

      setNotificationEnabledMessage("");
      setErrorMessage("");
      setSuccessMessage("");

      const accessToken =
        localStorage.getItem(
          "accessToken"
        );

      if (!accessToken) {

        setErrorMessage(
          "You are not authenticated. Please login again."
        );

        return;
      }

      try {

        setEnablingNotifications(true);

        console.log(
          "WEB PUSH: Starting subscription..."
        );

        // ------------------------------------------------------
        // CREATE / GET SUBSCRIPTION
        // ------------------------------------------------------

        const subscription =
          await subscribeToWebPush(
            accessToken
          );

        console.log(
          "WEB PUSH: Subscription returned:",
          subscription
        );

        console.log(
          "WEB PUSH: Endpoint:",
          subscription?.endpoint
        );

        // ------------------------------------------------------
        // VERIFY
        // ------------------------------------------------------

        if (
          !subscription ||
          !subscription.endpoint
        ) {

          throw new Error(
            "Browser push subscription was not created."
          );
        }

        // ------------------------------------------------------
        // UPDATE STATE
        // ------------------------------------------------------

        setPushSubscribed(true);

        setNotificationPermission(
          Notification.permission
        );

        setNotificationEnabledMessage(
          "Notifications enabled successfully."
        );

        console.log(
          "WEB PUSH: Notifications enabled successfully."
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

  const handleSendNotification =
    async () => {

      setSuccessMessage("");
      setErrorMessage("");

      // --------------------------------------------------------
      // VALIDATION
      // --------------------------------------------------------

      const cleanTitle =
        title.trim();

      const cleanBody =
        body.trim();

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

      // --------------------------------------------------------
      // TOKEN
      // --------------------------------------------------------

      const accessToken =
        localStorage.getItem(
          "accessToken"
        );

      if (!accessToken) {

        setErrorMessage(
          "You are not authenticated. Please login again."
        );

        return;
      }

      try {

        setLoading(true);

        // ------------------------------------------------------
        // SEND
        // ------------------------------------------------------

        const response =
          await fetch(
            `${API_URL}/admin/send-offer-notification`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${accessToken}`,
              },

              body: JSON.stringify({
                title:
                  cleanTitle,

                body:
                  cleanBody,
              }),
            }
          );

        const data =
          await response.json();

        // ------------------------------------------------------
        // ERROR
        // ------------------------------------------------------

        if (!response.ok) {

          throw new Error(
            data.message ||
            "Failed to send notification."
          );
        }

        // ------------------------------------------------------
        // SUCCESS
        // ------------------------------------------------------

        setSuccessMessage(
          `Notification sent successfully to ${
            data.sent || 0
          } user(s).`
        );

        setTitle("");
        setBody("");

        console.log(
          "NOTIFICATION RESPONSE:",
          data
        );

      } catch (error) {

        console.error(
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
            CHECKING
        ==================================================== */}

        {checkingPush && (

          <div className="notification-success">
            Checking browser notifications...
          </div>

        )}


        {/* ====================================================
            ENABLED
        ==================================================== */}

        {!checkingPush &&
          notificationPermission === "granted" &&
          pushSubscribed && (

          <div className="notification-success">

            Browser notifications are enabled.

          </div>

        )}


        {/* ====================================================
            GRANTED BUT NOT CONNECTED
        ==================================================== */}

        {!checkingPush &&
          notificationPermission === "granted" &&
          !pushSubscribed && (

          <div className="notification-error">

            Browser permission is allowed, but push
            notifications are not connected yet.

          </div>

        )}


        {/* ====================================================
            DENIED
        ==================================================== */}

        {!checkingPush &&
          notificationPermission === "denied" && (

          <div className="notification-error">

            Browser notifications are blocked.
            Please allow notifications from your browser
            settings.

          </div>

        )}


        {/* ====================================================
            UNSUPPORTED
        ==================================================== */}

        {!checkingPush &&
          notificationPermission === "unsupported" && (

          <div className="notification-error">

            Browser notifications are not supported
            by this browser.

          </div>

        )}


        {/* ====================================================
            SUCCESS MESSAGE
        ==================================================== */}

        {notificationEnabledMessage && (

          <div className="notification-success">

            {notificationEnabledMessage}

          </div>

        )}


        {/* ====================================================
            ENABLE / SYNC BUTTON
        ==================================================== */}

        {!checkingPush &&
          notificationPermission !== "denied" &&
          notificationPermission !== "unsupported" && (

          <button
            type="button"
            className="notification-send-button"
            onClick={
              handleEnableNotifications
            }
            disabled={
              enablingNotifications
            }
          >

            {enablingNotifications
              ? "Connecting..."
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
          onClick={
            handleSendNotification
          }
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