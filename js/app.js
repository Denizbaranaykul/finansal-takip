/**
 * ===================================================================
 * BÜTÇEM PRO - ANA UYGULAMA MANTIĞI (app.js)
 * ===================================================================
 * Arayüz yönetimi, filtreleme, periyot navigasyonu, CRUD operasyonları,
 * CSV export ve Firebase entegrasyon kontrolü.
 */

import { firebaseService, SEPTEMBER_TRANSACTIONS } from './firebase-service.js';
import { isFirebaseConfigured } from './firebase-config.js';
import { updateCategoryChart, updateMonthlyTrendChart, CATEGORY_COLORS } from './charts.js';

// Kategori & İkon Tanımları
const CATEGORIES = {
  expense: [
    { name: 'Market', icon: 'fa-basket-shopping', color: '#10b981' },
    { name: 'Dışardan Yemek', icon: 'fa-utensils', color: '#f97316' },
    { name: 'Yurt Ücreti', icon: 'fa-building-columns', color: '#6366f1' },
    { name: 'Ulaşım', icon: 'fa-bus', color: '#f59e0b' },
    { name: 'Fatura & Aidat', icon: 'fa-bolt', color: '#0ea5e9' },
    { name: 'Sağlık & Bakım', icon: 'fa-heart-pulse', color: '#ec4899' },
    { name: 'Eğlence & Sosyal', icon: 'fa-champagne-glasses', color: '#8b5cf6' },
    { name: 'Eğitim', icon: 'fa-graduation-cap', color: '#14b8a6' },
    { name: 'Giyim & Alışveriş', icon: 'fa-shirt', color: '#f43f5e' },
    { name: 'Diğer Gider', icon: 'fa-box-archive', color: '#64748b' }
  ],
  income: [
    { name: 'Maaş', icon: 'fa-money-bill-wave', color: '#10b981' },
    { name: 'Ek Gelir', icon: 'fa-laptop-code', color: '#3b82f6' },
    { name: 'Yatırım & Temettü', icon: 'fa-arrow-trend-up', color: '#8b5cf6' },
    { name: 'Kira Geliri', icon: 'fa-building', color: '#f59e0b' },
    { name: 'Satış & Ticaret', icon: 'fa-shop', color: '#06b6d4' },
    { name: 'Diğer Gelir', icon: 'fa-coins', color: '#64748b' }
  ]
};

const MONTH_NAMES_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

// Uygulama Durumu (State)
const state = {
  allTransactions: [],
  selectedYear: new Date().getFullYear(),
  selectedMonth: new Date().getMonth(), // 0-indexed (8 = Eylül)
  filterType: 'all', // 'all' | 'income' | 'expense'
  filterCategory: 'all',
  searchQuery: '',
  currentUser: null,
  pendingDeleteId: null
};

// ================= DOM ELEMENTLERİ =================
const elements = {
  // Durum & Kullanıcı
  firebaseStatusBadge: document.getElementById('firebaseStatusBadge'),
  firebaseStatusText: document.getElementById('firebaseStatusText'),
  userMenu: document.getElementById('userMenu'),
  navLoginBtn: document.getElementById('navLoginBtn'),
  userProfileWidget: document.getElementById('userProfileWidget'),
  userAvatar: document.getElementById('userAvatar'),
  userEmail: document.getElementById('userEmail'),
  logoutBtn: document.getElementById('logoutBtn'),
  configNoticeBanner: document.getElementById('configNoticeBanner'),
  openConfigHelpBtn: document.getElementById('openConfigHelpBtn'),
  closeBannerBtn: document.getElementById('closeBannerBtn'),

  // Tarih Periyodu
  prevMonthBtn: document.getElementById('prevMonthBtn'),
  nextMonthBtn: document.getElementById('nextMonthBtn'),
  selectedPeriodText: document.getElementById('selectedPeriodText'),

  // Özet Kartları
  totalIncomeValue: document.getElementById('totalIncomeValue'),
  incomeCountBadge: document.getElementById('incomeCountBadge'),
  totalExpenseValue: document.getElementById('totalExpenseValue'),
  expenseCountBadge: document.getElementById('expenseCountBadge'),
  netBalanceValue: document.getElementById('netBalanceValue'),
  savingsRateBadge: document.getElementById('savingsRateBadge'),
  balanceHealthText: document.getElementById('balanceHealthText'),
  topExpenseCategory: document.getElementById('topExpenseCategory'),
  topExpenseAmount: document.getElementById('topExpenseAmount'),

  // Filtreler & Tablo
  searchInput: document.getElementById('searchInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  typeFilterTabs: document.getElementById('typeFilterTabs'),
  categoryFilterSelect: document.getElementById('categoryFilterSelect'),
  categoryChipsContainer: document.getElementById('categoryChipsContainer'),
  categoryChipsBar: document.getElementById('categoryChipsBar'),
  activeCategoryIndicator: document.getElementById('activeCategoryIndicator'),
  activeCategoryName: document.getElementById('activeCategoryName'),
  activeCategoryStats: document.getElementById('activeCategoryStats'),
  clearCategoryFilterBtn: document.getElementById('clearCategoryFilterBtn'),
  transactionTableBody: document.getElementById('transactionTableBody'),
  emptyState: document.getElementById('emptyState'),
  emptyStateTitle: document.getElementById('emptyStateTitle'),
  emptyStateDesc: document.getElementById('emptyStateDesc'),
  emptyResetFilterBtn: document.getElementById('emptyResetFilterBtn'),
  transactionListSubtitle: document.getElementById('transactionListSubtitle'),

  // Aksiyon Butonları
  openAddIncomeBtn: document.getElementById('openAddIncomeBtn'),
  openAddExpenseBtn: document.getElementById('openAddExpenseBtn'),
  emptyAddIncomeBtn: document.getElementById('emptyAddIncomeBtn'),
  emptyAddExpenseBtn: document.getElementById('emptyAddExpenseBtn'),
  exportDataBtn: document.getElementById('exportDataBtn'),
  importDataBtn: document.getElementById('importDataBtn'),

  // Hızlı Senkronizasyon Bildirim Çubuğu
  quickSyncNoticeBanner: document.getElementById('quickSyncNoticeBanner'),
  quickSyncDataBtn: document.getElementById('quickSyncDataBtn'),
  closeQuickSyncBannerBtn: document.getElementById('closeQuickSyncBannerBtn'),

  // İçe Aktarma Modalı
  importModal: document.getElementById('importModal'),
  closeImportModalBtn: document.getElementById('closeImportModalBtn'),
  closeImportModalFooterBtn: document.getElementById('closeImportModalFooterBtn'),
  loadPreloadedDataBtn: document.getElementById('loadPreloadedDataBtn'),
  loadPreloadedBtnText: document.getElementById('loadPreloadedBtnText'),
  csvFileInput: document.getElementById('csvFileInput'),

  // İşlem Modalı
  transactionModal: document.getElementById('transactionModal'),
  closeTransactionModalBtn: document.getElementById('closeTransactionModalBtn'),
  cancelTransactionBtn: document.getElementById('cancelTransactionBtn'),
  transactionForm: document.getElementById('transactionForm'),
  modalTitle: document.getElementById('modalTitle'),
  editTransactionId: document.getElementById('editTransactionId'),
  typeExpenseRadio: document.getElementById('typeExpenseRadio'),
  typeIncomeRadio: document.getElementById('typeIncomeRadio'),
  amountInput: document.getElementById('amountInput'),
  dateInput: document.getElementById('dateInput'),
  categorySelect: document.getElementById('categorySelect'),
  titleInput: document.getElementById('titleInput'),
  descriptionInput: document.getElementById('descriptionInput'),
  saveBtnText: document.getElementById('saveBtnText'),
  modalTypeBadge: document.getElementById('modalTypeBadge'),

  // Auth Modalı (Zorunlu Giriş/Kayıt)
  authModal: document.getElementById('authModal'),
  authForm: document.getElementById('authForm'),
  tabLogin: document.getElementById('tabLogin'),
  tabRegister: document.getElementById('tabRegister'),
  authTitle: document.getElementById('authModalTitle'),
  authModalSubtitle: document.getElementById('authModalSubtitle'),
  authSubmitIcon: document.getElementById('authSubmitIcon'),
  authEmail: document.getElementById('authEmail'),
  authPassword: document.getElementById('authPassword'),
  authErrorMsg: document.getElementById('authErrorMsg'),
  authErrorText: document.getElementById('authErrorText'),
  authSubmitBtnText: document.getElementById('authSubmitBtnText'),

  // Config Rehber Modalı
  configGuideModal: document.getElementById('configGuideModal'),
  closeConfigGuideModalBtn: document.getElementById('closeConfigGuideModalBtn'),
  gotItConfigBtn: document.getElementById('gotItConfigBtn'),

  // Silme Onay Modalı
  deleteConfirmModal: document.getElementById('deleteConfirmModal'),
  cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
  confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
  deleteConfirmText: document.getElementById('deleteConfirmText'),

  // Toast
  toastContainer: document.getElementById('toastContainer')
};

let authMode = 'login'; // 'login' | 'register'

// ================= BAŞLANGIÇ (INIT) =================
async function initApp() {
  updatePeriodDisplay();
  bindEvents();
  populateCategorySelects();

  // Varsayılan olarak ekranı kilitle (Giriş yapılmadan hiçbir şey denenemesin)
  lockApp();

  // Firebase Servisini Başlat
  const mode = await firebaseService.init();
  updateFirebaseStatusIndicator(mode);

  // Kullanıcı oturum dinleyicisi
  firebaseService.onAuthStateChanged((user) => {
    state.currentUser = user;
    updateUserInterface(user);

    if (user) {
      // Oturum açılmış -> Kilidi kaldır ve verileri yükle
      unlockApp();

      firebaseService.subscribeTransactions((transactions) => {
        state.allTransactions = transactions;
        renderApp();

        // Eğer açık oturumda bu veriler henüz yoksa ve gizlenmediyse bildirim çubuğunu göster
        if (elements.quickSyncNoticeBanner && !localStorage.getItem('butcem_hide_quick_sync')) {
          const hasSeptData = transactions.some(t => t.title === 'bes geri dönüşü');
          if (!hasSeptData) {
            elements.quickSyncNoticeBanner.classList.remove('hidden');
          } else {
            elements.quickSyncNoticeBanner.classList.add('hidden');
          }
        }
      });
    } else {
      // Oturum açılmamış -> Kilitle ve zorunlu giriş/kayıt ekranını aç
      lockApp();
      openAuthModal('login');
    }
  });
}

function lockApp() {
  document.body.classList.add('auth-locked');
  state.allTransactions = [];
  renderApp();
}

function unlockApp() {
  document.body.classList.remove('auth-locked');
  if (elements.authModal) {
    elements.authModal.classList.add('hidden');
  }
}

// ================= ARAYÜZ GÜNCELLEMELERİ =================

function updatePeriodDisplay() {
  const monthName = MONTH_NAMES_TR[state.selectedMonth];
  elements.selectedPeriodText.textContent = `${monthName} ${state.selectedYear}`;
  if (elements.transactionListSubtitle) {
    elements.transactionListSubtitle.textContent = `${monthName} ${state.selectedYear} dönemine ait kayıtlar`;
  }
}

function updateFirebaseStatusIndicator(mode) {
  const dot = elements.firebaseStatusBadge.querySelector('.status-dot');
  dot.className = 'status-dot';

  if (mode === 'firebase') {
    dot.classList.add('status-connected');
    elements.firebaseStatusText.textContent = 'Firebase Canlı';
    elements.firebaseStatusBadge.title = 'Cloud Firestore ile gerçek zamanlı senkronize';
    if (elements.configNoticeBanner) elements.configNoticeBanner.classList.add('hidden');
  } else {
    dot.classList.add('status-offline');
    elements.firebaseStatusText.textContent = 'Demo Modu';
    elements.firebaseStatusBadge.title = 'Firebase config bekleniyor. Veriler yerel hafızada saklanıyor.';
    if (elements.configNoticeBanner && !localStorage.getItem('butcem_hide_banner')) {
      elements.configNoticeBanner.classList.remove('hidden');
    }
  }
}

function updateUserInterface(user) {
  if (user) {
    elements.navLoginBtn.classList.add('hidden');
    elements.userProfileWidget.classList.remove('hidden');
    elements.userEmail.textContent = user.email || 'Kullanıcı';
    elements.userAvatar.textContent = (user.email ? user.email[0] : 'U').toUpperCase();
  } else {
    elements.navLoginBtn.classList.remove('hidden');
    elements.userProfileWidget.classList.add('hidden');
  }
}

/**
 * Ana render fonksiyonu (İstatistikler, Grafikler, Tablo)
 */
function renderApp() {
  // Seçili periyota ait işlemleri filtrele
  const periodMonthStr = `${state.selectedYear}-${String(state.selectedMonth + 1).padStart(2, '0')}`;

  const currentPeriodTransactions = state.allTransactions.filter(t => {
    return t.date && t.date.startsWith(periodMonthStr);
  });

  // 1. Özet İstatistikleri Hesapla
  calculateAndRenderStats(currentPeriodTransactions);

  // 2. Grafikleri Güncelle
  updateCategoryChart(currentPeriodTransactions);
  updateMonthlyTrendChart(state.allTransactions);

  // 3. Kategori Seçim Menüsü ve Çip Arayüzünü Güncelle
  updateCategoryFilterUI(currentPeriodTransactions);

  // 4. Tablo Filtrelerini Uygula & Render Et
  renderTransactionsTable(currentPeriodTransactions);
}

/**
 * İstatistik kartlarını günceller
 */
function calculateAndRenderStats(transactions) {
  let totalIncome = 0;
  let incomeCount = 0;
  let totalExpense = 0;
  let expenseCount = 0;
  const expenseByCategory = {};

  transactions.forEach(t => {
    const amount = Number(t.amount) || 0;
    if (t.type === 'income') {
      totalIncome += amount;
      incomeCount++;
    } else {
      totalExpense += amount;
      expenseCount++;
      const cat = t.category || 'Diğer Gider';
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + amount;
    }
  });

  const netBalance = totalIncome - totalExpense;

  // Sayıları Ekrana Bas
  elements.totalIncomeValue.textContent = formatCurrency(totalIncome);
  elements.incomeCountBadge.textContent = `${incomeCount} işlem`;

  elements.totalExpenseValue.textContent = formatCurrency(totalExpense);
  elements.expenseCountBadge.textContent = `${expenseCount} işlem`;

  elements.netBalanceValue.textContent = formatCurrency(netBalance);

  // Tasarruf Oranı ve Bakiye Sağlığı
  if (totalIncome > 0) {
    const savingsRatio = Math.round((netBalance / totalIncome) * 100);
    elements.savingsRateBadge.textContent = `%${Math.max(0, savingsRatio)} Tasarruf`;
    if (savingsRatio >= 20) {
      elements.balanceHealthText.textContent = 'Harika Tasarruf 🚀';
    } else if (savingsRatio >= 0) {
      elements.balanceHealthText.textContent = 'Bütçe Dengeli 👍';
    } else {
      elements.balanceHealthText.textContent = 'Bütçe Aşımı ⚠️';
    }
  } else {
    elements.savingsRateBadge.textContent = '%0 Tasarruf';
    elements.balanceHealthText.textContent = totalExpense > 0 ? 'Gelir Eklenmedi' : 'Dengeli';
  }

  // En Çok Harcanan Kategori
  let topCat = '-';
  let topAmount = 0;
  for (const [cat, amt] of Object.entries(expenseByCategory)) {
    if (amt > topAmount) {
      topAmount = amt;
      topCat = cat;
    }
  }

  elements.topExpenseCategory.textContent = topCat;
  elements.topExpenseAmount.textContent = topAmount > 0 ? formatCurrency(topAmount) : '₺0,00';
}

/**
 * İşlem listesini filtreler ve tabloya döker
 */
function renderTransactionsTable(periodTransactions) {
  let filtered = [...periodTransactions];

  // Tür Filtresi (Tümü / Gelir / Gider)
  if (state.filterType !== 'all') {
    filtered = filtered.filter(t => t.type === state.filterType);
  }

  // Kategori Filtresi (Yalnızca seçilen kategorideki işlemler gösterilir)
  if (state.filterCategory !== 'all') {
    filtered = filtered.filter(t => t.category === state.filterCategory);
  }

  // Arama Filtresi
  if (state.searchQuery.trim() !== '') {
    const q = state.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(t => {
      const matchTitle = (t.title || '').toLowerCase().includes(q);
      const matchCat = (t.category || '').toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      return matchTitle || matchCat || matchDesc;
    });
  }

  elements.transactionTableBody.innerHTML = '';

  if (filtered.length === 0) {
    elements.emptyState.classList.remove('hidden');
    elements.transactionTableBody.parentElement.classList.add('hidden');
    
    if (state.filterCategory !== 'all') {
      if (elements.emptyStateTitle) elements.emptyStateTitle.textContent = `"${state.filterCategory}" Kategorisinde İşlem Yok`;
      elements.emptyStateDesc.textContent = `Bu dönem için "${state.filterCategory}" kategorisine ait herhangi bir işlem bulunamadı. Filtreyi temizleyerek tüm işlemleri görüntüleyebilirsiniz.`;
      if (elements.emptyResetFilterBtn) elements.emptyResetFilterBtn.classList.remove('hidden');
    } else if (state.searchQuery || state.filterType !== 'all') {
      if (elements.emptyStateTitle) elements.emptyStateTitle.textContent = 'Filtrelere Uygun İşlem Bulunamadı';
      elements.emptyStateDesc.textContent = 'Arama veya tür filtresine uygun işlem bulunamadı. Filtreleri temizleyerek tüm kayıtları görebilirsiniz.';
      if (elements.emptyResetFilterBtn) elements.emptyResetFilterBtn.classList.remove('hidden');
    } else {
      if (elements.emptyStateTitle) elements.emptyStateTitle.textContent = 'Henüz İşlem Bulunmuyor';
      elements.emptyStateDesc.textContent = 'Bu dönem için harcama veya gelir kaydı girmediniz. Yukarıdaki butonlardan hemen ekleyebilirsiniz!';
      if (elements.emptyResetFilterBtn) elements.emptyResetFilterBtn.classList.add('hidden');
    }
    return;
  }

  if (elements.emptyResetFilterBtn) elements.emptyResetFilterBtn.classList.add('hidden');
  elements.emptyState.classList.add('hidden');
  elements.transactionTableBody.parentElement.classList.remove('hidden');

  filtered.forEach(tx => {
    const tr = document.createElement('tr');

    const catMeta = getCategoryMeta(tx.type, tx.category);
    const isIncome = tx.type === 'income';
    const sign = isIncome ? '+' : '-';
    const amountClass = isIncome ? 'income' : 'expense';

    tr.innerHTML = `
      <td class="date-cell">
        <i class="fa-regular fa-calendar-days text-muted" style="margin-right: 4px;"></i>
        ${formatDate(tx.date)}
      </td>
      <td>
        <div class="category-cell">
          <div class="category-icon-box" style="background: ${catMeta.color}20; color: ${catMeta.color};">
            <i class="fa-solid ${catMeta.icon}"></i>
          </div>
          <span class="category-name-badge">${escapeHtml(tx.category || '-')}</span>
        </div>
      </td>
      <td class="title-cell">
        <span class="tx-title">${escapeHtml(tx.title)}</span>
        ${tx.description ? `<span class="tx-description">${escapeHtml(tx.description)}</span>` : ''}
      </td>
      <td class="amount-cell ${amountClass}">
        ${sign} ${formatCurrency(tx.amount)}
      </td>
      <td>
        <div class="action-buttons">
          <button class="action-btn edit-btn" data-id="${tx.id}" title="Düzenle">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="action-btn delete-btn" data-id="${tx.id}" title="Sil">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    `;

    // Buton eventleri
    tr.querySelector('.edit-btn').addEventListener('click', () => openEditTransactionModal(tx));
    tr.querySelector('.delete-btn').addEventListener('click', () => promptDeleteTransaction(tx.id, tx.title));

    elements.transactionTableBody.appendChild(tr);
  });
}

// ================= MODALLAR VE FORM İŞLEMLERİ =================

function openAddTransactionModal(defaultType = 'expense') {
  elements.transactionForm.reset();
  elements.editTransactionId.value = '';
  elements.modalTitle.textContent = defaultType === 'income' ? 'Yeni Para Girişi (Gelir) Ekle' : 'Yeni Harcama Ekle';
  elements.saveBtnText.textContent = 'Kaydet';

  if (defaultType === 'income') {
    elements.typeIncomeRadio.checked = true;
    elements.modalTypeBadge.style.background = 'var(--income)';
  } else {
    elements.typeExpenseRadio.checked = true;
    elements.modalTypeBadge.style.background = 'var(--expense)';
  }

  // Varsayılan tarih: Bugün (veya seçili ayın 15'i)
  const today = new Date().toISOString().slice(0, 10);
  elements.dateInput.value = today;

  populateCategoryDropdown(defaultType);
  elements.transactionModal.classList.remove('hidden');
  elements.amountInput.focus();
}

function openEditTransactionModal(tx) {
  elements.editTransactionId.value = tx.id;
  elements.modalTitle.textContent = 'İşlemi Düzenle';
  elements.saveBtnText.textContent = 'Güncelle';

  if (tx.type === 'income') {
    elements.typeIncomeRadio.checked = true;
    elements.modalTypeBadge.style.background = 'var(--income)';
  } else {
    elements.typeExpenseRadio.checked = true;
    elements.modalTypeBadge.style.background = 'var(--expense)';
  }

  populateCategoryDropdown(tx.type);

  elements.amountInput.value = tx.amount;
  elements.dateInput.value = tx.date;
  elements.categorySelect.value = tx.category;
  elements.titleInput.value = tx.title;
  elements.descriptionInput.value = tx.description || '';

  elements.transactionModal.classList.remove('hidden');
}

function closeTransactionModal() {
  elements.transactionModal.classList.add('hidden');
}

function populateCategoryDropdown(type) {
  elements.categorySelect.innerHTML = '';
  const cats = CATEGORIES[type] || [];
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.name;
    opt.textContent = c.name;
    elements.categorySelect.appendChild(opt);
  });
}

/**
 * Kategori filtresini belirler ve arayüzü günceller
 */
function setCategoryFilter(category) {
  state.filterCategory = category || 'all';
  if (elements.categoryFilterSelect && elements.categoryFilterSelect.value !== state.filterCategory) {
    elements.categoryFilterSelect.value = state.filterCategory;
  }
  renderApp();
}

/**
 * İşlem geçmişi menüsündeki Kategori Seçim kutusunu ve Kategori Çiplerini (Pills) günceller
 */
function updateCategoryFilterUI(periodTransactions = []) {
  // Aktif tür filtresine göre işlemleri al (income, expense, all)
  let relevantForType = periodTransactions;
  if (state.filterType !== 'all') {
    relevantForType = periodTransactions.filter(t => t.type === state.filterType);
  }

  // Kategorilere göre sayı ve toplam tutar hesapla
  const categoryStats = {};
  relevantForType.forEach(t => {
    const cat = t.category || (t.type === 'income' ? 'Diğer Gelir' : 'Diğer Gider');
    if (!categoryStats[cat]) {
      categoryStats[cat] = { count: 0, total: 0, type: t.type };
    }
    categoryStats[cat].count++;
    categoryStats[cat].total += (Number(t.amount) || 0);
  });

  // 1. Dropdown (<select id="categoryFilterSelect">) Güncelleme
  if (elements.categoryFilterSelect) {
    const prevSelected = state.filterCategory;
    elements.categoryFilterSelect.innerHTML = '';

    // "Tüm Kategoriler" seçeneği
    const allOpt = document.createElement('option');
    allOpt.value = 'all';
    allOpt.textContent = `Tüm Kategoriler (${relevantForType.length})`;
    elements.categoryFilterSelect.appendChild(allOpt);

    // Gider Kategorileri Grubu
    if (state.filterType === 'all' || state.filterType === 'expense') {
      const expGroup = document.createElement('optgroup');
      expGroup.label = '── Gider Kategorileri ──';

      const expList = [...CATEGORIES.expense];
      // Verilerde olup listede olmayan kategori varsa ekle
      Object.keys(categoryStats).forEach(c => {
        if (categoryStats[c].type === 'expense' && !expList.some(item => item.name === c)) {
          expList.push({ name: c, icon: 'fa-box', color: '#64748b' });
        }
      });

      // Sıralama: Bu ay işlem sayısı olanlar üstte, azalan sırayla
      expList.sort((a, b) => {
        const countA = (categoryStats[a.name]?.count) || 0;
        const countB = (categoryStats[b.name]?.count) || 0;
        if (countB !== countA) return countB - countA;
        return a.name.localeCompare(b.name, 'tr');
      });

      expList.forEach(c => {
        const count = categoryStats[c.name]?.count || 0;
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = count > 0 ? `${c.name} (${count})` : `${c.name} (0)`;
        expGroup.appendChild(opt);
      });

      elements.categoryFilterSelect.appendChild(expGroup);
    }

    // Gelir Kategorileri Grubu
    if (state.filterType === 'all' || state.filterType === 'income') {
      const incGroup = document.createElement('optgroup');
      incGroup.label = '── Gelir Kategorileri ──';

      const incList = [...CATEGORIES.income];
      Object.keys(categoryStats).forEach(c => {
        if (categoryStats[c].type === 'income' && !incList.some(item => item.name === c)) {
          incList.push({ name: c, icon: 'fa-coins', color: '#64748b' });
        }
      });

      incList.sort((a, b) => {
        const countA = (categoryStats[a.name]?.count) || 0;
        const countB = (categoryStats[b.name]?.count) || 0;
        if (countB !== countA) return countB - countA;
        return a.name.localeCompare(b.name, 'tr');
      });

      incList.forEach(c => {
        const count = categoryStats[c.name]?.count || 0;
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = count > 0 ? `${c.name} (${count})` : `${c.name} (0)`;
        incGroup.appendChild(opt);
      });

      elements.categoryFilterSelect.appendChild(incGroup);
    }

    // Seçili değeri koru
    elements.categoryFilterSelect.value = prevSelected;
    if (elements.categoryFilterSelect.value !== prevSelected && prevSelected !== 'all') {
      state.filterCategory = 'all';
      elements.categoryFilterSelect.value = 'all';
    }
  }

  // 2. Kategori Çipleri (Pill / Chip Bar) Güncelleme
  if (elements.categoryChipsBar) {
    elements.categoryChipsBar.innerHTML = '';

    // "Tümü" çipi
    const isAllActive = state.filterCategory === 'all';
    const allChip = document.createElement('button');
    allChip.type = 'button';
    allChip.className = `category-chip ${isAllActive ? 'active' : ''}`;
    allChip.title = 'Tüm kategorileri göster';
    allChip.innerHTML = `
      <i class="fa-solid fa-layer-group"></i>
      <span class="chip-text">Tümü</span>
      <span class="chip-count">${relevantForType.length}</span>
    `;
    allChip.addEventListener('click', () => setCategoryFilter('all'));
    elements.categoryChipsBar.appendChild(allChip);

    // Dönemde kaydı olan veya şu an seçili olan kategorileri sıralı çip olarak ekle
    const chipCategories = Object.keys(categoryStats)
      .filter(cat => categoryStats[cat].count > 0 || cat === state.filterCategory)
      .sort((a, b) => (categoryStats[b]?.count || 0) - (categoryStats[a]?.count || 0));

    chipCategories.forEach(catName => {
      const stats = categoryStats[catName] || { count: 0, total: 0, type: 'expense' };
      const meta = getCategoryMeta(stats.type, catName);
      const isSelected = state.filterCategory === catName;

      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `category-chip ${isSelected ? 'active' : ''}`;
      chip.title = `${catName} kategorisini filtrele (${stats.count} işlem)`;
      if (isSelected) {
        chip.style.borderColor = meta.color;
        chip.style.boxShadow = `0 0 12px ${meta.color}50`;
        chip.style.backgroundColor = `${meta.color}20`;
      }

      chip.innerHTML = `
        <i class="fa-solid ${meta.icon}" style="color: ${meta.color}"></i>
        <span class="chip-text">${escapeHtml(catName)}</span>
        <span class="chip-count" style="background: ${meta.color}25; color: ${meta.color}; border: 1px solid ${meta.color}40">${stats.count}</span>
      `;

      chip.addEventListener('click', () => {
        if (state.filterCategory === catName) {
          setCategoryFilter('all');
        } else {
          setCategoryFilter(catName);
        }
      });

      elements.categoryChipsBar.appendChild(chip);
    });
  }

  // 3. Aktif Kategori Filtresi Bilgi Çubuğu (Banner)
  if (elements.activeCategoryIndicator) {
    if (state.filterCategory !== 'all') {
      elements.activeCategoryIndicator.classList.remove('hidden');
      if (elements.activeCategoryName) {
        elements.activeCategoryName.textContent = state.filterCategory;
      }
      
      const filteredForStats = relevantForType.filter(t => t.category === state.filterCategory);
      const totalAmount = filteredForStats.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      
      if (elements.activeCategoryStats) {
        elements.activeCategoryStats.textContent = `${filteredForStats.length} işlem • Toplam: ${formatCurrency(totalAmount)}`;
      }
    } else {
      elements.activeCategoryIndicator.classList.add('hidden');
    }
  }
}

function populateCategorySelects() {
  updateCategoryFilterUI([]);
}

async function handleTransactionFormSubmit(e) {
  e.preventDefault();

  const isEdit = !!elements.editTransactionId.value;
  const txData = {
    type: elements.typeIncomeRadio.checked ? 'income' : 'expense',
    amount: elements.amountInput.value,
    date: elements.dateInput.value,
    category: elements.categorySelect.value,
    title: elements.titleInput.value,
    description: elements.descriptionInput.value
  };

  try {
    elements.saveBtnText.textContent = 'Kaydediliyor...';
    if (isEdit) {
      await firebaseService.updateTransaction(elements.editTransactionId.value, txData);
      showToast('İşlem başarıyla güncellendi.', 'success');
    } else {
      await firebaseService.addTransaction(txData);
      showToast('Yeni işlem başarıyla eklendi.', 'success');
    }
    closeTransactionModal();
  } catch (err) {
    console.error('İşlem kaydedilemedi:', err);
    showToast('Hata: İşlem kaydedilemedi.', 'error');
  } finally {
    elements.saveBtnText.textContent = isEdit ? 'Güncelle' : 'Kaydet';
  }
}

// ================= SİLME İŞLEMLERİ =================
function promptDeleteTransaction(id, title) {
  state.pendingDeleteId = id;
  elements.deleteConfirmText.textContent = `"${title}" başlıklı işlem silinecektir. Bu işlem geri alınamaz.`;
  elements.deleteConfirmModal.classList.remove('hidden');
}

async function confirmDelete() {
  if (!state.pendingDeleteId) return;
  try {
    await firebaseService.deleteTransaction(state.pendingDeleteId);
    showToast('İşlem silindi.', 'info');
    elements.deleteConfirmModal.classList.add('hidden');
    state.pendingDeleteId = null;
  } catch (err) {
    showToast('Silinemedi: Bir hata oluştu.', 'error');
  }
}

// ================= AUTH İŞLEMLERİ =================

function openAuthModal(mode = 'login') {
  authMode = mode;
  elements.authErrorMsg.classList.add('hidden');
  elements.authForm.reset();

  if (mode === 'login') {
    elements.tabLogin.classList.add('active');
    elements.tabRegister.classList.remove('active');
    elements.authTitle.textContent = 'Hesabınıza Giriş Yapın';
    if (elements.authModalSubtitle) {
      elements.authModalSubtitle.textContent = 'BütçemPro • Devam etmek için giriş yapın';
    }
    elements.authSubmitBtnText.textContent = 'Giriş Yap';
    if (elements.authSubmitIcon) elements.authSubmitIcon.className = 'fa-solid fa-right-to-bracket';
  } else {
    elements.tabRegister.classList.add('active');
    elements.tabLogin.classList.remove('active');
    elements.authTitle.textContent = 'Yeni Hesap Oluşturun';
    if (elements.authModalSubtitle) {
      elements.authModalSubtitle.textContent = 'BütçemPro • Hesabınızı oluşturup hemen başlayın';
    }
    elements.authSubmitBtnText.textContent = 'Kayıt Ol';
    if (elements.authSubmitIcon) elements.authSubmitIcon.className = 'fa-solid fa-user-plus';
  }

  elements.authModal.classList.remove('hidden');
  setTimeout(() => {
    if (elements.authEmail) elements.authEmail.focus();
  }, 100);
}

function closeAuthModal() {
  // Kullanıcı giriş yapmamışsa modal asla kapatılamaz!
  if (!state.currentUser) return;
  elements.authModal.classList.add('hidden');
}

async function handleAuthFormSubmit(e) {
  e.preventDefault();
  const email = elements.authEmail.value.trim();
  const password = elements.authPassword.value;

  elements.authErrorMsg.classList.add('hidden');
  elements.authSubmitBtnText.textContent = 'Lütfen bekleyin...';

  let res;
  if (authMode === 'login') {
    res = await firebaseService.login(email, password);
  } else {
    res = await firebaseService.register(email, password);
  }

  elements.authSubmitBtnText.textContent = authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol';

  if (res.success) {
    showToast(authMode === 'login' ? `Hoş geldiniz, ${email}!` : 'Hesabınız başarıyla oluşturuldu! Hoş geldiniz!', 'success');
    state.currentUser = res.user;
    unlockApp();
    updateUserInterface(res.user);
    closeAuthModal();

    // Veri dinleyicisini başlat
    firebaseService.subscribeTransactions((transactions) => {
      state.allTransactions = transactions;
      renderApp();
    });
  } else {
    elements.authErrorText.textContent = res.error || 'Giriş yapılamadı.';
    elements.authErrorMsg.classList.remove('hidden');
  }
}

// ================= CSV EXPORT =================
function exportTransactionsCSV() {
  if (state.allTransactions.length === 0) {
    showToast('Dışa aktarılacak işlem bulunamadı.', 'error');
    return;
  }

  let csvContent = '\uFEFF'; // Excel UTF-8 BOM
  csvContent += 'Tarih,Tür,Kategori,Başlık,Açıklama,Tutar (TL)\r\n';

  state.allTransactions.forEach(t => {
    const typeLabel = t.type === 'income' ? 'Gelir' : 'Gider';
    const row = [
      `"${t.date || ''}"`,
      `"${typeLabel}"`,
      `"${t.category || ''}"`,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${t.amount}"`
    ];
    csvContent += row.join(',') + '\r\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `butcem_islemler_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('İşlemler CSV dosyası olarak indirildi.', 'success');
}

// ================= VERİ İÇE AKTARMA (IMPORT) =================
async function importPreloadedData() {
  try {
    if (elements.quickSyncDataBtn) {
      elements.quickSyncDataBtn.disabled = true;
      elements.quickSyncDataBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Aktarılıyor...</span>';
    }
    if (elements.loadPreloadedBtnText) {
      elements.loadPreloadedBtnText.textContent = 'Aktarılıyor...';
    }

    const result = await firebaseService.importTransactionsBatch(SEPTEMBER_TRANSACTIONS);
    
    showToast(`Başarılı: ${result.count} işlem oturumunuza aktarıldı!`, 'success');

    if (elements.importModal) elements.importModal.classList.add('hidden');
    if (elements.quickSyncNoticeBanner) elements.quickSyncNoticeBanner.classList.add('hidden');
    localStorage.setItem('butcem_hide_quick_sync', 'true');
  } catch (err) {
    console.error('Veri aktarma hatası:', err);
    showToast('Hata: Veriler aktarılamadı.', 'error');
  } finally {
    if (elements.quickSyncDataBtn) {
      elements.quickSyncDataBtn.disabled = false;
      elements.quickSyncDataBtn.innerHTML = '<i class="fa-solid fa-bolt"></i> <span>Oturuma Aktar (36 Kayıt)</span>';
    }
    if (elements.loadPreloadedBtnText) {
      elements.loadPreloadedBtnText.textContent = 'Bu Verileri Oturuma Aktar';
    }
  }
}

function handleCsvUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (evt) => {
    try {
      const text = evt.target.result;
      const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
      if (lines.length < 2) {
        showToast('Geçersiz veya boş CSV dosyası.', 'error');
        return;
      }

      const transactions = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
        const parts = matches.map(m => m.replace(/^"|"$/g, '').trim());
        if (parts.length >= 6) {
          const [date, typeLabel, catRaw, title, desc, amtStr] = parts;
          let type = typeLabel.toLowerCase().includes('gelir') ? 'income' : 'expense';
          let category = catRaw;
          
          if (category === 'Market & Gıda') {
            const lowerTitle = (title || '').toLowerCase();
            const isFood = /burger|popeyes|kantin|simit|nezir|pasta|yemek|restoran|cafe|kafe/.test(lowerTitle);
            category = isFood ? 'Dışardan Yemek' : 'Market';
          } else if (category === 'Ulaşım & Yakıt') {
            category = 'Ulaşım';
          } else if (category === 'Kira & Konut') {
            category = 'Yurt Ücreti';
          }

          transactions.push({
            date: date || new Date().toISOString().slice(0, 10),
            type,
            category,
            title: title || 'İşlem',
            description: desc || '',
            amount: parseFloat(amtStr) || 0
          });
        }
      }

      if (transactions.length > 0) {
        await firebaseService.importTransactionsBatch(transactions);
        showToast(`${transactions.length} işlem CSV dosyasından aktarıldı!`, 'success');
        if (elements.importModal) elements.importModal.classList.add('hidden');
      } else {
        showToast('CSV dosyasında geçerli işlem bulunamadı.', 'error');
      }
    } catch (err) {
      console.error('CSV yükleme hatası:', err);
      showToast('CSV işlenirken hata oluştu.', 'error');
    }
  };
  reader.readAsText(file, 'UTF-8');
}

// ================= EVENT LISTENER'LAR =================
function bindEvents() {
  // Ay Geçişleri
  elements.prevMonthBtn.addEventListener('click', () => {
    state.selectedMonth--;
    if (state.selectedMonth < 0) {
      state.selectedMonth = 11;
      state.selectedYear--;
    }
    updatePeriodDisplay();
    renderApp();
  });

  elements.nextMonthBtn.addEventListener('click', () => {
    state.selectedMonth++;
    if (state.selectedMonth > 11) {
      state.selectedMonth = 0;
      state.selectedYear++;
    }
    updatePeriodDisplay();
    renderApp();
  });

  const guardAuth = (fn) => {
    if (!state.currentUser) {
      openAuthModal('login');
      showToast('Lütfen önce giriş yapın veya kayıt olun.', 'error');
      return;
    }
    fn();
  };

  // Butonlar: Gelir/Harcama Ekle (Oturum Korumalı)
  elements.openAddIncomeBtn.addEventListener('click', () => guardAuth(() => openAddTransactionModal('income')));
  elements.openAddExpenseBtn.addEventListener('click', () => guardAuth(() => openAddTransactionModal('expense')));
  elements.emptyAddIncomeBtn.addEventListener('click', () => guardAuth(() => openAddTransactionModal('income')));
  elements.emptyAddExpenseBtn.addEventListener('click', () => guardAuth(() => openAddTransactionModal('expense')));

  // CSV Export (Oturum Korumalı)
  elements.exportDataBtn.addEventListener('click', () => guardAuth(exportTransactionsCSV));

  // İşlem Modalı Kapatma
  elements.closeTransactionModalBtn.addEventListener('click', closeTransactionModal);
  elements.cancelTransactionBtn.addEventListener('click', closeTransactionModal);

  // Modal Tür Radio Değişimi
  elements.typeIncomeRadio.addEventListener('change', () => {
    elements.modalTypeBadge.style.background = 'var(--income)';
    populateCategoryDropdown('income');
  });
  elements.typeExpenseRadio.addEventListener('change', () => {
    elements.modalTypeBadge.style.background = 'var(--expense)';
    populateCategoryDropdown('expense');
  });

  // İşlem Formu Submit
  elements.transactionForm.addEventListener('submit', handleTransactionFormSubmit);

  // Silme Onay Modalı
  elements.cancelDeleteBtn.addEventListener('click', () => elements.deleteConfirmModal.classList.add('hidden'));
  elements.confirmDeleteBtn.addEventListener('click', confirmDelete);

  // Auth Modalı Sekmeler ve Form
  if (elements.navLoginBtn) {
    elements.navLoginBtn.addEventListener('click', () => openAuthModal('login'));
  }
  elements.tabLogin.addEventListener('click', () => openAuthModal('login'));
  elements.tabRegister.addEventListener('click', () => openAuthModal('register'));
  elements.authForm.addEventListener('submit', handleAuthFormSubmit);

  // Çıkış Yap -> Oturumu Kapatıp Zorunlu Giriş Modalı Aç
  elements.logoutBtn.addEventListener('click', async () => {
    await firebaseService.logout();
    showToast('Çıkış yapıldı. Tekrar görüşmek üzere!', 'info');
    state.currentUser = null;
    updateUserInterface(null);
    lockApp();
    openAuthModal('login');
  });

  // Firebase Durum Rozeti Tıklandığında Rehber Aç
  elements.firebaseStatusBadge.addEventListener('click', () => {
    elements.configGuideModal.classList.remove('hidden');
  });
  if (elements.openConfigHelpBtn) {
    elements.openConfigHelpBtn.addEventListener('click', () => {
      elements.configGuideModal.classList.remove('hidden');
    });
  }
  elements.closeConfigGuideModalBtn.addEventListener('click', () => {
    elements.configGuideModal.classList.add('hidden');
  });
  elements.gotItConfigBtn.addEventListener('click', () => {
    elements.configGuideModal.classList.add('hidden');
  });

  // Banner Kapatma
  if (elements.closeBannerBtn) {
    elements.closeBannerBtn.addEventListener('click', () => {
      elements.configNoticeBanner.classList.add('hidden');
      localStorage.setItem('butcem_hide_banner', 'true');
    });
  }

  // Filtreler: Tür Sekmeleri (Tümü / Gelirler / Giderler)
  elements.typeFilterTabs.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      elements.typeFilterTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filterType = btn.dataset.type;

      // Seçili kategori varsa ve yeni türe uymuyorsa 'all' olarak sıfırla
      if (state.filterCategory !== 'all') {
        const isExp = CATEGORIES.expense.some(c => c.name === state.filterCategory);
        const isInc = CATEGORIES.income.some(c => c.name === state.filterCategory);
        if ((state.filterType === 'income' && !isInc) || (state.filterType === 'expense' && !isExp)) {
          state.filterCategory = 'all';
        }
      }

      renderApp();
    });
  });

  // Filtre: Kategori Açılır Menü Değişimi
  elements.categoryFilterSelect.addEventListener('change', (e) => {
    setCategoryFilter(e.target.value);
  });

  // Filtre: Aktif Kategori Çubuğundaki Temizleme Butonu
  if (elements.clearCategoryFilterBtn) {
    elements.clearCategoryFilterBtn.addEventListener('click', () => {
      setCategoryFilter('all');
    });
  }

  // Boş Durumdaki Filtreyi Temizle Butonu
  if (elements.emptyResetFilterBtn) {
    elements.emptyResetFilterBtn.addEventListener('click', () => {
      setCategoryFilter('all');
      state.filterType = 'all';
      elements.typeFilterTabs.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.type === 'all');
      });
      state.searchQuery = '';
      if (elements.searchInput) elements.searchInput.value = '';
      if (elements.clearSearchBtn) elements.clearSearchBtn.classList.add('hidden');
      renderApp();
    });
  }

  // Arama Girişi
  elements.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    if (state.searchQuery) {
      elements.clearSearchBtn.classList.remove('hidden');
    } else {
      elements.clearSearchBtn.classList.add('hidden');
    }
    renderApp();
  });

  elements.clearSearchBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    state.searchQuery = '';
    elements.clearSearchBtn.classList.add('hidden');
    renderApp();
  });

  // İçe Aktarma Modalı & Hızlı Senkronizasyon
  if (elements.importDataBtn) {
    elements.importDataBtn.addEventListener('click', () => {
      guardAuth(() => elements.importModal.classList.remove('hidden'));
    });
  }
  if (elements.closeImportModalBtn) {
    elements.closeImportModalBtn.addEventListener('click', () => {
      elements.importModal.classList.add('hidden');
    });
  }
  if (elements.closeImportModalFooterBtn) {
    elements.closeImportModalFooterBtn.addEventListener('click', () => {
      elements.importModal.classList.add('hidden');
    });
  }
  if (elements.loadPreloadedDataBtn) {
    elements.loadPreloadedDataBtn.addEventListener('click', () => guardAuth(importPreloadedData));
  }
  if (elements.quickSyncDataBtn) {
    elements.quickSyncDataBtn.addEventListener('click', () => guardAuth(importPreloadedData));
  }
  if (elements.closeQuickSyncBannerBtn) {
    elements.closeQuickSyncBannerBtn.addEventListener('click', () => {
      elements.quickSyncNoticeBanner.classList.add('hidden');
      localStorage.setItem('butcem_hide_quick_sync', 'true');
    });
  }
  if (elements.csvFileInput) {
    elements.csvFileInput.addEventListener('change', handleCsvUpload);
  }

  // Modal dışına tıklandığında kapatma (authModal hariç!)
  window.addEventListener('click', (e) => {
    if (e.target === elements.transactionModal) closeTransactionModal();
    // authModal dışına tıklandığında ASLA kapanmaz
    if (e.target === elements.configGuideModal) elements.configGuideModal.classList.add('hidden');
    if (e.target === elements.deleteConfirmModal) elements.deleteConfirmModal.classList.add('hidden');
    if (e.target === elements.importModal) elements.importModal.classList.add('hidden');
  });

  // ESC tuşu yönetimi (authModal hariç)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (elements.transactionModal && !elements.transactionModal.classList.contains('hidden')) {
        closeTransactionModal();
      }
      if (elements.importModal && !elements.importModal.classList.contains('hidden')) {
        elements.importModal.classList.add('hidden');
      }
      if (elements.configGuideModal && !elements.configGuideModal.classList.contains('hidden')) {
        elements.configGuideModal.classList.add('hidden');
      }
      // authModal ESC ile kapanamaz!
    }
  });
}

// ================= YARDIMCI FONKSİYONLAR =================

function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return '₺' + num.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return dateStr;
}

function getCategoryMeta(type, categoryName) {
  const list = CATEGORIES[type] || [];
  const found = list.find(c => c.name === categoryName);
  if (found) return found;

  // Geriye dönük uyumluluk veya alternatif yazım desteği
  if (categoryName === 'Market & Gıda') return { name: 'Market', icon: 'fa-basket-shopping', color: '#10b981' };
  if (categoryName === 'Kira & Konut') return { name: 'Yurt Ücreti', icon: 'fa-building-columns', color: '#6366f1' };
  if (categoryName === 'Ulaşım & Yakıt') return { name: 'Ulaşım', icon: 'fa-bus', color: '#f59e0b' };
  if (categoryName === 'Dışarıdan Yemek') return { name: 'Dışardan Yemek', icon: 'fa-utensils', color: '#f97316' };

  return {
    name: categoryName || 'Diğer',
    icon: type === 'income' ? 'fa-wallet' : 'fa-receipt',
    color: CATEGORY_COLORS[categoryName] || '#64748b'
  };
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'fa-circle-info';
  if (type === 'success') icon = 'fa-circle-check';
  if (type === 'error') icon = 'fa-circle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${escapeHtml(message)}</span>
  `;

  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Dışarıdan veya konsoldan çağrılabilir yardımcı fonksiyon
window.importSeptemberData = importPreloadedData;

// Sayfa Yüklendiğinde Başlat
document.addEventListener('DOMContentLoaded', initApp);
