/**
 * ===================================================================
 * FİNANSAL TAKİP - FIREBASE & VERİ SERVİSİ (firebase-service.js)
 * ===================================================================
 * Firebase Modular SDK (v10) ile Auth ve Firestore entegrasyonu sağlar.
 * Yapılandırma eksikse pürüzsüz LocalStorage Demo modu sunar.
 */

import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

let app = null;
let auth = null;
let db = null;
let isInitialized = false;

// Firebase CDN Modülleri
let firebaseModules = {
  initializeApp: null,
  getAuth: null,
  signInWithEmailAndPassword: null,
  createUserWithEmailAndPassword: null,
  signOut: null,
  onAuthStateChanged: null,
  getFirestore: null,
  collection: null,
  doc: null,
  getDoc: null,
  getDocs: null,
  setDoc: null,
  addDoc: null,
  updateDoc: null,
  deleteDoc: null,
  onSnapshot: null,
  query: null,
  where: null,
  orderBy: null,
  serverTimestamp: null
};

// Yerel Demo Depolama Anahtarları
const LOCAL_STORAGE_KEY = 'finansal_takip_demo_transactions';
const LOCAL_USER_KEY = 'finansal_takip_demo_user';
const LOCAL_ACCOUNTS_KEY = 'finansal_takip_demo_registered_accounts';
const SYNC_KEY = 'finansal_takip_september_2026_synced_v1';
const LOCAL_ADMIN_TASKS_KEY = 'finansal_takip_admin_tasks';

// Yönetici (Admin) E-Posta Listesi
export const ADMIN_EMAILS = [
  'daykul75@gmail.com',
  'admin@finansaltakip.com',
  'admin@todoapp.com'
];

/**
 * Kullanıcının admin yetkisine sahip olup olmadığını kontrol eder
 */
export function isUserAdmin(user) {
  if (!user) return false;

  // 1. Rol veya yetki bayrağı kontrolü
  const role = String(user.role || '').toLowerCase().trim();
  if (role === 'admin' || user.isAdmin === true || user.admin === true) return true;

  // 2. E-posta ve kullanıcı adı kontrolü
  const email = (user.email || '').toLowerCase().trim();
  if (!email) return false;

  // daykul75, dayku, denizbaranaykul hesapları
  if (
    email === 'daykul75' ||
    email.startsWith('daykul75') ||
    email.includes('daykul75') ||
    email.includes('dayku') ||
    email.includes('denizbaranaykul')
  ) {
    return true;
  }

  // 3. Yerel depolama override kontrolü
  try {
    if (localStorage.getItem('finansal_takip_user_role') === 'admin') return true;
  } catch (e) {}

  return ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase().trim() === email);
}

// Görev Konuları (Kullanıcının talep ettiği güncel kategoriler)
export const TASK_TOPICS = [
  { id: 'banyo', name: 'Banyo', icon: 'fa-bath', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' },
  { id: 'yurt-yemegi', name: 'Yurt Yemeği', icon: 'fa-utensils', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
  { id: 'kardiyo', name: 'Kardiyo', icon: 'fa-heart-pulse', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  { id: 'derse-gitmek', name: 'Derse Gitmek', icon: 'fa-graduation-cap', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
  { id: 'odemeler', name: 'Ödemeler', icon: 'fa-credit-card', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.15)' },
  { id: 'calismalar', name: 'Çalışmalar', icon: 'fa-laptop-code', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  { id: 'alisveris', name: 'Alışveriş', icon: 'fa-basket-shopping', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' }
];

// Başlangıç Admin Görevleri (Güncel Konularla Örnek Yapılacaklar Listesi)
export const DEFAULT_ADMIN_TASKS = [
  {
    id: 'admin-task-01',
    date: '2026-09-27',
    time: '08:30',
    topic: 'Banyo',
    title: 'Sabah banyosu ve kişisel hazırlık',
    description: 'Güne dinç başlamak için sabah duşu ve kişisel bakım rutini.',
    status: 'completed',
    completedAt: '2026-09-27T08:50:00',
    createdAt: 1790580000000
  },
  {
    id: 'admin-task-02',
    date: '2026-09-27',
    time: '10:00',
    topic: 'Derse Gitmek',
    title: 'Finansal yönetim dersine katıl',
    description: 'Ders notlarını hazırla ve amfideki haftalık derse gir.',
    status: 'completed',
    completedAt: '2026-09-27T10:15:00',
    createdAt: 1790582400000
  },
  {
    id: 'admin-task-03',
    date: '2026-09-27',
    time: '13:00',
    topic: 'Ödemeler',
    title: 'Aylık yurt taksiti ve internet faturasını öde',
    description: 'Mobil bankacılık üzerinden faturaları ve yurt ödemesini tamamla.',
    status: 'pending',
    completedAt: null,
    createdAt: 1790584000000
  },
  {
    id: 'admin-task-04',
    date: '2026-09-27',
    time: '15:30',
    topic: 'Çalışmalar',
    title: 'Proje geliştirme ve kodlama çalışmaları',
    description: 'Finansal takip web uygulaması geliştirmelerine odaklan.',
    status: 'pending',
    completedAt: null,
    createdAt: 1790586000000
  },
  {
    id: 'admin-task-05',
    date: '2026-09-27',
    time: '17:30',
    topic: 'Kardiyo',
    title: '45 dk kardiyo ve koşu antrenmanı',
    description: 'Koşu bandı ve kardiyo alanında günlük kondisyon çalışması.',
    status: 'pending',
    completedAt: null,
    createdAt: 1790588000000
  },
  {
    id: 'admin-task-06',
    date: '2026-09-27',
    time: '19:00',
    topic: 'Yurt Yemeği',
    title: 'Yemekhanede akşam yurt yemeği',
    description: 'Yurt yemekhanesinde akşam yemeği saati.',
    status: 'pending',
    completedAt: null,
    createdAt: 1790590000000
  },
  {
    id: 'admin-task-07',
    date: '2026-09-27',
    time: '20:30',
    topic: 'Alışveriş',
    title: 'Haftalık ihtiyaçlar için market alışverişi',
    description: 'Kişisel atıştırmalık ve hijyen ürünleri alışverişi yap.',
    status: 'pending',
    completedAt: null,
    createdAt: 1790592000000
  }
];

// Geriye dönük uyumluluk: Eski verileri yeni anahtarlara aktar
try {
  if (!localStorage.getItem(LOCAL_STORAGE_KEY) && localStorage.getItem('butcem_demo_transactions')) {
    localStorage.setItem(LOCAL_STORAGE_KEY, localStorage.getItem('butcem_demo_transactions'));
  }
  if (!localStorage.getItem(LOCAL_USER_KEY) && localStorage.getItem('butcem_demo_user')) {
    localStorage.setItem(LOCAL_USER_KEY, localStorage.getItem('butcem_demo_user'));
  }
  if (!localStorage.getItem(LOCAL_ACCOUNTS_KEY) && localStorage.getItem('butcem_demo_registered_accounts')) {
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, localStorage.getItem('butcem_demo_registered_accounts'));
  }
  if (!localStorage.getItem(SYNC_KEY) && localStorage.getItem('butcem_september_2026_synced_v1')) {
    localStorage.setItem(SYNC_KEY, localStorage.getItem('butcem_september_2026_synced_v1'));
  }
  // Yeni Görev Kategorileri Göçü (banyo, yurt yemeği, kardiyo, derse gitmek, ödemeler, çalışmalar, alışveriş)
  if (localStorage.getItem('finansal_takip_topics_migrated_v3') !== 'true') {
    localStorage.setItem(LOCAL_ADMIN_TASKS_KEY, JSON.stringify(DEFAULT_ADMIN_TASKS));
    localStorage.setItem('finansal_takip_topics_migrated_v3', 'true');
  }
} catch (e) {
  console.warn('Veri göçü kontrolü sırasında uyarı:', e);
}

// Kullanıcının sağladığı Eylül 2026 işlem listesi (36 İşlem)
export const SEPTEMBER_TRANSACTIONS = [
  {
    id: 'demo-tx-01',
    date: '2026-09-25',
    type: 'income',
    category: 'Diğer Gelir',
    title: 'bes geri dönüşü',
    description: '',
    amount: 3000,
    createdAt: 1790442000000
  },
  {
    id: 'demo-tx-02',
    date: '2026-09-25',
    type: 'expense',
    category: 'Market',
    title: 'aydemir tekel',
    description: '',
    amount: 90,
    createdAt: 1790441000000
  },
  {
    id: 'demo-tx-03',
    date: '2026-09-25',
    type: 'expense',
    category: 'Dışardan Yemek',
    title: 'burger king',
    description: '',
    amount: 420,
    createdAt: 1790440000000
  },
  {
    id: 'demo-tx-04',
    date: '2026-09-25',
    type: 'expense',
    category: 'Market',
    title: 'aydemir büfe tekel',
    description: '',
    amount: 125,
    createdAt: 1790439000000
  },
  {
    id: 'demo-tx-05',
    date: '2026-09-25',
    type: 'expense',
    category: 'Eğlence & Sosyal',
    title: 'playstation',
    description: '',
    amount: 110,
    createdAt: 1790438000000
  },
  {
    id: 'demo-tx-06',
    date: '2026-09-25',
    type: 'expense',
    category: 'Market',
    title: 'şok',
    description: '',
    amount: 165,
    createdAt: 1790437000000
  },
  {
    id: 'demo-tx-07',
    date: '2026-09-25',
    type: 'expense',
    category: 'Sağlık & Bakım',
    title: 'sağlık raporu',
    description: '',
    amount: 443,
    createdAt: 1790436000000
  },
  {
    id: 'demo-tx-08',
    date: '2026-09-25',
    type: 'expense',
    category: 'Dışardan Yemek',
    title: 'miss burger',
    description: '',
    amount: 295,
    createdAt: 1790435000000
  },
  {
    id: 'demo-tx-09',
    date: '2026-09-25',
    type: 'expense',
    category: 'Market',
    title: 'bim şok',
    description: '',
    amount: 270,
    createdAt: 1790434000000
  },
  {
    id: 'demo-tx-10',
    date: '2026-09-25',
    type: 'expense',
    category: 'Ulaşım',
    title: 'taksi',
    description: '',
    amount: 370,
    createdAt: 1790433000000
  },
  {
    id: 'demo-tx-11',
    date: '2026-09-25',
    type: 'expense',
    category: 'Ulaşım',
    title: 'denizli karta para',
    description: '',
    amount: 133,
    createdAt: 1790432000000
  },
  {
    id: 'demo-tx-12',
    date: '2026-09-25',
    type: 'expense',
    category: 'Dışardan Yemek',
    title: 'kantin',
    description: '',
    amount: 160,
    createdAt: 1790431000000
  },
  {
    id: 'demo-tx-13',
    date: '2026-09-25',
    type: 'expense',
    category: 'Market',
    title: 'yurt kantin su',
    description: '',
    amount: 128,
    createdAt: 1790430000000
  },
  {
    id: 'demo-tx-14',
    date: '2026-09-25',
    type: 'expense',
    category: 'Eğlence & Sosyal',
    title: 'internet kafe',
    description: '',
    amount: 75,
    createdAt: 1790429000000
  },
  {
    id: 'demo-tx-15',
    date: '2026-09-25',
    type: 'expense',
    category: 'Dışardan Yemek',
    title: 'simit aldım trene giderken',
    description: '',
    amount: 150,
    createdAt: 1790428000000
  },
  {
    id: 'demo-tx-16',
    date: '2026-09-25',
    type: 'expense',
    category: 'Dışardan Yemek',
    title: 'yurt kantin',
    description: '',
    amount: 75,
    createdAt: 1790427000000
  },
  {
    id: 'demo-tx-17',
    date: '2026-09-25',
    type: 'expense',
    category: 'Diğer Gider',
    title: 'ekmek aldım',
    description: '',
    amount: 52,
    createdAt: 1790426000000
  },
  {
    id: 'demo-tx-18',
    date: '2026-09-25',
    type: 'expense',
    category: 'Dışardan Yemek',
    title: 'cafe berry yanı',
    description: '',
    amount: 300,
    createdAt: 1790425000000
  },
  {
    id: 'demo-tx-19',
    date: '2026-09-25',
    type: 'expense',
    category: 'Dışardan Yemek',
    title: 'nezir',
    description: '',
    amount: 210,
    createdAt: 1790424000000
  },
  {
    id: 'demo-tx-20',
    date: '2026-09-25',
    type: 'expense',
    category: 'Ulaşım',
    title: 'trenler',
    description: '',
    amount: 750,
    createdAt: 1790423000000
  },
  {
    id: 'demo-tx-21',
    date: '2026-09-25',
    type: 'expense',
    category: 'Ulaşım',
    title: 'araba',
    description: '',
    amount: 800,
    createdAt: 1790422000000
  },
  {
    id: 'demo-tx-22',
    date: '2026-09-25',
    type: 'income',
    category: 'Diğer Gelir',
    title: 'annem',
    description: '',
    amount: 5000,
    createdAt: 1790421000000
  },
  {
    id: 'demo-tx-23',
    date: '2026-09-25',
    type: 'expense',
    category: 'Dışardan Yemek',
    title: 'burger king',
    description: '',
    amount: 420,
    createdAt: 1790420000000
  },
  {
    id: 'demo-tx-24',
    date: '2026-09-24',
    type: 'expense',
    category: 'Eğlence & Sosyal',
    title: 'kafe',
    description: '',
    amount: 240,
    createdAt: 1790350000000
  },
  {
    id: 'demo-tx-25',
    date: '2026-09-23',
    type: 'expense',
    category: 'Dışardan Yemek',
    title: 'kantin',
    description: '',
    amount: 165,
    createdAt: 1790260000000
  },
  {
    id: 'demo-tx-26',
    date: '2026-09-22',
    type: 'expense',
    category: 'Market',
    title: 'pekdemirden terlik yoğurt ayran tavuk',
    description: '',
    amount: 700,
    createdAt: 1790180000000
  },
  {
    id: 'demo-tx-27',
    date: '2026-09-22',
    type: 'expense',
    category: 'Dışardan Yemek',
    title: 'pasta',
    description: '',
    amount: 180,
    createdAt: 1790175000000
  },
  {
    id: 'demo-tx-28',
    date: '2026-09-22',
    type: 'expense',
    category: 'Dışardan Yemek',
    title: 'popeyes',
    description: '',
    amount: 420,
    createdAt: 1790170000000
  },
  {
    id: 'demo-tx-29',
    date: '2026-09-18',
    type: 'expense',
    category: 'Dışardan Yemek',
    title: 'popeyes',
    description: '',
    amount: 420,
    createdAt: 1789830000000
  },
  {
    id: 'demo-tx-30',
    date: '2026-09-18',
    type: 'expense',
    category: 'Ulaşım',
    title: 'benzin',
    description: '',
    amount: 380,
    createdAt: 1789820000000
  },
  {
    id: 'demo-tx-31',
    date: '2026-09-17',
    type: 'expense',
    category: 'Eğitim',
    title: 'kpss',
    description: '',
    amount: 220,
    createdAt: 1789730000000
  },
  {
    id: 'demo-tx-32',
    date: '2026-09-15',
    type: 'expense',
    category: 'Dışardan Yemek',
    title: 'burger king',
    description: '',
    amount: 910,
    createdAt: 1789560000000
  },
  {
    id: 'demo-tx-33',
    date: '2026-09-15',
    type: 'expense',
    category: 'Eğlence & Sosyal',
    title: 'berry cafe',
    description: '',
    amount: 210,
    createdAt: 1789550000000
  },
  {
    id: 'demo-tx-34',
    date: '2026-09-14',
    type: 'expense',
    category: 'Ulaşım',
    title: 'kentkart',
    description: '',
    amount: 100,
    createdAt: 1789470000000
  },
  {
    id: 'demo-tx-35',
    date: '2026-09-14',
    type: 'expense',
    category: 'Dışardan Yemek',
    title: 'burger king',
    description: '',
    amount: 435,
    createdAt: 1789460000000
  },
  {
    id: 'demo-tx-36',
    date: '2026-09-14',
    type: 'income',
    category: 'Diğer Gelir',
    title: 'dedemler',
    description: '',
    amount: 10000,
    createdAt: 1789450000000
  }
];

export const DEFAULT_DEMO_DATA = SEPTEMBER_TRANSACTIONS;

class FirebaseService {
  constructor() {
    this.mode = 'checking'; // 'firebase' | 'demo'
    this.currentUser = null;
    this.activeListener = null;
    this.activeAdminTasksListener = null;
  }

  /**
   * Servisi başlatır; Firebase CDN modüllerini yüklemeyi dener.
   */
  async init() {
    if (isInitialized) return this.mode;

    if (isFirebaseConfigured()) {
      try {
        // Firebase CDN modüllerini dinamik yükle
        const [appMod, authMod, firestoreMod] = await Promise.all([
          import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js'),
          import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js'),
          import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js')
        ]);

        firebaseModules = {
          initializeApp: appMod.initializeApp,
          getAuth: authMod.getAuth,
          signInWithEmailAndPassword: authMod.signInWithEmailAndPassword,
          createUserWithEmailAndPassword: authMod.createUserWithEmailAndPassword,
          signOut: authMod.signOut,
          onAuthStateChanged: authMod.onAuthStateChanged,
          getFirestore: firestoreMod.getFirestore,
          collection: firestoreMod.collection,
          doc: firestoreMod.doc,
          getDoc: firestoreMod.getDoc,
          getDocs: firestoreMod.getDocs,
          setDoc: firestoreMod.setDoc,
          addDoc: firestoreMod.addDoc,
          updateDoc: firestoreMod.updateDoc,
          deleteDoc: firestoreMod.deleteDoc,
          onSnapshot: firestoreMod.onSnapshot,
          query: firestoreMod.query,
          where: firestoreMod.where,
          orderBy: firestoreMod.orderBy,
          serverTimestamp: firestoreMod.serverTimestamp
        };

        app = firebaseModules.initializeApp(firebaseConfig);
        auth = firebaseModules.getAuth(app);
        db = firebaseModules.getFirestore(app);

        this.mode = 'firebase';
        isInitialized = true;
        console.log('[FirebaseService] Firebase başarıyla bağlandı.');
        return 'firebase';
      } catch (err) {
        console.warn('[FirebaseService] Firebase bağlantı hatası, Demo moduna geçiliyor:', err);
        this.mode = 'demo';
        this._initDemoData();
        isInitialized = true;
        return 'demo';
      }
    } else {
      console.log('[FirebaseService] Firebase config boş veya varsayılan, Demo modunda başlatılıyor.');
      this.mode = 'demo';
      this._initDemoData();
      isInitialized = true;
      return 'demo';
    }
  }

  _initDemoData() {
    const isSynced = localStorage.getItem(SYNC_KEY);

    if (!isSynced) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEPTEMBER_TRANSACTIONS));
      localStorage.setItem(SYNC_KEY, 'true');
    } else {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEPTEMBER_TRANSACTIONS));
      } else {
        // Mevcut yerel verilerde eski kategori isimleri varsa güncelle
        try {
          let list = JSON.parse(raw);
          let modified = false;
          list = list.map(item => {
            if (item.category === 'Market & Gıda') {
              item.category = 'Market';
              modified = true;
            } else if (item.category === 'Kira & Konut') {
              item.category = 'Yurt Ücreti';
              if (item.title === 'Ev Kirası') item.title = 'Yurt Ücreti';
              modified = true;
            } else if (item.category === 'Ulaşım & Yakıt') {
              item.category = 'Ulaşım';
              modified = true;
            }
            return item;
          });
          if (modified) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
          }
        } catch (e) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEPTEMBER_TRANSACTIONS));
        }
      }
    }

    const savedUser = localStorage.getItem(LOCAL_USER_KEY);
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch (e) {
        this.currentUser = null;
        localStorage.removeItem(LOCAL_USER_KEY);
      }
    } else {
      this.currentUser = null;
    }

    // Demo Görev Verilerini Başlat
    if (!localStorage.getItem(LOCAL_ADMIN_TASKS_KEY)) {
      localStorage.setItem(LOCAL_ADMIN_TASKS_KEY, JSON.stringify(DEFAULT_ADMIN_TASKS));
    }
  }

  /**
   * Toplu işlem yükleme (Verileri içe aktarma / Senkronizasyon)
   * Aktif oturuma göre (Firebase veya LocalStorage) kaydeder.
   */
  async importTransactionsBatch(transactions) {
    if (this.mode === 'firebase' && this.currentUser) {
      const colRef = firebaseModules.collection(db, 'users', this.currentUser.uid, 'transactions');
      let count = 0;
      for (const tx of transactions) {
        const payload = {
          type: tx.type,
          title: (tx.title || '').trim(),
          amount: parseFloat(tx.amount) || 0,
          category: tx.category || 'Diğer Gider',
          date: tx.date || new Date().toISOString().slice(0, 10),
          description: (tx.description || '').trim(),
          createdAt: tx.createdAt || Date.now()
        };
        await firebaseModules.addDoc(colRef, payload);
        count++;
      }
      return { success: true, count, mode: 'firebase' };
    } else {
      // LocalStorage üzerine ekle veya güncelle
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      let data = raw ? JSON.parse(raw) : [];
      const newItems = transactions.map((t, idx) => ({
        ...t,
        id: t.id || 'imp-' + Date.now() + '-' + idx
      }));
      // Mevcut verileri yeni verilerle birleştir veya güncelle
      data = [...newItems];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('finansal_takip_data_change', { detail: { type: 'transaction_updated' } }));
      window.dispatchEvent(new CustomEvent('butcem_data_change', { detail: { type: 'transaction_updated' } }));
      return { success: true, count: newItems.length, mode: 'demo' };
    }
  }

  // ================= AUTH İŞLEMLERİ =================

  /**
   * Kullanıcı objesine Firestore ve yerel depodan admin rolünü bağlar
   */
  async _enrichUserWithRole(user) {
    if (!user) return user;

    // 1. E-posta adresi ve bilinen admin kullanıcıları
    const email = (user.email || '').toLowerCase().trim();
    if (
      email === 'daykul75' ||
      email.startsWith('daykul75') ||
      email.includes('daykul75') ||
      email.includes('dayku') ||
      email.includes('denizbaranaykul') ||
      ADMIN_EMAILS.some(ae => ae.toLowerCase().trim() === email)
    ) {
      user.role = 'admin';
      user.isAdmin = true;
      return user;
    }

    // 2. LocalStorage'da admin rolü varsa
    try {
      const localRole = localStorage.getItem('finansal_takip_user_role');
      if (localRole === 'admin') {
        user.role = 'admin';
        user.isAdmin = true;
        return user;
      }
    } catch (e) {}

    // 3. Firestore'dan doküman kontrolü
    if (this.mode === 'firebase' && db && firebaseModules.getDoc && firebaseModules.doc) {
      const docPaths = [
        ['users', user.uid],
        ['users', email],
        ['users', 'daykul75'],
        ['admins', user.uid],
        ['admins', email],
        ['roles', user.uid]
      ];

      for (const [col, docId] of docPaths) {
        if (!docId) continue;
        try {
          const docRef = firebaseModules.doc(db, col, docId);
          const snap = await firebaseModules.getDoc(docRef);
          if (snap && snap.exists()) {
            const data = snap.data();
            if (data) {
              const r = String(data.role || '').toLowerCase().trim();
              if (r === 'admin' || data.isAdmin === true || data.admin === true) {
                user.role = 'admin';
                user.isAdmin = true;
                return user;
              }
            }
          }
        } catch (e) {
          // Sonraki dokümanı dene
        }
      }

      // 4. Koleksiyon sorgusu (Auto-ID ile eklenmiş dokümanlar için)
      if (firebaseModules.getDocs && firebaseModules.collection) {
        try {
          const qUsers = firebaseModules.collection(db, 'users');
          const snaps = await firebaseModules.getDocs(qUsers);
          snaps.forEach(docSnap => {
            const d = docSnap.data();
            if (d) {
              const dEmail = (d.email || '').toLowerCase().trim();
              const dRole = String(d.role || '').toLowerCase().trim();
              if (dEmail === email || d.uid === user.uid || (!dEmail && dRole === 'admin')) {
                if (dRole === 'admin' || d.isAdmin === true || d.admin === true) {
                  user.role = 'admin';
                  user.isAdmin = true;
                }
              }
            }
          });
          if (user.role === 'admin') return user;
        } catch (e) {
          // Sessizce geç
        }
      }
    }

    return user;
  }

  onAuthStateChanged(callback) {
    if (this.mode === 'firebase' && auth && firebaseModules.onAuthStateChanged) {
      return firebaseModules.onAuthStateChanged(auth, async (user) => {
        if (!user) {
          this.currentUser = null;
          callback(null);
          return;
        }

        this.currentUser = await this._enrichUserWithRole(user);
        callback(this.currentUser);
      });
    } else {
      // Demo / Yerel Mod
      setTimeout(async () => {
        const savedUser = localStorage.getItem(LOCAL_USER_KEY);
        if (savedUser) {
          try {
            this.currentUser = JSON.parse(savedUser);
            // Yerel kayıtlardan da role kontrolü
            const rawAccounts = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
            const accounts = rawAccounts ? JSON.parse(rawAccounts) : {};
            const email = (this.currentUser.email || '').toLowerCase().trim();
            if (accounts[email] && accounts[email].role) {
              this.currentUser.role = accounts[email].role;
            }
            this.currentUser = await this._enrichUserWithRole(this.currentUser);
          } catch (e) {
            this.currentUser = null;
          }
        } else {
          this.currentUser = null;
        }
        callback(this.currentUser);
      }, 50);
      return () => {};
    }
  }

  async login(email, password) {
    if (this.mode === 'firebase') {
      try {
        const userCredential = await firebaseModules.signInWithEmailAndPassword(auth, email, password);
        this.currentUser = await this._enrichUserWithRole(userCredential.user);
        return { success: true, user: this.currentUser };
      } catch (error) {
        return { success: false, error: this._translateAuthError(error.code) };
      }
    } else {
      // Demo / Yerel giriş kontrolü
      const rawAccounts = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
      const accounts = rawAccounts ? JSON.parse(rawAccounts) : {};
      
      const normalizedEmail = email.toLowerCase().trim();
      if (!accounts[normalizedEmail]) {
        return { 
          success: false, 
          error: 'Bu e-posta adresiyle kayıtlı bir hesap bulunamadı. Lütfen "Kayıt Ol" sekmesinden hesap oluşturun.' 
        };
      }
      if (accounts[normalizedEmail].password !== password) {
        return { 
          success: false, 
          error: 'Hatalı şifre girdiniz. Lütfen şifrenizi kontrol edin.' 
        };
      }
      
      this.currentUser = { email: normalizedEmail, uid: accounts[normalizedEmail].uid };
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(this.currentUser));
      return { success: true, user: this.currentUser };
    }
  }

  async register(email, password) {
    if (this.mode === 'firebase') {
      try {
        const userCredential = await firebaseModules.createUserWithEmailAndPassword(auth, email, password);
        this.currentUser = userCredential.user;
        return { success: true, user: this.currentUser };
      } catch (error) {
        return { success: false, error: this._translateAuthError(error.code) };
      }
    } else {
      // Demo / Yerel kayıt
      const rawAccounts = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
      const accounts = rawAccounts ? JSON.parse(rawAccounts) : {};

      const normalizedEmail = email.toLowerCase().trim();
      if (accounts[normalizedEmail]) {
        return { 
          success: false, 
          error: 'Bu e-posta adresi ile zaten kayıtlı bir hesap var. Lütfen "Giriş Yap" sekmesinden giriş yapın.' 
        };
      }
      if (!password || password.length < 6) {
        return { 
          success: false, 
          error: 'Şifreniz en az 6 karakter uzunluğunda olmalıdır.' 
        };
      }

      const uid = 'demo-' + btoa(normalizedEmail).substring(0, 8);
      accounts[normalizedEmail] = { email: normalizedEmail, password, uid, createdAt: Date.now() };
      localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));

      this.currentUser = { email: normalizedEmail, uid };
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(this.currentUser));
      return { success: true, user: this.currentUser };
    }
  }

  async logout() {
    if (this.mode === 'firebase') {
      await firebaseModules.signOut(auth);
      this.currentUser = null;
    } else {
      this.currentUser = null;
      localStorage.removeItem(LOCAL_USER_KEY);
    }
    return true;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  // ================= FIRESTORE İŞLEMLERİ =================

  /**
   * İşlemleri gerçek zamanlı olarak dinler (onSnapshot)
   */
  subscribeTransactions(callback) {
    if (this.activeListener) {
      this.activeListener();
      this.activeListener = null;
    }

    if (this.mode === 'firebase' && this.currentUser) {
      try {
        const userTransactionsRef = firebaseModules.collection(db, 'users', this.currentUser.uid, 'transactions');
        const q = firebaseModules.query(userTransactionsRef, firebaseModules.orderBy('date', 'desc'));

        this.activeListener = firebaseModules.onSnapshot(q, (snapshot) => {
          const transactions = [];
          snapshot.forEach((doc) => {
            transactions.push({
              id: doc.id,
              ...doc.data()
            });
          });
          callback(transactions);
        }, (error) => {
          console.error('[FirebaseService] Firestore dinleme hatası:', error);
          callback([]);
        });

        return this.activeListener;
      } catch (e) {
        console.error('[FirebaseService] Firestore query kurulamadı:', e);
      }
    } else {
      // Demo / LocalStorage dinleme
      const loadLocal = () => {
        try {
          const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
          const data = raw ? JSON.parse(raw) : [];
          // Tarihe göre sırala
          data.sort((a, b) => new Date(b.date) - new Date(a.date));
          callback(data);
        } catch (e) {
          callback([]);
        }
      };

      loadLocal();

      // Değişiklikleri dinlemek için özel bir event dinleyici
      const storageHandler = (e) => {
        if (e.detail?.type === 'transaction_updated' || e.key === LOCAL_STORAGE_KEY) {
          loadLocal();
        }
      };
      window.addEventListener('finansal_takip_data_change', storageHandler);
      window.addEventListener('butcem_data_change', storageHandler);
      this.activeListener = () => {
        window.removeEventListener('finansal_takip_data_change', storageHandler);
        window.removeEventListener('butcem_data_change', storageHandler);
      };
      return this.activeListener;
    }
  }

  /**
   * Yeni harcama veya gelir ekleme
   */
  async addTransaction(txData) {
    const payload = {
      type: txData.type, // 'income' | 'expense'
      title: txData.title.trim(),
      amount: parseFloat(txData.amount),
      category: txData.category,
      date: txData.date,
      description: txData.description ? txData.description.trim() : '',
      createdAt: Date.now()
    };

    if (this.mode === 'firebase' && this.currentUser) {
      const colRef = firebaseModules.collection(db, 'users', this.currentUser.uid, 'transactions');
      const docRef = await firebaseModules.addDoc(colRef, payload);
      return { success: true, id: docRef.id };
    } else {
      // LocalStorage ekle
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : [];
      const newId = 'demo-' + Date.now();
      const newTx = { id: newId, ...payload };
      data.unshift(newTx);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('finansal_takip_data_change', { detail: { type: 'transaction_updated' } }));
      window.dispatchEvent(new CustomEvent('butcem_data_change', { detail: { type: 'transaction_updated' } }));
      return { success: true, id: newId };
    }
  }

  /**
   * Var olan işlemi güncelleme
   */
  async updateTransaction(id, txData) {
    const payload = {
      type: txData.type,
      title: txData.title.trim(),
      amount: parseFloat(txData.amount),
      category: txData.category,
      date: txData.date,
      description: txData.description ? txData.description.trim() : ''
    };

    if (this.mode === 'firebase' && this.currentUser) {
      const docRef = firebaseModules.doc(db, 'users', this.currentUser.uid, 'transactions', id);
      await firebaseModules.updateDoc(docRef, payload);
      return { success: true };
    } else {
      // LocalStorage güncelle
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      let data = raw ? JSON.parse(raw) : [];
      data = data.map(item => item.id === id ? { ...item, ...payload } : item);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('finansal_takip_data_change', { detail: { type: 'transaction_updated' } }));
      window.dispatchEvent(new CustomEvent('butcem_data_change', { detail: { type: 'transaction_updated' } }));
      return { success: true };
    }
  }

  /**
   * İşlem silme
   */
  async deleteTransaction(id) {
    if (this.mode === 'firebase' && this.currentUser) {
      const docRef = firebaseModules.doc(db, 'users', this.currentUser.uid, 'transactions', id);
      await firebaseModules.deleteDoc(docRef);
      return { success: true };
    } else {
      // LocalStorage sil
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      let data = raw ? JSON.parse(raw) : [];
      data = data.filter(item => item.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('finansal_takip_data_change', { detail: { type: 'transaction_updated' } }));
      window.dispatchEvent(new CustomEvent('butcem_data_change', { detail: { type: 'transaction_updated' } }));
      return { success: true };
    }
  }

  // ================= ADMIN GÖREV İŞLEMLERİ =================

  /**
   * Admin görevlerini gerçek zamanlı olarak dinler
   */
  subscribeAdminTasks(callback) {
    if (this.activeAdminTasksListener) {
      this.activeAdminTasksListener();
      this.activeAdminTasksListener = null;
    }

    const OLD_TOPICS_MAPPING = {
      'Fatura & Ödemeler': 'Ödemeler',
      'Bütçe & Raporlama': 'Çalışmalar',
      'Kira & Yurt Takibi': 'Ödemeler',
      'Yatırım & Birikim': 'Çalışmalar',
      'Banka & Kredi': 'Ödemeler',
      'Finansal Kapanış': 'Çalışmalar',
      'Kişisel / Özel Görev': 'Çalışmalar',
      'Diğer Konu': 'Çalışmalar'
    };

    const loadLocalTasks = () => {
      try {
        const raw = localStorage.getItem(LOCAL_ADMIN_TASKS_KEY);
        let data = raw ? JSON.parse(raw) : [...DEFAULT_ADMIN_TASKS];
        let modified = false;
        data = data.map(item => {
          if (OLD_TOPICS_MAPPING[item.topic]) {
            item.topic = OLD_TOPICS_MAPPING[item.topic];
            modified = true;
          }
          return item;
        });
        if (modified) {
          localStorage.setItem(LOCAL_ADMIN_TASKS_KEY, JSON.stringify(data));
        }
        data.sort((a, b) => {
          if (b.date !== a.date) return b.date.localeCompare(a.date);
          return (a.time || '').localeCompare(b.time || '');
        });
        return data;
      } catch (e) {
        return [...DEFAULT_ADMIN_TASKS];
      }
    };

    // 1. İlk olarak anında yerel/önbellek görevleri yayınla (kullanıcı asla boş beklemez)
    callback(loadLocalTasks());

    // 2. Her durumda yerel değişiklikleri dinle (çevrimdışı ve anında reaksiyon garantisi)
    const tasksHandler = () => {
      callback(loadLocalTasks());
    };
    window.addEventListener('finansal_takip_tasks_change', tasksHandler);

    let firestoreUnsub = null;

    // 3. Firebase modu aktifse Firestore ile çift yönlü senkronizasyon kur
    if (this.mode === 'firebase' && this.currentUser) {
      try {
        const tasksColRef = firebaseModules.collection(db, 'users', this.currentUser.uid, 'admin_tasks');
        const q = firebaseModules.query(tasksColRef, firebaseModules.orderBy('date', 'desc'));

        firestoreUnsub = firebaseModules.onSnapshot(q, (snapshot) => {
          const tasks = [];
          snapshot.forEach((doc) => {
            tasks.push({
              id: doc.id,
              ...doc.data()
            });
          });

          // Eğer Firestore'dan veri geldiyse yerel depoyla senkronize et
          if (tasks.length > 0) {
            tasks.sort((a, b) => {
              if (b.date !== a.date) return b.date.localeCompare(a.date);
              return (a.time || '').localeCompare(b.time || '');
            });
            localStorage.setItem(LOCAL_ADMIN_TASKS_KEY, JSON.stringify(tasks));
            callback(tasks);
          } else {
            // Firestore henüz boşsa yerel görevleri koru
            const local = loadLocalTasks();
            callback(local);
          }
        }, (error) => {
          console.warn('[FirebaseService] Firestore admin_tasks dinleme uyarısı (yerel veri korunuyor):', error);
          // Hata durumunda yerel verileri koru, asla arayüzü sıfırlama!
          callback(loadLocalTasks());
        });
      } catch (e) {
        console.warn('[FirebaseService] Firestore tasks query hatası:', e);
      }
    }

    this.activeAdminTasksListener = () => {
      window.removeEventListener('finansal_takip_tasks_change', tasksHandler);
      if (firestoreUnsub) firestoreUnsub();
    };
    return this.activeAdminTasksListener;
  }

  /**
   * Yeni admin görevi ekler
   */
  async addAdminTask(taskData) {
    const payload = {
      title: (taskData.title || '').trim(),
      date: taskData.date || new Date().toISOString().slice(0, 10),
      time: taskData.time || '10:00',
      topic: taskData.topic || 'Diğer Konu',
      description: (taskData.description || '').trim(),
      status: taskData.status || 'pending', // 'pending' | 'completed'
      completedAt: taskData.status === 'completed' ? (taskData.completedAt || new Date().toISOString()) : null,
      createdAt: Date.now()
    };

    let savedId = null;

    if (this.mode === 'firebase' && this.currentUser) {
      try {
        const colRef = firebaseModules.collection(db, 'users', this.currentUser.uid, 'admin_tasks');
        const docRef = await firebaseModules.addDoc(colRef, payload);
        savedId = docRef.id;
      } catch (err) {
        console.warn('[FirebaseService] Firestore admin_tasks yazılamadı, yerel hafızaya kaydediliyor:', err);
      }
    }

    // Her koşulda yerel hafızayı güncelle (anında arayüz yansıması ve çevrimdışı garanti)
    const raw = localStorage.getItem(LOCAL_ADMIN_TASKS_KEY);
    const data = raw ? JSON.parse(raw) : [...DEFAULT_ADMIN_TASKS];
    const newId = savedId || ('admin-task-' + Date.now());
    const newTask = { id: newId, ...payload };
    const existingIdx = data.findIndex(t => t.id === newId);
    if (existingIdx >= 0) {
      data[existingIdx] = newTask;
    } else {
      data.unshift(newTask);
    }
    localStorage.setItem(LOCAL_ADMIN_TASKS_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('finansal_takip_tasks_change', { detail: { type: 'task_added' } }));
    return { success: true, id: newId };
  }

  /**
   * Var olan görevi günceller
   */
  async updateAdminTask(id, taskData) {
    const payload = {
      title: (taskData.title || '').trim(),
      date: taskData.date,
      time: taskData.time || '10:00',
      topic: taskData.topic,
      description: (taskData.description || '').trim()
    };

    if (taskData.status !== undefined) {
      payload.status = taskData.status;
      payload.completedAt = taskData.status === 'completed' ? (taskData.completedAt || new Date().toISOString()) : null;
    }

    if (this.mode === 'firebase' && this.currentUser) {
      try {
        const docRef = firebaseModules.doc(db, 'users', this.currentUser.uid, 'admin_tasks', id);
        await firebaseModules.updateDoc(docRef, payload);
      } catch (err) {
        console.warn('[FirebaseService] Firestore güncelleme uyarısı, yerel güncelleniyor:', err);
      }
    }

    const raw = localStorage.getItem(LOCAL_ADMIN_TASKS_KEY);
    let data = raw ? JSON.parse(raw) : [];
    data = data.map(item => item.id === id ? { ...item, ...payload } : item);
    localStorage.setItem(LOCAL_ADMIN_TASKS_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('finansal_takip_tasks_change', { detail: { type: 'task_updated' } }));
    return { success: true };
  }

  /**
   * Görevin tamamlandı/bekliyor durumunu değiştirir
   */
  async toggleAdminTaskStatus(id, newStatus) {
    const isCompleted = newStatus === 'completed';
    const payload = {
      status: isCompleted ? 'completed' : 'pending',
      completedAt: isCompleted ? new Date().toISOString() : null
    };

    if (this.mode === 'firebase' && this.currentUser) {
      try {
        const docRef = firebaseModules.doc(db, 'users', this.currentUser.uid, 'admin_tasks', id);
        await firebaseModules.updateDoc(docRef, payload);
      } catch (err) {
        console.warn('[FirebaseService] Firestore durum güncelleme uyarısı:', err);
      }
    }

    const raw = localStorage.getItem(LOCAL_ADMIN_TASKS_KEY);
    let data = raw ? JSON.parse(raw) : [];
    data = data.map(item => item.id === id ? { ...item, ...payload } : item);
    localStorage.setItem(LOCAL_ADMIN_TASKS_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('finansal_takip_tasks_change', { detail: { type: 'task_status_changed' } }));
    return { success: true };
  }

  /**
   * Görevi siler
   */
  async deleteAdminTask(id) {
    if (this.mode === 'firebase' && this.currentUser) {
      try {
        const docRef = firebaseModules.doc(db, 'users', this.currentUser.uid, 'admin_tasks', id);
        await firebaseModules.deleteDoc(docRef);
      } catch (err) {
        console.warn('[FirebaseService] Firestore silme uyarısı:', err);
      }
    }

    const raw = localStorage.getItem(LOCAL_ADMIN_TASKS_KEY);
    let data = raw ? JSON.parse(raw) : [];
    data = data.filter(item => item.id !== id);
    localStorage.setItem(LOCAL_ADMIN_TASKS_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('finansal_takip_tasks_change', { detail: { type: 'task_deleted' } }));
    return { success: true };
  }

  /**
   * Hata mesajlarını Türkçeleştirme
   */
  _translateAuthError(code) {
    switch (code) {
      case 'auth/invalid-email':
        return 'Geçersiz bir e-posta adresi girdiniz.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'E-posta veya şifre hatalı.';
      case 'auth/email-already-in-use':
        return 'Bu e-posta adresi ile zaten kayıtlı bir hesap var.';
      case 'auth/weak-password':
        return 'Şifre çok zayıf. Lütfen en az 6 karakter girin.';
      case 'auth/network-request-failed':
        return 'Ağ bağlantısı kurulamadı. İnternetinizi kontrol edin.';
      default:
        return 'İşlem başarısız oldu. Lütfen tekrar deneyin.';
    }
  }
}

export const firebaseService = new FirebaseService();
