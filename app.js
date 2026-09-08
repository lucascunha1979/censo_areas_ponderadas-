"use strict";
/* Carrega a V4 preservada e, depois, as otimizações V5. */
(function () {
  const scripts = [
    "app_original.js?v=20260908-v4",
    "ajustes-v4.js?v=20260908-v4",
    "jenks-exato.js?v=20260908-v5",
    "ajustes-v5.js?v=20260908-v5"
  ];
  let index = 0;
  function next() {
    if (index >= scripts.length) return;
    const script = document.createElement("script");
    script.src = scripts[index++];
    script.async = false;
    script.onload = next;
    script.onerror = () => alert("Não foi possível carregar um arquivo do painel. Atualize a página e tente novamente.");
    document.head.appendChild(script);
  }
  next();
})();
