"use strict";
/* Carrega a versão publicada intacta e, em seguida, os ajustes V4. */
(function () {
  const original = document.createElement("script");
  original.src = "app_original.js?v=20260908-v4";
  original.async = false;
  original.onerror = () => alert("Não foi possível carregar o aplicativo original.");
  original.onload = () => {
    const patch = document.createElement("script");
    patch.src = "ajustes-v4.js?v=20260908-v4";
    patch.async = false;
    patch.onerror = () => alert("Não foi possível carregar os ajustes V4.");
    document.head.appendChild(patch);
  };
  document.head.appendChild(original);
})();
