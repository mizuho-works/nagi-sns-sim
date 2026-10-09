// 通知を受け取り、質問を端末内に保存し、タップしたらURLを開く
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("push", event => {
  let data = { title: "なぎ編集部", body: "体験メモの質問が届きました", url: "./?tab=memo" };
  try { if (event.data) data = Object.assign(data, event.data.json()); } catch (e) {}

  // 質問は、この端末のキャッシュにだけ保存する（アプリの画面で表示するため）
  const store = (data.questions && data.questions.length)
    ? caches.open("nagi-q").then(c => c.put("./latest-questions.json",
        new Response(JSON.stringify({ at: Date.now(), questions: data.questions }),
          { headers: { "Content-Type": "application/json" } })))
    : Promise.resolve();

  event.waitUntil(Promise.all([
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "icon-192.png",
      badge: "icon-192.png",
      data: { url: data.url }
    }),
    store
  ]));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "./?tab=memo";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ("focus" in c) { c.navigate(url); return c.focus(); }
      }
      return self.clients.openWindow(url);
    })
  );
});
