// Data utama
let transactions = [];      // array of { id, name, amount, category, timestamp }
let categories = ["Food", "Transport", "Fun"]; // default categories
let currentSort = "default"; // default, amount_asc, amount_desc, category_asc
let chart = null;           // Chart.js instance

// DOM Elements
const totalBalanceEl = document.getElementById("totalBalance");
const transactionListEl = document.getElementById("transactionList");
const categorySelect = document.getElementById("category");
const form = document.getElementById("transactionForm");
const newCategoryInput = document.getElementById("newCategory");
const addCategoryBtn = document.getElementById("addCategoryBtn");
const sortSelect = document.getElementById("sortSelect");
const darkModeToggle = document.getElementById("darkModeToggle");

// ======================== Helper Functions ========================
function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

// Hitung total pengeluaran
function calculateTotal() {
  return transactions.reduce((sum, t) => sum + t.amount, 0);
}

// Update total balance display
function updateTotalDisplay() {
  totalBalanceEl.textContent = formatRupiah(calculateTotal());
}

// Render dropdown kategori dari array categories
function renderCategoryDropdown() {
  categorySelect.innerHTML = '<option value="">-- Pilih Kategori --</option>';
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

// Tambah kategori custom
function addCustomCategory() {
  const newCat = newCategoryInput.value.trim();
  if (newCat === "") {
    alert("Nama kategori tidak boleh kosong!");
    return;
  }
  // Cek duplikat (case-insensitive)
  const exists = categories.some(cat => cat.toLowerCase() === newCat.toLowerCase());
  if (exists) {
    alert("Kategori sudah ada!");
    return;
  }
  categories.push(newCat);
  saveCategoriesToLocal();
  renderCategoryDropdown();
  newCategoryInput.value = "";
  // Optional: langsung pilih kategori baru
  categorySelect.value = newCat;
}

// Sorting transaksi berdasarkan currentSort
function getSortedTransactions() {
  const sorted = [...transactions];
  switch (currentSort) {
    case "amount_asc":
      return sorted.sort((a, b) => a.amount - b.amount);
    case "amount_desc":
      return sorted.sort((a, b) => b.amount - a.amount);
    case "category_asc":
      return sorted.sort((a, b) => a.category.localeCompare(b.category));
    default: // default: urut berdasarkan timestamp terbaru dulu
      return sorted.sort((a, b) => b.timestamp - a.timestamp);
  }
}

// Render daftar transaksi (dengan sorting)
function renderTransactionList() {
  const sortedTransactions = getSortedTransactions();
  
  if (sortedTransactions.length === 0) {
    transactionListEl.innerHTML = '<div class="empty-state">Belum ada transaksi. Tambahkan sekarang!</div>';
    return;
  }
  
  transactionListEl.innerHTML = "";
  sortedTransactions.forEach(transaction => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "transaction-item";
    itemDiv.dataset.id = transaction.id;
    
    itemDiv.innerHTML = `
      <div class="transaction-info">
        <div class="transaction-name">${escapeHtml(transaction.name)}</div>
        <div class="transaction-amount">${formatRupiah(transaction.amount)}</div>
        <div class="transaction-category">${escapeHtml(transaction.category)}</div>
      </div>
      <button class="delete-btn" data-id="${transaction.id}" aria-label="Hapus transaksi">
        <i class="fas fa-trash-alt"></i>
      </button>
    `;
    transactionListEl.appendChild(itemDiv);
  });
  
  // Tambahkan event listener untuk tombol hapus
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = Number(btn.dataset.id);
      deleteTransaction(id);
    });
  });
}

// Hapus transaksi berdasarkan ID
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveTransactionsToLocal();
  refreshAll();
}

// Update Chart (Pie Chart)
function updateChart() {
  // Agregasi jumlah per kategori
  const categoryMap = new Map();
  transactions.forEach(t => {
    const cat = t.category;
    const amount = t.amount;
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + amount);
  });
  
  const labels = Array.from(categoryMap.keys());
  const data = Array.from(categoryMap.values());
  
  if (chart) {
    chart.destroy();
  }
  
  const ctx = document.getElementById("expenseChart").getContext("2d");
  chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

// Refresh semua tampilan setelah data berubah
function refreshAll() {
  updateTotalDisplay();
  renderTransactionList();
  updateChart();
}

// ======================== Local Storage ========================
function saveTransactionsToLocal() {
  localStorage.setItem("expense_transactions", JSON.stringify(transactions));
}

function loadTransactionsFromLocal() {
  const stored = localStorage.getItem("expense_transactions");
  if (stored) {
    transactions = JSON.parse(stored);
    // Pastikan semua transaksi memiliki timestamp (migrasi jika belum)
    transactions.forEach(t => {
      if (!t.timestamp) t.timestamp = Date.now();
    });
  } else {
    transactions = [];
  }
}

function saveCategoriesToLocal() {
  localStorage.setItem("expense_categories", JSON.stringify(categories));
}

function loadCategoriesFromLocal() {
  const stored = localStorage.getItem("expense_categories");
  if (stored) {
    categories = JSON.parse(stored);
  } else {
    categories = ["Food", "Transport", "Fun"];
  }
  renderCategoryDropdown();
}

function loadSortPreference() {
  const savedSort = localStorage.getItem("expense_sort");
  if (savedSort && ["default", "amount_asc", "amount_desc", "category_asc"].includes(savedSort)) {
    currentSort = savedSort;
    sortSelect.value = savedSort;
  } else {
    currentSort = "default";
    sortSelect.value = "default";
  }
}

function saveSortPreference() {
  localStorage.setItem("expense_sort", currentSort);
}

// Dark Mode
function initDarkMode() {
  const isDark = localStorage.getItem("darkMode") === "true";
  if (isDark) {
    document.body.classList.add("dark-mode");
    darkModeToggle.innerHTML = '<i class="fas fa-sun"></i> <span>Light Mode</span>';
  } else {
    document.body.classList.remove("dark-mode");
    darkModeToggle.innerHTML = '<i class="fas fa-moon"></i> <span>Dark Mode</span>';
  }
}

function toggleDarkMode() {
  const isDark = document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", isDark);
  if (isDark) {
    darkModeToggle.innerHTML = '<i class="fas fa-sun"></i> <span>Light Mode</span>';
  } else {
    darkModeToggle.innerHTML = '<i class="fas fa-moon"></i> <span>Dark Mode</span>';
  }
}

// ======================== Event Handlers ========================
function handleAddTransaction(e) {
  e.preventDefault();
  
  const name = document.getElementById("itemName").value.trim();
  const amountRaw = document.getElementById("amount").value.trim();
  const category = categorySelect.value;
  
  if (!name) {
    alert("Nama item harus diisi!");
    return;
  }
  if (!amountRaw) {
    alert("Jumlah harus diisi!");
    return;
  }
  const amount = Number(amountRaw);
  if (isNaN(amount) || amount <= 0) {
    alert("Jumlah harus berupa angka positif!");
    return;
  }
  if (!category) {
    alert("Pilih kategori!");
    return;
  }
  
  const newTransaction = {
    id: Date.now(),
    name: name,
    amount: amount,
    category: category,
    timestamp: Date.now()
  };
  
  transactions.push(newTransaction);
  saveTransactionsToLocal();
  
  // Reset form
  document.getElementById("itemName").value = "";
  document.getElementById("amount").value = "";
  categorySelect.value = "";
  
  refreshAll();
}

function handleSortChange(e) {
  currentSort = e.target.value;
  saveSortPreference();
  renderTransactionList(); // hanya render ulang list, chart tetap sama
}

// ======================== Initialization ========================
function init() {
  loadCategoriesFromLocal();  // load categories & render dropdown
  loadTransactionsFromLocal();
  loadSortPreference();
  initDarkMode();
  
  refreshAll();
  
  // Event listeners
  form.addEventListener("submit", handleAddTransaction);
  addCategoryBtn.addEventListener("click", addCustomCategory);
  sortSelect.addEventListener("change", handleSortChange);
  darkModeToggle.addEventListener("click", toggleDarkMode);
}

// Helper untuk mencegah XSS
function escapeHtml(str) {
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
    return c;
  });
}

// Start
init();