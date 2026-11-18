/* Pulso · botão do WhatsApp com código de referência e eventos do pixel.
   Tudo é opcional e à prova de falha: se algo der errado, o botão continua abrindo o WhatsApp normalmente. */
(function () {
  "use strict";
  var C = window.PULSO || {};

  // Código curto (5 caracteres, sem 0/O/1/I) que liga este visitante à conversa do WhatsApp.
  var ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  function novoCodigo() {
    var bytes = new Uint8Array(5), s = "", i;
    try { (window.crypto || window.msCrypto).getRandomValues(bytes); }
    catch (e) { for (i = 0; i < 5; i++) bytes[i] = Math.floor(Math.random() * 256); }
    for (i = 0; i < 5; i++) s += ALFABETO.charAt(bytes[i] % 32);
    return s;
  }

  var code = null;
  try { code = window.sessionStorage.getItem("pulso_ref"); } catch (e) {}
  if (!code) {
    code = novoCodigo();
    try { window.sessionStorage.setItem("pulso_ref", code); } catch (e) {}
  }

  function cookie(nome) {
    var m = document.cookie.match(new RegExp("(?:^|; )" + nome + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : "";
  }
  function consulta(nome) {
    try { return new URLSearchParams(window.location.search).get(nome) || ""; } catch (e) { return ""; }
  }

  // Monta o link do WhatsApp já com a mensagem e o código no final.
  var texto = (C.mensagem || "Oi! Quero conhecer as 150 receitas fitness") + " (ref " + code + ")";
  var link = "https://wa.me/" + (C.whatsapp || "") + "?text=" + encodeURIComponent(texto);

  function enviarCodigo() {
    if (!C.refEndpoint) return;
    try {
      var fbclid = consulta("fbclid");
      var fbc = cookie("_fbc") || (fbclid ? "fb.1." + Date.now() + "." + fbclid : "");
      var dados = new URLSearchParams();
      dados.set("code", code);
      dados.set("fbp", cookie("_fbp"));
      dados.set("fbc", fbc);
      dados.set("fbclid", fbclid);
      dados.set("url", window.location.href);
      dados.set("referrer", document.referrer || "");
      dados.set("ua", navigator.userAgent || "");
      dados.set("ts", String(Date.now()));
      ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ad_id", "adset_id", "campaign_id", "placement"].forEach(function (k) {
        var v = consulta(k); if (v) dados.set(k, v);
      });
      var corpo = dados.toString();
      // sendBeacon continua enviando mesmo quando a página é fechada pela abertura do WhatsApp.
      if (!(navigator.sendBeacon && navigator.sendBeacon(C.refEndpoint, new Blob([corpo], { type: "application/x-www-form-urlencoded" })))) {
        fetch(C.refEndpoint, { method: "POST", body: corpo, headers: { "Content-Type": "application/x-www-form-urlencoded" }, keepalive: true, mode: "no-cors" });
      }
    } catch (e) {}
  }

  function aoClicar() {
    try {
      if (typeof window.fbq === "function") {
        var conteudo = { content_name: "150 Almoços Fitness", content_category: "Receitas" };
        window.fbq("track", "Lead", conteudo, { eventID: "lead-" + code });
        window.fbq("track", "Contact", conteudo, { eventID: "contact-" + code });
      }
    } catch (e) {}
    enviarCodigo();
    mostrarAbrindo();
  }

  // Tela "Abrindo o seu WhatsApp…": dá retorno imediato ao clique. Se o app não abrir em ~4 s, mostra o plano B.
  var abrindo = document.getElementById("abrindo"), plano = document.getElementById("abrindo-plano"),
      linkB = document.getElementById("abrindo-link"), voltar = document.getElementById("abrindo-voltar"), timerB = null;
  if (linkB) linkB.setAttribute("href", link);
  function esconderAbrindo() {
    if (!abrindo) return;
    clearTimeout(timerB);
    abrindo.classList.remove("is-on"); abrindo.hidden = true;
    if (plano) plano.hidden = true;
    document.documentElement.style.overflow = "";
  }
  function mostrarAbrindo() {
    try {
      if (!abrindo) return;
      abrindo.hidden = false;
      document.documentElement.style.overflow = "hidden";
      window.requestAnimationFrame(function () { abrindo.classList.add("is-on"); });
      clearTimeout(timerB);
      timerB = setTimeout(function () { if (plano) plano.hidden = false; }, 4000);
    } catch (e) {}
  }
  if (voltar) voltar.addEventListener("click", esconderAbrindo);
  // Quando a pessoa volta do WhatsApp para o navegador, a página aparece como estava.
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") esconderAbrindo(); });
  window.addEventListener("pageshow", function (e) { if (e.persisted) esconderAbrindo(); });

  var botoes = document.querySelectorAll("[data-wa]");
  for (var i = 0; i < botoes.length; i++) {
    botoes[i].setAttribute("href", link);
    botoes[i].addEventListener("click", aoClicar);
  }

  // Botão flutuante: aparece só depois que o botão principal já passou (saiu pelo topo da tela).
  try {
    var principal = document.querySelector(".hero .btn"), flut = document.getElementById("flutuante");
    if (principal && flut && "IntersectionObserver" in window) {
      var fl = flut.querySelector("a");
      new IntersectionObserver(function (es) {
        var e = es[es.length - 1];
        var mostrar = !e.isIntersecting && e.boundingClientRect.top < 0;
        flut.classList.toggle("is-on", mostrar);
        flut.setAttribute("aria-hidden", mostrar ? "false" : "true");
        if (fl) { if (mostrar) fl.removeAttribute("tabindex"); else fl.setAttribute("tabindex", "-1"); }
      }, { threshold: 0 }).observe(principal);
    }
  } catch (e) {}
})();
