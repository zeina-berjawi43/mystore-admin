
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

  return data.publicKey;
}

// ============================================================
// SUBSCRIBE ADMIN TO WEB PUSH
// ============================================================

export async function subscribeToWebPush(token) {
  try {
    // ----------------------------------------------------------
    // 1. REGISTER SERVICE WORKER
    // ----------------------------------------------------------

    const registration =
      await registerServiceWorker();

    // ----------------------------------------------------------
    // 2. REQUEST NOTIFICATION PERMISSION
    // ----------------------------------------------------------

    const permission =
      await Notification.requestPermission();

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

    // ----------------------------------------------------------
    // 4. CHECK EXISTING SUBSCRIPTION
    // ----------------------------------------------------------

    let subscription =
      await registration.pushManager.getSubscription();

    // ----------------------------------------------------------
    // 5. CREATE SUBSCRIPTION
    // ----------------------------------------------------------

    if (!subscription) {
      subscription =
        await registration.pushManager.subscribe({
          userVisibleOnly: true,

          applicationServerKey:
            urlBase64ToUint8Array(
              publicKey
            ),
        });
    }

    console.log(
      "✅ Web Push Subscription:",
      subscription
    );

    // ----------------------------------------------------------
    // 6. SEND SUBSCRIPTION TO BACKEND
    // ----------------------------------------------------------

    const response = await fetch(
      `${API_URL}/api/web-push/subscribe`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(subscription),
      }
    );

    const result =
      await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.message ||
          "Failed to save push subscription."
      );
    }

    console.log(
      "✅ Subscription saved successfully:",
      result
    );

    return subscription;
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
      return false;
    }

    const subscription =
      await registration.pushManager.getSubscription();

    if (!subscription) {
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