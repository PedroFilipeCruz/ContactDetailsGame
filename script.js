(function () {
  const SECRET = "UHIRED";

  const tbody = document.getElementById("rows");
  const tiles = document.getElementById("tiles");
  const simMeter = document.getElementById("simMeter");
  const simLabel = document.getElementById("simLabel");
  const currentCode = document.getElementById("currentCode");
  const success = document.getElementById("success");
  const copyBtn = document.getElementById("copyBtn");
  const resetBtn = document.getElementById("resetBtn");

  scrambleRows();
  updateProgress();
  updateArrowDisabledStates();

  // --- Row movement logic ---
  function moveRow(row, direction) {
    if (!row) return;
    const target = (direction === "up") ? row.previousElementSibling : row.nextElementSibling;
    if (!target) return;

    if (direction === "up") {
      tbody.insertBefore(row, target);
    } else {
      tbody.insertBefore(row, target.nextElementSibling);
    }

    row.classList.add("moved");
    setTimeout(() => row.classList.remove("moved"), 500);

    updateProgress();
    updateArrowDisabledStates();
  }

  tbody.addEventListener("click", (e) => {
    const up = e.target.closest(".btn.up");
    const down = e.target.closest(".btn.down");
    if (!up && !down) return;
    const row = e.target.closest("tr");
    moveRow(row, up ? "up" : "down");
  });

  tbody.addEventListener("keydown", (e) => {
    const isArrowUp = e.key === "ArrowUp";
    const isArrowDown = e.key === "ArrowDown";
    if (!isArrowUp && !isArrowDown) return;
    const btn = e.target.closest(".btn");
    if (!btn) return;
    e.preventDefault();
    const row = btn.closest("tr");
    moveRow(row, isArrowUp ? "up" : "down");
  });

  function updateArrowDisabledStates() {
    const rows = Array.from(tbody.querySelectorAll("tr"));
    rows.forEach((r, idx) => {
      const upBtn = r.querySelector(".btn.up");
      const downBtn = r.querySelector(".btn.down");
      if (upBtn) upBtn.disabled = (idx === 0);
      if (downBtn) downBtn.disabled = (idx === rows.length - 1);
    });
  }

  // --- Game logic ---
  function computeCode() {
    return Array.from(tbody.querySelectorAll("tr"))
      .map(tr => (tr.getAttribute("data-key") || "-").toUpperCase())
      .join("");
  }

  function renderTiles(guess) {
    tiles.innerHTML = "";
    const padded = guess.padEnd(SECRET.length).slice(0, SECRET.length);
    const result = scoreWordle(padded, SECRET);
    for (let i = 0; i < SECRET.length; i++) {
      const span = document.createElement("div");
      span.className = "tile " + (result[i] || "bad");
      span.textContent = padded[i] || " ";
      tiles.appendChild(span);
    }
  }

  function scoreWordle(guess, answer) {
    const res = new Array(answer.length).fill("bad");
    const a = answer.split("");
    const g = guess.split("");
    // greens
    for (let i = 0; i < a.length; i++) {
      if (g[i] === a[i]) {
        res[i] = "ok";
        a[i] = null;
        g[i] = null;
      }
    }
    // yellows
    for (let i = 0; i < a.length; i++) {
      if (g[i] && a.includes(g[i])) {
        res[i] = "warn";
        a[a.indexOf(g[i])] = null;
      }
    }
    return res;
  }

  function updateSimilarity(a, b) {
    const dist = levenshtein(a.toUpperCase(), b);
    const maxLen = Math.max(a.length, b.length, 1);
    const sim = Math.max(0, 100 * (1 - dist / maxLen));
    const pct = Math.round(sim);
    simMeter.value = pct;
    simLabel.textContent = pct + "%";
  }

  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[m][n];
  }

  function updateProgress() {
    const code = computeCode();
    currentCode.textContent = code;
    renderTiles(code);
    updateSimilarity(code, SECRET);

    if (code === SECRET) {
      success.hidden = false;
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } else {
      success.hidden = true;
    }
  }

  function scrambleRows() {
    const rows = Array.from(tbody.querySelectorAll("tr"));
    for (let i = rows.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      if (i !== j) {
        tbody.insertBefore(rows[j], rows[i].nextSibling);
        const tmp = rows[i];
        rows[i] = rows[j];
        rows[j] = tmp;
      }
    }
  }

  // --- Buttons inside success panel ---
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const text = [
        "Pedro Cruz",
        "Email: pedro.filipe.matos.cruz@gmail.com",
        "Nº Telefone: +351 917 900 749",
      ].join("\n");
      navigator.clipboard
        .writeText(text)
        .then(() => {
          alert("Detalhes copiados.");
        })
        .catch(() => {
          alert("Couldn't access clipboard. You can copy manually from the card.");
        });
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      scrambleRows();
      updateProgress();
      updateArrowDisabledStates();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
})();
