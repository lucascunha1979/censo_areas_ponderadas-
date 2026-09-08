"use strict";
/* V5 — otimizações de processamento e navegação, sem alterar dados. */
(function () {
  if (window.CensoV5) return;
  if (typeof jenksExato !== "function") throw new Error("Jenks V5 não foi carregado.");
  jenks = jenksExato;
  const originalAttach = attachData;
  const originalReset = resetThematicCache;
  const originalFit = fitToGeoJSON;
  const originalLoadBlock = loadBlock;
  const originalLoading = loading;
  const now = () => performance.now();
  const stats = {renders: 0, cacheHits: 0, lastRenderMs: 0, lastBlockMs: 0, lastBlock: null, loads: []};
  let busy = 0;
  loading = function (active) {
    busy = Math.max(0, busy + (active ? 1 : -1));
    originalLoading(busy > 0);
  };

  /* Reutiliza valores já calculados ao alternar métricas ou retornar à variável.
     O cache é limitado e não retém territórios anteriores. */
  let viewGeo = null, viewData = null;
  const viewCache = new Map();
  function clearViews() { viewGeo = viewData = null; viewCache.clear(); }
  resetThematicCache = function () { clearViews(); originalReset(); };
  attachData = function (geo, data) {
    if (geo !== viewGeo || data !== viewData) {
      clearViews(); viewGeo = geo; viewData = data;
    }
    const key = [state.blockSlug, state.variable, state.metric,
      state.metric === "share" ? scopeCategoryTotal() : ""].join("|");
    if (viewCache.has(key)) {
      stats.cacheHits++;
      const result = viewCache.get(key);
      viewCache.delete(key); viewCache.set(key, result);
      return result;
    }
    const result = originalAttach(geo, data);
    viewCache.set(key, result);
    if (viewCache.size > 4) viewCache.delete(viewCache.keys().next().value);
    return result;
  };

  /* A classificação exata substitui o algoritmo quadrático anterior.
     O mesmo número de classes e as mesmas regras de valores ausentes são mantidos. */
  const originalRender = renderCurrent;
  renderCurrent = function () {
    const start = now();
    const result = originalRender();
    stats.renders++;
    stats.lastRenderMs = now() - start;
    return result;
  };

  /* Ranking incremental: mantém todos os registros e a ordem, mas não cria
     milhares de elementos HTML de uma só vez. */
  let rankingGeo = null;
  renderRanking = function (geojson) {
    if (rankingGeo === geojson) return;
    rankingGeo = geojson;
    const rows = geojson.features.map(feature => ({
      id: String(feature.properties.id),
      name: rankingName(feature),
      value: feature.properties._metric,
      feature
    })).filter(row => Number.isFinite(row.value))
      .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "pt-BR"));
    const maxValue = rows.length ? rows[0].value : 1;
    el.ranking.replaceChildren();
    let shown = 0;
    const status = document.createElement("div");
    status.className = "v5-rank-status";
    const more = document.createElement("button");
    more.type = "button"; more.className = "v5-more";
    function openRow(row) {
      if (state.level === "uf") return showUF(row.id);
      if (state.level === "municipality") return showMunicipality(row.id);
      selectAP(row.id);
      fitToGeoJSON({type: "FeatureCollection", features: [row.feature]});
      renderCards(); renderBreadcrumb();
    }
    function appendChunk() {
      const end = Math.min(shown + 100, rows.length);
      const fragment = document.createDocumentFragment();
      for (let i = shown; i < end; i++) {
        const row = rows[i];
        const div = document.createElement("div");
        div.className = "rank-row"; div.tabIndex = 0; div.setAttribute("role", "button");
        div.setAttribute("aria-label", `${i + 1}. ${row.name}: ${formatValue(row.value)}`);
        const top = document.createElement("div"); top.className = "rank-top";
        const position = document.createElement("span"); position.className = "rank-position"; position.textContent = `${i + 1}.`;
        const name = document.createElement("span"); name.className = "rank-name"; name.title = row.name; name.textContent = row.name;
        const value = document.createElement("span"); value.className = "rank-value"; value.textContent = formatValue(row.value);
        top.append(position, name, value);
        const track = document.createElement("div"); track.className = "rank-track";
        const bar = document.createElement("div"); bar.className = "rank-bar";
        bar.style.width = `${maxValue > 0 ? Math.max(0, Math.min(100, row.value / maxValue * 100)) : 0}%`;
        track.appendChild(bar); div.append(top, track);
        const activate = () => Promise.resolve(openRow(row)).catch(error => { console.error(error); alert("Não foi possível abrir o território."); });
        div.addEventListener("click", activate);
        div.addEventListener("keydown", event => {
          if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(); }
        });
        fragment.appendChild(div);
      }
      el.ranking.insertBefore(fragment, status);
      shown = end;
      status.textContent = `Exibindo ${shown.toLocaleString("pt-BR")} de ${rows.length.toLocaleString("pt-BR")} unidades com dados.`;
      more.hidden = shown >= rows.length;
      more.textContent = `Mostrar mais ${Math.min(100, rows.length - shown)} unidades`;
    }
    el.ranking.append(status, more);
    more.addEventListener("click", appendChunk);
    appendChunk();
  };
  const rankStyle = document.createElement("style");
  rankStyle.textContent = `.v5-rank-status{padding:10px 4px;font-size:12px;opacity:.7}.v5-more{display:block;width:100%;padding:10px;margin:4px 0 8px;border:1px solid #9ca3af;border-radius:8px;background:transparent;color:inherit;cursor:pointer}.v5-more:hover{background:rgba(127,127,127,.1)}.v5-more[hidden]{display:none}.rank-row:focus-visible{outline:2px solid #7c3aed;outline-offset:2px}`;
  document.head.appendChild(rankStyle);

  /* Evita percorrer novamente todos os vértices ao retornar ao mesmo mapa. */
  const boundsCache = new WeakMap();
  fitToGeoJSON = function (geojson, padding = 35) {
    if (!geojson || !geojson.features?.length) return;
    if (geojson.features.length === 1) return originalFit(geojson, padding);
    let box = boundsCache.get(geojson);
    if (!box) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      const stack = [];
      for (const feature of geojson.features) if (feature.geometry?.coordinates) stack.push(feature.geometry.coordinates);
      while (stack.length) {
        const item = stack.pop();
        if (!Array.isArray(item)) continue;
        if (typeof item[0] === "number") {
          const x = item[0], y = item[1];
          if (Number.isFinite(x) && Number.isFinite(y)) {
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
          }
        } else for (const child of item) stack.push(child);
      }
      if (!Number.isFinite(minX)) return;
      box = [[minX, minY], [maxX, maxY]];
      boundsCache.set(geojson, box);
    }
    map.fitBounds(box, {padding, duration: 650, maxZoom: state.level === "ap" ? 12 : 9});
  };

  /* Dados e geometrias são solicitados em paralelo e chamadas simultâneas
     para a mesma UF/bloco compartilham a mesma Promise. */
  const pending = new Map();
  const recentData = new Map();
  function blockCache(slug) {
    if (!recentData.has(slug)) recentData.set(slug, {municipios: new Map(), areas: new Map()});
    return recentData.get(slug);
  }
  function loadTerritory(kind, uf) {
    const slug = state.blockSlug;
    const key = `${kind}:${slug}:${uf}`;
    if (pending.has(key)) return pending.get(key);
    const isArea = kind === "areas";
    const geoCache = isArea ? state.cache.areaGeo : state.cache.municipalityGeo;
    const dataCache = isArea ? state.cache.areaData : state.cache.municipalityData;
    const own = blockCache(slug)[isArea ? "areas" : "municipios"];
    const geoPath = isArea ? PATHS.areasGeo(uf) : PATHS.municipalitiesGeo(uf);
    const dataPath = isArea ? PATHS.areasData(slug, uf) : PATHS.municipalitiesData(slug, uf);
    const start = now();
    const promise = Promise.all([
      geoCache[uf] ? Promise.resolve(geoCache[uf]) : loadJSON(geoPath),
      own.has(uf) ? Promise.resolve(own.get(uf)) :
        (dataCache[uf] ? Promise.resolve(dataCache[uf]) : loadJSON(dataPath))
    ]).then(([geo, data]) => {
      geoCache[uf] = geo; own.set(uf, data);
      if (state.blockSlug === slug) {
        const current = isArea ? state.cache.areaData : state.cache.municipalityData;
        current[uf] = data;
      }
      stats.loads.push({kind, uf, block: slug, ms: now() - start});
      if (stats.loads.length > 50) stats.loads.shift();
      return {geo, data};
    }).finally(() => pending.delete(key));
    pending.set(key, promise);
    return promise;
  }
  loadUFAssets = function (uf) { return loadTerritory("municipios", uf); };
  loadAreaAssets = function (uf) { return loadTerritory("areas", uf); };
  loadBlock = async function (slug) {
    const start = now();
    const result = await originalLoadBlock(slug);
    stats.lastBlock = slug; stats.lastBlockMs = now() - start;
    /* Mantém somente o bloco atual e o anterior em memória. O navegador
       pode continuar usando seu próprio cache HTTP dos arquivos GZIP. */
    const entry = blockCache(slug);
    recentData.delete(slug); recentData.set(slug, entry);
    while (recentData.size > 2) {
      const oldest = recentData.keys().next().value;
      recentData.delete(oldest);
      compactPromises.delete(`block:${oldest}`);
    }
    rankingGeo = null;
    return result;
  };
  window.CensoV5 = Object.freeze({
    version: "20260908-v5",
    jenks: jenksExato,
    diagnostics: () => ({...stats, loads: stats.loads.slice(), cachedBlocks: [...recentData.keys()], pendingLoads: pending.size, busy})
  });
  console.info("Censo V5: classificação exata otimizada, cache e ranking incremental ativos.");
})();
