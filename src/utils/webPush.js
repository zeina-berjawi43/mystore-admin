
// ============================================================
// BStore Admin - Web Push
// ============================================================

const API_URL = import.meta.env.VITE_API_URL;

// ============================================================
// CONVERT VAPID PUBLIC KEY
// ============================================================

function urlBase64ToUint8Array(base64String) {
  const padding =
    "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (
    base64String + padding
  )
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from(
    [...rawData].map((char) =>
      char.charCodeAt(0)
    )
  );
}

// ============================================================
// REGISTER SERVICE WORKER
// ============================================================

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    throw new Error(
      "Service Worker is not supported by this browser."
    );
  }

  const registration =
    await navigator.serviceWorker.register(
      "/service-worker.js"
    );

  console.log(
    "✅ Service Worker registered:",
    registration
  );

  // Make sure the Service Worker is ready
  await navigator.serviceWorker.ready;

  console.log(
    "✅ Service Worker is ready."
  );

  return registration;
}

// ============================================================
// GET VAPID PUBLIC KEY FROM BACKEND
// ============================================================

async function getVapidPublicKey() {
  const response = await fetch(
    `${API_URL}/api/web-push/public-key`
  );

  if (!response.ok) {
    throw new Error(
      "Failed to get VAPID public key from backend."
    );
  }

  const data = await response.json();

  if (!data.publicKey) {
    throw new Error(
      "VAPID public key is missing."
    );
  }

  console.log(
    "✅ VAPID public key received."
  );

  return data.publicKey;
}

// ============================================================
// SUBSCRIBE ADMIN TO WEB PUSH
// ============================================================

export async function subscribeToWebPush(token) {
  try {
    // ----------------------------------------------------------
    // CHECK BROWSER SUPPORT
    // ----------------------------------------------------------

    if (!("Notification" in window)) {
      throw new Error(
        "This browser does not support notifications."
      );
    }

    if (!("serviceWorker" in navigator)) {
      throw new Error(
        "This browser does not support Service Workers."
      );
    }

    if (!("PushManager" in window)) {
      throw new Error(
        "This browser does not support Web Push."
      );
    }

    // ----------------------------------------------------------
    // 1. REGISTER SERVICE WORKER
    // ----------------------------------------------------------

    const registration =
      await registerServiceWorker();

    // ----------------------------------------------------------
    // 2. REQUEST NOTIFICATION PERMISSION
    // ----------------------------------------------------------

    let permission =
      Notification.permission;

    console.log(
      "🔔 Current notification permission:",
      permission
    );

    if (permission === "default") {
      permission =
        await Notification.requestPermission();
    }

    console.log(
      "🔔 Notification permission:",
      permission
    );

    if (permission !== "granted") {
      throw new Error(
        "Notification permission was not granted."
      );
    }

    // ----------------------------------------------------------
    // 3. GET VAPID PUBLIC KEY
    // ----------------------------------------------------------

    const publicKey =
      await getVapidPublicKey();

    console.log(
      "✅ Got VAPID public key."
    );

    // ----------------------------------------------------------
    // 4. GET EXISTING SUBSCRIPTION
    // ----------------------------------------------------------

    let subscription =
      await registration.pushManager.getSubscription();

    // ----------------------------------------------------------
    // 5. VALIDATE EXISTING SUBSCRIPTION
    // ----------------------------------------------------------

    if (subscription) {
      const existingJson =
        subscription.toJSON();

      console.log(
        "🔎 Existing Web Push subscription:",
        existingJson
      );

      if (
        !existingJson ||
        !existingJson.endpoint ||
        !existingJson.keys ||
        !existingJson.keys.p256dh ||
        !existingJson.keys.auth
      ) {
        console.log(
          "⚠️ Existing subscription is invalid. Unsubscribing..."
        );

        try {
          await subscription.unsubscribe();
        } catch (unsubscribeError) {
          console.log(
            "⚠️ Failed to remove invalid subscription:",
            unsubscribeError
          );
        }

        subscription = null;
      }
    }

    // ----------------------------------------------------------
    // 6. CREATE NEW SUBSCRIPTION
    // ----------------------------------------------------------

    if (!subscription) {
      console.log(
        "🔔 Creating new Web Push subscription..."
      );

      subscription =
        await registration.pushManager.subscribe({
          userVisibleOnly: true,

          applicationServerKey:
            urlBase64ToUint8Array(
              publicKey
            ),
        });

      console.log(
        "✅ New Web Push subscription created."
      );
    }

    // ----------------------------------------------------------
    // 7. CONVERT SUBSCRIPTION TO JSON
    // ----------------------------------------------------------

    const subscriptionJSON =
      subscription.toJSON();

    console.log(
      "========================================"
    );

    console.log(
      "WEB PUSH SUBSCRIPTION JSON:"
    );

    console.log(
      subscriptionJSON
    );

    console.log(
      "WEB PUSH ENDPOINT:",
      subscriptionJSON?.endpoint
    );

    console.log(
      "WEB PUSH P256DH:",
      subscriptionJSON?.keys?.p256dh
        ? "EXISTS"
        : "MISSING"
    );

    console.log(
      "WEB PUSH AUTH:",
      subscriptionJSON?.keys?.auth
        ? "EXISTS"
        : "MISSING"
    );

    console.log(
      "========================================"
    );

    // ----------------------------------------------------------
    // 8. FINAL VALIDATION BEFORE BACKEND
    // ----------------------------------------------------------

    if (
      !subscriptionJSON ||
      !subscriptionJSON.endpoint
    ) {
      throw new Error(
        "Browser created an invalid push subscription: endpoint is missing."
      );
    }

    if (
      !subscriptionJSON.keys ||
      !subscriptionJSON.keys.p256dh ||
      !subscriptionJSON.keys.auth
    ) {
      throw new Error(
        "Browser created an invalid push subscription: push keys are missing."
      );
    }

    // ----------------------------------------------------------
    // 9. SEND SUBSCRIPTION TO BACKEND
    // ----------------------------------------------------------

    console.log(
      "📤 Sending Web Push subscription to backend..."
    );

    const response = await fetch(
      `${API_URL}/api/web-push/subscribe`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,
        },

        body:
          JSON.stringify(
            subscriptionJSON
          ),
      }
    );

    const result =
      await response.json().catch(
        () => ({})
      );

    console.log(
      "📥 Backend subscription response:",
      result
    );

    if (!response.ok) {
      throw new Error(
        result.message ||
          "Failed to save push subscription."
      );
    }

    console.log(
      "✅ Web Push subscription saved successfully."
    );

    return subscriptionJSON;

  } catch (error) {

    console.error(
      "❌ Web Push Error:",
      error
    );

    throw error;
  }
}

// ============================================================
// UNSUBSCRIBE
// ============================================================

export async function unsubscribeFromWebPush() {
  try {
    const registration =
      await navigator.serviceWorker.getRegistration(
        "/service-worker.js"
      );

    if (!registration) {
      console.log(
        "ℹ️ No Service Worker registration found."
      );

      return false;
    }

    const subscription =
      await registration.pushManager.getSubscription();

    if (!subscription) {
      console.log(
        "ℹ️ No Web Push subscription found."
      );

      return false;
    }

    await subscription.unsubscribe();

    console.log(
      "✅ Web Push subscription removed."
    );

    return true;

  } catch (error) {

    console.error(
      "❌ Unsubscribe Web Push Error:",
      error
    );

    throw error;
  }
}
