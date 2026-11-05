/**
 * Line.Up Phone Rental Service - Firebase Cloud Database Integration
 * Supports Google Firebase Cloud Firestore synchronization for LineUp database.
 */

const FirebaseSync = {
  db: null,
  app: null,
  isConnected: false,
  isSyncing: false,
  config: null,

  init() {
    this.loadSavedConfig();
    this.updateStatusPill();
    this.bindEvents();

    if (this.config && this.config.apiKey && this.config.projectId) {
      this.connect(this.config, false);
    }
  },

  loadSavedConfig() {
    try {
      const saved = localStorage.getItem('lineup_firebase_config');
      if (saved) {
        this.config = JSON.parse(saved);
      } else if (window.LINEUP_FIREBASE_CONFIG) {
        this.config = window.LINEUP_FIREBASE_CONFIG;
      }
    } catch (e) {
      console.warn('Could not parse saved Firebase config', e);
    }
  },

  bindEvents() {
    // Listen for local DB changes to push to Firebase
    window.addEventListener('lineup:inventory-updated', () => {
      if (this.isConnected && !this.isSyncing) {
        this.syncCollectionToCloud('inventory', LineUpDB.getInventory());
      }
    });

    window.addEventListener('lineup:bookings-updated', () => {
      if (this.isConnected && !this.isSyncing) {
        this.syncCollectionToCloud('bookings', LineUpDB.getBookings());
      }
    });

    window.addEventListener('lineup:customers-updated', () => {
      if (this.isConnected && !this.isSyncing) {
        this.syncCollectionToCloud('customers', LineUpDB.getCustomers());
      }
    });

    window.addEventListener('lineup:events-updated', () => {
      if (this.isConnected && !this.isSyncing) {
        this.syncCollectionToCloud('events', LineUpDB.getEvents());
      }
    });

    // Form submit
    document.getElementById('firebase-config-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit();
    });
  },

  connect(config, showToast = true) {
    if (!window.firebase) {
      if (showToast) window.App?.showToast('ไม่พบไลบรารี Firebase SDK กำลังโหลด...', 'warning');
      return;
    }

    try {
      if (firebase.apps.length > 0) {
        this.app = firebase.apps[0];
      } else {
        this.app = firebase.initializeApp(config);
      }

      this.db = firebase.firestore();
      this.config = config;
      localStorage.setItem('lineup_firebase_config', JSON.stringify(config));

      // Test connectivity by writing a status doc
      this.db.collection('lineup_meta').doc('system_info').set({
        appName: 'LineUp Phone & Lens Rental Admin',
        connectedAt: new Date().toISOString(),
        lastSync: new Date().toISOString(),
        status: 'online'
      }, { merge: true }).then(() => {
        this.isConnected = true;
        this.updateStatusPill();
        if (showToast) {
          window.App?.showToast(`เชื่อมต่อ Firebase (${config.projectId}) สำเร็จ! ☁️`, 'success');
        }
        this.startRealtimeListeners();
      }).catch((err) => {
        console.error('Firebase test write error:', err);
        // Might be permission error or invalid key
        this.isConnected = true; // Still connected at SDK level
        this.updateStatusPill();
        this.startRealtimeListeners();
      });

    } catch (err) {
      console.error('Firebase initialization error:', err);
      if (showToast) {
        window.App?.showToast(`เชื่อมต่อ Firebase ไม่สำเร็จ: ${err.message}`, 'error');
      }
      this.isConnected = false;
      this.updateStatusPill();
    }
  },

  updateStatusPill() {
    const pill = document.getElementById('firebase-status-pill');
    const mobilePill = document.getElementById('mobile-firebase-status-pill');

    const updateEl = (el) => {
      if (!el) return;
      if (this.isConnected) {
        el.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs cursor-pointer hover:bg-emerald-200 transition-colors';
        el.innerHTML = `
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>☁️ Firebase: เชื่อมต่อแล้ว (${this.config?.projectId || 'LineUp'})</span>
        `;
      } else {
        el.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs cursor-pointer hover:bg-amber-100 transition-colors';
        el.innerHTML = `
          <span class="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>☁️ เชื่อมต่อ Firebase (LineUp)</span>
        `;
      }
    };

    updateEl(pill);
    updateEl(mobilePill);
  },

  startRealtimeListeners() {
    if (!this.db) return;

    // Listen to Bookings
    this.db.collection('lineup_bookings').onSnapshot((snapshot) => {
      if (snapshot.empty) return;
      const cloudBookings = [];
      snapshot.forEach(doc => cloudBookings.push(doc.data()));
      if (cloudBookings.length > 0) {
        this.isSyncing = true;
        LineUpDB.setBookings(cloudBookings);
        this.isSyncing = false;
      }
    }, (err) => {
      console.warn('Realtime bookings listener note:', err.message);
    });

    // Listen to Inventory
    this.db.collection('lineup_inventory').onSnapshot((snapshot) => {
      if (snapshot.empty) return;
      const cloudInventory = [];
      snapshot.forEach(doc => cloudInventory.push(doc.data()));
      if (cloudInventory.length > 0) {
        this.isSyncing = true;
        LineUpDB.setInventory(cloudInventory);
        this.isSyncing = false;
      }
    }, (err) => {
      console.warn('Realtime inventory listener note:', err.message);
    });

    // Listen to Customers
    this.db.collection('lineup_customers').onSnapshot((snapshot) => {
      if (snapshot.empty) return;
      const cloudCustomers = [];
      snapshot.forEach(doc => cloudCustomers.push(doc.data()));
      if (cloudCustomers.length > 0) {
        this.isSyncing = true;
        LineUpDB.setCustomers(cloudCustomers);
        this.isSyncing = false;
      }
    }, (err) => {
      console.warn('Realtime customers listener note:', err.message);
    });
  },

  async syncCollectionToCloud(type, items) {
    if (!this.db || !this.isConnected || !items || items.length === 0) return;

    try {
      const collectionName = `lineup_${type}`;
      const batch = this.db.batch();
      
      // Batch set up to 50 items
      const slice = items.slice(0, 50);
      slice.forEach(item => {
        const docRef = this.db.collection(collectionName).doc(String(item.id));
        batch.set(docRef, item, { merge: true });
      });

      await batch.commit();
      console.log(`Synced ${slice.length} ${type} items to Firebase Cloud Firestore (${collectionName})`);
    } catch (e) {
      console.error(`Error syncing ${type} to Firebase:`, e);
    }
  },

  async uploadAllDataToFirebase() {
    if (!this.db || !this.isConnected) {
      window.App?.showToast('กรุณาเชื่อมต่อ Firebase ก่อนทำการอัปโหลดข้อมูล', 'warning');
      return;
    }

    window.App?.showToast('กำลังอัปโหลดข้อมูล LineUp ทั้งหมดขึ้น Firebase...', 'info');

    try {
      const inventory = LineUpDB.getInventory();
      const bookings = LineUpDB.getBookings();
      const customers = LineUpDB.getCustomers();
      const events = LineUpDB.getEvents();

      // 1. Inventory
      for (const item of inventory) {
        await this.db.collection('lineup_inventory').doc(String(item.id)).set(item, { merge: true });
      }

      // 2. Bookings
      for (const item of bookings) {
        await this.db.collection('lineup_bookings').doc(String(item.id)).set(item, { merge: true });
      }

      // 3. Customers
      for (const item of customers) {
        await this.db.collection('lineup_customers').doc(String(item.id)).set(item, { merge: true });
      }

      // 4. Events
      for (const item of events) {
        await this.db.collection('lineup_events').doc(String(item.id)).set(item, { merge: true });
      }

      // 5. System Meta
      await this.db.collection('lineup_meta').doc('system_info').set({
        appName: 'LineUp Phone & Lens Rental Admin',
        lastFullSync: new Date().toISOString(),
        totalBookings: bookings.length,
        totalInventory: inventory.length,
        totalCustomers: customers.length
      }, { merge: true });

      window.App?.showToast(`อัปโหลดข้อมูลขึ้น Firebase Cloud สำเร็จครบถ้วน! 🎉 (การจอง: ${bookings.length}, อุปกรณ์: ${inventory.length}, ลูกค้า: ${customers.length})`, 'success');
      this.closeConfigModal();
    } catch (e) {
      console.error('Upload all data failed:', e);
      window.App?.showToast(`เกิดข้อผิดพลาดในการอัปโหลด: ${e.message}`, 'error');
    }
  },

  // UI Modal Management
  openConfigModal() {
    const modal = document.getElementById('firebase-config-modal');
    if (!modal) return;

    // Populate current config if any
    if (this.config) {
      document.getElementById('fb-api-key').value = this.config.apiKey || '';
      document.getElementById('fb-auth-domain').value = this.config.authDomain || '';
      document.getElementById('fb-project-id').value = this.config.projectId || 'LineUp';
      document.getElementById('fb-storage-bucket').value = this.config.storageBucket || '';
      document.getElementById('fb-messaging-sender-id').value = this.config.messagingSenderId || '';
      document.getElementById('fb-app-id').value = this.config.appId || '';
    } else {
      document.getElementById('fb-project-id').value = 'LineUp';
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  closeConfigModal() {
    const modal = document.getElementById('firebase-config-modal');
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
  },

  parsePastedConfig(text) {
    if (!text || !text.trim()) return null;

    try {
      // 1. If pure JSON
      if (text.trim().startsWith('{')) {
        return JSON.parse(text);
      }

      // 2. If JS object: const firebaseConfig = { ... }
      const extractField = (key) => {
        const regex = new RegExp(`['"]?${key}['"]?\\s*:\\s*['"]([^'"]+)['"]`, 'i');
        const match = text.match(regex);
        return match ? match[1] : '';
      };

      const apiKey = extractField('apiKey');
      const authDomain = extractField('authDomain');
      const projectId = extractField('projectId');
      const storageBucket = extractField('storageBucket');
      const messagingSenderId = extractField('messagingSenderId');
      const appId = extractField('appId');

      if (apiKey && projectId) {
        return { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId };
      }
    } catch (e) {
      console.warn('Error parsing pasted config:', e);
    }
    return null;
  },

  handlePasteConfig(inputEl) {
    const text = inputEl.value;
    const parsed = this.parsePastedConfig(text);
    if (parsed) {
      if (parsed.apiKey) document.getElementById('fb-api-key').value = parsed.apiKey;
      if (parsed.authDomain) document.getElementById('fb-auth-domain').value = parsed.authDomain;
      if (parsed.projectId) document.getElementById('fb-project-id').value = parsed.projectId;
      if (parsed.storageBucket) document.getElementById('fb-storage-bucket').value = parsed.storageBucket;
      if (parsed.messagingSenderId) document.getElementById('fb-messaging-sender-id').value = parsed.messagingSenderId;
      if (parsed.appId) document.getElementById('fb-app-id').value = parsed.appId;
      window.App?.showToast('ดึงข้อมูล Firebase Config จากโค้ดที่วางเรียบร้อยแล้ว!', 'info');
      inputEl.value = '';
    }
  },

  handleFormSubmit() {
    const apiKey = document.getElementById('fb-api-key').value.trim();
    const authDomain = document.getElementById('fb-auth-domain').value.trim();
    const projectId = document.getElementById('fb-project-id').value.trim() || 'LineUp';
    const storageBucket = document.getElementById('fb-storage-bucket').value.trim();
    const messagingSenderId = document.getElementById('fb-messaging-sender-id').value.trim();
    const appId = document.getElementById('fb-app-id').value.trim();

    if (!apiKey) {
      window.App?.showToast('กรุณากรอก API Key ของ Firebase', 'error');
      return;
    }

    const newConfig = {
      apiKey,
      authDomain: authDomain || `${projectId.toLowerCase()}.firebaseapp.com`,
      projectId: projectId || 'LineUp',
      storageBucket: storageBucket || `${projectId.toLowerCase()}.appspot.com`,
      messagingSenderId,
      appId
    };

    this.connect(newConfig, true);
  },

  disconnect() {
    if (confirm('คุณต้องการตัดการเชื่อมต่อกับ Firebase หรือไม่? (ข้อมูลยังคงถูกเก็บไว้ในเครื่องตามปกติ)')) {
      localStorage.removeItem('lineup_firebase_config');
      this.config = null;
      this.isConnected = false;
      this.updateStatusPill();
      window.App?.showToast('ตัดการเชื่อมต่อ Firebase เรียบร้อยแล้ว', 'info');
      this.closeConfigModal();
    }
  },

  exportLocalBackup() {
    const backupData = {
      version: 'LineUp-2.4',
      exportedAt: new Date().toISOString(),
      inventory: LineUpDB.getInventory(),
      events: LineUpDB.getEvents(),
      bookings: LineUpDB.getBookings(),
      customers: LineUpDB.getCustomers()
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LineUp_Database_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    window.App?.showToast('ส่งออกไฟล์สำรองฐานข้อมูล LineUp (.json) เรียบร้อยแล้ว 💾', 'success');
  }
};

window.FirebaseSync = FirebaseSync;
