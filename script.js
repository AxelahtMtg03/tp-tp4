function updateProgress(current, total, text) {
  const bar = document.querySelector("#progress");
  const counter = document.querySelector("#counter");
  bar.value = total ? (current / total) * 100 : 0;
  bar.textContent = `${current} / ${total}`;
  counter.textContent = `${current} / ${total}`;
  if (text) console.log(text);
}

function doProgressTimer(n) {
  let i = 0;
  updateProgress(0, n, "départ");
  const id = setInterval(() => {
    i++;
    updateProgress(i, n);
    if (i >= n) {
      clearInterval(id);
      updateProgress(n, n, "fini !");
    }
  }, 1000);
}
function getToken() {
  return localStorage.getItem("gh_token") || "";
}

function setToken(token) {
  if (token) {
    localStorage.setItem("gh_token", token);
  } else {
    localStorage.removeItem("gh_token");
  }
}
async function checkLinkAlive(link) {
  const m = link.url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!m) {
    link.status = 0;
    return link;
  }
  const [, owner, repo] = m;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

  const headers = { Accept: "application/vnd.github+json" };

  const token = getToken();
  if (token) headers.Authorization = `token ${token}`;

  try {
    const res = await fetch(apiUrl, { headers });
    link.status = res.status;
    if (res.status === 403) {
      const remaining = res.headers.get("x-ratelimit-remaining");
      const reset = res.headers.get("x-ratelimit-reset");
      link.rateLimited = true;
      link.rateLimitRemaining = remaining;
      link.rateLimitReset = reset;
      return link;
    }
    if (res.ok) {
      const data = await res.json();
      link.apiStars = data.stargazers_count;
      link.description = data.description || link.description;
    }
  } catch (e) {
    link.status = -1;
  }
  return link;
}


function progressLinks(promises) {
  let done = 0;
  const total = promises.length;
  updateProgress(0, total, "Début");

  const wrapped = promises.map((p) =>
    p.then((link) => {
      done++;
      updateProgress(done, total);
      return link;
    })
  );
  return Promise.all(wrapped);
}

async function downloadAndCheck() {
  const file = document.querySelector("#file-selector").value;
  const res = await fetch(file);
  const links = await res.json();

  const promises = links.map((link) => checkLinkAlive(link));
  const results = await progressLinks(promises);
  const rateLimited = results.filter((l) => l.rateLimited);
  if (rateLimited.length > 0) {
    const reset = rateLimited[0].rateLimitReset;
    const resetDate = reset ? new Date(reset * 1000).toLocaleString() : "inconnu";
    const warning = document.querySelector("#rate-limit-warning");
    warning.textContent =
      `${rateLimited.length} requête(s) ont été refusées (HTTP 403). ` +
      `Limite GitHub atteinte. Réinitialisation prévue : ${resetDate}. ` +
      `Ajoutez un token GitHub pour passer à 5000 req/h.`;
    warning.style.display = "block";
  }
  render(results);
}

/* ------------------------------------------------------------------ */
/* 6. Affichage simple des résultats                                  */
/* ------------------------------------------------------------------ */
function render(links) {
  const zone = document.querySelector("#results");
  zone.innerHTML = "";

  links.forEach((link) => {
    const ok = link.status === 200;
    const stars = link.apiStars ?? link.stars;
    const diff = link.apiStars != null ? link.apiStars - link.stars : 0;

    let diffText = "";
    if (diff !== null) {
      const sign = diff >= 0 ? "+" : "";
      diffText = ` (fichier : ${link.stars}, ${sign}${diff})`;
    }

    let statusText = `Statut HTTP : ${link.status}`;
    if (link.status === 403) statusText += " — rate limit atteint";
    if (link.status === 404) statusText += " — projet introuvable";
    if (link.status === -1) statusText += " — erreur réseau";

    const col = document.createElement("div");
    col.className = "column is-half";
    col.innerHTML = `
      <div class="box">
        <h3 class="title is-5">
          <a href="${link.url}" target="_blank">${link.url.replace("https://github.com/", "")}</a>
${
  link.status === 200
    ? "✅"
    : link.status === 404
      ? "❌ (supprimé)"
      : link.status === 403
        ? "⏳ (rate limit)"
        : "⚠️"
}        </h3>
        <p>${link.description || ""}</p>
        <p>
          API : <strong>${stars ?? "?"}</strong>${diffText}
        </p>
        <p>${statusText}</p>
      </div>
    `;
    zone.appendChild(col);
  });
}

document.querySelector("#check-btn").addEventListener("click", downloadAndCheck);
const tokenInput = document.querySelector("#token-input");
tokenInput.value = getToken();
tokenInput.addEventListener("change", (e) => setToken(e.target.value.trim()));