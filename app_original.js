
"use strict";


/* ==========================================================
   CONFIGURAÇÃO
========================================================== */

const PATHS = {

    manifest:
        "dados/blocos_v2/manifest.json",

    ufGeo:
        "dados/geo/uf.geojson",

    blockMeta:
        slug =>
            `dados/blocos_v2/${slug}/meta.json`,

    blockBrasil:
        slug =>
            `dados/blocos_v2/${slug}/brasil.json`,

    blockUFs:
        slug =>
            `dados/blocos_v2/${slug}/ufs.json`,

    blockCoverage:
        slug =>
            `dados/blocos_v2/${slug}/coverage.json`,

    municipalitiesData:
        (slug, uf) =>
            `dados/blocos_v2/${slug}/municipios/${uf}.json`,

    municipalitiesGeo:
        uf =>
            `dados/geo/municipios/${uf}.geojson`,

    areasData:
        (slug, uf) =>
            `dados/blocos_v2/${slug}/areas/${uf}.json`,

    areasGeo:
        uf =>
            `dados/geo/areas/${uf}.geojson`
};


/* ==========================================================
   PALETA
========================================================== */

const COLORS = [

    "#ede9fe",
    "#c4b5fd",
    "#a78bfa",
    "#7c3aed",
    "#4c1d95"

];

const MISSING_LIGHT = "#717983";

const MISSING_DARK = "#9ca3af";


/* ==========================================================
   ESTADO
========================================================== */

const state = {

    manifest:
        null,

    meta:
        null,

    coverage:
        null,

    blockSlug:
        null,

    subblock:
        null,

    metric:
        "absolute",

    variable:
        null,

    scope:
        "brazil",

    level:
        "uf",

    returnBrazilUnit:
        "uf",

    returnUFUnit:
        "municipality",

    selectedUF:
        null,

    selectedUFName:
        null,

    selectedMunicipality:
        null,

    selectedMunicipalityName:
        null,

    selectedAP:
        null,

    selectedAPName:
        null,

    currentGeo:
        null,

    currentData:
        null,

    currentParentData:
        null,

    currentParentName:
        "Brasil",

    currentRenderedGeo:
        null,

    ufGeo:
        null,

    ufData:
        null,

    brazilData:
        null,

    cache: {

        municipalityGeo:
            {},

        municipalityData:
            {},

        areaGeo:
            {},

        areaData:
            {},

        allAreaGeo:
            null,

        allAreaData:
            null
    },

    dark:
        false
};


/* ==========================================================
   DOM
========================================================== */

const el = {

    block:
        document.getElementById(
            "blockSelect"
        ),

    subblock:
        document.getElementById(
            "subblockSelect"
        ),

    variable:
        document.getElementById(
            "variableSelect"
        ),

    metricAbsolute:
        document.getElementById(
            "metricAbsolute"
        ),

    metricPercent:
        document.getElementById(
            "metricPercent"
        ),

    metricShare:
        document.getElementById(
            "metricShare"
        ),

    uf:
        document.getElementById(
            "ufSelect"
        ),

    municipality:
        document.getElementById(
            "municipalitySelect"
        ),

    unit:
        document.getElementById(
            "unitSelect"
        ),

    scopeIndicator:
        document.getElementById(
            "scopeIndicator"
        ),

    back:
        document.getElementById(
            "backButton"
        ),

    breadcrumb:
        document.getElementById(
            "breadcrumb"
        ),

    cardTerritory:
        document.getElementById(
            "cardTerritory"
        ),

    cardTotal:
        document.getElementById(
            "cardTotal"
        ),

    cardTotalLabel:
        document.getElementById(
            "cardTotalLabel"
        ),

    cardCategory:
        document.getElementById(
            "cardCategory"
        ),

    cardCategoryLabel:
        document.getElementById(
            "cardCategoryLabel"
        ),

    cardPercent:
        document.getElementById(
            "cardPercent"
        ),

    cardPercentLabel:
        document.getElementById(
            "cardPercentLabel"
        ),

    mapSubtitle:
        document.getElementById(
            "mapSubtitle"
        ),

    rankingSubtitle:
        document.getElementById(
            "rankingSubtitle"
        ),

    ranking:
        document.getElementById(
            "ranking"
        ),

    legend:
        document.getElementById(
            "legend"
        ),

    coverageNotice:
        document.getElementById(
            "coverageNotice"
        ),

    theme:
        document.getElementById(
            "themeButton"
        ),

    loading:
        document.getElementById(
            "loading"
        )
};


/* ==========================================================
   MAPLIBRE
========================================================== */

const map = new maplibregl.Map({

    container:
        "map",

    style: {

        version: 8,

        sources: {},

        layers: [
            {
                id:
                    "background",

                type:
                    "background",

                paint: {
                    "background-color":
                        "#eef1f4"
                }
            }
        ]
    },

    center:
        [-52.7, -14.5],

    zoom:
        3.1,

    attributionControl:
        false
});


map.addControl(

    new maplibregl.NavigationControl({
        showCompass: false
    }),

    "top-right"
);


const popup =
    new maplibregl.Popup({

        closeButton:
            false,

        closeOnClick:
            false,

        offset:
            8
    });


/* ==========================================================
   FORMATADORES
========================================================== */

const fmtInt =
    new Intl.NumberFormat(
        "pt-BR",
        {
            maximumFractionDigits: 0
        }
    );


const fmtPct =
    new Intl.NumberFormat(
        "pt-BR",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );


function formatPercentAdaptive(
    value
) {

    if (
        value === null ||
        value === undefined ||
        !Number.isFinite(value)
    ) {

        return "Sem dados";
    }


    const abs =
        Math.abs(value);


    let casas;


    if (
        abs === 0
    ) {

        casas = 2;
    }

    else if (
        abs >= 1
    ) {

        casas = 2;
    }

    else if (
        abs >= 0.1
    ) {

        casas = 3;
    }

    else if (
        abs >= 0.01
    ) {

        casas = 4;
    }

    else if (
        abs >= 0.001
    ) {

        casas = 5;
    }

    else if (
        abs >= 0.0001
    ) {

        casas = 6;
    }

    else {

        casas = 7;
    }


    return new Intl.NumberFormat(
        "pt-BR",
        {
            minimumFractionDigits:
                Math.min(
                    2,
                    casas
                ),

            maximumFractionDigits:
                casas
        }
    ).format(
        value
    );
}


function formatValue(
    value
) {

    if (
        value === null
        ||
        value === undefined
        ||
        !Number.isFinite(
            value
        )
    ) {

        return "Sem dados";
    }


    if (
        state.metric ===
        "percent"
        ||
        state.metric ===
        "share"
    ) {

        return (
            formatPercentAdaptive(
                value
            )
            +
            "%"
        );
    }


    return formatDataValue(
        value
    );
}


/* ==========================================================
   FETCH / CACHE
========================================================== */

/* Carregador de pacotes compactos — caminhos públicos originais preservados. */
const COMPACT_INDEX_PATH = "dados/pacotes/index.json?v=20260908135917";
let compactIndexPromise = null;
const compactPromises = new Map();

async function compactFetch(path) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status} ao carregar ${path}`);
    }
    return response;
}

async function compactPlainJSON(path) {
    return (await compactFetch(path)).json();
}

function compactIndex() {
    if (!compactIndexPromise) {
        compactIndexPromise = compactPlainJSON(COMPACT_INDEX_PATH)
            .then(index => {
                if (index.format !== "censo2022-gzip-v1") {
                    throw new Error("Índice de dados compactos incompatível.");
                }
                return index;
            })
            .catch(error => {
                compactIndexPromise = null;
                throw error;
            });
    }
    return compactIndexPromise;
}

function compactCached(key, factory) {
    if (!compactPromises.has(key)) {
        const promise = Promise.resolve().then(factory).catch(error => {
            compactPromises.delete(key);
            throw error;
        });
        compactPromises.set(key, promise);
    }
    return compactPromises.get(key);
}

async function compactReadGzip(path, version) {
    const response = await compactFetch(`${path}?v=${encodeURIComponent(version)}`);
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let text;
    if (bytes.length >= 2 && bytes[0] === 31 && bytes[1] === 139) {
        if (typeof DecompressionStream === "undefined") {
            throw new Error("Este navegador não oferece descompressão GZIP. Atualize o navegador para abrir o painel.");
        }
        const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream("gzip"));
        text = await new Response(stream).text();
    } else {
        // Compatibilidade com um servidor que já tenha descomprimido a resposta.
        text = new TextDecoder("utf-8").decode(bytes);
    }
    return JSON.parse(text);
}

async function compactBlock(slug, index) {
    const path = index.block_files[slug];
    if (!path) throw new Error(`Bloco não encontrado: ${slug}`);
    return compactCached(`block:${slug}`, () => compactReadGzip(path, index.version));
}

async function compactGeometry(path, index) {
    const descriptor = index.geo[path];
    if (!descriptor) throw new Error(`Geometria não encontrada: ${path}`);
    return compactCached(`geo:${path}`, async () => {
        if (descriptor.mode === "whole") {
            return compactReadGzip(descriptor.files[0], index.version);
        }
        const features = [];
        // Sequencial para evitar descomprimir vários GeoJSONs grandes de uma vez.
        for (const file of descriptor.files) {
            const part = await compactReadGzip(file, index.version);
            features.push(...part);
        }
        return {...descriptor.base, features};
    });
}

async function loadJSON(path) {
    const clean = String(path).split("?")[0];
    if (clean === "dados/blocos_v2/manifest.json") {
        return compactPlainJSON(path);
    }
    const index = await compactIndex();
    const match = clean.match(/^dados\/blocos_v2\/([^/]+)\/(meta|brasil|ufs|coverage|municipios|areas)(?:\/(\d{2}))?\.json$/);
    if (match) {
        const slug = match[1];
        const kind = match[2];
        const uf = match[3];
        if (kind === "meta") {
            if (!index.metadata[slug]) throw new Error(`Metadados ausentes: ${slug}`);
            return index.metadata[slug];
        }
        const pack = await compactBlock(slug, index);
        if (kind === "municipios" || kind === "areas") {
            const result = pack[kind][uf];
            if (!result) throw new Error(`Dados ausentes: ${clean}`);
            return result;
        }
        return pack[kind];
    }
    if (index.geo[clean]) {
        return compactGeometry(clean, index);
    }
    return compactPlainJSON(path);
}


function loading(
    active
) {

    el.loading.classList.toggle(
        "show",
        active
    );
}


/* ==========================================================
   META
========================================================== */

function currentVariableMeta() {

    if (
        !state.meta
        ||
        !Array.isArray(
            state.meta.variables
        )
    ) {

        return null;
    }


    return (
        state.meta.variables
        .find(
            item =>
                item.id ===
                state.variable
        )
        ||
        null
    );
}


function variableIndex(
    id
) {

    if (
        !state.meta
        ||
        !Array.isArray(
            state.meta.variables
        )
    ) {

        return -1;
    }


    const variable =
        state.meta.variables
        .find(
            item =>
                item.id === id
        );


    return (
        variable
        &&
        Number.isInteger(
            variable.field
        )
    )
    ?
    variable.field
    :
    -1;
}


function recordNumber(
    record,
    index
) {

    if (
        !record
        ||
        index === null
        ||
        index === undefined
        ||
        index < 0
    ) {

        return null;
    }


    const raw =
        record[index];


    if (
        raw === null
        ||
        raw === undefined
    ) {

        return null;
    }


    const value =
        Number(raw);


    return Number.isFinite(
        value
    )
    ?
    value
    :
    null;
}


function formatDataValue(
    value
) {

    if (
        value === null
        ||
        value === undefined
        ||
        !Number.isFinite(
            value
        )
    ) {

        return "—";
    }


    const variable =
        currentVariableMeta();


    if (
        variable
        &&
        variable.format ===
        "currency"
    ) {

        return new Intl.NumberFormat(
            "pt-BR",
            {
                style:
                    "currency",

                currency:
                    "BRL",

                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    2
            }
        ).format(
            value
        );
    }


    if (
        variable
        &&
        variable.format ===
        "decimal"
    ) {

        return new Intl.NumberFormat(
            "pt-BR",
            {
                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    2
            }
        ).format(
            value
        );
    }


    return fmtInt.format(
        value
    );
}


function metricAllowed(
    metric,
    considerLevel = true
) {

    const variable =
        currentVariableMeta();


    if (!variable) {

        return false;
    }


    if (
        metric ===
        "absolute"
    ) {

        return (
            variable.metrics
            ?.absolute
            !== false
        );
    }


    if (
        metric ===
        "percent"
    ) {

        return (
            variable.metrics
            ?.category_percent
            === true
        );
    }


    if (
        metric ===
        "share"
    ) {

        const habilitada =
            variable.metrics
            ?.scope_percent
            === true;


        return (
            habilitada
            &&
            (
                !considerLevel
                ||
                state.level ===
                "ap"
            )
        );
    }


    return false;
}


function levelTerritorialCode(
    level
) {

    if (
        level === "uf"
    ) {

        return "UF";
    }


    if (
        level ===
        "municipality"
    ) {

        return "MUNICIPIO";
    }


    return "AP";
}


function availableUnitsForScope(
    scope = state.scope
) {

    const variable =
        currentVariableMeta();


    const permitidas =
        new Set(
            variable
            ?.territorial_units
            ||
            [
                "UF",
                "MUNICIPIO",
                "AP"
            ]
        );


    let options;


    if (
        scope === "brazil"
    ) {

        options = [

            [
                "uf",
                "Estados"
            ],

            [
                "ap",
                "Áreas de Ponderação"
            ]
        ];
    }


    else if (
        scope === "uf"
    ) {

        options = [

            [
                "municipality",
                "Municípios"
            ],

            [
                "ap",
                "Áreas de Ponderação"
            ]
        ];
    }


    else {

        options = [

            [
                "ap",
                "Áreas de Ponderação"
            ]
        ];
    }


    return options.filter(
        ([level]) =>
            permitidas.has(
                levelTerritorialCode(
                    level
                )
            )
    );
}


function normalizeUnitForScope(
    unit,
    scope = state.scope
) {

    const options =
        availableUnitsForScope(
            scope
        );


    if (
        options.length === 0
    ) {

        throw new Error(
            "A variável selecionada não possui "
            + "unidade territorial disponível."
        );
    }


    if (
        options.some(
            ([level]) =>
                level === unit
        )
    ) {

        return unit;
    }


    return options[0][0];
}


function resetThematicCache() {

    state.cache
        .municipalityData =
            {};


    state.cache
        .areaData =
            {};


    state.cache
        .allAreaData =
            null;


    /*
       Evita qualquer possibilidade de meta do
       bloco novo ser usada temporariamente com
       dados do bloco anterior.
    */

    state.currentData =
        null;


    state.currentParentData =
        null;


    state.currentRenderedGeo =
        null;
}


function populateBlocks() {

    el.block.innerHTML =
        "";


    const blocks =
        [
            ...state.manifest.blocks
        ]
        .sort(
            (a, b) =>
                a.order -
                b.order
        );


    for (
        const block
        of blocks
    ) {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            block.slug;


        option.textContent =
            block.label;


        el.block.appendChild(
            option
        );
    }
}


function friendlySubblockLabel(
    subblock
) {

    if (
        state.blockSlug !==
        "moradia"
    ) {

        return subblock;
    }


    const variable =
        state.meta.variables
        .find(
            item =>
                item.subblock ===
                subblock
        );


    const table =
        variable
        ?.table
        ||
        "";


    const labels = {

        "T1_1":
            "Domicílios — condição de ocupação",

        "T1_2":
            "Domicílios — material das paredes externas",

        "T1_3":
            "Domicílios — número de moradores por dormitório",

        "T1_4":
            "Domicílios — conexão domiciliar à internet",

        "T1_5":
            "Moradores — condição de ocupação do domicílio",

        "T1_6":
            "Moradores — material das paredes externas do domicílio",

        "T1_7":
            "Moradores — número de moradores por dormitório",

        "T1_8":
            "Moradores — conexão domiciliar à internet"
    };


    return (
        labels[table]
        ||
        subblock
    );
}


function populateSubblocks() {

    el.subblock.innerHTML =
        "";


    const encontrados =
        [];


    for (
        const variable
        of state.meta.variables
    ) {

        if (
            !encontrados.includes(
                variable.subblock
            )
        ) {

            encontrados.push(
                variable.subblock
            );
        }
    }


    for (
        const subblock
        of encontrados
    ) {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            subblock;


        option.textContent =
            friendlySubblockLabel(
                subblock
            );


        el.subblock.appendChild(
            option
        );
    }


    state.subblock =
        encontrados[0]
        ||
        null;


    el.subblock.value =
        state.subblock
        ||
        "";


    el.subblock.disabled =
        encontrados.length <= 1;
}


function captureNavigation() {

    return {

        scope:
            state.scope,

        level:
            state.level,

        selectedUF:
            state.selectedUF,

        selectedMunicipality:
            state.selectedMunicipality,

        returnBrazilUnit:
            state.returnBrazilUnit,

        returnUFUnit:
            state.returnUFUnit
    };
}


async function restoreNavigation(
    snapshot
) {

    if (
        snapshot.scope ===
        "municipality"
        &&
        snapshot.selectedUF
        &&
        snapshot.selectedMunicipality
    ) {

        await showUF(

            snapshot.selectedUF,

            normalizeUnitForScope(
                "municipality",
                "uf"
            )
        );


        await showMunicipality(
            snapshot.selectedMunicipality
        );


        return;
    }


    if (
        snapshot.scope ===
        "uf"
        &&
        snapshot.selectedUF
    ) {

        await showUF(

            snapshot.selectedUF,

            normalizeUnitForScope(
                snapshot.level,
                "uf"
            )
        );


        return;
    }


    await showBrazil(

        normalizeUnitForScope(
            snapshot.level,
            "brazil"
        )
    );
}


async function loadBlock(
    slug
) {

    const [
        meta,
        brazilData,
        ufData,
        coverage
    ] =
    await Promise.all([

        loadJSON(
            PATHS.blockMeta(
                slug
            )
        ),

        loadJSON(
            PATHS.blockBrasil(
                slug
            )
        ),

        loadJSON(
            PATHS.blockUFs(
                slug
            )
        ),

        loadJSON(
            PATHS.blockCoverage(
                slug
            )
        )
    ]);


    if (
        meta.schema_version !== 2
    ) {

        throw new Error(
            `Schema inválido no bloco ${slug}.`
        );
    }


    state.blockSlug =
        slug;


    state.meta =
        meta;


    state.brazilData =
        brazilData;


    state.ufData =
        ufData;


    state.coverage =
        coverage;


    resetThematicCache();


    populateSubblocks();

    populateVariables();


    if (
        !metricAllowed(
            state.metric,
            false
        )
    ) {

        state.metric =
            "absolute";
    }


    el.block.value =
        slug;
}


async function switchBlock(
    slug
) {

    const snapshot =
        captureNavigation();


    loading(true);


    try {

        await loadBlock(
            slug
        );


        await restoreNavigation(
            snapshot
        );
    }


    finally {

        loading(false);
    }
}


async function applyVariableSelection() {

    state.selectedAP =
        null;


    state.selectedAPName =
        null;


    if (
        !metricAllowed(
            state.metric,
            false
        )
    ) {

        state.metric =
            "absolute";
    }


    const options =
        availableUnitsForScope(
            state.scope
        );


    const currentAllowed =
        options.some(
            ([level]) =>
                level ===
                state.level
        );


    if (!currentAllowed) {

        const target =
            options[0][0];


        if (
            state.scope ===
            "brazil"
        ) {

            await showBrazil(
                target
            );


            return;
        }


        if (
            state.scope ===
            "uf"
        ) {

            await showUF(
                state.selectedUF,
                target
            );


            return;
        }


        await showMunicipality(
            state.selectedMunicipality
        );


        return;
    }


    syncViewControls();

    renderCurrent();
}


function coverageApplies() {

    if (
        !state.coverage
        ||
        state.coverage.complete
    ) {

        return false;
    }


    const affected =
        state.coverage.affected
        ||
        {};


    if (
        state.selectedAP
    ) {

        return (
            affected.areas
            ||
            []
        ).includes(
            String(
                state.selectedAP
            )
        );
    }


    if (
        state.scope ===
        "municipality"
    ) {

        return (
            affected.municipios
            ||
            []
        ).includes(
            String(
                state.selectedMunicipality
            )
        );
    }


    if (
        state.scope ===
        "uf"
    ) {

        return (
            affected.ufs
            ||
            []
        ).includes(
            String(
                state.selectedUF
            )
        );
    }


    return true;
}


function renderCoverageNotice() {

    if (
        !el.coverageNotice
    ) {

        return;
    }


    if (
        coverageApplies()
    ) {

        el.coverageNotice.hidden =
            false;


        el.coverageNotice.textContent =
            (
                "Atenção à cobertura: "
                +
                (
                    state.coverage.reason
                    ||
                    "há dados ausentes nesta abrangência."
                )
            );
    }


    else {

        el.coverageNotice.hidden =
            true;


        el.coverageNotice.textContent =
            "";
    }
}


function absoluteLegendTitle() {

    const variable =
        currentVariableMeta();


    if (
        variable?.format ===
        "currency"
    ) {

        return "Valor em reais";
    }


    if (
        variable?.format ===
        "decimal"
    ) {

        return "Valor médio";
    }


    return "Valor absoluto";
}


function currentUnitLabel() {

    if (
        state.level ===
        "uf"
    ) {

        return "Estados";
    }


    if (
        state.level ===
        "municipality"
    ) {

        return "Municípios";
    }


    return "Áreas de Ponderação";
}


function totalIndex() {

    const variable =
        currentVariableMeta();


    return (
        variable
        &&
        Number.isInteger(
            variable.denominator_field
        )
    )
    ?
    variable.denominator_field
    :
    null;
}


function variableLabel(
    id
) {

    if (
        !state.meta
        ||
        !Array.isArray(
            state.meta.variables
        )
    ) {

        return "";
    }


    const variable =
        state.meta.variables
        .find(
            item =>
                item.id === id
        );


    return variable
        ?
        variable.label
        :
        "";
}


/* ==========================================================
   DADOS
========================================================== */

function safeCategoryPercent(
    category,
    total
) {

    if (
        !Number.isFinite(
            category
        )
        ||
        !Number.isFinite(
            total
        )
        ||
        total <= 0
    ) {

        return null;
    }


    const value =

        (
            category
            /
            total
        )
        *
        100;


    /*
       A auditoria global da base comprovou que
       todas as ocorrências válidas estão entre
       0% e 100%.

       Se o navegador produzir algo fora desse
       intervalo, não devemos "corrigir" o dado:
       devemos rejeitar a renderização incoerente.
    */

    const tolerancia =
        1e-7;


    if (
        value < -tolerancia
        ||
        value > 100 + tolerancia
    ) {

        console.warn(
            "Percentual da categoria incoerente no frontend",
            {
                block:
                    state.blockSlug,

                variable:
                    state.variable,

                category:
                    category,

                total:
                    total,

                percent:
                    value
            }
        );


        return null;
    }


    return value;
}


function extractValues(
    record
) {

    const variable =
        currentVariableMeta();


    if (
        !record
        ||
        !variable
    ) {

        return {

            total:
                null,

            category:
                null,

            percent:
                null,

            metric:
                null
        };
    }


    const category =
        recordNumber(
            record,
            variable.field
        );


    const total =
        recordNumber(
            record,
            variable.denominator_field
        );


    const percent =

        variable.metrics
        ?.category_percent
        === true

        ?

        safeCategoryPercent(
            category,
            total
        )

        :

        null;


    let metric =
        null;


    if (
        state.metric ===
        "absolute"
    ) {

        metric =
            category;
    }


    else if (
        state.metric ===
        "percent"
    ) {

        metric =
            percent;
    }


    else if (
        state.metric ===
        "share"
    ) {

        metric =
            category;
    }


    return {

        total:
            total,

        category:
            category,

        percent:
            percent,

        metric:
            metric
    };
}


/* ==========================================================
   JENKS — 5 CLASSES
========================================================== */

function jenks(
    input,
    requestedClasses = 5
) {

    const data =
        input
        .filter(
            Number.isFinite
        )
        .sort(
            (a, b) =>
                a - b
        );


    if (
        data.length === 0
    ) {

        return [
            0,
            1
        ];
    }


    const unique =
        [...new Set(data)];


    if (
        unique.length === 1
    ) {

        return [
            unique[0],
            unique[0]
        ];
    }


    const classes =
        Math.min(
            requestedClasses,
            unique.length
        );


    const n =
        data.length;


    const lower =
        Array.from(
            {
                length:
                    n + 1
            },

            () =>
                Array(
                    classes + 1
                ).fill(0)
        );


    const variance =
        Array.from(
            {
                length:
                    n + 1
            },

            () =>
                Array(
                    classes + 1
                ).fill(Infinity)
        );


    for (
        let i = 1;
        i <= classes;
        i++
    ) {

        lower[1][i] =
            1;

        variance[1][i] =
            0;
    }


    for (
        let l = 2;
        l <= n;
        l++
    ) {

        let s1 = 0;
        let s2 = 0;
        let w = 0;
        let varianceValue = 0;


        for (
            let m = 1;
            m <= l;
            m++
        ) {

            const lowerClassLimit =
                l - m + 1;

            const value =
                data[
                    lowerClassLimit - 1
                ];


            s2 +=
                value * value;

            s1 +=
                value;

            w++;


            varianceValue =
                s2 -
                (
                    s1 * s1
                ) /
                w;


            const previous =
                lowerClassLimit - 1;


            if (
                previous !== 0
            ) {

                for (
                    let j = 2;
                    j <= classes;
                    j++
                ) {

                    const candidate =
                        varianceValue +
                        variance[
                            previous
                        ][
                            j - 1
                        ];


                    if (
                        candidate <
                        variance[l][j]
                    ) {

                        lower[l][j] =
                            lowerClassLimit;

                        variance[l][j] =
                            candidate;
                    }
                }
            }
        }


        lower[l][1] =
            1;

        variance[l][1] =
            varianceValue;
    }


    const breaks =
        Array(
            classes + 1
        ).fill(0);


    breaks[0] =
        data[0];

    breaks[classes] =
        data[
            data.length - 1
        ];


    let k =
        n;


    for (
        let j = classes;
        j >= 2;
        j--
    ) {

        const id =
            Math.max(
                0,
                Math.floor(
                    lower[k][j]
                ) - 2
            );


        breaks[
            j - 1
        ] =
            data[id];


        k =
            Math.floor(
                lower[k][j] - 1
            );
    }


    return breaks;
}


function classForValue(
    value,
    breaks
) {

    if (
        !Number.isFinite(value)
    ) {

        return -1;
    }


    if (
        breaks.length <= 2
    ) {

        return 2;
    }


    for (
        let i = 1;
        i < breaks.length;
        i++
    ) {

        if (
            value <=
            breaks[i]
        ) {

            return (
                i - 1
            );
        }
    }


    return (
        breaks.length - 2
    );
}


/* ==========================================================
   GEOJSON + DADOS
========================================================== */

function attachData(
    geojson,
    data
) {

    /*
       IMPORTANTE PARA PERFORMANCE:

       NÃO fazemos structuredClone() de geometry.

       Cada feature recebe um novo objeto properties,
       enquanto geometry é reutilizada por referência.

       Isso evita copiar centenas de MB de coordenadas
       a cada troca de variável ou métrica.
    */

    const result = {

        type:
            geojson.type,

        features:
            geojson.features.map(
                feature => ({

                    type:
                        feature.type,

                    geometry:
                        feature.geometry,

                    properties: {
                        ...feature.properties
                    }
                })
            )
    };


    const metrics =
        [];


    for (
        const feature
        of result.features
    ) {

        const id =
            String(
                feature.properties.id
            );


        const record =
            data
            ?
            (
                data[id]
                ??
                null
            )
            :
            null;


        const values =
            extractValues(
                record
            );


        feature.properties._record =
            record;


        feature.properties._total =
            values.total;


        feature.properties._cat =
            values.category;


        feature.properties._pct =
            values.percent;


        feature.properties._metric =
            values.metric;


        if (
            Number.isFinite(
                values.metric
            )
        ) {

            metrics.push(
                values.metric
            );
        }
    }


    const breaks =
        jenks(
            metrics,
            5
        );


    for (
        const feature
        of result.features
    ) {

        feature.properties._class =
            classForValue(

                feature.properties._metric,

                breaks
            );
    }


    return {

        geojson:
            result,

        breaks:
            breaks
    };
}


/* ==========================================================
   MAP LAYERS
========================================================== */

function mapColorExpression() {

    return [
        "match",

        [
            "get",
            "_class"
        ],

        -1,
        state.dark
            ? MISSING_DARK
            : MISSING_LIGHT,

        0,
        COLORS[0],

        1,
        COLORS[1],

        2,
        COLORS[2],

        3,
        COLORS[3],

        4,
        COLORS[4],

        COLORS[4]
    ];
}


function ensureLayers(
    geojson
) {

    if (
        map.getSource(
            "territories"
        )
    ) {

        map
        .getSource(
            "territories"
        )
        .setData(
            geojson
        );

        map.setPaintProperty(
            "territories-fill",
            "fill-color",
            mapColorExpression()
        );

        return;
    }


    map.addSource(
        "territories",
        {
            type:
                "geojson",

            data:
                geojson
        }
    );


    map.addLayer({

        id:
            "territories-fill",

        type:
            "fill",

        source:
            "territories",

        paint: {

            "fill-color":
                mapColorExpression(),

            "fill-opacity":
                0.88
        }
    });


    map.addLayer({

        id:
            "territories-line",

        type:
            "line",

        source:
            "territories",

        paint: {

            "line-color":
                state.dark
                ?
                "#2c3440"
                :
                "#ffffff",

            "line-width":
                0.65
        }
    });


    map.addLayer({

        id:
            "territories-hover",

        type:
            "line",

        source:
            "territories",

        filter: [
            "==",
            [
                "get",
                "id"
            ],
            "__none__"
        ],

        paint: {

            "line-color":
                state.dark
                ?
                "#ffffff"
                :
                "#172033",

            "line-width":
                2.2
        }
    });


    map.on(
        "mousemove",
        "territories-fill",
        handleHover
    );


    map.on(
        "mouseleave",
        "territories-fill",

        () => {

            popup.remove();

            map.setFilter(
                "territories-hover",
                [
                    "==",
                    [
                        "get",
                        "id"
                    ],
                    "__none__"
                ]
            );

            map.getCanvas().style.cursor =
                "";
        }
    );


    map.on(
        "click",
        "territories-fill",
        handleMapClick
    );
}


/* ==========================================================
   HOVER
========================================================== */

function featureName(
    properties
) {

    return (
        properties.nm
        ||
        properties.mn
        ||
        properties.sg
        ||
        properties.id
    );
}


function handleHover(
    event
) {

    const feature =
        event.features?.[0];


    if (!feature)
        return;


    map.getCanvas().style.cursor =
        "pointer";


    const p =
        feature.properties;


    const id =
        String(
            p.id
        );


    map.setFilter(
        "territories-hover",
        [
            "==",
            [
                "get",
                "id"
            ],
            id
        ]
    );


    const total =
        Number.isFinite(
            p._total
        )
        ?
        p._total
        :
        null;


    const category =
        Number.isFinite(
            p._cat
        )
        ?
        p._cat
        :
        null;


    const percent =
        Number.isFinite(
            p._pct
        )
        ?
        p._pct
        :
        null;


    const metric =
        Number.isFinite(
            p._metric
        )
        ?
        p._metric
        :
        null;


    let metricRow =
        "";


    if (
        state.metric ===
        "share"
        &&
        Number.isFinite(
            metric
        )
    ) {

        metricRow = `

            <div class="popup-row">

                <span class="popup-label">
                    Participação na abrangência
                </span>

                <span class="popup-value">

                    ${
                        formatPercentAdaptive(
                            metric
                        )
                    }%

                </span>

            </div>
        `;
    }


    else if (
        Number.isFinite(
            percent
        )
    ) {

        metricRow = `

            <div class="popup-row">

                <span class="popup-label">
                    Percentual da categoria
                </span>

                <span class="popup-value">

                    ${
                        formatPercentAdaptive(
                            percent
                        )
                    }%

                </span>

            </div>
        `;
    }


    const totalRow =
        Number.isFinite(
            total
        )

        ?

        `

        <div class="popup-row">

            <span class="popup-label">
                Total de referência
            </span>

            <span class="popup-value">
                ${fmtInt.format(total)}
            </span>

        </div>
        `

        :

        "";


    const html = `

        <div class="popup-title">

            ${featureName(p)}

        </div>


        <div class="popup-row">

            <span class="popup-label">
                ${variableLabel(state.variable)}
            </span>

            <span class="popup-value">

                ${
                    Number.isFinite(
                        category
                    )
                    ?
                    formatDataValue(
                        category
                    )
                    :
                    "Sem dados"
                }

            </span>

        </div>


        ${metricRow}

        ${totalRow}
    `;


    popup
    .setLngLat(
        event.lngLat
    )
    .setHTML(
        html
    )
    .addTo(
        map
    );
}


/* ==========================================================
   CLICK MAP
========================================================== */

async function handleMapClick(
    event
) {

    const feature =
        event.features?.[0];


    if (!feature)
        return;


    const id =
        String(
            feature.properties.id
        );


    if (
        state.level ===
        "uf"
    ) {

        await showUF(
            id
        );

        return;
    }


    if (
        state.level ===
        "municipality"
    ) {

        await showMunicipality(
            id
        );

        return;
    }


    if (
        state.level ===
        "ap"
    ) {

        selectAP(
            id
        );

        fitToGeoJSON({
            type:
                "FeatureCollection",

            features:
                [feature]
        });

        renderCards();
        renderBreadcrumb();
    }
}


/* ==========================================================
   FIT BOUNDS
========================================================== */

function extendCoordinates(
    coordinates,
    bounds
) {

    if (
        typeof coordinates[0] ===
        "number"
    ) {

        bounds.extend(
            coordinates
        );

        return;
    }


    for (
        const child
        of coordinates
    ) {

        extendCoordinates(
            child,
            bounds
        );
    }
}


function fitToGeoJSON(
    geojson,
    padding = 35
) {

    if (
        !geojson ||
        !geojson.features?.length
    )
        return;


    const bounds =
        new maplibregl.LngLatBounds();


    for (
        const feature
        of geojson.features
    ) {

        if (
            feature.geometry
        ) {

            extendCoordinates(
                feature.geometry.coordinates,
                bounds
            );
        }
    }


    if (
        !bounds.isEmpty()
    ) {

        map.fitBounds(
            bounds,
            {
                padding:
                    padding,

                duration:
                    650,

                maxZoom:
                    state.level === "ap"
                    ?
                    12
                    :
                    9
            }
        );
    }
}


/* ==========================================================
   CARDS
========================================================== */

function currentParentValues() {

    if (
        state.selectedAP &&
        state.level === "ap"
    ) {

        return extractValues(
            state.currentData[
                state.selectedAP
            ]
        );
    }


    return extractValues(
        state.currentParentData
    );
}


function currentTerritoryName() {

    if (
        state.selectedAP &&
        state.level === "ap"
    ) {

        return (
            state.selectedAPName
            ||
            `AP ${state.selectedAP}`
        );
    }

    return (
        state.currentParentName
        ||
        "Brasil"
    );
}


function renderCards() {

    const values =
        currentParentValues();


    el.cardTerritory.textContent =
        currentTerritoryName();


    el.cardTotalLabel.textContent =
        "Total de referência";


    el.cardTotal.textContent =
        Number.isFinite(
            values.total
        )
        ?
        fmtInt.format(
            values.total
        )
        :
        "—";


    el.cardCategoryLabel.textContent =
        variableLabel(
            state.variable
        );


    el.cardCategory.textContent =
        Number.isFinite(
            values.category
        )
        ?
        formatDataValue(
            values.category
        )
        :
        "—";


    let percentual =
        values.percent;


    let rotulo =
        "Percentual da categoria";


    if (
        state.metric ===
        "share"
    ) {

        rotulo =
            "Participação na abrangência";


        if (
            state.selectedAP
        ) {

            const denominador =
                scopeCategoryTotal();


            percentual =
                (
                    Number.isFinite(
                        values.category
                    )
                    &&
                    Number.isFinite(
                        denominador
                    )
                    &&
                    denominador !== 0
                )

                ?

                (
                    values.category
                    /
                    denominador
                ) * 100

                :

                null;
        }


        else {

            percentual =
                null;
        }
    }


    else if (
        !metricAllowed(
            "percent",
            false
        )
    ) {

        percentual =
            null;


        rotulo =
            "Percentual não aplicável";
    }


    el.cardPercentLabel.textContent =
        rotulo;


    el.cardPercent.textContent =
        Number.isFinite(
            percentual
        )
        ?
        (
            formatPercentAdaptive(
                percentual
            )
            +
            "%"
        )
        :
        "—";
}


/* ==========================================================
   RANKING
========================================================== */

function rankingName(
    feature
) {

    const p =
        feature.properties;

    return (
        p.nm
        ||
        p.mn
        ||
        p.sg
        ||
        p.id
    );
}


function renderRanking(
    geojson
) {

    const rows =
        geojson.features
        .map(
            feature => {

                const p =
                    feature.properties;

                return {

                    id:
                        String(p.id),

                    name:
                        rankingName(
                            feature
                        ),

                    value:
                        Number(
                            p._metric
                        ),

                    feature:
                        feature
                };
            }
        )
        .filter(
            row =>
                Number.isFinite(
                    row.value
                )
        )
        .sort(
            (a, b) =>
                b.value -
                a.value
        );


    const maxValue =
        rows.length
        ?
        Math.max(
            ...rows.map(
                x => x.value
            )
        )
        :
        1;


    el.ranking.innerHTML =
        "";


    rows.forEach(
        (
            row,
            index
        ) => {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "rank-row";


            const width =
                maxValue > 0
                ?
                (
                    row.value /
                    maxValue
                ) * 100
                :
                0;


            div.innerHTML = `

                <div class="rank-top">

                    <span class="rank-position">

                        ${index + 1}.

                    </span>

                    <span
                        class="rank-name"
                        title="${row.name}"
                    >

                        ${row.name}

                    </span>

                    <span class="rank-value">

                        ${formatValue(row.value)}

                    </span>

                </div>

                <div class="rank-track">

                    <div
                        class="rank-bar"
                        style="width:${width}%"
                    ></div>

                </div>
            `;


            div.addEventListener(
                "click",

                async () => {

                    if (
                        state.level === "uf"
                    ) {

                        await showUF(
                            row.id
                        );
                    }

                    else if (
                        state.level ===
                        "municipality"
                    ) {

                        await showMunicipality(
                            row.id
                        );
                    }

                    else {

                        selectAP(
                            row.id
                        );

                        fitToGeoJSON({
                            type:
                                "FeatureCollection",

                            features:
                                [row.feature]
                        });

                        renderCards();
                        renderBreadcrumb();
                    }
                }
            );


            el.ranking.appendChild(
                div
            );
        }
    );
}


/* ==========================================================
   LEGENDA
========================================================== */

function renderLegend(
    breaks
) {

    let titulo;


    if (
        state.metric ===
        "absolute"
    ) {

        titulo =
            absoluteLegendTitle();
    }


    else if (
        state.metric ===
        "share"
    ) {

        titulo =
            "Participação na abrangência";
    }


    else {

        titulo =
            "Percentual da categoria";
    }


    let html = `

        <div class="legend-title">

            ${titulo}

        </div>
    `;


    if (
        breaks.length === 2
        &&
        breaks[0] ===
        breaks[1]
    ) {

        html += `

            <div class="legend-item">

                <span
                    class="legend-color"
                    style="background:${COLORS[2]}"
                ></span>

                <span>

                    ${formatValue(breaks[0])}

                </span>

            </div>
        `;
    }


    else {

        for (
            let i = 0;
            i < breaks.length - 1;
            i++
        ) {

            html += `

                <div class="legend-item">

                    <span
                        class="legend-color"
                        style="background:${COLORS[i]}"
                    ></span>

                    <span>

                        ${formatValue(breaks[i])}
                        –
                        ${formatValue(breaks[i + 1])}

                    </span>

                </div>
            `;
        }
    }


    html += `

        <div class="legend-item legend-missing">

            <span
                class="legend-color missing-data-color"
                style="background:${
                    state.dark
                    ?
                    MISSING_DARK
                    :
                    MISSING_LIGHT
                }"
            ></span>

            <span>
                Sem dados
            </span>

        </div>
    `;


    el.legend.innerHTML =
        html;
}


/* ==========================================================
   SUBTÍTULOS
========================================================== */

function renderSubtitles() {

    const variable =
        variableLabel(
            state.variable
        );


    const abrangencia =
        scopeName();


    const unidade =
        currentUnitLabel();


    el.mapSubtitle.textContent =
        `${variable} · ${abrangencia}`;


    el.rankingSubtitle.textContent =
        `${unidade} · ${variable}`;
}


/* ==========================================================
   BREADCRUMB
========================================================== */

function renderBreadcrumb() {

    const parts =
        [
            "Brasil"
        ];


    if (
        state.selectedUFName
    ) {

        parts.push(
            state.selectedUFName
        );
    }


    if (
        state.selectedMunicipalityName
    ) {

        parts.push(
            state.selectedMunicipalityName
        );
    }


    if (
        state.selectedAP
    ) {

        parts.push(
            state.selectedAPName
            ||
            `AP ${state.selectedAP}`
        );
    }


    el.breadcrumb.textContent =
        parts.join(
            " › "
        );


    el.back.disabled =
        (
            state.scope ===
            "brazil"
            &&
            !state.selectedAP
        );
}


/* ==========================================================
   RENDER PRINCIPAL
========================================================== */

function renderCurrent() {

    syncMetricButtons();


    const attached =
        attachData(
            state.currentGeo,
            state.currentData
        );


    /*
       % abrangência:

       valor da categoria na AP
       -------------------------
       valor da categoria na abrangência
    */

    if (
        state.metric ===
        "share"
    ) {

        const denominator =
            scopeCategoryTotal();


        const metrics =
            [];


        for (
            const feature
            of attached.geojson.features
        ) {

            const category =
                feature.properties._cat;


            const value =
                (
                    Number.isFinite(
                        category
                    )
                    &&
                    Number.isFinite(
                        denominator
                    )
                    &&
                    denominator !== 0
                )

                ?

                (
                    category
                    /
                    denominator
                ) * 100

                :

                null;


            feature.properties._metric =
                value;


            if (
                Number.isFinite(
                    value
                )
            ) {

                metrics.push(
                    value
                );
            }
        }


        attached.breaks =
            jenks(
                metrics,
                5
            );


        for (
            const feature
            of attached.geojson.features
        ) {

            feature.properties._class =
                classForValue(

                    feature.properties._metric,

                    attached.breaks
                );
        }
    }


    state.currentRenderedGeo =
        attached.geojson;


    ensureLayers(
        attached.geojson
    );


    renderLegend(
        attached.breaks
    );


    renderRanking(
        attached.geojson
    );


    renderCards();

    renderBreadcrumb();

    renderSubtitles();

    renderCoverageNotice();
}


/* ==========================================================
   POPULAR SELECTS
========================================================== */

function populateVariables() {

    el.variable.innerHTML =
        "";


    const variables =
        state.meta.variables
        .filter(
            item =>
                item.subblock ===
                state.subblock
        );


    for (
        const variable
        of variables
    ) {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            variable.id;


        option.textContent =
            variable.label;


        el.variable.appendChild(
            option
        );
    }


    state.variable =
        variables[0]
        ?.id
        ||
        null;


    el.variable.value =
        state.variable
        ||
        "";
}


function populateUFs() {

    el.uf.innerHTML =
        '<option value="">Brasil</option>';


    const entries =
        state.ufGeo.features
        .map(
            feature => ({

                id:
                    String(
                        feature.properties.id
                    ),

                name:
                    feature.properties.nm
            })
        )
        .sort(
            (a, b) =>
                a.name.localeCompare(
                    b.name,
                    "pt-BR"
                )
        );


    for (
        const row
        of entries
    ) {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            row.id;


        option.textContent =
            row.name;


        el.uf.appendChild(
            option
        );
    }
}


function populateMunicipalities(
    geojson
) {

    el.municipality.innerHTML =
        '<option value="">Todos</option>';


    const entries =
        geojson.features
        .map(
            feature => ({
                id:
                    String(
                        feature.properties.id
                    ),

                name:
                    feature.properties.nm
            })
        )
        .sort(
            (a, b) =>
                a.name.localeCompare(
                    b.name,
                    "pt-BR"
                )
        );


    for (
        const row
        of entries
    ) {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            row.id;

        option.textContent =
            row.name;

        el.municipality.appendChild(
            option
        );
    }


    el.municipality.disabled =
        false;
}


/* ==========================================================
   BRASIL
========================================================== */

async function showBrazil(
    unit = "uf"
) {

    loading(true);


    try {

        const unidade =
            normalizeUnitForScope(
                unit,
                "brazil"
            );


        if (
            unidade ===
            "ap"
        ) {

            await loadBrazilAreaAssets();
        }


        state.scope =
            "brazil";


        state.level =
            unidade;


        state.selectedUF =
            null;

        state.selectedUFName =
            null;

        state.selectedMunicipality =
            null;

        state.selectedMunicipalityName =
            null;

        state.selectedAP =
            null;

        state.selectedAPName =
            null;


        if (
            unidade ===
            "uf"
        ) {

            state.currentGeo =
                state.ufGeo;


            state.currentData =
                state.ufData;
        }


        else {

            state.currentGeo =
                state.cache
                .allAreaGeo;


            state.currentData =
                state.cache
                .allAreaData;
        }


        state.currentParentData =
            state.brazilData.BR;


        state.currentParentName =
            "Brasil";


        el.uf.value =
            "";


        el.municipality.innerHTML =
            '<option value="">Todos</option>';


        el.municipality.disabled =
            true;


        syncViewControls();

        renderCurrent();


        fitToGeoJSON(
            state.currentGeo,
            20
        );
    }


    finally {

        loading(false);
    }
}


/* ==========================================================
   UF
========================================================== */

async function loadUFAssets(
    uf
) {

    if (
        !state.cache
        .municipalityGeo[uf]
    ) {

        state.cache
        .municipalityGeo[uf] =
            await loadJSON(

                PATHS
                .municipalitiesGeo(
                    uf
                )
            );
    }


    if (
        !state.cache
        .municipalityData[uf]
    ) {

        state.cache
        .municipalityData[uf] =
            await loadJSON(

                PATHS
                .municipalitiesData(
                    state.blockSlug,
                    uf
                )
            );
    }
}


async function showUF(
    uf,
    unit = "municipality"
) {

    loading(true);


    try {

        if (
            state.scope ===
            "brazil"
        ) {

            state.returnBrazilUnit =
                state.level;
        }


        await loadUFAssets(
            uf
        );


        const unidade =
            normalizeUnitForScope(
                unit,
                "uf"
            );


        if (
            unidade ===
            "ap"
        ) {

            await loadAreaAssets(
                uf
            );
        }


        state.scope =
            "uf";


        state.level =
            unidade;


        state.selectedUF =
            uf;


        state.selectedMunicipality =
            null;

        state.selectedMunicipalityName =
            null;

        state.selectedAP =
            null;

        state.selectedAPName =
            null;


        const ufFeature =
            state.ufGeo.features
            .find(
                f =>
                    String(
                        f.properties.id
                    ) ===
                    uf
            );


        state.selectedUFName =
            ufFeature
            ?
            ufFeature.properties.nm
            :
            uf;


        if (
            unidade ===
            "municipality"
        ) {

            state.currentGeo =
                state.cache
                .municipalityGeo[uf];


            state.currentData =
                state.cache
                .municipalityData[uf];
        }


        else {

            state.currentGeo =
                state.cache
                .areaGeo[uf];


            state.currentData =
                state.cache
                .areaData[uf];
        }


        state.currentParentData =
            state.ufData[uf];


        state.currentParentName =
            state.selectedUFName;


        el.uf.value =
            uf;


        populateMunicipalities(
            state.cache
                .municipalityGeo[uf]
        );


        syncViewControls();

        renderCurrent();


        fitToGeoJSON(
            state.currentGeo,
            35
        );
    }


    finally {

        loading(false);
    }
}


/* ==========================================================
   MUNICÍPIO
========================================================== */

async function loadAreaAssets(
    uf
) {

    if (
        !state.cache
        .areaGeo[uf]
    ) {

        state.cache
        .areaGeo[uf] =
            await loadJSON(

                PATHS
                .areasGeo(
                    uf
                )
            );
    }


    if (
        !state.cache
        .areaData[uf]
    ) {

        state.cache
        .areaData[uf] =
            await loadJSON(

                PATHS
                .areasData(
                    state.blockSlug,
                    uf
                )
            );
    }
}


async function showMunicipality(
    municipality
) {

    const uf =
        state.selectedUF;


    if (!uf)
        return;


    loading(true);


    try {

        if (
            state.scope === "uf"
        ) {

            state.returnUFUnit =
                state.level === "ap"
                ?
                "ap"
                :
                "municipality";
        }


        await loadUFAssets(
            uf
        );


        await loadAreaAssets(
            uf
        );


        const allGeo =
            state.cache
            .areaGeo[uf];


        const filteredFeatures =
            allGeo.features
            .filter(
                f =>
                    String(
                        f.properties.mun
                    ) ===
                    municipality
            );


        const geo = {

            type:
                "FeatureCollection",

            features:
                filteredFeatures
        };


        const allData =
            state.cache
            .areaData[uf];


        const filteredData =
            {};


        for (
            const feature
            of filteredFeatures
        ) {

            const id =
                String(
                    feature.properties.id
                );


            if (
                Object.prototype
                .hasOwnProperty
                .call(
                    allData,
                    id
                )
            ) {

                filteredData[id] =
                    allData[id];
            }
        }


        const muniFeature =
            state.cache
            .municipalityGeo[uf]
            .features
            .find(
                f =>
                    String(
                        f.properties.id
                    ) ===
                    municipality
            );


        state.scope =
            "municipality";


        state.level =
            "ap";


        state.selectedMunicipality =
            municipality;


        state.selectedMunicipalityName =
            muniFeature
            ?
            muniFeature.properties.nm
            :
            municipality;


        state.selectedAP =
            null;

        state.selectedAPName =
            null;


        state.currentGeo =
            geo;


        state.currentData =
            filteredData;


        state.currentParentData =
            state.cache
            .municipalityData[uf][
                municipality
            ];


        state.currentParentName =
            state.selectedMunicipalityName;


        el.uf.value =
            uf;


        el.municipality.value =
            municipality;


        syncViewControls();


        renderCurrent();


        fitToGeoJSON(
            geo,
            38
        );
    }

    finally {

        loading(false);
    }
}


/* ==========================================================
   AP
========================================================== */

function selectAP(
    id
) {

    state.selectedAP =
        id;


    const feature =
        state.currentGeo.features
        .find(
            f =>
                String(
                    f.properties.id
                ) ===
                id
        );


    state.selectedAPName =
        feature
        ?
        (
            feature.properties.nm
            ||
            `AP ${id}`
        )
        :
        `AP ${id}`;
}


/* ==========================================================
   BACK
========================================================== */

async function goBack() {

    if (
        state.selectedAP
    ) {

        state.selectedAP =
            null;


        state.selectedAPName =
            null;


        renderCurrent();


        const padding =
            state.scope ===
            "brazil"
            ?
            20
            :
            (
                state.scope ===
                "uf"
                ?
                35
                :
                38
            );


        fitToGeoJSON(
            state.currentGeo,
            padding
        );


        return;
    }


    if (
        state.scope ===
        "municipality"
    ) {

        await showUF(

            state.selectedUF,

            normalizeUnitForScope(
                state.returnUFUnit
                ||
                "municipality",
                "uf"
            )
        );


        return;
    }


    if (
        state.scope ===
        "uf"
    ) {

        await showBrazil(

            normalizeUnitForScope(
                state.returnBrazilUnit
                ||
                "uf",
                "brazil"
            )
        );
    }
}


/* ==========================================================
   TEMA
========================================================== */

function applyTheme() {

    document.body.classList.toggle(
        "dark",
        state.dark
    );


    el.theme.textContent =
        state.dark
        ?
        "☀"
        :
        "☾";


    if (
        map.getLayer(
            "background"
        )
    ) {

        map.setPaintProperty(
            "background",
            "background-color",
            state.dark
            ?
            "#11151b"
            :
            "#eef1f4"
        );
    }


    if (
        map.getLayer(
            "territories-fill"
        )
    ) {

        map.setPaintProperty(
            "territories-fill",
            "fill-color",
            mapColorExpression()
        );


        map.setPaintProperty(
            "territories-line",
            "line-color",
            state.dark
            ?
            "#303946"
            :
            "#ffffff"
        );


        map.setPaintProperty(
            "territories-hover",
            "line-color",
            state.dark
            ?
            "#ffffff"
            :
            "#172033"
        );
    }


    if (
        state.currentRenderedGeo
    ) {

        const metrics =
            state.currentRenderedGeo
            .features
            .map(
                f =>
                    Number(
                        f.properties._metric
                    )
            )
            .filter(
                Number.isFinite
            );


        renderLegend(
            jenks(
                metrics,
                5
            )
        );
    }
}




/* ==========================================================
   RECURSOS V3
   Downloads + metodologia
   ========================================================== */


const v3UI = {

    tabPanel:
        document.getElementById(
            "tabPanelButton"
        ),

    tabMethod:
        document.getElementById(
            "tabMethodButton"
        ),

    methodology:
        document.getElementById(
            "methodologyPane"
        ),

    closeMethodology:
        document.getElementById(
            "closeMethodologyBtn"
        ),

    methodologySearch:
        document.getElementById(
            "methodologySearch"
        ),

    methodologyVariables:
        document.getElementById(
            "methodologyVariables"
        ),

    methodologyVariableCount:
        document.getElementById(
            "methodologyVariableCount"
        ),

    downloadFilters:
        document.getElementById(
            "downloadFiltersBtn"
        ),

    downloadData:
        document.getElementById(
            "downloadDataBtn"
        )
};


let methodologyMetaCache =
    null;


function escapeHTML(
    value
) {

    return String(
        value
        ??
        ""
    )
    .replaceAll(
        "&",
        "&amp;"
    )
    .replaceAll(
        "<",
        "&lt;"
    )
    .replaceAll(
        ">",
        "&gt;"
    )
    .replaceAll(
        '"',
        "&quot;"
    )
    .replaceAll(
        "'",
        "&#039;"
    );
}


function slugFileName(
    value
) {

    return String(
        value
        ||
        "dados"
    )
    .normalize(
        "NFD"
    )
    .replace(
        /[\u0300-\u036f]/g,
        ""
    )
    .toLowerCase()
    .replace(
        /[^a-z0-9]+/g,
        "_"
    )
    .replace(
        /^_+|_+$/g,
        ""
    );
}


function downloadBlob(
    content,
    filename,
    mime
) {

    const blob =
        new Blob(
            [
                content
            ],
            {
                type:
                    mime
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const anchor =
        document.createElement(
            "a"
        );


    anchor.href =
        url;


    anchor.download =
        filename;


    document.body.appendChild(
        anchor
    );


    anchor.click();


    anchor.remove();


    setTimeout(
        () =>
            URL.revokeObjectURL(
                url
            ),
        1000
    );
}


function downloadCurrentFilters() {

    const variable =
        currentVariableMeta();


    const block =
        state.manifest.blocks
        .find(
            item =>
                item.slug ===
                state.blockSlug
        );


    const payload = {

        painel:
            "Censo Demográfico 2022 — Áreas de Ponderação",

        gerado_em:
            new Date()
            .toISOString(),

        bloco: {

            slug:
                state.blockSlug,

            nome:
                block
                ?.label
                ||
                state.blockSlug
        },

        subbloco: {

            codigo:
                state.subblock,

            nome:
                friendlySubblockLabel(
                    state.subblock
                )
        },

        variavel: {

            id:
                state.variable,

            nome:
                variable
                ?.label
                ||
                "",

            tabela:
                variable
                ?.table
                ||
                "",

            coluna_origem:
                variable
                ?.column
                ||
                ""
        },

        metrica:
            state.metric,

        abrangencia:
            state.scope,

        unidade_exibida:
            state.level,

        uf: {

            codigo:
                state.selectedUF,

            nome:
                state.selectedUFName
        },

        municipio: {

            codigo:
                state.selectedMunicipality,

            nome:
                state.selectedMunicipalityName
        },

        area_ponderacao: {

            codigo:
                state.selectedAP,

            nome:
                state.selectedAPName
        }
    };


    downloadBlob(

        JSON.stringify(
            payload,
            null,
            2
        ),

        "filtros_"
        +
        slugFileName(
            state.blockSlug
        )
        +
        "_"
        +
        slugFileName(
            variable
            ?.label
        )
        +
        ".json",

        "application/json;charset=utf-8"
    );
}


function rawRecordValue(
    record,
    index
) {

    if (
        !record
        ||
        index === null
        ||
        index === undefined
        ||
        index < 0
        ||
        index >= record.length
    ) {

        return null;
    }


    const value =
        record[index];


    return (
        value === null
        ||
        value === undefined
    )
    ?
    null
    :
    value;
}


function csvText(
    value
) {

    if (
        value === null
        ||
        value === undefined
    ) {

        return "";
    }


    const text =
        String(
            value
        );


    return (
        '"'
        +
        text.replaceAll(
            '"',
            '""'
        )
        +
        '"'
    );
}


function csvRawNumber(
    value
) {

    if (
        value === null
        ||
        value === undefined
    ) {

        return "";
    }


    const number =
        Number(
            value
        );


    if (
        !Number.isFinite(
            number
        )
    ) {

        return "";
    }


    /*
       Sem arredondamento.

       Apenas trocamos o separador decimal para vírgula,
       porque o arquivo usa ; como separador de colunas e
       foi pensado para abertura no Excel pt-BR.
    */

    return String(
        number
    ).replace(
        ".",
        ","
    );
}


function downloadCurrentData() {

    const variable =
        currentVariableMeta();


    if (
        !variable
        ||
        !state.currentRenderedGeo
    ) {

        return;
    }


    const scopeDenominator =
        scopeCategoryTotal();


    const block =
        state.manifest.blocks
        .find(
            item =>
                item.slug ===
                state.blockSlug
        );


    const header = [

        "codigo",
        "territorio",
        "abrangencia",
        "unidade_exibida",
        "bloco",
        "subbloco",
        "tabela",
        "id_variavel",
        "variavel",
        "tipo_medida",
        "regra_agregacao",
        "valor_original",
        "total_referencia_original",
        "percentual_categoria_calculado",
        "percentual_abrangencia_calculado",
        "sem_dados"
    ];


    const lines =
        [
            header.join(
                ";"
            )
        ];


    for (
        const feature
        of state.currentRenderedGeo.features
    ) {

        const p =
            feature.properties;


        const record =
            p._record
            ??
            null;


        const rawValue =
            rawRecordValue(
                record,
                variable.field
            );


        const rawTotal =
            rawRecordValue(
                record,
                variable.denominator_field
            );


        const categoryNumber =
            rawValue === null
            ?
            null
            :
            Number(
                rawValue
            );


        const totalNumber =
            rawTotal === null
            ?
            null
            :
            Number(
                rawTotal
            );


        const categoryPercent =

            variable.metrics
            ?.category_percent
            === true

            ?

            safeCategoryPercent(
                categoryNumber,
                totalNumber
            )

            :

            null;


        let scopePercent =
            null;


        if (
            variable.metrics
            ?.scope_percent
            === true
            &&
            state.level ===
            "ap"
            &&
            Number.isFinite(
                categoryNumber
            )
            &&
            Number.isFinite(
                scopeDenominator
            )
            &&
            scopeDenominator !== 0
        ) {

            scopePercent =

                (
                    categoryNumber
                    /
                    scopeDenominator
                )
                *
                100;
        }


        const row = [

            csvText(
                p.id
            ),

            csvText(
                rankingName(
                    feature
                )
            ),

            csvText(
                scopeName()
            ),

            csvText(
                currentUnitLabel()
            ),

            csvText(
                block
                ?.label
                ||
                state.blockSlug
            ),

            csvText(
                friendlySubblockLabel(
                    state.subblock
                )
            ),

            csvText(
                variable.table
            ),

            csvText(
                variable.id
            ),

            csvText(
                variable.label
            ),

            csvText(
                variable.type
            ),

            csvText(
                variable.aggregation
            ),

            csvRawNumber(
                rawValue
            ),

            csvRawNumber(
                rawTotal
            ),

            csvRawNumber(
                categoryPercent
            ),

            csvRawNumber(
                scopePercent
            ),

            csvText(
                rawValue === null
                ?
                "Sim"
                :
                "Não"
            )
        ];


        lines.push(
            row.join(
                ";"
            )
        );
    }


    const csv =

        "\uFEFF"
        +
        lines.join(
            "\r\n"
        );


    downloadBlob(

        csv,

        "dados_"
        +
        slugFileName(
            state.blockSlug
        )
        +
        "_"
        +
        slugFileName(
            variable.label
        )
        +
        "_"
        +
        slugFileName(
            scopeName()
        )
        +
        ".csv",

        "text/csv;charset=utf-8"
    );
}


function showPanelTab() {

    v3UI.methodology.hidden =
        true;


    v3UI.tabPanel
        .classList.add(
            "active"
        );


    v3UI.tabMethod
        .classList.remove(
            "active"
        );


    document.body
        .classList.remove(
            "methodology-open"
        );


    /*
       MapLibre precisa recalcular as dimensões
       depois que a aba reaparece.
    */

    setTimeout(
        () => {

            if (
                typeof map !==
                "undefined"
            ) {

                map.resize();
            }
        },
        30
    );
}


async function showMethodologyTab() {

    v3UI.methodology.hidden =
        false;


    v3UI.tabPanel
        .classList.remove(
            "active"
        );


    v3UI.tabMethod
        .classList.add(
            "active"
        );


    document.body
        .classList.add(
            "methodology-open"
        );


    await ensureMethodologyDictionary();
}


async function ensureMethodologyDictionary() {

    if (
        methodologyMetaCache ===
        null
    ) {

        const blocks =

            [
                ...state.manifest.blocks
            ]
            .sort(
                (a, b) =>
                    a.order -
                    b.order
            );


        const metas =

            await Promise.all(

                blocks.map(
                    block =>
                        loadJSON(
                            PATHS.blockMeta(
                                block.slug
                            )
                        )
                )
            );


        methodologyMetaCache =
            [];


        for (
            let i = 0;
            i < blocks.length;
            i++
        ) {

            const block =
                blocks[i];


            const meta =
                metas[i];


            for (
                const variable
                of meta.variables
            ) {

                methodologyMetaCache.push({

                    blockOrder:
                        block.order,

                    block:
                        block.label,

                    blockSlug:
                        block.slug,

                    ...variable
                });
            }
        }
    }


    renderMethodologyDictionary(
        v3UI.methodologySearch
        ?.value
        ||
        ""
    );
}


function metricText(
    variable
) {

    const itens =
        [];


    if (
        variable.metrics
        ?.absolute
        !== false
    ) {

        itens.push(
            "Absoluto"
        );
    }


    if (
        variable.metrics
        ?.category_percent
        === true
    ) {

        itens.push(
            "% categoria"
        );
    }


    if (
        variable.metrics
        ?.scope_percent
        === true
    ) {

        itens.push(
            "% abrangência"
        );
    }


    return itens.join(
        " · "
    );
}


function aggregationText(
    variable
) {

    const map = {

        "SOMA":
            "Soma",

        "MÉDIA_PONDERADA":
            "Média ponderada",

        "AP_SOMENTE":
            "Somente Área de Ponderação"
    };


    return (
        map[
            variable.aggregation
        ]
        ||
        variable.aggregation
    );
}


function renderMethodologyDictionary(
    search
) {

    if (
        !methodologyMetaCache
    ) {

        return;
    }


    const termo =
        String(
            search
            ||
            ""
        )
        .trim()
        .toLocaleLowerCase(
            "pt-BR"
        );


    const rows =

        methodologyMetaCache
        .filter(
            item => {

                if (!termo) {

                    return true;
                }


                const texto =

                    [
                        item.block,
                        item.subblock,
                        item.label,
                        item.table,
                        item.type,
                        item.column,
                        item.methodological_note
                    ]
                    .join(
                        " "
                    )
                    .toLocaleLowerCase(
                        "pt-BR"
                    );


                return texto.includes(
                    termo
                );
            }
        );


    v3UI.methodologyVariableCount
        .textContent =

            `${rows.length} de `
            +
            `${methodologyMetaCache.length} variáveis`;


    const html = `

        <table class="dictionary-table">

            <thead>

                <tr>

                    <th>Bloco</th>

                    <th>Subbloco</th>

                    <th>Variável</th>

                    <th>Tabela</th>

                    <th>Tipo</th>

                    <th>Agregação</th>

                    <th>Métricas</th>

                    <th>Composição / observação</th>

                </tr>

            </thead>

            <tbody>

                ${
                    rows.map(
                        variable => {

                            const componentes =

                                variable.derived
                                ?
                                (
                                    "Derivada de: "
                                    +
                                    variable.components.join(
                                        " + "
                                    )
                                )
                                :
                                "";


                            const nota =
                                variable.methodological_note
                                ||
                                "";


                            const observacao =
                                [
                                    componentes,
                                    nota
                                ]
                                .filter(
                                    Boolean
                                )
                                .join(
                                    " — "
                                );


                            const subblock =

                                variable.blockSlug ===
                                "moradia"

                                ?

                                (() => {

                                    const labels = {

                                        "T1_1":
                                            "Domicílios — condição de ocupação",

                                        "T1_2":
                                            "Domicílios — material das paredes externas",

                                        "T1_3":
                                            "Domicílios — moradores por dormitório",

                                        "T1_4":
                                            "Domicílios — conexão domiciliar à internet",

                                        "T1_5":
                                            "Moradores — condição de ocupação do domicílio",

                                        "T1_6":
                                            "Moradores — material das paredes externas",

                                        "T1_7":
                                            "Moradores — moradores por dormitório",

                                        "T1_8":
                                            "Moradores — conexão domiciliar à internet"
                                    };


                                    return (
                                        labels[
                                            variable.table
                                        ]
                                        ||
                                        variable.subblock
                                    );
                                })()

                                :

                                variable.subblock;


                            return `

                                <tr>

                                    <td>
                                        ${escapeHTML(variable.block)}
                                    </td>

                                    <td>
                                        ${escapeHTML(subblock)}
                                    </td>

                                    <td>
                                        <strong>
                                            ${escapeHTML(variable.label)}
                                        </strong>
                                    </td>

                                    <td>
                                        ${escapeHTML(variable.table)}
                                    </td>

                                    <td>
                                        ${escapeHTML(variable.type)}
                                    </td>

                                    <td>
                                        ${escapeHTML(
                                            aggregationText(
                                                variable
                                            )
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHTML(
                                            metricText(
                                                variable
                                            )
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHTML(observacao)}
                                    </td>

                                </tr>
                            `;
                        }
                    ).join(
                        ""
                    )
                }

            </tbody>

        </table>
    `;


    v3UI.methodologyVariables
        .innerHTML =
            html;
}


/* ----------------------------------------------------------
   Eventos V3
---------------------------------------------------------- */


v3UI.downloadFilters
?.addEventListener(

    "click",

    downloadCurrentFilters
);


v3UI.downloadData
?.addEventListener(

    "click",

    downloadCurrentData
);


v3UI.tabPanel
?.addEventListener(

    "click",

    showPanelTab
);


v3UI.closeMethodology
?.addEventListener(

    "click",

    showPanelTab
);


v3UI.tabMethod
?.addEventListener(

    "click",

    showMethodologyTab
);


v3UI.methodologySearch
?.addEventListener(

    "input",

    () => {

        renderMethodologyDictionary(
            v3UI.methodologySearch.value
        );
    }
);


/* ==========================================================
   NAVEGAÇÃO / MÉTRICAS / EVENTOS — FRONTEND V2
   ========================================================== */


function allUFIds() {

    return state.ufGeo.features
        .map(
            f =>
                String(
                    f.properties.id
                )
        );
}


async function loadBrazilAreaAssets() {

    if (
        state.cache.allAreaGeo
        &&
        state.cache.allAreaData
    ) {

        return;
    }


    const ufs =
        allUFIds();


    const TAMANHO_LOTE =
        4;


    for (
        let i = 0;
        i < ufs.length;
        i += TAMANHO_LOTE
    ) {

        const lote =
            ufs.slice(
                i,
                i + TAMANHO_LOTE
            );


        await Promise.all(

            lote.map(
                uf =>
                    loadAreaAssets(
                        uf
                    )
            )
        );
    }


    /*
       Geometria pode ser reutilizada
       entre todos os blocos.
    */

    if (
        !state.cache
        .allAreaGeo
    ) {

        const features =
            [];


        for (
            const uf
            of ufs
        ) {

            const geo =
                state.cache
                .areaGeo[uf];


            if (
                geo
                &&
                Array.isArray(
                    geo.features
                )
            ) {

                features.push(
                    ...geo.features
                );
            }
        }


        state.cache.allAreaGeo = {

            type:
                "FeatureCollection",

            features:
                features
        };
    }


    /*
       Dados temáticos são reconstruídos
       a cada troca de bloco.
    */

    const dados =
        {};


    for (
        const uf
        of ufs
    ) {

        Object.assign(
            dados,
            state.cache
            .areaData[uf]
            ||
            {}
        );
    }


    state.cache.allAreaData =
        dados;
}


function scopeCategoryTotal() {

    if (
        !state.currentParentData
    ) {

        return null;
    }


    const values =
        extractValues(
            state.currentParentData
        );


    return Number.isFinite(
        values.category
    )
    ?
    values.category
    :
    null;
}


function scopeName() {

    if (
        state.scope ===
        "brazil"
    ) {

        return "Brasil";
    }


    if (
        state.scope ===
        "uf"
    ) {

        return (
            state.selectedUFName
            ||
            "Estado"
        );
    }


    return (
        state.selectedMunicipalityName
        ||
        "Município"
    );
}


function metricDescriptor() {

    if (
        state.metric ===
        "share"
    ) {

        return "% abrangência";
    }


    if (
        state.metric ===
        "percent"
    ) {

        return "% categoria";
    }


    return "Absoluto";
}


function fitPaddingForScope() {

    if (
        state.scope ===
        "brazil"
    ) {

        return 20;
    }


    if (
        state.scope ===
        "uf"
    ) {

        return 35;
    }


    return 38;
}


function syncMetricButtons() {

    const variable =
        currentVariableMeta();


    const percentAvailable =
        variable
        ?.metrics
        ?.category_percent
        === true;


    const shareAvailable =
        (
            variable
            ?.metrics
            ?.scope_percent
            === true
            &&
            state.level ===
            "ap"
        );


    el.metricAbsolute.disabled =
        false;


    el.metricPercent.disabled =
        !percentAvailable;


    el.metricShare.disabled =
        !shareAvailable;


    if (
        state.metric ===
        "percent"
        &&
        !percentAvailable
    ) {

        state.metric =
            "absolute";
    }


    if (
        state.metric ===
        "share"
        &&
        !shareAvailable
    ) {

        state.metric =
            "absolute";
    }


    el.metricAbsolute
        .classList.toggle(
            "active",
            state.metric ===
            "absolute"
        );


    el.metricPercent
        .classList.toggle(
            "active",
            state.metric ===
            "percent"
        );


    el.metricShare
        .classList.toggle(
            "active",
            state.metric ===
            "share"
        );
}


function syncViewControls() {

    const options =
        availableUnitsForScope(
            state.scope
        );


    el.unit.innerHTML =
        options
        .map(
            ([value, label]) =>
                `<option value="${value}">${label}</option>`
        )
        .join("");


    el.unit.value =
        state.level;


    el.scopeIndicator.textContent =
        scopeName();


    syncMetricButtons();
}


/* ----------------------------------------------------------
   BLOCO
---------------------------------------------------------- */

el.block.addEventListener(

    "change",

    async () => {

        await switchBlock(
            el.block.value
        );
    }
);


/* ----------------------------------------------------------
   SUBBLOCO
---------------------------------------------------------- */

el.subblock.addEventListener(

    "change",

    async () => {

        state.subblock =
            el.subblock.value;


        populateVariables();


        await applyVariableSelection();
    }
);


/* ----------------------------------------------------------
   VARIÁVEL
---------------------------------------------------------- */

el.variable.addEventListener(

    "change",

    async () => {

        state.variable =
            el.variable.value;


        await applyVariableSelection();
    }
);


/* ----------------------------------------------------------
   MÉTRICA ABSOLUTA
---------------------------------------------------------- */

el.metricAbsolute.addEventListener(

    "click",

    () => {

        state.metric =
            "absolute";


        syncMetricButtons();

        renderCurrent();
    }
);


/* ----------------------------------------------------------
   % CATEGORIA
---------------------------------------------------------- */

el.metricPercent.addEventListener(

    "click",

    () => {

        if (
            el.metricPercent.disabled
        ) {

            return;
        }


        state.metric =
            "percent";


        syncMetricButtons();

        renderCurrent();
    }
);


/* ----------------------------------------------------------
   % ABRANGÊNCIA
---------------------------------------------------------- */

el.metricShare.addEventListener(

    "click",

    () => {

        if (
            el.metricShare.disabled
        ) {

            return;
        }


        state.metric =
            "share";


        syncMetricButtons();

        renderCurrent();
    }
);


/* ----------------------------------------------------------
   UNIDADE EXIBIDA
---------------------------------------------------------- */

el.unit.addEventListener(

    "change",

    async () => {

        const unit =
            el.unit.value;


        if (
            state.scope ===
            "brazil"
        ) {

            await showBrazil(
                unit
            );


            return;
        }


        if (
            state.scope ===
            "uf"
        ) {

            await showUF(
                state.selectedUF,
                unit
            );


            return;
        }


        await showMunicipality(
            state.selectedMunicipality
        );
    }
);


/* ----------------------------------------------------------
   UF
---------------------------------------------------------- */

el.uf.addEventListener(

    "change",

    async () => {

        const uf =
            String(
                el.uf.value
                ||
                ""
            );


        if (!uf) {

            const unit =
                normalizeUnitForScope(

                    state.level ===
                    "ap"
                    ?
                    "ap"
                    :
                    (
                        state.returnBrazilUnit
                        ||
                        "uf"
                    ),

                    "brazil"
                );


            await showBrazil(
                unit
            );


            return;
        }


        const requested =
            (
                state.level ===
                "ap"
            )
            ?
            "ap"
            :
            "municipality";


        await showUF(

            uf,

            normalizeUnitForScope(
                requested,
                "uf"
            )
        );
    }
);


/* ----------------------------------------------------------
   MUNICÍPIO
---------------------------------------------------------- */

el.municipality.addEventListener(

    "change",

    async () => {

        const municipality =
            String(
                el.municipality.value
                ||
                ""
            );


        if (!municipality) {

            if (
                !state.selectedUF
            ) {

                return;
            }


            const requested =
                state.returnUFUnit
                ||
                (
                    state.level ===
                    "ap"
                    ?
                    "ap"
                    :
                    "municipality"
                );


            await showUF(

                state.selectedUF,

                normalizeUnitForScope(
                    requested,
                    "uf"
                )
            );


            return;
        }


        await showMunicipality(
            municipality
        );
    }
);


/* ----------------------------------------------------------
   VOLTAR
---------------------------------------------------------- */

el.back.addEventListener(
    "click",
    goBack
);


/* ----------------------------------------------------------
   TEMA
---------------------------------------------------------- */

el.theme.addEventListener(

    "click",

    () => {

        state.dark =
            !state.dark;


        applyTheme();
    }
);


/* ==========================================================
   INIT
========================================================== */

async function init() {

    loading(true);


    try {

        const [
            manifest,
            ufGeo
        ] =
        await Promise.all([

            loadJSON(
                PATHS.manifest
            ),

            loadJSON(
                PATHS.ufGeo
            )
        ]);


        if (
            manifest.schema_version !== 2
        ) {

            throw new Error(
                "Manifest V2 inválido."
            );
        }


        state.manifest =
            manifest;


        state.ufGeo =
            ufGeo;


        populateBlocks();

        populateUFs();


        /*
           Começamos por Religião porque esse é
           o bloco já validado visualmente no
           protótipo anterior.

           Assim a primeira tela V2 deve reproduzir
           o comportamento conhecido.
        */

        const defaultBlock =

            manifest.blocks
            .some(
                item =>
                    item.slug ===
                    "religiao"
            )

            ?

            "religiao"

            :

            manifest.blocks[0]
            .slug;


        await loadBlock(
            defaultBlock
        );


        await showBrazil(

            normalizeUnitForScope(
                "uf",
                "brazil"
            )
        );
    }


    catch (
        error
    ) {

        console.error(
            error
        );


        alert(
            "Erro ao iniciar o painel V2:\n"
            +
            error.message
        );
    }


    finally {

        loading(false);
    }
}


/* ==========================================================
   INICIAR QUANDO O MAPA ESTIVER PRONTO
========================================================== */

map.on(
    "load",
    init
);
