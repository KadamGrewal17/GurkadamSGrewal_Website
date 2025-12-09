// ------------------------------
// Theme handling
// ------------------------------
const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");

function getPreferredTheme() {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light" : "dark";
}

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "light" ? "🌞 Theme" : "🌙 Theme";
}

applyTheme(getPreferredTheme());

themeToggle.addEventListener("click", () => {
  const current = root.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  localStorage.setItem("theme", next);
  applyTheme(next);
});

// ------------------------------
// Footer year
// ------------------------------
document.getElementById("year").textContent = new Date().getFullYear();

// ------------------------------
// Scroll reveal
// ------------------------------
const revealEls = Array.from(document.querySelectorAll(".reveal"));
const obs = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) e.target.classList.add("visible");
  }
}, { threshold: 0.12 });

revealEls.forEach(el => obs.observe(el));

// ------------------------------
// Projects: Search + Sort
// ------------------------------
const grid = document.getElementById("projectsGrid");
const searchInput = document.getElementById("projectSearch");
const sortSelect = document.getElementById("sortSelect");

function getCards() {
  return Array.from(grid.querySelectorAll(".project-card"));
}

function filterCards() {
  const q = (searchInput.value || "").trim().toLowerCase();
  getCards().forEach(card => {
    const name = (card.dataset.name || "").toLowerCase();
    const desc = (card.querySelector(".project-desc")?.textContent || "").toLowerCase();
    const match = !q || name.includes(q) || desc.includes(q);
    card.style.display = match ? "" : "none";
  });
}

function sortCards() {
  const mode = sortSelect.value;
  const cards = getCards();

  const byName = (a, b) => (a.dataset.name || "").localeCompare(b.dataset.name || "");
  const byStars = (a, b) => Number(b.dataset.stars || 0) - Number(a.dataset.stars || 0);
  const byUpdated = (a, b) => new Date(b.dataset.updated || 0) - new Date(a.dataset.updated || 0);

  let sorted = cards.slice();
  if (mode === "name") sorted.sort(byName);
  else if (mode === "stars") sorted.sort(byStars);
  else if (mode === "updated") sorted.sort(byUpdated);

  sorted.forEach(c => grid.appendChild(c));
}

searchInput.addEventListener("input", filterCards);
sortSelect.addEventListener("change", () => { sortCards(); filterCards(); });

// ------------------------------
// Load projects from GitHub (optional)
// ------------------------------
const loadBtn = document.getElementById("loadGithubBtn");
const githubBtn = document.getElementById("githubBtn");

const GITHUB_USERNAME = "KadamGrewal17"; // <-- change this

githubBtn.href = `https://github.com/${GITHUB_USERNAME}`;

function createGithubCard(repo) {
  const card = document.createElement("article");
  card.className = "project-card reveal visible";
  card.dataset.name = repo.name || "";
  card.dataset.stars = repo.stargazers_count || 0;
  card.dataset.updated = repo.updated_at || "";

  const topics = (repo.topics || []).slice(0, 4);

  card.innerHTML = `
    <div class="project-top">
      <div>
        <h3 class="project-name">${repo.name}</h3>
        <div class="project-meta">
          ${repo.language ? repo.language + " • " : ""}⭐ ${repo.stargazers_count ?? 0}
        </div>
      </div>
      ${repo.private ? `<span class="tag">Private</span>` : `<span class="tag">GitHub</span>`}
    </div>
    <p class="project-desc">
      ${repo.description ? repo.description : "No description provided yet."}
    </p>
    <div class="tag-row">
      ${topics.length ? topics.map(t => `<span class="tag">${t}</span>`).join("") : `<span class="tag">No topics</span>`}
    </div>
    <div class="project-links">
      <a class="btn" href="${repo.html_url}" target="_blank" rel="noreferrer">Code</a>
      ${repo.homepage ? `<a class="btn" href="${repo.homepage}" target="_blank" rel="noreferrer">Live</a>` : ""}
    </div>
  `;
  return card;
}

async function loadFromGithub() {
  if (!GITHUB_USERNAME || GITHUB_USERNAME === "YOUR_GITHUB") {
    alert("Update GITHUB_USERNAME in script.js first.");
    return;
  }

  loadBtn.disabled = true;
  loadBtn.textContent = "Loading...";

  try {
    const res = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`, {
      headers: { "Accept": "application/vnd.github+json" }
    });

    if (!res.ok) throw new Error("GitHub request failed.");

    const repos = await res.json();

    const cleaned = repos
      .filter(r => !r.fork)
      .slice(0, 12);

    cleaned.forEach(repo => grid.appendChild(createGithubCard(repo)));

    sortSelect.value = "updated";
    sortCards();
    filterCards();

  } catch (err) {
    console.error(err);
    alert("Could not load GitHub projects. Try again later or add manual projects.");
  } finally {
    loadBtn.disabled = false;
    loadBtn.textContent = "⬇️ Load from GitHub";
  }
}

loadBtn.addEventListener("click", loadFromGithub);
