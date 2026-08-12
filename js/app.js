/* ==========================================================
   NIRMAN HISAB — Construction Accounting App
   Pure vanilla JS. Data stored in localStorage on this device.
   ========================================================== */

const STORAGE_KEY = "nirmanHisabData_v1";

const EXPENSE_CATS = [
  { v: "Material", icon: "🧱" },
  { v: "Majdoori (Labor)", icon: "👷" },
  { v: "Transport", icon: "🚚" },
  { v: "Machinery/Rent", icon: "⚙️" },
  { v: "Other Kharch", icon: "📌" },
];
const INCOME_CATS = [
  { v: "Client Payment", icon: "💰" },
  { v: "Advance Mila", icon: "💵" },
  { v: "Other Income", icon: "➕" },
];
const ALL_CATS = [...EXPENSE_CATS, ...INCOME_CATS];

/* ---------------- STATE ---------------- */
let data = loadData();
let state = {
  tab: "dashboard",
  ledgerSiteId: "all",
  ledgerSearch: "",
  editEntryId: null, // when set, add-form edits this entry instead of creating new
  addType: "expense",
  addCategory: EXPENSE_CATS[0].v,
};

/* ---------------- STORAGE ---------------- */
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("load failed", e);
  }
  return { sites: [], entries: [] };
}
function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    toast("Save nahi ho paaya — device storage full ho sakta hai");
  }
}

/* ---------------- HELPERS ---------------- */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function fmtAmt(n) {
  const v = Math.round(Number(n) || 0);
  return "₹" + Math.abs(v).toLocaleString("en-IN");
}
function fmtDate(s) {
  try {
    const d = new Date(s + "T00:00:00");
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch (e) {
    return s;
  }
}
function esc(s) {
  if (s === undefined || s === null) return "";
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function catIcon(cat) {
  const f = ALL_CATS.find((c) => c.v === cat);
  return f ? f.icon : "📌";
}
function toast(msg) {
  const el = document.getElementById("toast") || (() => {
    const t = document.createElement("div");
    t.id = "toast";
    document.body.appendChild(t);
    return t;
  })();
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2200);
}

/* ---------------- DERIVED TOTALS ---------------- */
function computeTotals() {
  let income = 0, expense = 0;
  data.entries.forEach((e) => (e.type === "income" ? (income += e.amount) : (expense += e.amount)));
  return { income, expense, balance: income - expense };
}
function computeSiteTotals() {
  const map = {};
  data.sites.forEach((s) => (map[s.id] = { income: 0, expense: 0, count: 0 }));
  data.entries.forEach((e) => {
    const key = e.siteId || "__general__";
    if (!map[key]) map[key] = { income: 0, expense: 0, count: 0 };
    map[key].count++;
    if (e.type === "income") map[key].income += e.amount;
    else map[key].expense += e.amount;
  });
  return map;
}

/* ---------------- HEADER ---------------- */
function renderHeader() {
  const t = computeTotals();
  document.getElementById("totalBalance").textContent = (t.balance >= 0 ? "+" : "−") + fmtAmt(t.balance);
  document.getElementById("totalBalance").style.color = t.balance >= 0 ? "#2F7D5A" : "#B23A2E";
  document.getElementById("totalIncome").textContent = fmtAmt(t.income);
  document.getElementById("totalExpense").textContent = fmtAmt(t.expense);
}

/* ---------------- ROUTER ---------------- */
function setTab(tab) {
  state.tab = tab;
  if (tab === "add") state.editEntryId = null;
  render();
}
function render() {
  renderHeader();
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === state.tab));
  const content = document.getElementById("content");
  if (state.tab === "dashboard") content.innerHTML = viewDashboard();
  else if (state.tab === "sites") content.innerHTML = viewSites();
  else if (state.tab === "add") content.innerHTML = viewAddEntry();
  else if (state.tab === "ledger") content.innerHTML = viewLedger();
  else if (state.tab === "settings") content.innerHTML = viewSettings();
  attachHandlers();
}

/* ---------------- DASHBOARD ---------------- */
function viewDashboard() {
  const siteTotals = computeSiteTotals();
  if (data.sites.length === 0) {
    return `
      <div class="section-label">SITE-WISE HISAB</div>
      <div class="empty-card">
        <div style="font-size:28px;margin-bottom:8px;">🏗️</div>
        Abhi koi site nahi hai.<br/>Pehle apni construction site add karo, phir uska hisab rakhna shuru karo.
        <div style="margin-top:14px;"><button class="primary-btn" data-goto="sites">Site Add Karo</button></div>
      </div>`;
  }
  const cards = data.sites
    .map((s) => {
      const t = siteTotals[s.id] || { income: 0, expense: 0, count: 0 };
      const bal = t.income - t.expense;
      return `
      <button class="site-card" data-select-site="${s.id}">
        <div class="site-card-top">
          <div class="site-name">${esc(s.name)}</div>
          <div class="site-entries">${t.count} entries</div>
        </div>
        ${s.client ? `<div class="site-client">Client: ${esc(s.client)}</div>` : ""}
        <div class="site-card-bottom">
          <div class="site-stat-col"><span class="income-text">Aaya</span><span class="mono">${fmtAmt(t.income)}</span></div>
          <div class="site-stat-col"><span class="expense-text">Gaya</span><span class="mono">${fmtAmt(t.expense)}</span></div>
          <div class="site-stat-col"><span style="color:var(--steel)">Balance</span><span class="mono" style="color:${bal >= 0 ? "var(--income)" : "var(--expense)"};font-weight:600;">${bal >= 0 ? "+" : "−"}${fmtAmt(bal)}</span></div>
        </div>
      </button>`;
    })
    .join("");
  return `
    <div class="section-label-row">
      <div class="section-label">SITE-WISE HISAB</div>
      <button class="link-btn" data-goto="sites">+ Nayi Site</button>
    </div>
    <div class="site-grid">${cards}</div>
    <div style="margin-top:18px;"><button class="primary-btn" data-goto="add">➕ Nayi Entry Daalo</button></div>
  `;
}

/* ---------------- SITES ---------------- */
function viewSites(openForm) {
  const siteTotals = computeSiteTotals();
  const rows = data.sites
    .map((s) => {
      const t = siteTotals[s.id] || { income: 0, expense: 0, count: 0 };
      const bal = t.income - t.expense;
      return `
      <div class="site-list-row">
        <div style="flex:1;">
          <div class="site-name">${esc(s.name)}</div>
          <div class="site-meta">${[s.client, s.location, s.startDate ? "shuru: " + fmtDate(s.startDate) : ""].filter(Boolean).join(" · ")}</div>
        </div>
        <div class="mono" style="color:${bal >= 0 ? "var(--income)" : "var(--expense)"};margin-right:10px;">${bal >= 0 ? "+" : "−"}${fmtAmt(bal)}</div>
        <button class="delete-btn" data-delete-site="${s.id}" aria-label="Delete site">✕</button>
      </div>`;
    })
    .join("");

  return `
    <div class="section-label-row">
      <div class="section-label">MERI SITES</div>
      <button class="link-btn" id="toggleSiteForm">${openForm ? "Band Karo" : "+ Nayi Site"}</button>
    </div>
    ${openForm ? `
    <form id="siteForm" class="card">
      <div class="field"><span class="field-label">Site ka naam *</span><input class="input" id="siteName" placeholder="e.g. Sharma Villa, Sector 12" /></div>
      <div class="field"><span class="field-label">Client ka naam</span><input class="input" id="siteClient" placeholder="e.g. Rajesh Sharma" /></div>
      <div class="field"><span class="field-label">Location</span><input class="input" id="siteLocation" placeholder="e.g. Sector 12, Gurugram" /></div>
      <div class="field"><span class="field-label">Shuru hone ki date</span><input class="input" type="date" id="siteStart" value="${todayStr()}" /></div>
      <button type="submit" class="primary-btn">Site Save Karo</button>
    </form>` : ""}
    <div style="margin-top:14px;">${rows || `<div class="empty-card">Koi site nahi hai.</div>`}</div>
  `;
}

/* ---------------- ADD / EDIT ENTRY ---------------- */
function viewAddEntry() {
  const editing = state.editEntryId ? data.entries.find((e) => e.id === state.editEntryId) : null;
  const type = editing ? editing.type : state.addType;
  const cats = type === "expense" ? EXPENSE_CATS : INCOME_CATS;
  const category = editing ? editing.category : state.addCategory;
  const meta = editing && editing.meta ? editing.meta : {};

  const siteOptions = data.sites
    .map((s) => `<option value="${s.id}" ${editing && editing.siteId === s.id ? "selected" : ""}>${esc(s.name)}</option>`)
    .join("");

  const catChips = cats
    .map((c) => `<button type="button" class="cat-btn ${category === c.v ? "active" : ""}" data-cat="${esc(c.v)}">${c.icon} ${esc(c.v)}</button>`)
    .join("");

  let calcHtml = "";
  if (category === "Material") {
    calcHtml = `
      <div class="calc-row">
        <div class="field"><span class="field-label">Quantity</span><input class="input" type="number" id="fQty" value="${meta.qty || ""}" placeholder="0" /></div>
        <div class="field"><span class="field-label">Unit</span><input class="input" id="fUnit" value="${meta.unit || "bag"}" placeholder="bag/kg/cft" /></div>
        <div class="field"><span class="field-label">Rate/unit</span><input class="input" type="number" id="fRate" value="${meta.rate || ""}" placeholder="0" /></div>
      </div>`;
  } else if (category === "Majdoori (Labor)") {
    calcHtml = `
      <div class="calc-row">
        <div class="field"><span class="field-label">Mazdoor (count)</span><input class="input" type="number" id="fWorkers" value="${meta.workers || ""}" placeholder="0" /></div>
        <div class="field"><span class="field-label">Din (days)</span><input class="input" type="number" id="fDays" value="${meta.days || ""}" placeholder="0" /></div>
        <div class="field"><span class="field-label">Rate/din</span><input class="input" type="number" id="fWage" value="${meta.wage || ""}" placeholder="0" /></div>
      </div>`;
  }

  let partyLabel = "Naam (optional)";
  if (category === "Material") partyLabel = "Dukaan / Vendor ka naam";
  else if (category === "Majdoori (Labor)") partyLabel = "Thekedar / Mistri ka naam";
  else if (category === "Client Payment") partyLabel = "Client ka naam";

  return `
    <div class="section-label-row">
      <div class="section-label">${editing ? "ENTRY EDIT KARO" : "NAYI ENTRY"}</div>
      ${editing ? `<button class="link-btn" id="cancelEdit">Cancel</button>` : ""}
    </div>

    <div class="toggle-row">
      <button type="button" class="toggle-btn ${type === "expense" ? "active-expense" : ""}" data-type="expense">▼ Kharch (Expense)</button>
      <button type="button" class="toggle-btn ${type === "income" ? "active-income" : ""}" data-type="income">▲ Aamdani (Income)</button>
    </div>

    <form id="entryForm" class="card">
      <div class="field">
        <span class="field-label">Site</span>
        <select class="input" id="fSite">
          <option value="">General (koi site nahi)</option>
          ${siteOptions}
        </select>
      </div>

      <div class="field">
        <span class="field-label">Category</span>
        <div class="cat-grid" id="catGrid">${catChips}</div>
      </div>

      <div id="calcFields">${calcHtml}</div>

      <div class="field"><span class="field-label" id="partyLabel">${partyLabel}</span><input class="input" id="fParty" value="${editing ? esc(editing.party || "") : ""}" placeholder="Naam likho" /></div>
      <div class="field"><span class="field-label">Date</span><input class="input" type="date" id="fDate" value="${editing ? editing.date : todayStr()}" /></div>
      <div class="field"><span class="field-label">Amount (₹) *</span><input class="input mono" style="font-size:18px;" type="number" id="fAmount" value="${editing ? editing.amount : ""}" placeholder="0" /></div>
      <div class="field"><span class="field-label">Note (optional)</span><input class="input" id="fNote" value="${editing ? esc(editing.note || "") : ""}" placeholder="Kuch aur likhna ho toh" /></div>

      <button type="submit" class="primary-btn">${editing ? "Update Karo" : "Entry Save Karo"}</button>
      ${editing ? `<button type="button" class="danger-btn" id="deleteFromEdit">Entry Delete Karo</button>` : ""}
    </form>
  `;
}

/* set the selected site after render (since <option selected> from state var needs siteId match for General too) */
function postRenderAddEntrySiteSelect() {
  const editing = state.editEntryId ? data.entries.find((e) => e.id === state.editEntryId) : null;
  const sel = document.getElementById("fSite");
  if (sel) sel.value = editing ? editing.siteId || "" : "";
}

/* ---------------- LEDGER ---------------- */
function viewLedger() {
  let list = data.entries;
  if (state.ledgerSiteId !== "all") list = list.filter((e) => (e.siteId || "") === state.ledgerSiteId);
  if (state.ledgerSearch.trim()) {
    const q = state.ledgerSearch.trim().toLowerCase();
    list = list.filter((e) => (e.party || "").toLowerCase().includes(q) || (e.note || "").toLowerCase().includes(q) || (e.category || "").toLowerCase().includes(q));
  }
  const asc = [...list].sort((a, b) => (a.date + a.id > b.date + b.id ? 1 : -1));
  let running = 0;
  const withBalance = asc.map((e) => {
    running += e.type === "income" ? e.amount : -e.amount;
    return { ...e, running };
  });
  const rows = withBalance
    .reverse()
    .map((e) => {
      const siteLabel = state.ledgerSiteId === "all" ? `<div class="ledger-tag">${e.siteId ? esc(siteName(e.siteId)) : "General"}</div>` : "";
      return `
      <div class="ledger-row ${e.type}">
        <div class="ledger-row-top">
          <span class="ledger-date">${fmtDate(e.date)}</span>
          <span class="mono" style="font-weight:600;color:${e.type === "income" ? "var(--income)" : "var(--expense)"};">${e.type === "income" ? "+" : "−"}${fmtAmt(e.amount)}</span>
        </div>
        <div class="ledger-row-mid">
          <span>${catIcon(e.category)} ${esc(e.category)}${e.party ? " — " + esc(e.party) : ""}</span>
          <span class="ledger-actions">
            <button class="edit-btn-sm" data-edit-entry="${e.id}">✎</button>
            <button class="delete-btn-sm" data-delete-entry="${e.id}">✕</button>
          </span>
        </div>
        ${siteLabel}
        ${e.note ? `<div class="ledger-note">${esc(e.note)}</div>` : ""}
        <div class="ledger-balance">Balance: <span class="mono">${e.running >= 0 ? "+" : "−"}${fmtAmt(e.running)}</span></div>
      </div>`;
    })
    .join("");

  const siteOptions = data.sites.map((s) => `<option value="${s.id}" ${state.ledgerSiteId === s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("");

  return `
    <div class="section-label">LEDGER (रजिस्टर)</div>
    <select class="input" id="ledgerSiteSelect" style="margin-bottom:8px;">
      <option value="all" ${state.ledgerSiteId === "all" ? "selected" : ""}>Sabhi Sites</option>
      <option value="" ${state.ledgerSiteId === "" ? "selected" : ""}>General (koi site nahi)</option>
      ${siteOptions}
    </select>
    <input class="input" id="ledgerSearch" placeholder="🔍 Naam, note ya category se dhundo" value="${esc(state.ledgerSearch)}" style="margin-bottom:12px;" />
    ${rows ? `<div class="ledger-book">${rows}</div>` : `<div class="empty-card">Is filter ke liye abhi koi entry nahi hai.</div>`}
  `;
}
function siteName(id) {
  const s = data.sites.find((x) => x.id === id);
  return s ? s.name : "Deleted Site";
}

/* ---------------- SETTINGS ---------------- */
function viewSettings() {
  return `
    <div class="section-label">SETTINGS</div>

    <div class="section-label-row"><div class="field-label">DATA BACKUP</div></div>
    <div class="settings-row">
      <button class="secondary-btn" id="backupBtn">⬇️ Backup Download Karo (.json)</button>
      <button class="secondary-btn" id="restoreBtn">⬆️ Backup Se Restore Karo</button>
      <div class="settings-note">Ye app sirf isi phone/browser mein data save karta hai. Naya phone lene se pehle, ya Chrome/Safari data clear karne se pehle, backup zaroor download kar lo.</div>
    </div>

    <div class="section-label-row"><div class="field-label">REPORT EXPORT</div></div>
    <div class="settings-row">
      <select class="input" id="csvSiteSelect">
        <option value="all">Sabhi Sites</option>
        <option value="">General (koi site nahi)</option>
        ${data.sites.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("")}
      </select>
      <button class="secondary-btn" id="csvBtn">📄 CSV Report Download Karo</button>
    </div>

    <div class="section-label-row"><div class="field-label">DANGER ZONE</div></div>
    <div class="settings-row">
      <button class="danger-btn" id="clearBtn">🗑️ Sab Data Delete Karo</button>
    </div>

    <div class="settings-note" style="margin-top:20px;">Nirman Hisab v1.0 — poora data sirf tumhare device par, offline rehta hai.</div>
  `;
}

/* ---------------- HANDLERS ---------------- */
function attachHandlers() {
  document.querySelectorAll("[data-goto]").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.goto)));
  document.querySelectorAll("[data-select-site]").forEach((b) =>
    b.addEventListener("click", () => {
      state.ledgerSiteId = b.dataset.selectSite;
      setTab("ledger");
    })
  );

  /* SITES TAB */
  const toggleSiteForm = document.getElementById("toggleSiteForm");
  if (toggleSiteForm) {
    toggleSiteForm.addEventListener("click", () => {
      document.getElementById("content").innerHTML = viewSites(!document.getElementById("siteForm"));
      attachHandlers();
    });
  }
  const siteForm = document.getElementById("siteForm");
  if (siteForm) {
    siteForm.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const name = document.getElementById("siteName").value.trim();
      if (!name) return toast("Site ka naam likho");
      data.sites.push({
        id: uid(),
        name,
        client: document.getElementById("siteClient").value.trim(),
        location: document.getElementById("siteLocation").value.trim(),
        startDate: document.getElementById("siteStart").value || todayStr(),
      });
      saveData();
      toast("Site add ho gayi ✅");
      document.getElementById("content").innerHTML = viewSites(false);
      attachHandlers();
      renderHeader();
    });
  }
  document.querySelectorAll("[data-delete-site]").forEach((b) =>
    b.addEventListener("click", () => {
      const id = b.dataset.deleteSite;
      const hasEntries = data.entries.some((e) => e.siteId === id);
      if (hasEntries && !confirm("Is site se entries judi hain. Site delete hone par woh entries 'General' ban jayengi. Continue?")) return;
      if (!hasEntries && !confirm("Ye site delete karni hai?")) return;
      data.sites = data.sites.filter((s) => s.id !== id);
      saveData();
      toast("Site delete ho gayi");
      render();
    })
  );

  /* ADD/EDIT ENTRY TAB */
  const entryForm = document.getElementById("entryForm");
  if (entryForm) {
    postRenderAddEntrySiteSelect();
    document.querySelectorAll("[data-type]").forEach((b) =>
      b.addEventListener("click", () => {
        state.addType = b.dataset.type;
        state.addCategory = (b.dataset.type === "expense" ? EXPENSE_CATS : INCOME_CATS)[0].v;
        if (state.editEntryId) {
          const e = data.entries.find((x) => x.id === state.editEntryId);
          if (e) {
            e.type = b.dataset.type;
            e.category = state.addCategory;
          }
        }
        document.getElementById("content").innerHTML = viewAddEntry();
        attachHandlers();
      })
    );
    document.querySelectorAll("[data-cat]").forEach((b) =>
      b.addEventListener("click", () => {
        state.addCategory = b.dataset.cat;
        if (state.editEntryId) {
          const e = data.entries.find((x) => x.id === state.editEntryId);
          if (e) e.category = b.dataset.cat;
        }
        document.getElementById("content").innerHTML = viewAddEntry();
        attachHandlers();
      })
    );
    // live calc for material/labor
    ["fQty", "fRate", "fWorkers", "fDays", "fWage"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", () => {
          const qty = parseFloat(document.getElementById("fQty")?.value) || 0;
          const rate = parseFloat(document.getElementById("fRate")?.value) || 0;
          const workers = parseFloat(document.getElementById("fWorkers")?.value) || 0;
          const days = parseFloat(document.getElementById("fDays")?.value) || 0;
          const wage = parseFloat(document.getElementById("fWage")?.value) || 0;
          const amtEl = document.getElementById("fAmount");
          if (document.getElementById("fQty") && qty && rate) amtEl.value = qty * rate;
          if (document.getElementById("fWorkers") && workers && days && wage) amtEl.value = workers * days * wage;
        });
      }
    });

    entryForm.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const amount = parseFloat(document.getElementById("fAmount").value);
      if (!amount || amount <= 0) return toast("Amount sahi se bharo");
      const type = document.querySelector(".toggle-btn.active-expense") ? "expense" : "income";
      const payload = {
        siteId: document.getElementById("fSite").value || "",
        date: document.getElementById("fDate").value || todayStr(),
        type,
        category: state.addCategory,
        party: document.getElementById("fParty").value.trim(),
        note: document.getElementById("fNote").value.trim(),
        amount,
      };
      if (state.addCategory === "Material") {
        payload.meta = { qty: document.getElementById("fQty")?.value, unit: document.getElementById("fUnit")?.value, rate: document.getElementById("fRate")?.value };
      } else if (state.addCategory === "Majdoori (Labor)") {
        payload.meta = { workers: document.getElementById("fWorkers")?.value, days: document.getElementById("fDays")?.value, wage: document.getElementById("fWage")?.value };
      }

      if (state.editEntryId) {
        const idx = data.entries.findIndex((e) => e.id === state.editEntryId);
        if (idx > -1) data.entries[idx] = { ...data.entries[idx], ...payload };
        toast("Entry update ho gayi ✅");
      } else {
        data.entries.push({ id: uid(), ...payload });
        toast("Entry save ho gayi ✅");
      }
      saveData();
      state.editEntryId = null;
      state.ledgerSiteId = payload.siteId || "";
      setTab("ledger");
    });
  }
  const cancelEdit = document.getElementById("cancelEdit");
  if (cancelEdit) cancelEdit.addEventListener("click", () => { state.editEntryId = null; setTab("ledger"); });
  const deleteFromEdit = document.getElementById("deleteFromEdit");
  if (deleteFromEdit) deleteFromEdit.addEventListener("click", () => {
    if (!confirm("Ye entry delete karni hai?")) return;
    data.entries = data.entries.filter((e) => e.id !== state.editEntryId);
    saveData();
    toast("Entry delete ho gayi");
    state.editEntryId = null;
    setTab("ledger");
  });

  /* LEDGER TAB */
  const ledgerSiteSelect = document.getElementById("ledgerSiteSelect");
  if (ledgerSiteSelect) ledgerSiteSelect.addEventListener("change", (e) => { state.ledgerSiteId = e.target.value; render(); });
  const ledgerSearch = document.getElementById("ledgerSearch");
  if (ledgerSearch) ledgerSearch.addEventListener("input", (e) => { state.ledgerSearch = e.target.value; render(); });
  document.querySelectorAll("[data-delete-entry]").forEach((b) =>
    b.addEventListener("click", () => {
      if (!confirm("Ye entry delete karni hai?")) return;
      data.entries = data.entries.filter((e) => e.id !== b.dataset.deleteEntry);
      saveData();
      toast("Entry delete ho gayi");
      render();
    })
  );
  document.querySelectorAll("[data-edit-entry]").forEach((b) =>
    b.addEventListener("click", () => {
      state.editEntryId = b.dataset.editEntry;
      setTab("add");
    })
  );

  /* SETTINGS TAB */
  const backupBtn = document.getElementById("backupBtn");
  if (backupBtn) backupBtn.addEventListener("click", downloadBackup);
  const restoreBtn = document.getElementById("restoreBtn");
  if (restoreBtn) restoreBtn.addEventListener("click", () => document.getElementById("restoreFile").click());
  const csvBtn = document.getElementById("csvBtn");
  if (csvBtn) csvBtn.addEventListener("click", () => downloadCsv(document.getElementById("csvSiteSelect").value));
  const clearBtn = document.getElementById("clearBtn");
  if (clearBtn) clearBtn.addEventListener("click", () => {
    if (!confirm("Pakka? Ye SAB sites aur entries hamesha ke liye delete kar dega. Pehle backup le lo.")) return;
    if (!confirm("Ek baar aur confirm karo — sab data mit jayega, wapas nahi aayega.")) return;
    data = { sites: [], entries: [] };
    saveData();
    toast("Sab data delete ho gaya");
    setTab("dashboard");
  });

  const settingsHeaderBtn = document.getElementById("settingsBtn");
  if (settingsHeaderBtn) settingsHeaderBtn.onclick = () => setTab("settings");
}

/* ---------------- BACKUP / RESTORE / CSV ---------------- */
function downloadBackup() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nirman-hisab-backup-${todayStr()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast("Backup download ho gaya");
}
function downloadCsv(siteFilter) {
  let list = data.entries;
  if (siteFilter !== "all") list = list.filter((e) => (e.siteId || "") === siteFilter);
  const header = ["Date", "Type", "Category", "Site", "Party", "Note", "Amount"];
  const lines = [header.join(",")];
  [...list]
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .forEach((e) => {
      const row = [e.date, e.type, e.category, e.siteId ? siteName(e.siteId) : "General", e.party || "", e.note || "", e.amount];
      lines.push(row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    });
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nirman-hisab-report-${todayStr()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast("CSV report download ho gaya");
}
document.getElementById("restoreFile").addEventListener("change", (ev) => {
  const file = ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!parsed.sites || !parsed.entries) throw new Error("invalid");
      if (!confirm("Restore karne se abhi ka data replace ho jayega. Continue?")) return;
      data = parsed;
      saveData();
      toast("Data restore ho gaya ✅");
      setTab("dashboard");
    } catch (e) {
      toast("Ye file valid backup nahi hai");
    }
  };
  reader.readAsText(file);
  ev.target.value = "";
});

/* ---------------- NAV WIRING ---------------- */
document.querySelectorAll(".nav-btn, .fab").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));

/* ---------------- PWA SERVICE WORKER ---------------- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}

/* ---------------- INIT ---------------- */
render();
