// ---- App state ----
const COMBINED = 'combined';

const DEFAULT_STATE = {
  mode: 'single',
  servants: [],
  selected: null
};

function parseStoredJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return value === null ? fallback : value;
  } catch (e) {
    localStorage.removeItem(key);
    return fallback;
  }
}

function boundedLevel(value, fallback) {
  return Number.isInteger(value) ? Math.max(1, Math.min(10, value)) : fallback;
}

function normalizeState(value) {
  if (!value || typeof value !== 'object') return { ...DEFAULT_STATE };

  const servants = Array.isArray(value.servants)
    ? value.servants
      .filter((servant) => servant && Number.isInteger(servant.id) && servant.id > 0)
      .map((servant) => ({
        id: servant.id,
        ascReached: Array.isArray(servant.ascReached)
          ? [0, 1, 2, 3].map((index) => servant.ascReached[index] === true)
          : [false, false, false, false],
        skillCurrent: Array.isArray(servant.skillCurrent)
          ? [0, 1, 2].map((index) => boundedLevel(servant.skillCurrent[index], 1))
          : [1, 1, 1],
        skillTarget: boundedLevel(servant.skillTarget, 10),
        appendCurrent: Array.isArray(servant.appendCurrent)
          ? [0, 1, 2].map((index) => boundedLevel(servant.appendCurrent[index], 1))
          : [1, 1, 1],
        appendTarget: boundedLevel(servant.appendTarget, 10),
        grailTarget: Number.isInteger(servant.grailTarget) ? servant.grailTarget : null
      }))
    : [];

  const selected = value.selected === COMBINED ||
    (Number.isInteger(value.selected) && servants.some((servant) => servant.id === value.selected))
    ? value.selected
    : (servants[0]?.id ?? null);

  return {
    mode: value.mode === 'roster' ? 'roster' : 'single',
    servants,
    selected
  };
}

function normalizeInventory(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .filter(([id, quantity]) =>
      /^\d+$/.test(id) &&
      Number.isSafeInteger(quantity) &&
      quantity >= 0
    ));
}

let state = normalizeState(parseStoredJson('cl_state', DEFAULT_STATE));
// Back-fill append-skill fields for servants saved before that feature existed.
let inventory = normalizeInventory(parseStoredJson('cl_inventory', {}));

function save() {
  saveLocalOnly();
  if (typeof saveCloudData === 'function') saveCloudData();
}

function saveLocalOnly() {
  try {
    localStorage.setItem('cl_state', JSON.stringify(state));
    localStorage.setItem('cl_inventory', JSON.stringify(normalizeInventory(inventory)));
  } catch (e) {
    console.error('Could not save tracker data locally.', e);
  }
}

function setMode(mode) {
  state.mode = mode;
  $('#modeSingle').classList.toggle('active', mode === 'single');
  $('#modeRoster').classList.toggle('active', mode === 'roster');

  if (mode === 'single' && state.servants.length > 1) {
    state.servants = state.servants.slice(-1);
    state.selected = state.servants[0]?.id ?? null;
  }

  save();
  render();
}

async function addServant(id) {
  if (!state.servants.some((servant) => servant.id === id)) {
    try {
      await fetchServant(id, () => addServant(id));
    } catch (e) {
      return; // fetch failed — showFetchError() already handled the UI, don't add a broken entry
    }

    const entry = {
      id,
      ascReached: [false, false, false, false],
      skillCurrent: [1, 1, 1],
      skillTarget: 10,
      appendCurrent: [1, 1, 1],
      appendTarget: 10,
      grailTarget: null
    };

    if (state.mode === 'single') {
      state.servants = [entry];
    } else {
      state.servants.push(entry);
    }
  }

  state.selected = id;
  save();
  render();
}

function removeServant(id) {
  state.servants = state.servants.filter((servant) => servant.id !== id);

  if (state.selected === id) {
    state.selected = state.servants[0]?.id ?? null;
  }

  save();
  render();
}