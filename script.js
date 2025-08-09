(function () {
  const SECRET = "HIREME";

  const table = document.getElementById("tradeTable");
  const tbody = document.getElementById("rows");
  const tiles = document.getElementById("tiles");
  const simMeter = document.getElementById("simMeter");
  const simLabel = document.getElementById("simLabel");
  const currentCode = document.getElementById("currentCode");
  const success = document.getElementById("success");
  const copyBtn = document.getElementById("copyBtn");
  const resetBtn = document.getElementById("resetBtn");

  // Randomize order so it's not solved initially
  scrambleRows();
  updateProgress();

  // ---- Pointer Events drag & drop (works on touch + mouse) ----
  let draggedRow = null;

  // Delegate: start drag from handle only
  tbody.addEventListener("pointerdown", (e) => {
    const handle = e.target.closest(".handle");
    if (!handle) return;
    const row = handle.closest("tr");
    if (!row || !tbody.contains(row)) return;

    draggedRow = row;
    row.classList.add("dragging");

    // Capture pointer so we keep getting move/up events even if we leave the handle
    handle.setPointerCapture(e.pointerId);
    e.preventDefault(); // avoid text selection / scroll during drag
  });

  tbody.addEventListener("pointermove", (e) => {
    if (!draggedRow) return;
    const y = e.clientY;
    const rows = [...tbody.querySelectorAll("tr:not(.dragging)")];

    // Find the first row whose midpoint is below the cursor
    let nextRow = null;
    for (const r of rows) {
      const rect = r.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      if (y < midpoint) {
        nextRow = r;
        break;
      }
    }
    tbody.insertBefore(draggedRow, nextRow);
  });

  tbody.addEventListener("pointerup", () => {
    if (!draggedRow) return;
    draggedRow.classList.remove("dragging");
    draggedRow = null;
    updateProgress();
  });

  // ---- Game logic ----
  function computeCode() {
    const letters = Array.from(tbody.querySelectorAll("tr")).map((tr) => {
      const key = tr.getAttribute("data-key");
      if (key) return key.toUpperCase();
      const strong = tr.querySelector("td:last-child strong");
      return strong ? (strong.textContent.trim()[0] || "-").toUpperCase() : "-";
    });
    return letters.join("");
  }

  function renderTiles(guess) {
    tiles.innerHTML = "";
    const padded = guess.padEnd(SECRET.length).slice(0, SECRET.length);
    const result = scoreWordle(padded, SECRET);
    for (let i = 0; i < SECRET.length; i++) {
      const span = document.createElement("div");
      span.className = "tile " + (result[i] || "bad");
      span.textContent = padded[i] ? padded[i] : " ";
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
    const m = a.length,
      n = b.length;
    const dp = Array.from({ length: m + 1 }, () =>
      new Array(n + 1).fill(0)
    );
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

  // Buttons inside success panel
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const text = [
        "Pedro Cruz",
        "Código: HIREME",
        "Email: pedro.filipe.matos.cruz@gmail.com",
        "Nº Telefone: +351 917 900 749",
      ].join("\n");
      navigator.clipboard
        .writeText(text)
        .then(() => {
          alert("Contact details copied to clipboard.");
        })
        .catch(() => {
          alert(
            "Couldn't access clipboard. You can copy manually from the card."
          );
        });
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      scrambleRows();
      updateProgress();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
})();
