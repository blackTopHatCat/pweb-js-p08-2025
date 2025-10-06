// external.js (UPDATE lengkap)
// Pastikan file ini direplace di project kamu (ganti file existing)

(function () {
  const current_page = window.location.href.replace(/^.*[\\\/]/, "");

  /* -----------------------
     Helper utilities
  ------------------------*/
  const qs = (s) => document.querySelector(s);
  const qsa = (s) => Array.from(document.querySelectorAll(s));
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const load = (k) => {
    try {
      return JSON.parse(localStorage.getItem(k));
    } catch (e) {
      return null;
    }
  };

  const showLoadingText = (el, text = "Loading...") => {
    if (!el) return;
    el.dataset._old = el.innerHTML;
    el.innerHTML = text;
  };
  const restoreText = (el) => {
    if (!el) return;
    if (el.dataset._old !== undefined) el.innerHTML = el.dataset._old;
  };

  /* -----------------------
     LOGIN PAGE LOGIC
  ------------------------*/
  if (current_page === "login.html" || current_page === "") {
    // ensure we have the elements (login.html awal punya input, tapi belum ada button)
    const usernameInput = qs("#username_input");
    const passwordInput = qs("#password_input");
    const feedback = qs("#login_feedback");

    // If login button doesn't exist (older html), create it under the form
    let submitBtn = qs("#submit_btn");
    if (!submitBtn) {
      submitBtn = document.createElement("button");
      submitBtn.id = "submit_btn";
      submitBtn.type = "button";
      submitBtn.textContent = "LOGIN";
      // put before feedback
      feedback.parentElement.insertBefore(submitBtn, feedback);
    }

    submitBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      feedback.innerText = "";
      const username = (usernameInput.value || "").trim();
      const password = (passwordInput.value || "").trim();

      // Validation rules: username must exist in dummy users, password must not be empty
      if (!username || !password) {
        feedback.innerText = "Username and/or password is empty!";
        return;
      }

      // show loading
      showLoadingText(feedback, "Checking credentials...");

      try {
        // Use users search endpoint to verify username exists (requirement: authenticate using users API)
        const usersRes = await fetch(`https://dummyjson.com/users/search?q=${encodeURIComponent(username)}`);
        const usersJson = await usersRes.json();

        // if fetch failed or no users found -> error
        if (!usersJson || !Array.isArray(usersJson.users) || usersJson.users.length === 0) {
          // fallback: some environments block external request -> show clear message
          feedback.innerText = "Username not found (atau API unreachable).";
          restoreText(feedback);
          return;
        }

        // find exact username match
        const found = usersJson.users.find(u => u.username && u.username.toLowerCase() === username.toLowerCase());
        if (!found) {
          feedback.innerText = "Username not found!";
          restoreText(feedback);
          return;
        }

        // NOTE: dummyjson users data doesn't expose real passwords.
        // Requirement from tugas: "Username harus sesuai dengan data dummy, password tidak boleh kosong."
        // Jadi di sini kita *anggap* password valid jika non-empty (per spesifikasi tugas).
        // Jika kalian ingin testing autentikasi nyata, ubah ke POST /auth/login sesuai docs.
        const userToStore = {
          id: found.id,
          username: found.username,
          firstName: found.firstName || "",
          lastName: found.lastName || "",
          image: found.image || null
        };

        // store user info and juga simpan firstName terpisah (wajib)
        save("response", userToStore);
        save("firstName", found.firstName || found.username || "");

        feedback.innerText = "Success! Redirecting to recipes...";
        // short delay lalu redirect
        setTimeout(() => {
          window.location.href = "recipes.html";
        }, 700);
      } catch (err) {
        console.error(err);
        feedback.innerText = "Network/API error. Coba lagi atau gunakan offline recipes.json.";
      } finally {
        restoreText(feedback);
      }
    });

    return; // done login page
  }

  /* -----------------------
     RECIPES PAGE LOGIC
  ------------------------*/
  // Block access if not logged in
  const storedUser = load("response");
  const storedFirstName = load("firstName");
  if (!storedUser || !storedFirstName) {
    localStorage.clear();
    window.location.href = "login.html";
  }

  // put username in navbar
  const usernameEl = qs("#username");
  if (usernameEl) {
    usernameEl.innerText = storedFirstName;
  }

  // logout handler
  const logoutBtn = qs("#logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.clear();
      window.location.href = "login.html";
    });
  }

  // Add UI placeholders if missing (in case original html didn't include)
  const mainEl = qs("main");
  if (!qs("#controls")) {
    const controls = document.createElement("div");
    controls.id = "controls";
    controls.innerHTML = `
      <div class="controls-row">
        <input id="search_input" placeholder="Search recipes by name, cuisine, ingredient, or tag..." />
        <select id="cuisine_filter"><option value="">All cuisines</option></select>
        <button id="clear_filters">Clear</button>
      </div>
      <div id="recipes_container" class="recipes-grid"></div>
      <div style="text-align:center; margin:16px;">
        <button id="show_more">Show More</button>
      </div>
      <div id="modal_overlay" class="modal-overlay" style="display:none;"></div>
    `;
    mainEl.appendChild(controls);
  }

  // Element refs
  const searchInput = qs("#search_input");
  const cuisineFilter = qs("#cuisine_filter");
  const recipesContainer = qs("#recipes_container");
  const showMoreBtn = qs("#show_more");
  const clearFiltersBtn = qs("#clear_filters");
  const modalOverlay = qs("#modal_overlay");

  // Pagination settings
  let allRecipes = [];
  let filteredRecipes = [];
  let currentIndex = 0;
  const PAGE_SIZE = 6;

  // Fetch recipes from API, fallback to local recipes.json
  async function loadRecipes() {
    try {
      const res = await fetch("https://dummyjson.com/recipes");
      if (!res.ok) throw new Error("remote fetch failed");
      const json = await res.json();
      // dummyjson returns {recipes: [...]} — keep consistent
      allRecipes = json.recipes || [];
    } catch (err) {
      console.warn("Fetch remote recipes failed, using local recipes.json", err);
      // fallback to local file uploaded in project
      try {
        const localRes = await fetch("recipes.json");
        const localJson = await localRes.json();
        allRecipes = localJson.recipes || [];
      } catch (e2) {
        console.error("Local recipes.json not found or parse error", e2);
        recipesContainer.innerHTML = "<p>Unable to load recipes (API and local fallback failed).</p>";
        return;
      }
    }

    // initialize unique cuisines in dropdown
    const cuisines = Array.from(new Set(allRecipes.map(r => r.cuisine).filter(Boolean))).sort();
    cuisines.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.innerText = c;
      cuisineFilter.appendChild(opt);
    });

    // initial filter (none) and render first page
    applyFilters();
  }

  // Render helpers
  function createRecipeCard(recipe) {
    const card = document.createElement("article");
    card.className = "recipe-card";
    card.innerHTML = `
      <img class="recipe-image" src="${recipe.image || ""}" alt="${escapeHtml(recipe.name)}" />
      <div class="card-body">
        <h3 class="r-name">${escapeHtml(recipe.name)}</h3>
        <p class="meta">⏱ ${recipe.cookTimeMinutes ? recipe.cookTimeMinutes + " min" : "N/A"} • ${escapeHtml(recipe.difficulty || "")} • ${escapeHtml(recipe.cuisine || "")}</p>
        <p class="rating">⭐ ${recipe.rating ?? "—"} (${recipe.reviewCount ?? 0})</p>
        <p class="ingredients"><strong>Ingredients:</strong> ${escapeHtml((recipe.ingredients || []).slice(0,4).join(", "))}${(recipe.ingredients && recipe.ingredients.length>4)?", ...":""}</p>
        <div class="card-actions">
          <button class="view_full" data-id="${recipe.id}">View Full Recipe</button>
        </div>
      </div>
    `;
    return card;
  }

  function renderNextPage() {
    const next = filteredRecipes.slice(currentIndex, currentIndex + PAGE_SIZE);
    next.forEach(r => {
      recipesContainer.appendChild(createRecipeCard(r));
    });
    currentIndex += next.length;
    // hide show more if no more
    if (currentIndex >= filteredRecipes.length) {
      showMoreBtn.style.display = "none";
    } else {
      showMoreBtn.style.display = "inline-block";
    }
    // attach handlers for "View Full"
    qsa(".view_full").forEach(btn => {
      if (!btn.dataset.bound) {
        btn.dataset.bound = "1";
        btn.addEventListener("click", (e) => {
          const id = Number(btn.dataset.id);
          const recipe = allRecipes.find(x => x.id === id);
          if (recipe) showRecipeModal(recipe);
        });
      }
    });
  }

  function clearRecipesRender() {
    recipesContainer.innerHTML = "";
    currentIndex = 0;
  }

  function applyFilters() {
    const q = (searchInput.value || "").trim().toLowerCase();
    const cuisine = (cuisineFilter.value || "").trim().toLowerCase();

    filteredRecipes = allRecipes.filter(r => {
      // cuisine filter
      if (cuisine && (r.cuisine || "").toLowerCase() !== cuisine) return false;

      // search across name, cuisine, ingredients, tags
      if (!q) return true;

      const fields = [];
      fields.push((r.name || "").toLowerCase());
      fields.push((r.cuisine || "").toLowerCase());
      fields.push(((r.ingredients || []).join(" ") || "").toLowerCase());
      fields.push(((r.tags || []).join(" ") || "").toLowerCase());

      return fields.some(f => f.includes(q));
    });

    // reset and render
    clearRecipesRender();
    if (filteredRecipes.length === 0) {
      recipesContainer.innerHTML = "<p>No recipes found.</p>";
      showMoreBtn.style.display = "none";
      return;
    }
    renderNextPage();
  }

  // Debounce util
  function debounce(fn, wait = 300) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  // Modal / detail view
  function showRecipeModal(recipe) {
    modalOverlay.style.display = "block";
    modalOverlay.innerHTML = `
      <div class="modal-card">
        <button id="modal_close" class="modal-close">X</button>
        <img src="${recipe.image || ""}" alt="${escapeHtml(recipe.name)}" class="modal-image"/>
        <h2>${escapeHtml(recipe.name)}</h2>
        <p class="meta">⏱ ${recipe.prepTimeMinutes ?? 0} + ${recipe.cookTimeMinutes ?? 0} min • ${escapeHtml(recipe.difficulty || "")} • ${escapeHtml(recipe.cuisine || "")}</p>
        <p><strong>Rating:</strong> ⭐ ${recipe.rating ?? "—"} (${recipe.reviewCount ?? 0})</p>
        <h4>Ingredients</h4>
        <ul>${(recipe.ingredients || []).map(i => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
        <h4>Instructions</h4>
        <ol>${(recipe.instructions || []).map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ol>
      </div>
    `;

    qs("#modal_close").addEventListener("click", closeModal);
    modalOverlay.addEventListener("click", (ev) => {
      if (ev.target === modalOverlay) closeModal();
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeModal() {
    modalOverlay.style.display = "none";
    modalOverlay.innerHTML = "";
  }

  function escapeHtml(str) {
    if (typeof str !== "string") return String(str || "");
    return str.replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[m]);
  }

  // Attach controls
  if (searchInput) {
    searchInput.addEventListener("input", debounce(() => {
      applyFilters();
    }, 300));
  }
  if (cuisineFilter) {
    cuisineFilter.addEventListener("change", () => {
      applyFilters();
    });
  }
  if (showMoreBtn) {
    showMoreBtn.addEventListener("click", (e) => {
      e.preventDefault();
      renderNextPage();
    });
  }
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (searchInput) searchInput.value = "";
      if (cuisineFilter) cuisineFilter.value = "";
      applyFilters();
    });
  }

  // small CSS insert for modal and grid (in case style.css missing these)
  (function injectSmallStyles() {
    const css = `
      .recipes-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(260px,1fr)); gap:12px; padding:16px; }
      .recipe-card { background:#1e1e1e; border:1px solid #333; border-radius:8px; overflow:hidden; color:var(--text-color); display:flex; flex-direction:column; }
      .recipe-image { width:100%; height:160px; object-fit:cover; background:#222; }
      .card-body { padding:12px; flex:1; display:flex; flex-direction:column; gap:8px; }
      .r-name { margin:0; font-size:1.1rem; }
      .meta { margin:0; font-size:.9rem; color:#bfbfbf; }
      .ingredients { margin:0; font-size:.85rem; color:#ddd; }
      .card-actions { margin-top:auto; display:flex; justify-content:flex-end; gap:8px; }
      .card-actions button { padding:6px 10px; border-radius:6px; border:0; background:var(--accent-color); color:var(--bg-color); cursor:pointer; }
      /* modal */
      .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:9999; }
      .modal-card { background:#fff; color:#000; width:min(900px,95%); max-height:90vh; overflow:auto; border-radius:8px; padding:16px; position:relative; }
      .modal-close { position:absolute; right:8px; top:8px; border:0; background:#eee; padding:6px 8px; cursor:pointer; border-radius:6px; }
      .modal-image { width:100%; max-height:320px; object-fit:cover; border-radius:6px; }
      #controls { padding:12px 16px; }
      .controls-row { display:flex; gap:8px; align-items:center; margin-bottom:8px; flex-wrap:wrap; }
      #search_input { padding:8px; min-width:220px; flex:1; }
      #cuisine_filter, #clear_filters { padding:8px; }
    `;
    const style = document.createElement("style");
    style.innerText = css;
    document.head.appendChild(style);
  })();

  // finally load the recipes
  loadRecipes();

})();
