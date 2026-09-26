/**
 * ===================================================================
 * BÜTÇEM PRO - FIREBASE YAPILANDIRMASI (firebase-config.js)
 * ===================================================================
 * Firebase Konsolu'ndan (https://console.firebase.google.com) aldığınız
 * Web Uygulaması yapılandırma anahtarlarını aşağıdaki alana yapıştırın.
 * 
 * Bilgilerinizi girdikten sonra dosyayı kaydedip tarayıcıyı yenilemeniz yeterlidir!
 */
export const firebaseConfig = {
  apiKey: "AIzaSyCkrQhWIeFgWeqt47_35XvjM5weWf_osbw",
  authDomain: "todoapp-90b16.firebaseapp.com",
  projectId: "todoapp-90b16",
  storageBucket: "todoapp-90b16.firebasestorage.app",
  messagingSenderId: "131650734209",
  appId: "1:131650734209:web:109f90b758e04c532aa580",
  measurementId: "G-2TX2GR15RR"
};

/**
 * Firebase yapılandırmasının kullanıcı tarafından doldurulup doldurulmadığını kontrol eder.
 * Eğer varsayılan "YOUR_API_KEY" duruyorsa uygulama güvenli Yerel Demo (LocalStorage) moduna geçer.
 */
export function isFirebaseConfigured() {
  return (
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "YOUR_API_KEY" &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID"
  );
}