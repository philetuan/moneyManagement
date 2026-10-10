document.addEventListener("DOMContentLoaded", () => {
  window.MoneyFlowStorage.init();

  setupNavigation();
  setupModalEvents();
  setupBudgetEvents();
  setupFilters();
  setupSettings();

  renderApp();

  // Xử lý tự động ẩn Splash Video khi phát xong hoặc tối đa 4.5 giây
  const splash = document.getElementById("splashScreen");
  const splashVideo = document.getElementById("splashVideo");

  const hideSplash = () => {
    if (splash && !splash.classList.contains("fade-out")) {
      splash.classList.add("fade-out");
      setTimeout(() => splash.remove(), 600);
    }
  };

  if (splashVideo) {
    splashVideo.onended = hideSplash;
    setTimeout(hideSplash, 4500); // Dự phòng nếu video không tự trigger sự kiện ended
  } else {
    setTimeout(hideSplash, 2500);
  }
});

// 1. Điều hướng Tab
function setupNavigation() {
  const navBtns = document.querySelectorAll(".nav-btn");
  const views = document.querySelectorAll(".view");
  const pageTitle = document.getElementById("pageTitle");

  const titleMap = {
    dashboard: "Tổng quan",
    transactions: "Giao dịch",
    budget: "Ngân sách",
    settings: "Cài đặt"
  };

  navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-view");

      navBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      views.forEach(v => v.classList.remove("active"));
      document.getElementById(`view-${target}`).classList.add("active");

      if (pageTitle) pageTitle.textContent = titleMap[target] || "MoneyFlow";
    });
  });
}

// 2. Sự kiện Modal Thêm/Sửa giao dịch
function setupModalEvents() {
  const btnOpen = document.getElementById("btnNewTransaction");
  const btnClose = document.getElementById("btnCloseModal");
  const btnCancel = document.getElementById("btnCancelModal");
  const form = document.getElementById("transactionForm");

  btnOpen.addEventListener("click", () => openModal());
  btnClose.addEventListener("click", () => closeModal());
  btnCancel.addEventListener("click", () => closeModal());

  const typeRadios = document.querySelectorAll('input[name="transType"]');
  typeRadios.forEach(radio => {
    radio.addEventListener("change", (e) => {
      populateCategories(e.target.value);
    });
  });

  form.addEventListener("submit", handleFormSubmit);
}

// 3. Sự kiện Thêm Danh Mục tại giao diện Ngân sách
function setupBudgetEvents() {
  const btnAddCat = document.getElementById("btnAddBudgetCategory");
  
  if (btnAddCat) {
    btnAddCat.addEventListener("click", () => {
      const newCat = prompt("Nhập tên danh mục chi tiêu mới:");
      if (newCat && newCat.trim() !== "") {
        window.MoneyFlowStorage.addCategory("expense", newCat.trim());
        setupFilters();
        renderApp();
      }
    });
  }
}

function openModal(editItem = null) {
  const modal = document.getElementById("transactionModal");
  const form = document.getElementById("transactionForm");
  const title = document.getElementById("modalTitle");

  form.reset();

  if (editItem) {
    title.textContent = "Chỉnh sửa giao dịch";
    document.getElementById("transId").value = editItem.id;
    document.getElementById("transAmount").value = editItem.amount;
    document.getElementById("transDate").value = editItem.date;
    document.getElementById("transDesc").value = editItem.desc || "";

    const radio = form.querySelector(`input[name="transType"][value="${editItem.type}"]`);
    if (radio) radio.checked = true;

    populateCategories(editItem.type, editItem.category);
    populateAccounts(editItem.account);
  } else {
    title.textContent = "Thêm giao dịch mới";
    document.getElementById("transId").value = "";
    document.getElementById("transDate").value = new Date().toISOString().slice(0, 10);
    
    populateCategories("expense");
    populateAccounts();
  }

  modal.classList.add("open");
}

function closeModal() {
  document.getElementById("transactionModal").classList.remove("open");
}

function populateCategories(type, selectedCat = null) {
  const select = document.getElementById("transCategory");
  const categories = window.MoneyFlowStorage.getCategories();
  const list = categories[type] || [];

  select.innerHTML = list.map(c => 
    `<option value="${c}" ${c === selectedCat ? "selected" : ""}>${c}</option>`
  ).join("");
}

function populateAccounts(selectedAcc = null) {
  const select = document.getElementById("transAccount");
  const accounts = window.MoneyFlowData.defaultAccounts;

  select.innerHTML = accounts.map(a => 
    `<option value="${a}" ${a === selectedAcc ? "selected" : ""}>${a}</option>`
  ).join("");
}

function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("transId").value;
  const type = document.querySelector('input[name="transType"]:checked').value;
  const amount = Number(document.getElementById("transAmount").value);
  const category = document.getElementById("transCategory").value;
  const account = document.getElementById("transAccount").value;
  const date = document.getElementById("transDate").value;
  const desc = document.getElementById("transDesc").value;

  if (!amount || amount <= 0) return alert("Vui lòng nhập số tiền hợp lệ!");

  const itemData = {
    id: id || "trans_" + Date.now(),
    type,
    amount,
    category,
    account,
    date,
    desc
  };

  if (id) {
    window.MoneyFlowStorage.updateTransaction(itemData);
  } else {
    window.MoneyFlowStorage.addTransaction(itemData);
  }

  closeModal();
  renderApp();
}

// 4. Bộ lọc Giao dịch
function setupFilters() {
  const filterType = document.getElementById("filterType");
  const filterCat = document.getElementById("filterCategory");
  const filterMonth = document.getElementById("filterMonth");
  const btnReset = document.getElementById("btnResetFilter");

  filterType.addEventListener("change", renderApp);
  filterCat.addEventListener("change", renderApp);
  filterMonth.addEventListener("change", renderApp);

  btnReset.addEventListener("click", () => {
    filterType.value = "all";
    filterCat.value = "all";
    filterMonth.value = "";
    renderApp();
  });

  const categories = window.MoneyFlowStorage.getCategories();
  const allCats = [...(categories.expense || []), ...(categories.income || [])];
  const uniqueCats = Array.from(new Set(allCats));

  filterCat.innerHTML = '<option value="all">Tất cả danh mục</option>' +
    uniqueCats.map(c => `<option value="${c}">${c}</option>`).join("");
}

// 5. Cài đặt Dữ liệu
function setupSettings() {
  document.getElementById("btnExport").addEventListener("click", () => {
    const data = window.MoneyFlowStorage.getTransactions();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `moneyflow_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  });

  document.getElementById("fileImport").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const importedData = JSON.parse(evt.target.result);
        if (Array.isArray(importedData)) {
          window.MoneyFlowStorage.saveTransactions(importedData);
          alert("Nhập dữ liệu thành công!");
          renderApp();
        } else {
          alert("File JSON không hợp lệ!");
        }
      } catch (err) {
        alert("Lỗi đọc file JSON!");
      }
    };
    reader.readAsText(file);
  });

  document.getElementById("btnClearData").addEventListener("click", () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu giao dịch?")) {
      window.MoneyFlowStorage.saveTransactions([]);
      renderApp();
    }
  });
}

// 6. Render ứng dụng
function renderApp() {
  const transactions = window.MoneyFlowStorage.getTransactions();
  const fmt = (num) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);

  let income = 0;
  let expense = 0;

  transactions.forEach(t => {
    if (t.type === "income") income += t.amount;
    if (t.type === "expense") expense += t.amount;
  });

  document.getElementById("dashBalance").textContent = fmt(income - expense);
  document.getElementById("dashIncome").textContent = fmt(income);
  document.getElementById("dashExpense").textContent = fmt(expense);

  const recentContainer = document.getElementById("recentList");
  const recentList = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  recentContainer.innerHTML = recentList.length === 0 
    ? `<p style="color: #94a3b8; text-align: center; padding: 1rem;">Chưa có giao dịch nào.</p>`
    : recentList.map(t => renderTransItem(t, fmt)).join("");

  const typeFilter = document.getElementById("filterType").value;
  const catFilter = document.getElementById("filterCategory").value;
  const monthFilter = document.getElementById("filterMonth").value;

  let filtered = transactions.filter(t => {
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    if (catFilter !== "all" && t.category !== catFilter) return false;
    if (monthFilter && !t.date.startsWith(monthFilter)) return false;
    return true;
  });

  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  const allContainer = document.getElementById("allTransactionsList");
  allContainer.innerHTML = filtered.length === 0
    ? `<p style="color: #94a3b8; text-align: center; padding: 1rem;">Không có giao dịch phù hợp.</p>`
    : filtered.map(t => renderTransItem(t, fmt, true)).join("");

  renderBudget(transactions, fmt);
}

function renderBudget(transactions, fmt) {
  const container = document.getElementById("budgetContainer");
  const categories = window.MoneyFlowStorage.getCategories();
  const expenseCats = categories.expense || [];

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const currentMonthExpenses = transactions.filter(t => t.type === "expense" && t.date.startsWith(currentMonthStr));

  const catTotals = {};
  currentMonthExpenses.forEach(t => {
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });

  const DEFAULT_LIMIT = 5000000;

  container.innerHTML = expenseCats.length === 0
    ? `<p style="color: #94a3b8; text-align: center; padding: 1rem;">Chưa có danh mục chi tiêu nào.</p>`
    : expenseCats.map(cat => {
      const spent = catTotals[cat] || 0;
      const percent = Math.min(Math.round((spent / DEFAULT_LIMIT) * 100), 100);
      const barColor = percent > 80 ? "#dc2626" : "#2563eb";

      return `
        <div class="budget-item">
          <div class="budget-item-top">
            <strong>${cat}</strong>
            <div class="budget-actions">
              <span style="font-weight: 600; font-size: 0.9rem;">${fmt(spent)} / ${fmt(DEFAULT_LIMIT)}</span>
              <button class="btn-delete-cat" onclick="removeCategory('expense', '${cat}')">Xóa</button>
            </div>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${percent}%; background: ${barColor};"></div>
          </div>
        </div>
      `;
    }).join("");
}

function renderTransItem(t, fmt, showActions = false) {
  const isIncome = t.type === "income";
  const color = isIncome ? "#16a34a" : "#dc2626";
  const prefix = isIncome ? "+" : "-";

  return `
    <div class="trans-item">
      <div>
        <strong>${t.desc || t.category}</strong>
        <div style="font-size: 0.8rem; color: #64748b;">${t.date} • ${t.category} (${t.account})</div>
      </div>
      <div style="display: flex; align-items: center; gap: 1rem;">
        <span style="font-weight: 700; color: ${color};">${prefix}${fmt(t.amount)}</span>
        ${showActions ? `
          <button onclick="editTrans('${t.id}')" style="background:none; border:none; color:#2563eb; cursor:pointer;">Sửa</button>
          <button onclick="deleteTrans('${t.id}')" style="background:none; border:none; color:#dc2626; cursor:pointer;">Xóa</button>
        ` : ""}
      </div>
    </div>
  `;
}

window.removeCategory = function(type, categoryName) {
  if (confirm(`Bạn có chắc muốn xóa danh mục "${categoryName}"?`)) {
    window.MoneyFlowStorage.deleteCategory(type, categoryName);
    setupFilters();
    renderApp();
  }
};

window.editTrans = function(id) {
  const list = window.MoneyFlowStorage.getTransactions();
  const item = list.find(t => t.id === id);
  if (item) openModal(item);
};

window.deleteTrans = function(id) {
  if (confirm("Bạn có chắc chắn muốn xóa giao dịch này?")) {
    window.MoneyFlowStorage.deleteTransaction(id);
    renderApp();
  }
};