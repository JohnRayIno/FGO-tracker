// ---- Supabase authentication and cloud persistence ----
let supabaseClient = null;
let currentUser = null;
let cloudSyncInProgress = false;
let cloudSyncPending = false;

function authConfigured() {
  return supabaseConfigured && typeof supabase !== 'undefined';
}

function authStatus(message, isError = false) {
  const element = $('#accountModalStatus') || $('#accountStatus');
  if (!element) return;
  element.textContent = message;
  element.style.color = isError ? 'var(--red)' : 'var(--muted)';
}

function updateAccountUi() {
  const signedOut = !currentUser;
  $('#accountSignedOut').style.display = signedOut ? 'block' : 'none';
  $('#accountSignedIn').style.display = signedOut ? 'none' : 'block';
  $('#accountEmail').textContent = currentUser ? currentUser.email : '';
  $('#accountButton').textContent = currentUser ? 'Account' : 'Sign in';
}

async function loadCloudData(user, migrateLocal = true) {
  const { data, error } = await supabaseClient
    .from('user_data')
    .select('state, inventory')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    state = normalizeState(data.state);
    inventory = normalizeInventory(data.inventory);
    saveLocalOnly();
    render();
    authStatus('Cloud data loaded.');
    return;
  }

  if (migrateLocal) {
    await saveCloudData(user);
    authStatus('Your local tracker data was saved to your account.');
  }
}

async function saveCloudData(user = currentUser) {
  if (!user || !supabaseClient) return;
  if (cloudSyncInProgress) {
    cloudSyncPending = true;
    return;
  }

  cloudSyncInProgress = true;
  try {
    const { error } = await supabaseClient.from('user_data').upsert({
      user_id: user.id,
      state: normalizeState(state),
      inventory: normalizeInventory(inventory),
      updated_at: new Date().toISOString()
    });
    if (error) throw error;
  } catch (error) {
    console.error('Could not save tracker data to Supabase.', error);
    authStatus('Cloud save failed. Your local data is still available.', true);
  } finally {
    cloudSyncInProgress = false;
    if (cloudSyncPending) {
      cloudSyncPending = false;
      saveCloudData(user);
    }
  }
}

async function deleteCloudData(user = currentUser) {
  if (!user || !supabaseClient) return;
  const { error } = await supabaseClient
    .from('user_data')
    .delete()
    .eq('user_id', user.id);
  if (error) throw error;
}

async function signIn() {
  const email = $('#accountEmailInput').value.trim();
  const password = $('#accountPasswordInput').value;
  if (!email || !password) {
    authStatus('Enter an email address and password.', true);
    return;
  }

  authStatus('Signing in…');
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) authStatus(error.message, true);
}

async function signUp() {
  const email = $('#accountEmailInput').value.trim();
  const password = $('#accountPasswordInput').value;
  if (!email || password.length < 8) {
    authStatus('Use an email address and a password with at least 8 characters.', true);
    return;
  }

  authStatus('Creating account…');
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) {
    authStatus(error.message, true);
  } else if (!data.session) {
    authStatus('Account created. Check your email to confirm it, then sign in.');
  }
}

async function signOut() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) authStatus(error.message, true);
}

async function initAuth() {
  updateAccountUi();
  if (!supabaseConfigured) {
    authStatus('Cloud accounts are not configured yet. Local storage is active.');
    return;
  }
  if (!authConfigured()) {
    authStatus('Supabase client failed to load. Local storage is active.', true);
    return;
  }

  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  $('#accountButton').disabled = false;

  const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
  if (sessionError) {
    authStatus(sessionError.message, true);
  } else if (sessionData.session) {
    currentUser = sessionData.session.user;
    updateAccountUi();
    try {
      await loadCloudData(currentUser);
    } catch (error) {
      console.error('Could not load tracker data from Supabase.', error);
      authStatus('Cloud data could not be loaded. Local data is still available.', true);
    }
  }

  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    currentUser = session ? session.user : null;
    updateAccountUi();
    if (event === 'SIGNED_IN' && currentUser) {
      try {
        await loadCloudData(currentUser);
      } catch (error) {
        console.error('Could not load tracker data from Supabase.', error);
        authStatus('Cloud data could not be loaded.', true);
      }
    } else if (event === 'SIGNED_OUT') {
      authStatus('Signed out. Local storage is active.');
    }
  });
}

$('#accountButton').addEventListener('click', () => {
  $('#accountOverlay').style.display = 'flex';
  $('#accountEmailInput').focus();
});
$('#accountClose').addEventListener('click', () => {
  $('#accountOverlay').style.display = 'none';
});
$('#accountCloseSignedIn').addEventListener('click', () => {
  $('#accountOverlay').style.display = 'none';
});
$('#accountSignIn').addEventListener('click', signIn);
$('#accountSignUp').addEventListener('click', signUp);
$('#accountSignOut').addEventListener('click', signOut);

initAuth();
