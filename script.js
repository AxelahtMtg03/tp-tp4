/* ------------------------------------------------------------------ */
/* 1. Mise à jour de la barre de progression (fournie)                */
/* ------------------------------------------------------------------ */
function updateProgress(current, total, text) {
  const bar = document.querySelector("#progress");
  const counter = document.querySelector("#counter");
  bar.value = total ? (current / total) * 100 : 0;
  bar.textContent = `${current} / ${total}`;
  counter.textContent = `${current} / ${total}`;
  if (text) console.log(text);
}

/* ------------------------------------------------------------------ */
/* 2. Exercice setInterval : doProgressTimer(n)                       */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/* 3. Vérifie un lien : met à jour l'objet link avec son statut HTTP  */
/* ------------------------------------------------------------------ */
async function checkLinkAlive(link) {
  // https://github.com/owner/repo  ->  https://api.github.com/repos/owner/repo
  const m = link.url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!m) {
    link.status = 0;
    return link;
  }
  const [, owner, repo] = m;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

  const headers = { Accept: "application/vnd.github+json" };

  // (option) token pour passer la limite à 5000 req/h
  const token = localStorage.getItem("gh_token");
  if (token) headers.Authorization = `token ${token}`;

  try {
    const res = await fetch(apiUrl, { headers });
    link.status = res.status;

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

/* ------------------------------------------------------------------ */
/* 4. Ajoute un .then à chaque promesse pour incrémenter la barre     */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/* 5. Télécharge le JSON et lance la vérification en parallèle        */
/* ------------------------------------------------------------------ */
async function downloadAndCheck() {
  const file = document.querySelector("#file-selector").value;
  const res = await fetch(file);
  const links = await res.json();

  const promises = links.map((link) => checkLinkAlive(link));
  const results = await progressLinks(promises);

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

    const col = document.createElement("div");
    col.className = "column is-half";
    col.innerHTML = `
      <div class="box">
        <h3 class="title is-5">
          <a href="${link.url}" target="_blank">${link.url.replace("https://github.com/", "")}</a>
          ${ok ? "✅" : "❌"}
        </h3>
        <p>${link.description || ""}</p>
        <p>
          ⭐ API : <strong>${stars ?? "?"}</strong>
          ${link.apiStars != null ? ` (fichier : ${link.stars}, +${diff})` : ""}
        </p>
        <p>Statut HTTP : ${link.status}</p>
      </div>
    `;
    zone.appendChild(col);
  });
}

/* ------------------------------------------------------------------ */
/* 7. Branchement du bouton                                           */
/* ------------------------------------------------------------------ */
document.querySelector("#check-btn").addEventListener("click", downloadAndCheck);