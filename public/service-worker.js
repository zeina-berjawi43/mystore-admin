
// ============================================================
// BStore Admin - Web Push Service Worker
// ============================================================

self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let data;

  try {
    data = event.data.json();
  } catch (error) {
    data = {
      title: "BStore",
      body: event.data.text(),
    };
  }

  const title = data.title || "BStore";

  const options = {
    body: data.body || "",
    icon: "/favicon.png",
    badge: "/favicon.png",
    data: data.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ============================================================
// NOTIFICATION CLICK
// ============================================================

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow("/");
      }

      return null;
    })
  );
});