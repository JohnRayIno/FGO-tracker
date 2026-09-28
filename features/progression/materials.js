// ---- Material calculations ----
// Grail level-cap table: base max level per rarity, and the level each successive Grail unlocks.
// Grail counts are well-documented game mechanics; QP cost per grail is NOT included here since
// it isn't exposed by the Atlas Academy API in a simple per-servant form, so we only show the
// Grail count needed to reach a target level, not a QP total for it.
const GRAIL_TABLE = {
  1: { base: 60, levels: [70, 75, 80, 85, 90, 92, 94, 96, 98, 100] },
  2: { base: 65, levels: [70, 75, 80, 85, 90, 92, 94, 96, 98, 100] },
  3: { base: 70, levels: [75, 80, 85, 90, 92, 94, 96, 98, 100] },
  4: { base: 80, levels: [85, 90, 92, 94, 96, 98, 100] },
  5: { base: 90, levels: [92, 94, 96, 98, 100] },
};

function grailInfoFor(rarity) {
  return GRAIL_TABLE[rarity] || GRAIL_TABLE[5];
}

function grailsNeeded(rarity, targetLevel) {
  const info = grailInfoFor(rarity);

  if (!targetLevel || targetLevel <= info.base) return 0;

  const idx = info.levels.indexOf(targetLevel);
  return idx === -1 ? 0 : idx + 1;
}

// Cached per-entry (keyed by object identity + a signature of its own inputs) so re-rendering
// the same servant repeatedly — e.g. just toggling which tab is active — doesn't recompute from scratch.
const _matCache = new WeakMap();
function materialsFor(entry) {
  const sig = entry.ascReached.join('') + '|' +
    entry.skillCurrent.join(',') + '|' +
    entry.skillTarget + '|' +
    entry.appendCurrent.join(',') + '|' +
    entry.appendTarget;

  const cached = _matCache.get(entry);
  if (cached && cached.sig === sig) return cached.result;

  const data = svtCache[entry.id];
  if (!data) return { need: {}, qp: 0 };

  const need = {};
  let qp = 0;

  const add = (item, amt) => {
    if (!need[item.id]) {
      need[item.id] = {
        name: item.name,
        icon: item.icon,
        amount: 0
      };
    }

    need[item.id].amount += amt;
  };

  entry.ascReached.forEach((reached, i) => {
    if (reached) return;

    const tier = data.ascensionMaterials[i+1];
    if (tier) {
      tier.items.forEach((item) => add(item.item, item.amount));
      qp += tier.qp || 0;
    }
  });

  entry.skillCurrent.forEach((currentLevel) => {
    for (let level = currentLevel; level < entry.skillTarget; level++) {
      const tier = data.skillMaterials[level];
      if (tier) {
        tier.items.forEach((item) => add(item.item, item.amount));
        qp += tier.qp || 0;
      }
    }
  });

  entry.appendCurrent.forEach((currentLevel) => {
    for (let level = currentLevel; level < entry.appendTarget; level++) {
      const tier = data.appendSkillMaterials && data.appendSkillMaterials[level];
      if (tier) {
        tier.items.forEach((item) => add(item.item, item.amount));
        qp += tier.qp || 0;
      }
    }
  });

  const result = { need, qp };
  _matCache.set(entry, { sig, result });
  return result;
}

// Reverse lookup: itemId -> [{name of servant, amount that servant needs}], across ALL tracked servants.
// Used for bottleneck highlighting and the click-to-expand breakdown, regardless of which tab is open.
function computeBreakdown() {
  const map = {};

  state.servants.forEach((entry) => {
    const data = svtCache[entry.id];
    if (!data) return;

    const { need } = materialsFor(entry);
    Object.entries(need).forEach(([id, value]) => {
      if (!map[id]) map[id] = [];
      map[id].push({
        name: data.name,
        amount: value.amount
      });
    });
  });

  return map;
}

function mergeMaterials(list) {
  const out = {};
  let qp = 0;

  list.forEach(({ need, qp: servantQp }) => {
    qp += servantQp;
    Object.entries(need).forEach(([id, value]) => {
      if (!out[id]) {
        out[id] = {
          name: value.name,
          icon: value.icon,
          amount: 0
        };
      }

      out[id].amount += value.amount;
    });
  });

  return { need: out, qp };
}