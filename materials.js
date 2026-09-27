// ---- Material calculations ----
// Cached per-entry (keyed by object identity + a signature of its own inputs) so re-rendering
// the same servant repeatedly — e.g. just toggling which tab is active — doesn't recompute from scratch.
const _matCache = new WeakMap();
function materialsFor(entry){
  const sig = entry.ascReached.join('')+'|'+entry.skillCurrent.join(',')+'|'+entry.skillTarget+'|'+entry.appendCurrent.join(',')+'|'+entry.appendTarget;
  const cached = _matCache.get(entry);
  if(cached && cached.sig===sig) return cached.result;
  const data = svtCache[entry.id];
  const need = {}; let qp = 0;
  const add = (item, amt) => {
    if(!need[item.id]) need[item.id] = {name:item.name, icon:item.icon, amount:0};
    need[item.id].amount += amt;
  };
  entry.ascReached.forEach((reached, i)=>{
    if(reached) return;
    const tier = data.ascensionMaterials[i+1];
    if(tier){ tier.items.forEach(it=>add(it.item, it.amount)); qp += tier.qp||0; }
  });
  entry.skillCurrent.forEach(cur=>{
    for(let lvl=cur; lvl<entry.skillTarget; lvl++){
      const tier = data.skillMaterials[lvl];
      if(tier){ tier.items.forEach(it=>add(it.item, it.amount)); qp += tier.qp||0; }
    }
  });
  entry.appendCurrent.forEach(cur=>{
    for(let lvl=cur; lvl<entry.appendTarget; lvl++){
      const tier = data.appendSkillMaterials && data.appendSkillMaterials[lvl];
      if(tier){ tier.items.forEach(it=>add(it.item, it.amount)); qp += tier.qp||0; }
    }
  });
  const result = {need, qp};
  _matCache.set(entry, {sig, result});
  return result;
}

// Reverse lookup: itemId -> [{name of servant, amount that servant needs}], across ALL tracked servants.
// Used for bottleneck highlighting and the click-to-expand breakdown, regardless of which tab is open.
function computeBreakdown(){
  const map = {};
  state.servants.forEach(entry=>{
    const data = svtCache[entry.id];
    if(!data) return;
    const {need} = materialsFor(entry);
    Object.entries(need).forEach(([id,v])=>{
      if(!map[id]) map[id] = [];
      map[id].push({name: data.name, amount: v.amount});
    });
  });
  return map;
}

function mergeMaterials(list){
  const out = {}; let qp = 0;
  list.forEach(({need, qp:q})=>{
    qp += q;
    Object.entries(need).forEach(([id,v])=>{
      if(!out[id]) out[id] = {name:v.name, icon:v.icon, amount:0};
      out[id].amount += v.amount;
    });
  });
  return {need:out, qp};
}