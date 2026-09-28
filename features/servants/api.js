// ---- Atlas Academy API access ----
const API = 'https://api.atlasacademy.io';
const NICE = (id, region) => `${API}/nice/${region}/servant/${id}?lore=false&lang=en`;
const BASIC_NA = `${API}/export/NA/basic_servant.json`;
const BASIC_JP = `${API}/export/JP/basic_servant_lang_en.json`; // JP data with English names

const $ = (s) => document.querySelector(s);
const statusEl = $('#status');

// New key (cl_basic2): the old NA-only list is ignored and dropped.
try {
  localStorage.removeItem('cl_basic');
} catch (e) {}

let basicList = JSON.parse(localStorage.getItem('cl_basic2') || 'null');
const svtCache = {};

// Visible error with an optional Retry button (instead of hanging on "Fetching…" forever).
function showError(msg, retry) {
  statusEl.innerHTML = `<span style="color:var(--red)">${msg}</span> ${
    retry ? '<button class="reset" id="retryBtn">Retry</button>' : ''
  }`;

  if (retry) {
    $('#retryBtn').onclick = () => {
      statusEl.textContent = '';
      retry();
    };
  }
}

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

// localStorage is best-effort: a full quota must never break the app.
function cacheSet(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {}
}

// Full servant list — trimmed to the fields we use so it stays small in storage.
async function ensureBasicList() {
  if (basicList) return;

  statusEl.textContent = 'Loading servant list…';
  try {
    // JP is a superset of NA; `na` marks servants already released on NA.
    const [jp, na] = await Promise.all([
      getJSON(BASIC_JP),
      getJSON(BASIC_NA)
    ]);
    const naIds = new Set(na.map(s=>s.id));

    basicList = jp
      .filter((s) => s.type === 'normal' || s.type === 'heroine')
      .map((s) => ({
        id: s.id,
        name: s.name,
        className: s.className,
        rarity: s.rarity,
        face: s.face,
        na: naIds.has(s.id)
      }));

    cacheSet('cl_basic2', basicList);
    statusEl.textContent = '';
  } catch (e) {
    showError(
      'Could not load the servant list (' + e.message + '). Check your connection.',
      () => init()
    );
    throw e;
  }
}

// Keep only what the tracker needs (full records are huge and blow past localStorage limits).
const slimTiers = (tiers) => Object.fromEntries(
  Object.entries(tiers || {}).map(([key, tier]) => [key, {
    qp: tier.qp,
    items: tier.items.map((item) => ({
      item: {
        id: item.item.id,
        name: item.item.name,
        icon: item.item.icon
      },
      amount: item.amount
    }))
  }])
);

// Servant detail — memory cache → localStorage → network. On failure shows an error + Retry and throws.
const showFetchError = showError;
async function fetchServant(id, retry) {
  const basicEntry = basicList && basicList.find((servant) => servant.id === id);
  const region = basicEntry && basicEntry.na === false ? 'JP' : 'NA';

  if (svtCache[id]) return svtCache[id];

  const cached = localStorage.getItem('cl_svt_' + id);
  if (cached) {
    const c = JSON.parse(cached);
    // Cached JP data goes stale once the servant reaches NA — refetch in that case.
    if (!(c.region === 'JP' && region === 'NA')) {
      svtCache[id] = c;
      return c;
    }
  }

  statusEl.textContent = 'Fetching servant data…';
  try {
    const d = await getJSON(NICE(id, region));
    const slim = {
      id: d.id,
      name: d.name,
      className: d.className,
      rarity: d.rarity,
      region,
      ascensionMaterials: slimTiers(d.ascensionMaterials),
      skillMaterials: slimTiers(d.skillMaterials),
      appendSkillMaterials: slimTiers(d.appendSkillMaterials),
      extraAssets: {
        faces: d.extraAssets && d.extraAssets.faces
      }
    };

    svtCache[id] = slim;
    cacheSet('cl_svt_' + id, slim);
    statusEl.textContent = '';
    return slim;
  } catch (e) {
    showError(
      'Could not fetch servant data (' + e.message + ').',
      retry || (() => init())
    );
    throw e;
  }
}

// Portrait icon: prefer the basic-list face, fall back to the detailed asset bundle.
function faceFor(id, data) {
  const basicEntry = basicList && basicList.find((servant) => servant.id === id);
  if (basicEntry && basicEntry.face) return basicEntry.face;

  const asc = data && data.extraAssets && data.extraAssets.faces && data.extraAssets.faces.ascension;
  if (asc) {
    const faces = Object.values(asc);
    if (faces.length) return faces[0];
  }

  return '';
}