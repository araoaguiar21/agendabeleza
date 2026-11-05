/* Supabase JS v2 — apenas chave PUBLICÁVEL no navegador. */
(function () {
  "use strict";
  var settings = window.LETICIA_SUPABASE_CONFIG || {};
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    window.studioCloudError = "Biblioteca Supabase não carregada.";
    return;
  }
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(settings.url || "") ||
      !/^sb_publishable_[A-Za-z0-9_-]+$/.test(settings.publishableKey || "")) {
    window.studioCloudError = "Confira os dados públicos do supabase-config.js.";
    return;
  }
  window.studioDb = window.supabase.createClient(settings.url, settings.publishableKey);
})();
