"use strict";
/* V4: navegação municipal nacional e metodologia independente. */
(function () {
  const oldUnits = availableUnitsForScope;
  const oldBrazil = showBrazil;
  const oldUF = showUF;
  const oldMunicipality = showMunicipality;
  const oldBack = goBack;
  const oldCapture = captureNavigation;
  const oldRestore = restoreNavigation;
  const oldReset = resetThematicCache;
  const oldPopulate = populateMunicipalities;
  const UF = {11:"RO",12:"AC",13:"AM",14:"RR",15:"PA",16:"AP",17:"TO",21:"MA",22:"PI",23:"CE",24:"RN",25:"PB",26:"PE",27:"AL",28:"SE",29:"BA",31:"MG",32:"ES",33:"RJ",35:"SP",41:"PR",42:"SC",43:"RS",50:"MS",51:"MT",52:"GO",53:"DF"};
  const cache = state.cache;
  cache.allMunicipalityGeo = null;
  cache.allMunicipalityData = null;
  cache.allMunicipalityBlock = null;
  state.v4ReturnNational = false;
  let nationalPromise = null;

  availableUnitsForScope = function (scope = state.scope) {
    const options = oldUnits(scope);
    const v = currentVariableMeta();
    if (scope !== "brazil" || !v || !v.territorial_units.includes("MUNICIPIO")) return options;
    if (options.some(([unit]) => unit === "municipality")) return options;
    const result = [...options];
    result.splice(Math.min(1, result.length), 0, ["municipality", "Municípios"]);
    return result;
  };

  resetThematicCache = function () {
    oldReset();
    cache.allMunicipalityData = null;
    cache.allMunicipalityBlock = null;
    nationalPromise = null;
  };

  async function loadNationalMunicipalities() {
    if (cache.allMunicipalityGeo && cache.allMunicipalityData && cache.allMunicipalityBlock === state.blockSlug) return;
    if (nationalPromise) return nationalPromise;
    const slug = state.blockSlug;
    nationalPromise = (async () => {
      const ids = allUFIds();
      for (let i = 0; i < ids.length; i += 3) {
        await Promise.all(ids.slice(i, i + 3).map(uf => loadUFAssets(uf)));
      }
      if (!cache.allMunicipalityGeo) {
        const features = [];
        for (const uf of ids) features.push(...cache.municipalityGeo[uf].features);
        cache.allMunicipalityGeo = {type: "FeatureCollection", features};
      }
      const data = {};
      for (const uf of ids) Object.assign(data, cache.municipalityData[uf]);
      if (state.blockSlug !== slug) return;
      cache.allMunicipalityData = data;
      cache.allMunicipalityBlock = slug;
    })();
    try { await nationalPromise; }
    finally { nationalPromise = null; }
    if (state.blockSlug !== slug) return loadNationalMunicipalities();
  }

  populateMunicipalities = function (geojson) {
    if (state.scope === "brazil" && state.level === "municipality") {
      const features = geojson.features.map(f => ({properties:{id:f.properties.id, nm:`${f.properties.nm} — ${UF[String(f.properties.id).slice(0,2)] || ""}`}}));
      oldPopulate({features});
      el.municipality.options[0].textContent = "Todos os municípios";
    } else oldPopulate(geojson);
  };

  showBrazil = async function (unit = "uf") {
    if (unit !== "municipality") {
      state.v4ReturnNational = false;
      return oldBrazil(unit);
    }
    if (!availableUnitsForScope("brazil").some(([u]) => u === "municipality")) return oldBrazil(normalizeUnitForScope(unit, "brazil"));
    loading(true);
    try {
      await loadNationalMunicipalities();
      state.scope = "brazil";
      state.level = "municipality";
      state.returnBrazilUnit = "municipality";
      state.v4ReturnNational = false;
      state.selectedUF = state.selectedUFName = null;
      state.selectedMunicipality = state.selectedMunicipalityName = null;
      state.selectedAP = state.selectedAPName = null;
      state.currentGeo = cache.allMunicipalityGeo;
      state.currentData = cache.allMunicipalityData;
      state.currentParentData = state.brazilData.BR;
      state.currentParentName = "Brasil";
      el.uf.value = "";
      populateMunicipalities(state.currentGeo);
      el.municipality.value = "";
      syncViewControls();
      renderCurrent();
      fitToGeoJSON(state.ufGeo, 20);
    } finally { loading(false); }
  };

  showUF = async function (uf, unit = "municipality") {
    state.v4ReturnNational = false;
    return oldUF(uf, unit);
  };

  showMunicipality = async function (municipality) {
    const code = String(municipality);
    const uf = code.slice(0, 2);
    const fromNational = state.scope === "brazil" && state.level === "municipality";
    if (!UF[uf]) throw new Error(`Código municipal inválido: ${code}`);
    if (fromNational || !state.selectedUF || state.selectedUF !== uf) {
      state.selectedUF = uf;
      state.selectedUFName = state.ufGeo.features.find(f => String(f.properties.id) === uf)?.properties.nm || UF[uf];
      await loadUFAssets(uf);
      oldPopulate(cache.municipalityGeo[uf]);
    }
    state.v4ReturnNational = fromNational || state.v4ReturnNational && state.scope === "municipality";
    if (state.v4ReturnNational) {
      state.returnBrazilUnit = "municipality";
      state.returnUFUnit = "municipality";
    }
    return oldMunicipality(code);
  };

  goBack = async function () {
    if (!state.selectedAP && state.scope === "municipality" && state.v4ReturnNational) return showBrazil("municipality");
    return oldBack();
  };

  captureNavigation = function () {
    return {...oldCapture(), v4ReturnNational: state.v4ReturnNational};
  };
  restoreNavigation = async function (snapshot) {
    await oldRestore(snapshot);
    if (snapshot.scope === "municipality" && state.scope === "municipality" && snapshot.v4ReturnNational) {
      state.v4ReturnNational = true;
      state.returnBrazilUnit = "municipality";
      state.returnUFUnit = "municipality";
    }
  };

  function openMethodology(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.href = "metodologia.html";
  }
  for (const id of ["tabMethodButton", "closeMethodologyBtn"]) {
    document.getElementById(id)?.addEventListener("click", openMethodology, true);
  }
  document.getElementById("backButton")?.addEventListener("click", event => {
    if (!state.selectedAP && state.scope === "municipality" && state.v4ReturnNational) {
      event.preventDefault(); event.stopImmediatePropagation();
      showBrazil("municipality").catch(console.error);
    }
  }, true);
  el.municipality.addEventListener("change", event => {
    if (state.scope === "brazil" && state.level === "municipality" && !el.municipality.value) {
      event.stopImmediatePropagation();
      showBrazil("municipality").catch(console.error);
    }
  }, true);
  console.info("V4: municípios nacionais e metodologia independente disponíveis.");
})();
