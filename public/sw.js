self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    self.clients.claim()
  );
});

const RUTA_SEGUIMIENTO =
  /^\/seguimiento\/[a-f0-9]{64}\/?$/i;

const CACHE_ENLACE =
  "dioxilife-ultimo-enlace-v1";

const CLAVE_ENLACE =
  "/__ultimo-enlace-seguimiento";

async function guardarUltimoEnlace(ruta) {
  const cache =
    await caches.open(CACHE_ENLACE);

  await cache.put(
    CLAVE_ENLACE,
    new Response(ruta)
  );
}

async function leerUltimoEnlace() {
  try {
    const cache =
      await caches.open(CACHE_ENLACE);

    const respuesta =
      await cache.match(CLAVE_ENLACE);

    if (!respuesta) {
      return null;
    }

    const ruta = await respuesta.text();

    return RUTA_SEGUIMIENTO.test(ruta)
      ? ruta
      : null;
  } catch {
    return null;
  }
}

self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET"
  ) {
    return;
  }

  if (event.request.mode === "navigate") {
    const url = new URL(
      event.request.url
    );

    if (
      url.origin ===
        self.location.origin &&
      RUTA_SEGUIMIENTO.test(
        url.pathname
      )
    ) {
      event.waitUntil(
        guardarUltimoEnlace(
          url.pathname
        ).catch(() => null)
      );
    }
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

  const options = {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag:
      typeof data.tag === "string"
        ? data.tag
        : "dioxilife-seguimiento",

    renotify: false,

  };

  event.waitUntil(
    (async () => {
      const enlaceGuardado =
        await leerUltimoEnlace();

      const url =
        typeof data.url === "string" &&
        data.url.startsWith("/")
          ? data.url
          : enlaceGuardado || "/";

      await self.registration.showNotification(
        title,
        {
          ...options,
          data: {
            url,
          },
        }
      );
    })()
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
