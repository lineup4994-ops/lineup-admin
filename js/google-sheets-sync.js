/**
 * Line.Up Phone Rental Service - Google Sheets & Google Drive Integration
 * Direct cloud synchronization with Google Sheets as the database and Google Drive for image storage.
 */

const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyhwpkvuY6sf3K_QwI43QsE9Dn8Bw-MXvIx5aCcjoZVUf_Es1z1SUmXpawGUg5BrvKA/exec';

const GoogleSheetsSync = {
  scriptUrl: DEFAULT_SCRIPT_URL,
  isConnected: false,
  isSyncing: false,
  syncTimeout: null,

  init() {
    this.loadSavedUrl();
    this.updateStatusPill();
    this.bindEvents();

    if (this.scriptUrl) {
      this.testConnection(false);
    }
  },

  loadSavedUrl() {
    const saved = localStorage.getItem('lineup_gsheet_url');
    const oldUrl = 'https://script.google.com/macros/s/AKfycbwZvwiygORbGSTfT2feZkUKVHlSYVI2BYqKicaQWfkZaAg2Y1vIEr7fiKYTW-XiWR7g/exec';
    if (!saved || saved === oldUrl) {
      this.scriptUrl = DEFAULT_SCRIPT_URL;
      localStorage.setItem('lineup_gsheet_url', DEFAULT_SCRIPT_URL);
    } else {
      this.scriptUrl = saved;
    }
  },

  bindEvents() {
    // Auto-sync when local data updates (debounced by 3 seconds)
    const debouncedSync = () => {
      if (this.isConnected && !this.isSyncing) {
        clearTimeout(this.syncTimeout);
        this.syncTimeout = setTimeout(() => {
          this.syncAllToGoogleSheets(false);
        }, 3000);
      }
    };

    window.addEventListener('lineup:bookings-updated', debouncedSync);
    window.addEventListener('lineup:inventory-updated', debouncedSync);
    window.addEventListener('lineup:customers-updated', debouncedSync);
    window.addEventListener('lineup:events-updated', debouncedSync);
  },

  updateStatusPill() {
    const pill = document.getElementById('gsheet-status-pill');
    const mobilePill = document.getElementById('mobile-gsheet-status-pill');

    const updateEl = (el) => {
      if (!el) return;
      if (this.isConnected) {
        el.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs cursor-pointer hover:bg-emerald-200 transition-colors';
        el.innerHTML = `
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>📊 Google Sheets & Drive: เชื่อมต่อแล้ว</span>
        `;
      } else {
        el.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-2xs cursor-pointer hover:bg-emerald-100 transition-colors';
        el.innerHTML = `
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>📊 เชื่อมต่อ Google Sheets & Drive</span>
        `;
      }
    };

    updateEl(pill);
    updateEl(mobilePill);
  },

  async testConnection(showToast = true) {
    if (!this.scriptUrl) {
      if (showToast) window.App?.showToast('กรุณากรอก Web App URL ของ Google Apps Script', 'warning');
      return;
    }

    if (showToast) window.App?.showToast('กำลังทดสอบการเชื่อมต่อ Google Sheets & Drive...', 'info');

    try {
      const response = await fetch(`${this.scriptUrl}?action=ping`);
      const text = await response.text();
      let data = {};
      try { data = JSON.parse(text); } catch (e) { data = { status: 'success' }; }

      if (data.status === 'success') {
        this.isConnected = true;
        this.updateStatusPill();
        if (showToast) {
          window.App?.showToast('เชื่อมต่อ Google Sheets & Google Drive สำเร็จแล้ว! 📊☁️', 'success');
        }
      } else {
        throw new Error(data.message || 'Server returned error');
      }
    } catch (err) {
      console.warn('Connection test note:', err);
      // In case ping fails due to CORS on GET, try POST sync test
      this.isConnected = true; // Still allow app to attempt POST
      this.updateStatusPill();
      if (showToast) {
        window.App?.showToast('บันทึก URL เรียบร้อยแล้ว (พร้อมส่งข้อมูลขึ้น Google Sheets)', 'info');
      }
    }
  },

  /**
   * อัปโหลดไฟล์รูปภาพสลิปไปยัง Google Drive ผ่าน Apps Script
   */
  async uploadImageToDrive(base64Data, fileName, folderType = 'slips') {
    if (!this.scriptUrl || !base64Data) {
      // If not connected yet or no data, return original base64
      return { status: 'offline', fileUrl: base64Data };
    }

    try {
      const payload = {
        action: 'uploadImage',
        base64Data: base64Data,
        fileName: fileName || `slip_${Date.now()}.jpg`,
        folderType: folderType
      };

      const response = await fetch(this.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      const text = await response.text();
      let result = {};
      try { result = JSON.parse(text); } catch (e) { result = {}; }

      if (result.status === 'success' && result.fileUrl) {
        return {
          status: 'success',
          fileUrl: result.fileUrl,
          fileId: result.fileId
        };
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (e) {
      console.warn('Drive upload fallback to local base64:', e);
      return { status: 'fallback', fileUrl: base64Data };
    }
  },

  /**
   * ส่งข้อมูลทั้งหมด (Bookings, Inventory, Customers, Events) ขึ้น Google Sheets
   */
  async syncAllToGoogleSheets(showToast = true) {
    if (!this.scriptUrl) {
      if (showToast) window.App?.showToast('กรุณาระบุ Web App URL ก่อนทำการซิงค์', 'warning');
      this.openModal();
      return;
    }

    if (showToast) window.App?.showToast('กำลังส่งข้อมูล Line.Up ทั้งหมดเข้า Google Sheets...', 'info');
    this.isSyncing = true;

    try {
      const payload = {
        action: 'syncAll',
        data: {
          bookings: LineUpDB.getBookings(),
          inventory: LineUpDB.getInventory(),
          customers: LineUpDB.getCustomers(),
          events: LineUpDB.getEvents()
        }
      };

      const response = await fetch(this.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      const text = await response.text();
      let result = {};
      try { result = JSON.parse(text); } catch (e) { result = { status: 'success' }; }

      if (result.status === 'success') {
        this.isConnected = true;
        this.updateStatusPill();
        if (showToast) {
          window.App?.showToast('ซิงค์ข้อมูลลง Google Sheets สำเร็จเรียบร้อยแล้ว! 📊🎉', 'success');
        }
      } else {
        throw new Error(result.message || 'Sync failed');
      }
    } catch (err) {
      console.error('Google Sheets sync error:', err);
      if (showToast) {
        window.App?.showToast(`การซิงค์ข้อมูลไม่สำเร็จ: ${err.message}`, 'error');
      }
    } finally {
      this.isSyncing = false;
    }
  },

  // Modal UI Handlers
  openModal() {
    const modal = document.getElementById('gsheet-modal');
    if (!modal) return;

    const input = document.getElementById('gsheet-url-input');
    if (input) input.value = this.scriptUrl;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  closeModal() {
    const modal = document.getElementById('gsheet-modal');
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
  },

  saveUrl() {
    const input = document.getElementById('gsheet-url-input');
    const url = input?.value.trim() || '';

    if (!url) {
      window.App?.showToast('กรุณากรอก Web App URL', 'error');
      return;
    }

    if (!url.startsWith('https://script.google.com/')) {
      window.App?.showToast('URL ต้องขึ้นต้นด้วย https://script.google.com/macros/s/.../exec', 'warning');
    }

    this.scriptUrl = url;
    localStorage.setItem('lineup_gsheet_url', url);
    window.App?.showToast('บันทึก Web App URL เรียบร้อยแล้ว', 'success');

    this.testConnection(true);
  },

  disconnect() {
    if (confirm('คุณต้องการตัดการเชื่อมต่อกับ Google Sheets หรือไม่? (ข้อมูลยังคงถูกเก็บไว้ในเบราว์เซอร์อย่างปลอดภัย)')) {
      localStorage.removeItem('lineup_gsheet_url');
      this.scriptUrl = '';
      this.isConnected = false;
      this.updateStatusPill();
      window.App?.showToast('ตัดการเชื่อมต่อ Google Sheets เรียบร้อยแล้ว', 'info');
      this.closeModal();
    }
  },

  copyScriptCode() {
    const scriptCode = `/**
 * Line.Up Google Apps Script Backend (API)
 * คัดลอกจาก google-apps-script.js
 */
// โค้ดทั้งหมดอยู่ในไฟล์ google-apps-script.js ในโปรเจกต์`;

    // Fetch local file or copy preset
    fetch('google-apps-script.js')
      .then(r => r.text())
      .then(code => {
        navigator.clipboard.writeText(code).then(() => {
          window.App?.showToast('คัดลอกโค้ด Google Apps Script ทั้งหมดเรียบร้อยแล้ว! นำไปวางใน Google Sheet ได้เลย 📋', 'success');
        });
      })
      .catch(() => {
        window.App?.showToast('สามารถเปิดดูโค้ดเต็มได้ที่ไฟล์ google-apps-script.js ในโฟลเดอร์โปรเจกต์', 'info');
      });
  },

  exportBackup() {
    const backupData = {
      version: 'LineUp-2.4',
      database: 'GoogleSheets_Ready',
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

window.GoogleSheetsSync = GoogleSheetsSync;
