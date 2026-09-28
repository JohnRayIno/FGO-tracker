// ---- App state ----
const COMBINED = 'combined';

let state = JSON.parse(localStorage.getItem('cl_state') || 'null') || {
  mode: 'single',
  servants: [],
  selected: null
};
// Back-fill append-skill fields for servants saved before that feature existed.
state.servants.forEach((servant) => {
  if (!servant.appendCurrent) servant.appendCurrent = [1, 1, 1];
  if (!servant.appendTarget) servant.appendTarget = 10;
  if (servant.grailTarget === undefined) servant.grailTarget = null;
});
let inventory = JSON.parse(localStorage.getItem('cl_inventory') || '{}');

function save() {
  localStorage.setItem('cl_state', JSON.stringify(state));
  localStorage.setItem('cl_inventory', JSON.stringify(inventory));
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