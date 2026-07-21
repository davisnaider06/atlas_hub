/**
 * Service worker do Hub Atlas.
 *
 * Estratégia deliberadamente conservadora: NÃO cacheamos páginas nem respostas
 * de dados. Num CRM, mostrar um lead com estágio antigo ou um agendamento já
 * cancelado é pior do que mostrar "sem conexão" — a pessoa agiria sobre uma
 * informação errada sem perceber.
 *
 * Cacheamos só o que é imutável (ícones) e servimos uma página de offline
 * quando a navegação falha por falta de rede.
 */

const CACHE = "atlas-v1";
const OFFLINE_URL = "/offline.html";

const PRECACHE = [OFFLINE_URL, "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  // remove caches de versões anteriores
  event.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // só GET: nunca interceptar mutações (server actions são POST)
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navegação: tenta a rede; se falhar, mostra a página de offline.
  // Nunca devolve página cacheada — dados de CRM precisam ser atuais.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL).then((r) => r ?? Response.error())),
    );
    return;
  }

  // Ícones: imutáveis, pode servir do cache
  if (url.pathname.startsWith("/icon-") || url.pathname === "/apple-icon.png") {
    event.respondWith(
      caches.match(request).then((cacheado) => cacheado ?? fetch(request)),
    );
  }
});
