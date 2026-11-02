// Sign-in with Google via Supabase Auth. Shows the login screen until the
// visitor signs in (or chooses guest), then shows their name and photo.
(() => {
  "use strict";

  // Public client config. The publishable key is safe to ship in the browser.
  const SUPABASE_URL = "https://kukglvtcsiovqvrahgmi.supabase.co";
  const SUPABASE_KEY = "sb_publishable_dpVBilRfoPWpTzsJVtSIcw_PxJVXUVx";
  const GUEST_KEY = "fauwx:guest";

  const $ = (id) => document.getElementById(id);
  const body = document.body;

  function setGuest(on) {
    try { on ? sessionStorage.setItem(GUEST_KEY, "1") : sessionStorage.removeItem(GUEST_KEY); } catch { /* ignore */ }
  }
  function isGuest() {
    try { return sessionStorage.getItem(GUEST_KEY) === "1"; } catch { return false; }
  }

  function showLoginError(msg) {
    const el = $("login-error");
    el.textContent = msg;
    el.hidden = !msg;
  }

  function greeting() {
    const hour = new Date().getHours();
    return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  }

  function render(user) {
    body.classList.remove("auth-pending");
    const chip = $("user-chip");
    const signoutBtn = $("signout-btn");

    if (!user && !isGuest()) {
      body.classList.add("signed-out");
      chip.hidden = true;
      return;
    }
    body.classList.remove("signed-out");
    chip.hidden = false;

    if (!user) {
      // Guest
      $("user-avatar").hidden = true;
      $("user-initials").hidden = true;
      $("user-name").textContent = "Guest";
      signoutBtn.textContent = "Sign in";
      $("welcome-title").textContent = `${greeting()}, Owl! Welcome.`;
      return;
    }

    const meta = user.user_metadata || {};
    const name = meta.full_name || meta.name || user.email || "Owl";
    const firstName = name.split(" ")[0];
    const avatarUrl = meta.avatar_url || meta.picture;

    $("user-name").textContent = name;
    $("welcome-title").textContent = `${greeting()}, ${firstName}! Welcome back.`;
    signoutBtn.textContent = "Sign out";

    const img = $("user-avatar");
    const initials = $("user-initials");
    initials.textContent = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
    if (avatarUrl) {
      img.alt = `${name}'s profile picture`;
      img.onerror = () => { img.hidden = true; initials.hidden = false; };
      img.src = avatarUrl;
      img.hidden = false;
      initials.hidden = true;
    } else {
      img.hidden = true;
      initials.hidden = false;
    }
  }

  // Errors from Google/Supabase come back in the URL (e.g. the user cancelled).
  function readRedirectError() {
    const params = new URLSearchParams(window.location.hash.slice(1) || window.location.search);
    const err = params.get("error_description") || params.get("error");
    if (err) {
      history.replaceState(null, "", window.location.pathname);
      return err.replace(/\+/g, " ");
    }
    return "";
  }

  if (!window.supabase) {
    // Library failed to load: don't lock anyone out of the weather.
    console.error("Supabase library not loaded");
    setGuest(true);
    render(null);
    return;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const redirectError = readRedirectError();

  $("google-btn").addEventListener("click", async () => {
    showLoginError("");
    const btn = $("google-btn");
    btn.disabled = true;
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + window.location.pathname },
    });
    if (error) {
      btn.disabled = false;
      showLoginError(`Google sign-in failed: ${error.message}`);
    }
  });

  $("guest-btn").addEventListener("click", () => {
    setGuest(true);
    render(null);
  });

  $("signout-btn").addEventListener("click", async () => {
    setGuest(false);
    await client.auth.signOut();
    render(null);
  });

  client.auth.onAuthStateChange((_event, session) => {
    if (session) setGuest(false);
    // Defer so we don't call back into Supabase inside its own callback.
    setTimeout(() => render(session ? session.user : null), 0);
  });

  client.auth.getSession().then(({ data }) => {
    render(data.session ? data.session.user : null);
    if (redirectError) showLoginError(`Sign-in didn't finish: ${redirectError}`);
  });
})();
