// ---- Material calculations ----
function materialsFor(entry){
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
  return {need, qp};
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
