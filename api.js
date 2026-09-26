// ---- Atlas Academy API access ----
const NICE = id => `https://api.atlasacademy.io/nice/NA/servant/${id}?lore=false`;
const BASIC = `https://api.atlasacademy.io/export/NA/basic_servant.json`;

const $ = s => document.querySelector(s);
const statusEl = $('#status');

let basicList = JSON.parse(localStorage.getItem('cl_basic')||'null');
const svtCache = {};

// Full servant list (id, name, class, rarity, face icon) — fetched once, cached forever.
async function ensureBasicList(){
  if(basicList) return;
  statusEl.textContent = 'Loading servant list…';
  const r = await fetch(BASIC);
  basicList = (await r.json()).filter(s=>s.type==='normal'||s.type==='heroine');
  localStorage.setItem('cl_basic', JSON.stringify(basicList));
  statusEl.textContent = '';
}

// Full servant detail (ascension/skill/append materials) — fetched on demand, cached per id.
async function fetchServant(id){
  if(svtCache[id]) return svtCache[id];
  const cached = localStorage.getItem('cl_svt_'+id);
  if(cached){ svtCache[id]=JSON.parse(cached); return svtCache[id]; }
  statusEl.textContent = 'Fetching servant data…';
  const r = await fetch(NICE(id));
  const data = await r.json();
  svtCache[id] = data;
  localStorage.setItem('cl_svt_'+id, JSON.stringify(data));
  statusEl.textContent = '';
  return data;
}

// Portrait icon for a servant: prefer the basic-list face, fall back to the detailed asset bundle.
function faceFor(id, data){
  const basicEntry = basicList && basicList.find(b=>b.id===id);
  if(basicEntry && basicEntry.face) return basicEntry.face;
  const asc = data && data.extraAssets && data.extraAssets.faces && data.extraAssets.faces.ascension;
  if(asc){ const v = Object.values(asc); if(v.length) return v[0]; }
  return '';
}
