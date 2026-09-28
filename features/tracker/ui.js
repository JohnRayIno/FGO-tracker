// ---- Rendering ----
function renderMaterialTable(need){
  const breakdown = computeBreakdown();
  const rows = Object.entries(need).sort((a,b)=>{
    const ca = (breakdown[a[0]]||[]).length, cb = (breakdown[b[0]]||[]).length;
    return cb!==ca ? cb-ca : b[1].amount-a[1].amount;
  });
  if(!rows.length) return `<div class="empty">All selected stages already reached — nothing needed.</div>`;
  return `<div class="mat-wrap">
  <input class="mat-filter" data-matfilter placeholder="Filter materials by name…">
  <table><thead><tr><th>Material</th><th class="num">Needed</th><th class="num">Owned</th><th class="num">Remaining</th></tr></thead><tbody>
    ${rows.map(([id,v])=>{
      const owned = inventory[id]||0;
      const remaining = Math.max(0, v.amount - owned);
      const uses = breakdown[id]||[];
      const multi = uses.length>1;
      return `<tr class="matrow ${multi?'bottleneck':''}" data-item-row="${id}" data-matname="${v.name.toLowerCase()}">
        <td class="mat">${v.icon?`<img src="${v.icon}">`:''}${v.name}${multi?`<span class="needcount">needed by ${uses.length} servants</span>`:''}</td>
        <td class="num">${v.amount}</td>
        <td class="num"><input class="own" type="number" min="0" value="${owned}" data-item="${id}"></td>
        <td class="num ${remaining===0?'done':'deficit'}">${remaining===0?'✓ done':remaining}</td>
      </tr>
      <tr class="breakdown-row" data-breakdown="${id}" style="display:none;">
        <td colspan="4">${uses.map(u=>`${u.name}: ${u.amount}`).join(' &nbsp;·&nbsp; ') || 'Not needed by any tracked servant right now.'}</td>
      </tr>`;
    }).join('')}
  </tbody></table></div>`;
}

function tabstripHtml(){
  let html = state.servants.map(s=>{
    const data = svtCache[s.id];
    if(!data) return '';
    const active = state.selected===s.id ? 'active':'';
    const face = faceFor(s.id, data);
    return `<div class="tab ${active}" data-tab="${s.id}" data-rarity="${data.rarity}">
      <span class="x" data-remove="${s.id}">✕</span>
      ${face?`<img src="${face}" alt="${data.name}" loading="lazy">`:'<div style="width:48px;height:48px;border-radius:6px;background:var(--panel2);"></div>'}
      <span class="tname">${data.name}</span>
    </div>`;
  }).join('');
  if(state.mode==='roster' && state.servants.length>1){
    const active = state.selected===COMBINED ? 'active':'';
    html += `<div class="tab combined ${active}" data-tab="${COMBINED}">
      <span class="icon">Σ</span>
      <span class="tname">Combined Total</span>
    </div>`;
  }
  return html;
}

function detailHtmlFor(entry){
  const data = svtCache[entry.id];
  if(!data) return `<div class="detail"><div class="empty">Servant data isn't loaded yet — use Retry above or check your connection.</div></div>`;
  const ascLabels = ['1st','2nd','3rd','4th (max)'];
  const {need, qp} = materialsFor(entry);
  const grailInfo = grailInfoFor(data.rarity);
  const grailOptions = [grailInfo.base, ...grailInfo.levels];
  const grailTarget = entry.grailTarget || grailInfo.base;
  return `<div class="detail" data-svt="${entry.id}">
    <div class="card-head">
      <div><h3>${data.name}</h3><div class="meta">${data.className} · ${data.rarity}★${data.region==='JP'?' · <span class="jp-badge">JP only</span>':''}</div></div>
      <button class="remove" data-remove="${entry.id}">remove</button>
    </div>
    <div class="section-label">Ascensions reached</div>
    <div class="asc-row">
      ${ascLabels.map((l,i)=>`<label><input type="checkbox" data-asc="${i}" ${entry.ascReached[i]?'checked':''}> ${l}</label>`).join('')}
    </div>
    <div class="section-label">Skill levels</div>
    <div class="skill-grid">
      ${[0,1,2].map(i=>`<div class="skill-box"><label>Skill ${i+1} — current lvl</label><input type="number" min="1" max="10" data-skill="${i}" value="${entry.skillCurrent[i]}"></div>`).join('')}
    </div>
    <div class="target-row">Target level for all skills:
      <select data-target>${[...Array(10)].map((_,i)=>`<option value="${i+1}" ${entry.skillTarget===i+1?'selected':''}>${i+1}</option>`).join('')}</select>
    </div>
    <div class="section-label">Append skill levels</div>
    <div class="skill-grid">
      ${[0,1,2].map(i=>`<div class="skill-box"><label>Append ${i+1} — current lvl</label><input type="number" min="1" max="10" data-append="${i}" value="${entry.appendCurrent[i]}"></div>`).join('')}
    </div>
    <div class="target-row">Target level for all append skills:
      <select data-appendtarget>${[...Array(10)].map((_,i)=>`<option value="${i+1}" ${entry.appendTarget===i+1?'selected':''}>${i+1}</option>`).join('')}</select>
    </div>
    <div class="section-label">Level cap / Grails</div>
    <div class="grail-line">Target level:
      <select data-grailtarget>${grailOptions.map(lv=>`<option value="${lv}" ${grailTarget===lv?'selected':''}>${lv}${lv===grailInfo.base?' (no grail)':''}</option>`).join('')}</select>
      — Grails needed: ${grailsNeeded(data.rarity, grailTarget)} <span style="opacity:.7;">(QP cost for grailing isn't tracked here)</span>
    </div>
    <div class="section-label" style="display:flex;align-items:center;">Materials still needed
      <button class="reset copylist-btn" data-copylist>Copy as text list</button>
    </div>
    ${renderMaterialTable(need)}
    <div class="qp-line">QP needed (ascension + skills + append): ${qp.toLocaleString()}</div>
  </div>`;
}

function combinedDetailHtml(){
  const all = state.servants.map(materialsFor);
  const {need, qp} = mergeMaterials(all);
  return `<div class="detail">
    <div class="card-head">
      <h3>Combined shopping list</h3>
      <div class="meta">${state.servants.length} servants</div>
    </div>
    <div class="section-label" style="display:flex;align-items:center;">Materials needed
      <button class="reset copylist-btn" data-copylist>Copy as text list</button>
    </div>
    ${renderMaterialTable(need)}
    <div class="qp-line">Total QP needed (ascension + skills + append): ${qp.toLocaleString()}</div>
  </div>`;
}

function render(){
  const stripEl = $('#tabstrip');
  const detailEl = $('#detail');
  if(!state.servants.length){
    stripEl.innerHTML = '';
    detailEl.innerHTML = `<div class="empty">Search above to ${state.mode==='single'?'pick a servant to track':'start building your roster'}.</div>`;
    return;
  }
  if(state.selected==null || (state.selected!==COMBINED && !state.servants.some(s=>s.id===state.selected))){
    state.selected = state.servants[0].id;
  }
  // Full rebuild — only needed when the roster itself changed (add/remove/mode switch/init).
  stripEl.innerHTML = `<div class="tabstrip">${tabstripHtml()}</div>`;
  stripEl.querySelectorAll('[data-tab]').forEach(t=>t.addEventListener('click', e=>{
    if(e.target.closest('[data-remove]')) return;
    const id = t.dataset.tab;
    state.selected = id===COMBINED ? COMBINED : parseInt(id);
    save();
    updateTabActiveStates();
    renderDetail();
  }));
  stripEl.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click', e=>{
    e.stopPropagation();
    removeServant(parseInt(b.dataset.remove));
  }));
  renderDetail();
}

// Just flips the active tab's highlight — doesn't touch the DOM tree, so portrait <img>s
// already in the tab strip are never recreated or re-fetched.
function updateTabActiveStates(){
  document.querySelectorAll('#tabstrip .tab').forEach(t=>{
    const isActive = state.selected===COMBINED ? t.classList.contains('combined') : t.dataset.tab===String(state.selected);
    t.classList.toggle('active', isActive);
  });
}

// Rebuilds only the panel below the tabs — ascension/skill controls and the materials table.
// This is the part that actually changes on a tab click or an input edit, so it's the only
// thing that needs to re-render; the tab strip (and its images) stays untouched.
function renderDetail(){
  const detailEl = $('#detail');
  const entry = state.selected===COMBINED ? null : state.servants.find(s=>s.id===state.selected);
  detailEl.innerHTML = entry ? detailHtmlFor(entry) : combinedDetailHtml();

  const removeBtn = detailEl.querySelector('button[data-remove]');
  if(removeBtn) removeBtn.addEventListener('click', ()=>removeServant(parseInt(removeBtn.dataset.remove)));

  const d = detailEl.querySelector('.detail[data-svt]');
  if(d){
    const id = parseInt(d.dataset.svt);
    const ent = state.servants.find(s=>s.id===id);
    d.querySelectorAll('[data-asc]').forEach(cb=>cb.addEventListener('change',e=>{
      ent.ascReached[parseInt(e.target.dataset.asc)] = e.target.checked;
      save(); renderDetail();
    }));
    d.querySelectorAll('[data-skill]').forEach(inp=>inp.addEventListener('change',e=>{
      ent.skillCurrent[parseInt(e.target.dataset.skill)] = Math.max(1, Math.min(10, parseInt(e.target.value)||1));
      save(); renderDetail();
    }));
    d.querySelectorAll('[data-target]').forEach(sel=>sel.addEventListener('change',e=>{
      ent.skillTarget = parseInt(e.target.value);
      save(); renderDetail();
    }));
    d.querySelectorAll('[data-append]').forEach(inp=>inp.addEventListener('change',e=>{
      ent.appendCurrent[parseInt(e.target.dataset.append)] = Math.max(1, Math.min(10, parseInt(e.target.value)||1));
      save(); renderDetail();
    }));
    d.querySelectorAll('[data-appendtarget]').forEach(sel=>sel.addEventListener('change',e=>{
      ent.appendTarget = parseInt(e.target.value);
      save(); renderDetail();
    }));
    d.querySelectorAll('[data-grailtarget]').forEach(sel=>sel.addEventListener('change',e=>{
      ent.grailTarget = parseInt(e.target.value);
      save(); renderDetail();
    }));
  }
  const copyBtn = detailEl.querySelector('[data-copylist]');
  if(copyBtn) copyBtn.addEventListener('click', ()=>{
    const need = entry ? materialsFor(entry).need : mergeMaterials(state.servants.map(materialsFor)).need;
    const lines = Object.values(need).sort((a,b)=>b.amount-a.amount).map(v=>`${v.name} x${v.amount}`).join('\n');
    openModal({
      title: 'Shopping list',
      desc: 'Plain-text list — copy and paste anywhere (notes app, spreadsheet, etc).',
      value: lines,
      readonly: true,
      primaryLabel: 'Copy',
      onPrimary: async (val, btn)=>{
        try{ await navigator.clipboard.writeText(val); }
        catch(e){ $('#modalTextarea').select(); document.execCommand('copy'); }
        btn.textContent = 'Copied!';
        setTimeout(closeModal, 500);
      }
    });
  });
  detailEl.querySelectorAll('.mat-wrap').forEach(wrap=>{
    const inp = wrap.querySelector('[data-matfilter]');
    inp.addEventListener('input', ()=>{
      const q = inp.value.trim().toLowerCase();
      wrap.querySelectorAll('tr.matrow').forEach(tr=>{
        const match = !q || tr.dataset.matname.includes(q);
        tr.style.display = match ? '' : 'none';
        const br = wrap.querySelector(`[data-breakdown="${tr.dataset.itemRow}"]`);
        if(br && !match) br.style.display = 'none';
      });
    });
  });
  detailEl.querySelectorAll('input.own').forEach(inp=>inp.addEventListener('change',e=>{
    inventory[e.target.dataset.item] = Math.max(0, parseInt(e.target.value)||0);
    save(); renderDetail();
  }));
  detailEl.querySelectorAll('.matrow').forEach(tr=>tr.addEventListener('click', e=>{
    if(e.target.closest('input')) return;
    const id = tr.dataset.itemRow;
    const br = detailEl.querySelector(`[data-breakdown="${id}"]`);
    if(br) br.style.display = br.style.display==='none' ? 'table-row' : 'none';
  }));
}


// ---- Search / class / rarity filter ----
// Small starter set of common English nicknames -> a substring that appears in the servant's
// actual API name. Not exhaustive — extend this object with more as you run into gaps.
const NICKNAMES = {
  'herc': 'heracles',
  'gil': 'gilgamesh',
  'jalter': "jeanne d'arc (alter)",
  'salter': 'saber alter',
  'okitan': 'okita souji',
  'chaldea': 'mash',
};

// Accent-insensitive matching plus a few nicknames the API names don't contain (extend freely).
const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

async function updateResults(){
  try{ await ensureBasicList(); }catch(e){ return; }
  if(!basicList) return;
  const q = norm($('#searchInput').value.trim());
  const cls = $('#classFilter').value;
  const rar = $('#rarityFilter').value;
  const reg = $('#regionFilter').value;
  const box = $('#results');
  if(!q && !cls && !rar && !reg){ box.style.display='none'; return; }
  const terms = q ? [q].concat(NICKNAMES[q] ? [NICKNAMES[q]] : []) : [];
  let matches = basicList.filter(s=>
    (!q || terms.some(t=>norm(s.name).includes(t))) &&
    (!cls || s.className===cls) && (!rar || s.rarity===parseInt(rar)) &&
    (!reg || (reg==='na' ? s.na : !s.na)));
  matches.sort((a,b)=> a.className===b.className ? a.name.localeCompare(b.name) : a.className.localeCompare(b.className));
  matches = matches.slice(0,30);
  box.innerHTML = matches.map(s=>`<div data-id="${s.id}"><span>${s.name}</span><span class="cls">${s.na?'':'<span class="jp-badge">JP</span> '}${s.className} · ${s.rarity}★</span></div>`).join('') || '<div style="color:var(--muted);cursor:default;">No matches</div>';
  box.style.display='block';
}

$('#searchInput').addEventListener('input', updateResults);
$('#classFilter').addEventListener('change', updateResults);
$('#rarityFilter').addEventListener('change', updateResults);
$('#regionFilter').addEventListener('change', updateResults);

$('#results').addEventListener('click', async e=>{
  const row = e.target.closest('div[data-id]');
  if(!row) return;
  await addServant(parseInt(row.dataset.id));
  $('#searchInput').value='';
  $('#classFilter').value='';
  $('#rarityFilter').value='';
  $('#regionFilter').value='';
  $('#results').style.display='none';
});

$('#modeSingle').addEventListener('click', ()=>setMode('single'));
$('#modeRoster').addEventListener('click', ()=>setMode('roster'));

$('#resetAll').addEventListener('click', ()=>{
  if(!confirm('This clears every tracked servant, your inventory, and all cached data. This cannot be undone. Continue?')) return;
  Object.keys(localStorage).filter(k=>k.startsWith('cl_')).forEach(k=>localStorage.removeItem(k));
  location.reload();
});

// ---- Themed modal (replaces native prompt/alert for import/export) ----
function openModal({title, desc, value, readonly, primaryLabel, onPrimary}){
  $('#modalTitle').textContent = title;
  $('#modalDesc').textContent = desc;
  $('#modalDesc').style.color = 'var(--muted)';
  const ta = $('#modalTextarea');
  ta.value = value ?? '';
  ta.style.display = value===null ? 'none' : 'block';
  ta.readOnly = !!readonly;
  const primary = $('#modalPrimary');
  primary.textContent = primaryLabel;
  $('#modalOverlay').style.display = 'flex';
  ta.focus(); ta.select();
  primary.onclick = ()=>onPrimary(ta.value, primary);
}
function closeModal(){ $('#modalOverlay').style.display = 'none'; }
$('#modalSecondary').addEventListener('click', closeModal);
$('#modalOverlay').addEventListener('click', e=>{ if(e.target.id==='modalOverlay') closeModal(); });

// ---- Inventory import/export ----
$('#exportInv').addEventListener('click', ()=>{
  const json = JSON.stringify(inventory, null, 2);
  openModal({
    title: 'Export inventory',
    desc: 'Copy this and save it somewhere — paste it back in later with Import.',
    value: json,
    readonly: true,
    primaryLabel: 'Copy',
    onPrimary: copyAndClose
  });
});

async function copyAndClose(val, btn){
  try{ await navigator.clipboard.writeText(val); }
  catch(e){ $('#modalTextarea').select(); document.execCommand('copy'); }
  btn.textContent = 'Copied!';
  setTimeout(closeModal, 500);
}

$('#importInv').addEventListener('click', ()=>{
  openModal({
    title: 'Import inventory',
    desc: 'Paste a previously exported inventory JSON below, then Apply.',
    value: '',
    readonly: false,
    primaryLabel: 'Apply',
    onPrimary: (val)=>{
      try{
        inventory = JSON.parse(val);
        save(); render();
        closeModal();
      }catch(e){
        $('#modalDesc').textContent = 'That did not look like valid JSON — nothing was changed. Try again or Cancel.';
        $('#modalDesc').style.color = 'var(--red)';
      }
    }
  });
});

// ---- Init ----
async function init(){
  setMode(state.mode||'single');
  try{ await ensureBasicList(); }
  catch(e){ return; } // showFetchError() already put a Retry button in #status
  if(state.servants.length){
    statusEl.textContent = 'Loading saved servants…';
    for(const s of state.servants){
      try{ await fetchServant(s.id); }
      catch(e){ return; } // stop here — Retry button is already showing, no point continuing
    }
    if(statusEl.textContent==='Loading saved servants…') statusEl.textContent = '';
  }
  render();
}
init();