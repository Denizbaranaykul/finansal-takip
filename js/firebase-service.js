/**
 * ===================================================================
 * BÜTÇEM PRO - FIREBASE & VERİ SERVİSİ (firebase-service.js)
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
  addDoc: null,
  updateDoc: null,
  deleteDoc: null,
  onSnapshot: null,
  query: null,
  orderBy: null,
  serverTimestamp: null
};

// Yerel Demo Depolama Anahtarları
const LOCAL_STORAGE_KEY = 'butcem_demo_transactions';
const LOCAL_USER_KEY = 'butcem_demo_user';

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
          addDoc: firestoreMod.addDoc,
          updateDoc: firestoreMod.updateDoc,
          deleteDoc: firestoreMod.deleteDoc,
          onSnapshot: firestoreMod.onSnapshot,
          query: firestoreMod.query,
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
    const SYNC_KEY = 'butcem_september_2026_synced_v1';
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
      window.dispatchEvent(new CustomEvent('butcem_data_change', { detail: { type: 'transaction_updated' } }));
      return { success: true, count: newItems.length, mode: 'demo' };
    }
  }

  // ================= AUTH İŞLEMLERİ =================

  onAuthStateChanged(callback) {
    if (this.mode === 'firebase' && auth && firebaseModules.onAuthStateChanged) {
      return firebaseModules.onAuthStateChanged(auth, (user) => {
        this.currentUser = user;
        callback(user);
      });
    } else {
      // Demo / Yerel Mod
      setTimeout(() => {
        const savedUser = localStorage.getItem(LOCAL_USER_KEY);
        if (savedUser) {
          try {
            this.currentUser = JSON.parse(savedUser);
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
        this.currentUser = userCredential.user;
        return { success: true, user: this.currentUser };
      } catch (error) {
        return { success: false, error: this._translateAuthError(error.code) };
      }
    } else {
      // Demo / Yerel giriş kontrolü
      const rawAccounts = localStorage.getItem('butcem_demo_registered_accounts');
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
      const rawAccounts = localStorage.getItem('butcem_demo_registered_accounts');
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
      localStorage.setItem('butcem_demo_registered_accounts', JSON.stringify(accounts));

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
      window.addEventListener('butcem_data_change', storageHandler);
      this.activeListener = () => window.removeEventListener('butcem_data_change', storageHandler);
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
      window.dispatchEvent(new CustomEvent('butcem_data_change', { detail: { type: 'transaction_updated' } }));
      return { success: true };
    }
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
