/**
 * Line.Up Phone Rental Service - Equipment Inventory Module
 * Independent table tabs for Smartphones and Lenses with full CRUD, password toggle, status badges.
 */

const InventoryModule = {
  currentTab: 'phone', // 'phone' or 'lens'
  searchQuery: '',
  statusFilter: 'all', // 'all', 'available', 'booked', 'maintenance'
  editingItem: null,

  init() {
    this.render();
    this.bindEvents();

    window.addEventListener('lineup:inventory-updated', () => {
      this.render();
    });

    window.addEventListener('lineup:bookings-updated', () => {
      this.render();
    });
  },

  bindEvents() {
    // Tab switching
    document.getElementById('inv-tab-phone')?.addEventListener('click', () => {
      this.switchTab('phone');
    });

    document.getElementById('inv-tab-lens')?.addEventListener('click', () => {
      this.switchTab('lens');
    });

    // Search and filter
    document.getElementById('inv-search-input')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderTable();
    });

    document.getElementById('inv-status-filter')?.addEventListener('change', (e) => {
      this.statusFilter = e.target.value;
      this.renderTable();
    });

    // Add equipment button
    document.getElementById('inv-add-btn')?.addEventListener('click', () => {
      this.openAddEditModal();
    });

    // Save equipment form
    document.getElementById('inv-modal-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveEquipment();
    });
  },

  switchTab(tab) {
    this.currentTab = tab;
    const phoneTabBtn = document.getElementById('inv-tab-phone');
    const lensTabBtn = document.getElementById('inv-tab-lens');
    const tabIndicator = document.getElementById('inv-tab-title');

    if (tab === 'phone') {
      phoneTabBtn?.classList.add('border-emerald-500', 'text-emerald-700', 'bg-emerald-50/50');
      phoneTabBtn?.classList.remove('border-transparent', 'text-slate-500');
      lensTabBtn?.classList.remove('border-emerald-500', 'text-emerald-700', 'bg-emerald-50/50');
      lensTabBtn?.classList.add('border-transparent', 'text-slate-500');
      if (tabIndicator) tabIndicator.innerText = 'ตารางจัดการ: โทรศัพท์มือถือ (Smartphones)';
    } else {
      lensTabBtn?.classList.add('border-emerald-500', 'text-emerald-700', 'bg-emerald-50/50');
      lensTabBtn?.classList.remove('border-transparent', 'text-slate-500');
      phoneTabBtn?.classList.remove('border-emerald-500', 'text-emerald-700', 'bg-emerald-50/50');
      phoneTabBtn?.classList.add('border-transparent', 'text-slate-500');
      if (tabIndicator) tabIndicator.innerText = 'ตารางจัดการ: เลนส์และอุปกรณ์เสริม (Lenses & Accessories)';
    }

    this.render();
  },

  render() {
    this.renderStats();
    this.renderTable();
  },

  renderStats() {
    const inventory = LineUpDB.getInventory();
    const phones = inventory.filter(i => i.category === 'phone');
    const lenses = inventory.filter(i => i.category === 'lens');

    const isItemBookedToday = (id) => LineUpDB.getDeviceDynamicStatus(id) === 'booked';

    const phoneMaint = phones.filter(p => p.status === 'maintenance').length;
    const phoneBooked = phones.filter(p => p.status !== 'maintenance' && isItemBookedToday(p.id)).length;
    const phoneAvail = phones.length - phoneMaint - phoneBooked;

    const lensMaint = lenses.filter(l => l.status === 'maintenance').length;
    const lensBooked = lenses.filter(l => l.status !== 'maintenance' && isItemBookedToday(l.id)).length;
    const lensAvail = lenses.length - lensMaint - lensBooked;

    const phoneTabCount = document.getElementById('inv-phone-count-badge');
    if (phoneTabCount) phoneTabCount.innerText = `${phoneAvail}/${phones.length} ว่างวันนี้`;

    const lensTabCount = document.getElementById('inv-lens-count-badge');
    if (lensTabCount) lensTabCount.innerText = `${lensAvail}/${lenses.length} ว่างวันนี้`;

    const summaryBar = document.getElementById('inv-stat-summary-bar');
    if (summaryBar) {
      const isPhone = this.currentTab === 'phone';
      const avail = isPhone ? phoneAvail : lensAvail;
      const booked = isPhone ? phoneBooked : lensBooked;
      const maint = isPhone ? phoneMaint : lensMaint;
      const total = isPhone ? phones.length : lenses.length;

      summaryBar.innerHTML = `
        <div class="flex flex-wrap items-center gap-3 text-xs">
          <div class="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>ว่างพร้อมเช่าวันนี้: <strong>${avail}</strong> รายการ</span>
          </div>
          <div class="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>ติดจองวันนี้: <strong>${booked}</strong> รายการ (วันอื่นเช่าได้)</span>
          </div>
          <div class="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800">
            <span class="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>ส่งซ่อม/บำรุงรักษา: <strong>${maint}</strong> รายการ</span>
          </div>
          <div class="ml-auto text-slate-500 text-xs font-medium">
            รวมในคลัง: <strong class="text-slate-800">${total}</strong> เครื่อง
          </div>
        </div>
      `;
    }
  },

  renderTable() {
    const tableBody = document.getElementById('inv-table-body');
    if (!tableBody) return;

    let items = LineUpDB.getInventory().filter(i => i.category === this.currentTab);

    // Apply status filter based on dynamic status
    if (this.statusFilter !== 'all') {
      items = items.filter(i => {
        if (i.status === 'maintenance') return this.statusFilter === 'maintenance';
        const curStatus = LineUpDB.getDeviceDynamicStatus(i.id);
        return curStatus === this.statusFilter;
      });
    }

    // Apply search
    if (this.searchQuery) {
      items = items.filter(i => 
        (i.model && i.model.toLowerCase().includes(this.searchQuery)) ||
        (i.id && i.id.toLowerCase().includes(this.searchQuery)) ||
        (i.email && i.email.toLowerCase().includes(this.searchQuery)) ||
        (i.serial && i.serial.toLowerCase().includes(this.searchQuery))
      );
    }

    if (items.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="py-12 text-center text-slate-400">
            <div class="flex flex-col items-center justify-center">
              <span class="text-4xl mb-2">🔍</span>
              <p class="text-sm font-medium">ไม่พบอุปกรณ์ที่ตรงกับเงื่อนไขการค้นหา</p>
              <button onclick="InventoryModule.resetFilters()" class="mt-2 text-xs text-emerald-600 font-semibold hover:underline">
                ล้างคำค้นหาทั้งหมด
              </button>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    items.forEach(item => {
      // Dynamic status and booking intervals
      const schedules = LineUpDB.getDeviceBookingSchedules(item.id);
      const isBookedToday = LineUpDB.getDeviceDynamicStatus(item.id) === 'booked';

      let statusBadge = '';
      if (item.status === 'maintenance') {
        statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold badge-maintenance">
          <span class="w-1.5 h-1.5 rounded-full bg-rose-600"></span> ส่งซ่อม (Maintenance)
        </span>`;
      } else if (isBookedToday) {
        statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold badge-booked">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-600"></span> ติดจองวันนี้ (Booked)
        </span>`;
      } else {
        statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold badge-available">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> ว่างพร้อมเช่า (Available)
        </span>`;
      }

      const isPhone = item.category === 'phone';
      const icon = isPhone ? '📱' : '📷';

      html += `
        <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
          <!-- Model & Specs -->
          <td class="py-3.5 px-4">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl ${isPhone ? 'bg-emerald-100 text-emerald-700' : 'bg-pink-100 text-pink-700'} flex items-center justify-center text-lg shrink-0">
                ${icon}
              </div>
              <div>
                <div class="font-bold text-slate-800 text-sm flex items-center gap-2">
                  ${item.model}
                  ${item.color ? `<span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-normal">${item.color}</span>` : ''}
                </div>
                <div class="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                  ${item.accessories || item.notes || '-'}
                </div>
                <!-- Dynamic Booking Schedule Pills -->
                <div class="mt-1">
                  ${schedules.length > 0 ? `
                    <div class="text-[10px] flex flex-wrap items-center gap-1">
                      <span class="text-slate-400 font-medium">วันที่ติดจอง:</span>
                      ${schedules.map(s => `
                        <span class="px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium" title="${s.eventName}">
                          📅 ${s.startDate} ถึง ${s.endDate} (${s.nickname})
                        </span>
                      `).join('')}
                      <span class="text-emerald-700 font-bold">✓ วันอื่นว่างเช่าได้</span>
                    </div>
                  ` : `
                    <div class="text-[10px] text-emerald-600 font-medium">
                      ✓ ว่างทุกวัน ไม่มีคิวจอง
                    </div>
                  `}
                </div>
              </div>
            </div>
          </td>

          <!-- Equipment ID -->
          <td class="py-3.5 px-4">
            <span class="font-mono text-xs font-bold px-2 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
              ${item.id}
            </span>
            ${item.serial ? `<div class="text-[10px] text-slate-400 font-mono mt-1">S/N: ${item.serial}</div>` : ''}
          </td>

          <!-- Email / Apple ID -->
          <td class="py-3.5 px-4 text-xs font-medium text-slate-600">
            ${item.email && item.email !== '-' ? `
              <div class="flex items-center gap-1.5">
                <span class="text-slate-400">✉️</span>
                <span class="select-all font-mono">${item.email}</span>
                <button onclick="InventoryModule.copyText('${item.email}', 'คัดลอกอีเมลแล้ว')" class="text-slate-400 hover:text-emerald-600 p-0.5" title="คัดลอก">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                </button>
              </div>
            ` : `<span class="text-slate-300">-</span>`}
          </td>

          <!-- Password with toggle -->
          <td class="py-3.5 px-4 text-xs">
            ${item.password && item.password !== '-' ? `
              <div class="flex items-center gap-2">
                <span id="pw-display-${item.id}" class="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200">
                  ••••••••
                </span>
                <button onclick="InventoryModule.togglePasswordVisibility('${item.id}', '${item.password}')" class="text-slate-400 hover:text-slate-700 p-1" title="ดูรหัสผ่าน">
                  <svg id="pw-icon-${item.id}" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                </button>
                <button onclick="InventoryModule.copyText('${item.password}', 'คัดลอกรหัสผ่านแล้ว')" class="text-slate-400 hover:text-emerald-600 p-1" title="คัดลอกรหัสผ่าน">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                </button>
              </div>
            ` : `<span class="text-slate-300">-</span>`}
          </td>

          <!-- Status Tag -->
          <td class="py-3.5 px-4">
            <div class="flex items-center gap-2">
              ${statusBadge}
              <select onchange="InventoryModule.quickUpdateStatus('${item.id}', this.value)" class="text-[10px] bg-transparent text-slate-400 hover:text-slate-700 cursor-pointer border-none outline-none focus:ring-0">
                <option value="available" ${item.status === 'available' ? 'selected' : ''}>สถานะหลัก: พร้อมใช้งาน</option>
                <option value="maintenance" ${item.status === 'maintenance' ? 'selected' : ''}>สถานะหลัก: ส่งซ่อม</option>
              </select>
            </div>
          </td>

          <!-- Actions -->
          <td class="py-3.5 px-4 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <button onclick="InventoryModule.openAddEditModal('${item.id}')" class="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors" title="แก้ไขข้อมูล">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </button>
              <button onclick="InventoryModule.confirmDelete('${item.id}', '${item.model}')" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="ลบอุปกรณ์">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
  },

  togglePasswordVisibility(itemId, realPassword) {
    const el = document.getElementById(`pw-display-${itemId}`);
    const icon = document.getElementById(`pw-icon-${itemId}`);
    if (!el) return;

    if (el.innerText.includes('•')) {
      el.innerText = realPassword;
      el.classList.add('bg-yellow-50', 'text-yellow-900', 'font-semibold');
      if (icon) {
        icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path>`;
      }
    } else {
      el.innerText = '••••••••';
      el.classList.remove('bg-yellow-50', 'text-yellow-900', 'font-semibold');
      if (icon) {
        icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>`;
      }
    }
  },

  copyText(text, successMsg) {
    navigator.clipboard.writeText(text).then(() => {
      window.App.showToast(successMsg, 'success');
    }).catch(() => {
      window.App.showToast('ไม่สามารถคัดลอกได้', 'error');
    });
  },

  quickUpdateStatus(itemId, newStatus) {
    const inventory = LineUpDB.getInventory();
    const item = inventory.find(i => i.id === itemId);
    if (item) {
      item.status = newStatus;
      LineUpDB.setInventory(inventory);
      window.App.showToast(`อัปเดตสถานะของ ${item.id} เป็น "${newStatus === 'available' ? 'พร้อมใช้งาน' : 'ส่งซ่อม'}" แล้ว`, 'success');
    }
  },

  openAddEditModal(itemId = null) {
    const modal = document.getElementById('inv-add-edit-modal');
    const titleEl = document.getElementById('inv-modal-title');
    const form = document.getElementById('inv-modal-form');
    if (!modal || !form) return;

    this.editingItem = itemId ? LineUpDB.getInventory().find(i => i.id === itemId) : null;

    if (this.editingItem) {
      titleEl.innerText = `แก้ไขข้อมูลอุปกรณ์: ${this.editingItem.id}`;
      document.getElementById('inv-form-category').value = this.editingItem.category;
      document.getElementById('inv-form-id').value = this.editingItem.id;
      document.getElementById('inv-form-id').readOnly = true;
      document.getElementById('inv-form-model').value = this.editingItem.model;
      document.getElementById('inv-form-color').value = this.editingItem.color || '';
      document.getElementById('inv-form-serial').value = this.editingItem.serial || '';
      document.getElementById('inv-form-email').value = this.editingItem.email || '';
      document.getElementById('inv-form-password').value = this.editingItem.password || '';
      document.getElementById('inv-form-status').value = this.editingItem.status;
      document.getElementById('inv-form-battery').value = this.editingItem.batteryHealth || '';
      document.getElementById('inv-form-accessories').value = this.editingItem.accessories || '';
      document.getElementById('inv-form-notes').value = this.editingItem.notes || '';
    } else {
      titleEl.innerText = `+ เพิ่ม${this.currentTab === 'phone' ? 'โทรศัพท์มือถือ' : 'เลนส์'}ใหม่`;
      form.reset();
      document.getElementById('inv-form-category').value = this.currentTab;
      document.getElementById('inv-form-id').readOnly = false;

      // Auto-suggest next ID
      const items = LineUpDB.getInventory().filter(i => i.category === this.currentTab);
      const prefix = this.currentTab === 'phone' ? 'PH-' : 'LN-';
      const nextNum = items.length + 1;
      document.getElementById('inv-form-id').value = `${prefix}${String(nextNum).padStart(2, '0')}`;
      document.getElementById('inv-form-status').value = 'available';
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  closeModal() {
    const modal = document.getElementById('inv-add-edit-modal');
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
    this.editingItem = null;
  },

  saveEquipment() {
    const id = document.getElementById('inv-form-id').value.trim();
    const category = document.getElementById('inv-form-category').value;
    const model = document.getElementById('inv-form-model').value.trim();
    const color = document.getElementById('inv-form-color').value.trim();
    const serial = document.getElementById('inv-form-serial').value.trim();
    const email = document.getElementById('inv-form-email').value.trim() || '-';
    const password = document.getElementById('inv-form-password').value.trim() || '-';
    const status = document.getElementById('inv-form-status').value;
    const batteryHealth = document.getElementById('inv-form-battery').value.trim() || '-';
    const accessories = document.getElementById('inv-form-accessories').value.trim();
    const notes = document.getElementById('inv-form-notes').value.trim();

    if (!id || !model) {
      window.App.showToast('กรุณากรอกรหัสเครื่องและชื่อรุ่นอุปกรณ์', 'error');
      return;
    }

    const inventory = LineUpDB.getInventory();

    if (this.editingItem) {
      // Update existing
      const index = inventory.findIndex(i => i.id === this.editingItem.id);
      if (index !== -1) {
        inventory[index] = {
          ...inventory[index],
          category,
          model,
          color,
          serial,
          email,
          password,
          status,
          batteryHealth,
          accessories,
          notes,
          updatedAt: new Date().toISOString()
        };
        LineUpDB.setInventory(inventory);
        window.App.showToast(`บันทึกข้อมูล ${id} สำเร็จเรียบร้อย`, 'success');
      }
    } else {
      // Check duplicate ID
      if (inventory.some(i => i.id === id)) {
        window.App.showToast(`รหัสอุปกรณ์ "${id}" มีอยู่ในระบบแล้ว`, 'error');
        return;
      }

      inventory.push({
        id,
        category,
        model,
        color,
        serial,
        email,
        password,
        status,
        batteryHealth,
        accessories,
        notes,
        createdAt: new Date().toISOString().split('T')[0]
      });
      LineUpDB.setInventory(inventory);
      window.App.showToast(`เพิ่มอุปกรณ์ ${model} (${id}) สำเร็จ!`, 'success');
    }

    this.closeModal();
  },

  confirmDelete(itemId, modelName) {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบอุปกรณ์ "${modelName}" (${itemId}) ออกจากระบบ?`)) {
      const inventory = LineUpDB.getInventory().filter(i => i.id !== itemId);
      LineUpDB.setInventory(inventory);
      window.App.showToast(`ลบอุปกรณ์ ${itemId} เรียบร้อยแล้ว`, 'info');
    }
  },

  resetFilters() {
    this.searchQuery = '';
    this.statusFilter = 'all';
    const searchInput = document.getElementById('inv-search-input');
    const filterSelect = document.getElementById('inv-status-filter');
    if (searchInput) searchInput.value = '';
    if (filterSelect) filterSelect.value = 'all';
    this.renderTable();
  }
};

window.InventoryModule = InventoryModule;
