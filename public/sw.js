self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    self.clients.claim()
  );
});

self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET"
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
  );
});


self.addEventListener("push", (event) => {
  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = {
        body:
          event.data.text(),
      };
    }
  }

  const title =
    typeof data.title === "string" &&
    data.title.trim()
      ? data.title.trim()
      : "DioxiLife";

  const body =
    typeof data.body === "string" &&
    data.body.trim()
      ? data.body.trim()
      : "Tienes una actividad programada en tu seguimiento.";

  const url =
    typeof data.url === "string" &&
    data.url.startsWith("/")
      ? data.url
      : "/";

  const options = {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag:
      typeof data.tag === "string"
        ? data.tag
        : "dioxilife-seguimiento",

    renotify: false,

    data: {
      url,
    },
  };

  event.waitUntil(
    self.registration.showNotification(
      title,
      options
    )
  );
});


self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    const url =
      event.notification?.data?.url ||
      "/";

    event.waitUntil(
      self.clients
        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })
        .then((clients) => {
          for (const client of clients) {
            if (
              "focus" in client &&
              client.url.includes(
                self.location.origin
              )
            ) {
              if (
                "navigate" in client
              ) {
                client.navigate(url);
              }

              return client.focus();
            }
          }

          return self.clients.openWindow(
            url
          );
        })
    );
  }
);
