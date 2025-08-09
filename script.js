(function(){
  const SECRET = "HIREME";

  const table = document.getElementById("tradeTable");
  const tbody = table.querySelector("tbody");
  const tiles = document.getElementById("tiles");
  const simMeter = document.getElementById("simMeter");
  const simLabel = document.getElementById("simLabel");
  const currentCode = document.getElementById("currentCode");
  const success = document.getElementById("success");
  const copyBtn = document.getElementById("copyBtn");
  const resetBtn = document.getElementById("resetBtn");

  // Initialize: randomize order so it's not already solved
  scrambleRows();

  // Set up drag-and-drop
  let dragSrc = null;
  Array.from(tbody.querySelectorAll("tr")).forEach(attachDnD);

  function attachDnD(row){
    row.addEventListener("dragstart", (e)=>{
      dragSrc = row;
      row.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", "row");
    });
    row.addEventListener("dragend", ()=>{
      row.classList.remove("dragging");
      dragSrc = null;
    });
    row.addEventListener("dragover", (e)=>{
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const target = getRowFromEvent(e);
      if (!target || target === dragSrc) return;
      const rect = target.getBoundingClientRect();
      const before = (e.clientY - rect.top) < rect.height / 2;
      tbody.insertBefore(dragSrc, before ? target : target.nextSibling);
      updateProgress();
    });
  }

  function getRowFromEvent(e){
    let el = e.target;
    while (el && el.tagName !== "TR"){
      el = el.parentElement;
    }
    return el && el.parentElement === tbody ? el : null;
  }

  // Build current code from first letter of Note strong tag per row
  function computeCode(){
    const letters = Array.from(tbody.querySelectorAll("tr")).map(tr => {
      // prefer data-key for robustness; fallback to parsing Note
      const key = tr.getAttribute("data-key");
      if (key) return key;
      const strong = tr.querySelector("td:last-child strong");
      return strong ? (strong.textContent.trim()[0] || "-").toUpperCase() : "-";
    });
    return letters.join("");
  }

  function renderTiles(guess){
    tiles.innerHTML = "";
    const padded = guess.padEnd(SECRET.length).slice(0, SECRET.length);
    const result = scoreWordle(padded, SECRET);
    for (let i=0; i<SECRET.length; i++){
      const span = document.createElement("div");
      span.className = "tile " + (result[i] || "bad");
      span.textContent = padded[i] ? padded[i] : " ";
      tiles.appendChild(span);
    }
  }

  function scoreWordle(guess, answer){
    const res = new Array(answer.length).fill("bad");
    const a = answer.split("");
    const g = guess.split("");
    // greens
    for (let i=0;i<a.length;i++){
      if (g[i] === a[i]){
        res[i] = "ok";
        a[i] = null;
        g[i] = null;
      }
    }
    // yellows
    for (let i=0;i<a.length;i++){
      if (g[i] && a.includes(g[i])){
        res[i] = "warn";
        a[a.indexOf(g[i])] = null;
      }
    }
    return res;
  }

  function updateSimilarity(a, b){
    const dist = levenshtein(a.toUpperCase(), b);
    const maxLen = Math.max(a.length, b.length, 1);
    const sim = Math.max(0, 100 * (1 - dist / maxLen));
    simMeter.value = Math.round(sim);
    simLabel.textContent = Math.round(sim) + "%";
  }

  function levenshtein(a, b){
    const m = a.length, n = b.length;
    const dp = Array.from({length:m+1}, ()=>new Array(n+1).fill(0));
    for (let i=0;i<=m;i++) dp[i][0] = i;
    for (let j=0;j<=n;j++) dp[0][j] = j;
    for (let i=1;i<=m;i++){
      for (let j=1;j<=n;j++){
        const cost = a[i-1] === b[j-1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + cost);
      }
    }
    return dp[m][n];
  }

  function updateProgress(){
    const code = computeCode();
    currentCode.textContent = code;
    renderTiles(code);
    updateSimilarity(code, SECRET);
    if (code === SECRET){
      success.hidden = false;
      window.scrollTo({top: document.body.scrollHeight, behavior: "smooth"});
    } else {
      success.hidden = true;
    }
  }

  function scrambleRows(){
    const rows = Array.from(tbody.querySelectorAll("tr"));
    // Fisher-Yates shuffle
    for (let i = rows.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      if (i !== j){
        tbody.insertBefore(rows[j], rows[i].nextSibling);
        // swap in our local array too
        const tmp = rows[i];
        rows[i] = rows[j];
        rows[j] = tmp;
      }
    }
  }

  // Buttons inside success panel
  document.getElementById("copyBtn").addEventListener("click", ()=>{
    const text = [
      "Pedro Cruz",
      "Código: HIREME",
      "Email: pedro.filipe.matos.cruz@gmail.com",
      "Nº Telefone: +351 917 900 749"
    ].join("\\n");
    navigator.clipboard.writeText(text).then(()=>{
      alert("Contact details copied to clipboard.");
    }).catch(()=>{
      alert("Couldn't access clipboard. You can copy manually from the card.");
    });
  });
  document.getElementById("resetBtn").addEventListener("click", ()=>{
    scrambleRows();
    updateProgress();
    window.scrollTo({top:0, behavior:"smooth"});
  });

  // Initial draw
  updateProgress();
})();