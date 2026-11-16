(() => {
  const config = window.LAUNCHPAD_SUPABASE;
  const status = document.getElementById("authMessage");
  const signedOut = document.getElementById("authSignedOut");
  const signedIn = document.getElementById("authSignedIn");
  const saveButton = document.getElementById("savePlanBtn");
  const saveMessage = document.getElementById("savePlanMessage");
  const projectsBox = document.createElement("div");
  projectsBox.id = "savedProjects";
  projectsBox.style.marginTop = "14px";
  const account = document.getElementById("account");
  account.appendChild(projectsBox);

  if (!config || !window.supabase?.createClient) {
    if (status) status.textContent = "Cloud sign-in is unavailable. You can still use the local tools.";
    return;
  }

  const client = window.supabase.createClient(config.url, config.publishableKey);
  let currentUser = null;
  let lastPlan = "";

  function localChecks() {
    try { return JSON.parse(localStorage.getItem("lp-checks") || "{}"); }
    catch { return {}; }
  }
  function completedSteps() {
    const saved = localChecks();
    return Object.keys(saved).filter(key => saved[key]).map(Number);
  }
  function showAuth(user) {
    currentUser = user || null;
    signedOut.hidden = !!currentUser;
    signedIn.hidden = !currentUser;
    if (currentUser) {
      document.getElementById("authUserEmail").textContent = currentUser.email || "Signed in";
      if (status) status.textContent = "Your account is connected. Your projects and checklist can sync.";
      if (saveButton) saveButton.style.display = "block";
      loadCloudData();
    } else {
      if (status) status.textContent = "No password needed. Check your inbox for a secure link.";
      if (saveButton) saveButton.style.display = "none";
      projectsBox.replaceChildren();
    }
  }
  async function loadCloudData() {
    if (!currentUser) return;
    const { data: checklist, error: checklistError } = await client
      .from("launchpad_checklists").select("completed_steps").eq("user_id", currentUser.id).maybeSingle();
    if (!checklistError && checklist && Array.isArray(checklist.completed_steps)) {
      const saved = {};
      checklist.completed_steps.forEach(index => { saved[index] = true; });
      localStorage.setItem("lp-checks", JSON.stringify(saved));
      if (typeof window.render === "function") window.render();
    }
    const { data: projects, error } = await client.from("launchpad_projects")
      .select("id,title,idea,updated_at").order("updated_at", { ascending: false }).limit(20);
    projectsBox.replaceChildren();
    const heading = document.createElement("strong");
    heading.textContent = "Your saved business plans";
    projectsBox.appendChild(heading);
    if (error) {
      const note = document.createElement("p");
      note.className = "muted";
      note.textContent = "Could not load saved plans right now.";
      projectsBox.appendChild(note);
      return;
    }
    if (!projects || !projects.length) {
      const note = document.createElement("p");
      note.className = "muted";
      note.textContent = "No saved plans yet. Create a plan and tap Save.";
      projectsBox.appendChild(note);
      return;
    }
    projects.forEach(project => {
      const item = document.createElement("div");
      item.style.cssText = "padding:10px;margin-top:8px;border:1px solid var(--line);border-radius:10px";
      const title = document.createElement("strong");
      title.textContent = project.title;
      const detail = document.createElement("p");
      detail.className = "muted";
      detail.textContent = project.idea || "Business idea";
      item.append(title, detail);
      projectsBox.appendChild(item);
    });
  }

  document.getElementById("signInBtn")?.addEventListener("click", async () => {
    const email = document.getElementById("authEmail").value.trim();
    if (!email) { status.textContent = "Enter your email address first."; return; }
    status.textContent = "Sending your sign-in link…";
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href.split("#")[0] }
    });
    status.textContent = error ? error.message : "Sign-in link sent. Check your inbox (and spam folder).";
  });
  document.getElementById("signOutBtn")?.addEventListener("click", async () => {
    const { error } = await client.auth.signOut();
    if (error && status) status.textContent = error.message;
    else showAuth(null);
  });

  saveButton?.addEventListener("click", async () => {
    if (!currentUser) { saveMessage.textContent = "Sign in first to save your plan."; return; }
    const title = (document.getElementById("business").value.trim() || "My business idea").slice(0, 120);
    const idea = document.getElementById("business").value.trim();
    const customer = document.getElementById("customer").value.trim();
    const problem = document.getElementById("problem").value.trim();
    const { error } = await client.from("launchpad_projects").insert({
      user_id: currentUser.id,
      title,
      idea,
      customer,
      problem,
      plan: lastPlan ? [{ text: lastPlan }] : []
    });
    saveMessage.textContent = error ? "Couldn't save: " + error.message : "Saved to your Launchpad account ✓";
    if (!error) loadCloudData();
  });

  document.getElementById("tasks")?.addEventListener("change", async event => {
    if (event.target?.type !== "checkbox" || !currentUser) return;
    const { error } = await client.from("launchpad_checklists").upsert({
      user_id: currentUser.id,
      completed_steps: completedSteps(),
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id" });
    if (error && status) status.textContent = "Checklist sync issue: " + error.message;
  });

  const originalPlan = window.plan;
  if (typeof originalPlan === "function") {
    window.plan = function () {
      originalPlan();
      const output = document.getElementById("planOut");
      lastPlan = output?.innerText || "";
      if (saveMessage) saveMessage.textContent = "";
    };
  }

  client.auth.onAuthStateChange((_event, session) => {
    showAuth(session?.user || null);
  });
  client.auth.getSession().then(({ data }) => showAuth(data.session?.user || null));
})();