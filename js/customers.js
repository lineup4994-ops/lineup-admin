/**
 * Line.Up Phone Rental Service - Customer & Documents Module
 * Customer CRM, VIP & Blacklist tagging, rental history tracking, and printable rental contract generator.
 */

const CustomersModule = {
  searchQuery: '',
  filterTag: 'all', // 'all', 'VIP', 'Blacklist', 'Regular', 'Caution'
  selectedCustomerId: null,

  init() {
    this.render();
    this.bindEvents();

    window.addEventListener('lineup:customers-updated', () => {
      this.render();
    });

    window.addEventListener('lineup:bookings-updated', () => {
      this.render();
    });
  },

  bindEvents() {
    document.getElementById('cust-search-input')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderTable();
    });

    document.getElementById('cust-filter-tag')?.addEventListener('change', (e) => {
      this.filterTag = e.target.value;
      this.renderTable();
    });

    document.getElementById('cust-add-btn')?.addEventListener('click', () => {
      this.openAddCustomerModal();
    });

    document.getElementById('cust-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveCustomer();
    });
  },

  render() {
    this.renderStats();
    this.renderTable();
  },

  renderStats() {
    const customers = LineUpDB.getCustomers();
    const bookings = LineUpDB.getBookings();

    const returningCount = customers.filter(c => {
      const cBooks = bookings.filter(b => b.customerId === c.id || b.customerPhone === c.phone);
      return cBooks.length >= 2 || (c.tag === 'VIP' && cBooks.length >= 2);
    }).length;

    const blacklistCount = customers.filter(c => c.tag === 'Blacklist').length;
    const regularCount = customers.filter(c => {
      const cBooks = bookings.filter(b => b.customerId === c.id || b.customerPhone === c.phone);
      return cBooks.length <= 1 && c.tag !== 'Blacklist';
    }).length;

    const statsEl = document.getElementById('cust-stats-strip');
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg font-bold shrink-0">⭐</span>
            <div>
              <p class="text-[11px] text-slate-500 font-medium">ลูกค้าเก่า (เช่า 2 ครั้ง+)</p>
              <h4 class="text-lg font-bold text-slate-800">${returningCount} <span class="text-xs font-normal text-slate-400">คน</span></h4>
            </div>
          </div>
          <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-lg font-bold shrink-0">🚫</span>
            <div>
              <p class="text-[11px] text-slate-500 font-medium">ติดแบล็กลิสต์ (Blacklist)</p>
              <h4 class="text-lg font-bold text-rose-600">${blacklistCount} <span class="text-xs font-normal text-slate-400">คน</span></h4>
            </div>
          </div>
          <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-bold shrink-0">👥</span>
            <div>
              <p class="text-[11px] text-slate-500 font-medium">ไม่มีป้าย (เช่า 1 ครั้ง / ใหม่)</p>
              <h4 class="text-lg font-bold text-slate-800">${regularCount} <span class="text-xs font-normal text-slate-400">คน</span></h4>
            </div>
          </div>
          <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center text-lg font-bold shrink-0">📱</span>
            <div>
              <p class="text-[11px] text-slate-500 font-medium">ฐานลูกค้าทั้งหมด</p>
              <h4 class="text-lg font-bold text-slate-800">${customers.length} <span class="text-xs font-normal text-slate-400">คน</span></h4>
            </div>
          </div>
        </div>
      `;
    }
  },

  renderTable() {
    const tableBody = document.getElementById('cust-table-body');
    if (!tableBody) return;

    let customers = LineUpDB.getCustomers();
    const bookings = LineUpDB.getBookings();

    // Filter by tag
    if (this.filterTag !== 'all') {
      if (this.filterTag === 'VIP') {
        customers = customers.filter(c => {
          const cBooks = bookings.filter(b => b.customerId === c.id || b.customerPhone === c.phone);
          return c.tag === 'VIP' || cBooks.length >= 2;
        });
      } else if (this.filterTag === 'Regular') {
        customers = customers.filter(c => {
          const cBooks = bookings.filter(b => b.customerId === c.id || b.customerPhone === c.phone);
          return (c.tag === 'Regular' || !c.tag) && cBooks.length <= 1 && c.tag !== 'Blacklist';
        });
      } else {
        customers = customers.filter(c => c.tag === this.filterTag);
      }
    }

    // Search query
    if (this.searchQuery) {
      customers = customers.filter(c =>
        c.nickname.toLowerCase().includes(this.searchQuery) ||
        (c.fullName && c.fullName.toLowerCase().includes(this.searchQuery)) ||
        (c.phone && c.phone.includes(this.searchQuery)) ||
        (c.lineId && c.lineId.toLowerCase().includes(this.searchQuery)) ||
        (c.id && c.id.toLowerCase().includes(this.searchQuery))
      );
    }

    if (customers.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="py-12 text-center text-slate-400">
            <div class="flex flex-col items-center justify-center">
              <span class="text-4xl mb-2">👤</span>
              <p class="text-sm font-medium">ไม่พบข้อมูลลูกค้าที่ตรงกับคำค้นหา</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    customers.forEach(cust => {
      // Rental history stats for this customer
      const custBookings = bookings.filter(b => b.customerId === cust.id || b.customerPhone === cust.phone);
      const totalSpent = custBookings.reduce((sum, b) => sum + (b.totalRental || 0), 0);

      // เงื่อนไข: ถ้าลูกค้าเช่า 1 ครั้ง -> ไม่มีป้ายสถานะ
      // แต่ถ้าลูกค้าเช่าเป็นครั้งที่ 2 เป็นต้นไป (>= 2 ครั้ง) -> ให้ขึ้น ป้ายลูกค้าเก่า
      const isOldCustomer = custBookings.length >= 2;

      if (cust.tag !== 'Blacklist' && cust.tag !== 'Caution') {
        if (isOldCustomer) {
          if (cust.tag !== 'VIP') {
            cust.tag = 'VIP';
            cust.tagReason = `ลูกค้าเก่า (ประวัติเช่า ${custBookings.length} ครั้ง)`;
            setTimeout(() => LineUpDB.setCustomers(customers), 0);
          }
        } else {
          // ถ้าเช่า 1 ครั้ง หรือไม่เคยเช่า ให้รีเซ็ตกลับเป็นไม่มีป้ายสถานะ
          if (cust.tag === 'VIP' || (cust.tagReason && cust.tagReason.includes('ลูกค้าเก่า'))) {
            cust.tag = 'Regular';
            cust.tagReason = '';
            setTimeout(() => LineUpDB.setCustomers(customers), 0);
          }
        }
      }

      // Tag styling:
      let tagBadge = '';
      if (cust.tag === 'VIP' || isOldCustomer) {
        tagBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold badge-vip">
          ⭐ ลูกค้าเก่า
        </span>`;
      } else if (cust.tag === 'Blacklist') {
        tagBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold badge-blacklist">
          🚫 BLACKLIST เฝ้าระวัง
        </span>`;
      } else if (cust.tag === 'Caution') {
        tagBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
          ⚠️ มีประวัติคืนช้า
        </span>`;
      } else {
        // เช่า 1 ครั้ง หรือลูกค้าใหม่: ไม่มีป้ายสถานะ
        tagBadge = `<span class="text-xs text-slate-400 italic font-normal">- ไม่มีป้ายสถานะ -</span>`;
      }

      const noteToDisplay = isOldCustomer ? cust.tagReason : (cust.tagReason?.includes('ลูกค้าเก่า') ? '' : cust.tagReason);

      html += `
        <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
          <!-- Customer Info -->
          <td class="py-3.5 px-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full ${isOldCustomer ? 'bg-amber-100 text-amber-700 border-2 border-amber-300' : (cust.tag === 'Blacklist' ? 'bg-rose-100 text-rose-700 border-2 border-rose-300' : 'bg-emerald-100 text-emerald-700')} flex items-center justify-center font-bold text-sm shrink-0">
                ${cust.nickname.slice(0, 2)}
              </div>
              <div>
                <div class="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  ${cust.nickname}
                  ${isOldCustomer ? `<span class="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300">⭐ ลูกค้าเก่า</span>` : ''}
                </div>
                <div class="text-[11px] text-slate-400 mt-0.5 font-mono">
                  ID: ${cust.id}
                </div>
              </div>
            </div>
          </td>

          <!-- Contact Details -->
          <td class="py-3.5 px-4 text-xs">
            <div class="text-slate-800 font-semibold flex items-center gap-1">
              <span>📞</span> ${cust.phone}
            </div>
            <div class="text-slate-500 mt-0.5 flex items-center gap-1">
              <span>💬</span> Line: <strong class="text-slate-700">${cust.lineId || '-'}</strong>
            </div>
            ${cust.socialHandle && cust.socialHandle !== '-' ? `
              <div class="text-[10px] text-pink-600 mt-0.5">
                ${cust.socialHandle}
              </div>
            ` : ''}
          </td>

          <!-- Tag & Notes -->
          <td class="py-3.5 px-4">
            <div>${tagBadge}</div>
            ${noteToDisplay ? `
              <div class="text-[11px] text-slate-600 mt-1 max-w-xs bg-slate-50 p-1.5 rounded border border-slate-200/80 line-clamp-2">
                ${noteToDisplay}
              </div>
            ` : ''}
          </td>

          <!-- Rental History Stats -->
          <td class="py-3.5 px-4">
            <div class="text-xs font-bold text-slate-800">
              เคยเช่า ${custBookings.length} ครั้ง
            </div>
            <div class="text-xs text-emerald-600 font-semibold mt-0.5">
              ยอดรวม ฿${totalSpent.toLocaleString()}
            </div>
            <button onclick="CustomersModule.viewCustomerHistory('${cust.id}')" class="text-[11px] text-emerald-700 hover:text-emerald-900 font-medium underline mt-1 block">
              ดูประวัติย้อนหลังทั้งหมด →
            </button>
          </td>

          <!-- Actions -->
          <td class="py-3.5 px-4 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <button onclick="CustomersModule.openEditCustomerModal('${cust.id}')" class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors" title="แก้ไขข้อมูล">
                แก้ไข
              </button>
              <button onclick="CustomersModule.createContractForCustomer('${cust.id}')" class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 transition-colors flex items-center gap-1 shadow-2xs" title="พิมพ์สัญญาเช่า">
                📄 สัญญา
              </button>
              <button onclick="CustomersModule.confirmDeleteCustomer('${cust.id}', '${cust.nickname}')" class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors flex items-center gap-1" title="ลบข้อมูลลูกค้ากรณีที่กรอกผิด">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                ลบ
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
  },

  openAddCustomerModal() {
    this.selectedCustomerId = null;
    const modal = document.getElementById('cust-modal');
    const title = document.getElementById('cust-modal-title');
    const form = document.getElementById('cust-form');
    if (!modal || !form) return;

    form.reset();
    title.innerText = '+ เพิ่มข้อมูลลูกค้าใหม่';

    // Auto next customer id
    const customers = LineUpDB.getCustomers();
    const nextId = `CUST-${String(customers.length + 1).padStart(3, '0')}`;
    document.getElementById('cust-form-id').value = nextId;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  openEditCustomerModal(custId) {
    this.selectedCustomerId = custId;
    const customers = LineUpDB.getCustomers();
    const cust = customers.find(c => c.id === custId);
    if (!cust) return;

    const modal = document.getElementById('cust-modal');
    const title = document.getElementById('cust-modal-title');
    if (!modal) return;

    title.innerText = `แก้ไขข้อมูลลูกค้า: ${cust.nickname} (${cust.id})`;
    document.getElementById('cust-form-id').value = cust.id;
    document.getElementById('cust-form-nickname').value = cust.nickname;
    document.getElementById('cust-form-phone').value = cust.phone;
    document.getElementById('cust-form-line').value = cust.lineId || '';
    document.getElementById('cust-form-social').value = cust.socialHandle || '';
    document.getElementById('cust-form-notes').value = cust.notes || '';

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  confirmDeleteCustomer(custId, nickname) {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลลูกค้า "${nickname}" (${custId}) ออกจากระบบ?\n(ใช้ในกรณีที่กรอกข้อมูลผิด)`)) {
      const customers = LineUpDB.getCustomers().filter(c => c.id !== custId);
      LineUpDB.setCustomers(customers);
      window.App.showToast(`ลบข้อมูลลูกค้า "${nickname}" (${custId}) สำเร็จแล้ว`, 'info');
    }
  },

  closeModal() {
    const modal = document.getElementById('cust-modal');
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
    this.selectedCustomerId = null;
  },

  saveCustomer() {
    const id = document.getElementById('cust-form-id').value;
    const nickname = document.getElementById('cust-form-nickname').value.trim();
    const phone = document.getElementById('cust-form-phone').value.trim();
    const lineId = document.getElementById('cust-form-line')?.value.trim() || '';
    const socialHandle = document.getElementById('cust-form-social')?.value.trim() || '-';
    const notes = document.getElementById('cust-form-notes')?.value.trim() || '';

    if (!nickname || !phone) {
      window.App.showToast('กรุณากรอกชื่อเล่นและเบอร์โทรศัพท์ลูกค้า', 'error');
      return;
    }

    const customers = LineUpDB.getCustomers();
    const bookings = LineUpDB.getBookings();
    const custBookings = bookings.filter(b => b.customerId === id || b.customerPhone === phone);

    if (this.selectedCustomerId) {
      const idx = customers.findIndex(c => c.id === this.selectedCustomerId);
      if (idx !== -1) {
        customers[idx] = {
          ...customers[idx],
          nickname,
          fullName: nickname,
          phone,
          lineId,
          socialHandle,
          notes,
          updatedAt: new Date().toISOString()
        };
        LineUpDB.setCustomers(customers);
        window.App.showToast(`อัปเดตข้อมูลลูกค้า ${nickname} เรียบร้อย`, 'success');
      }
    } else {
      // Check if this is a returning customer who already booked before
      const isReturning = custBookings.length > 0;
      const tag = isReturning ? 'VIP' : 'Regular';
      const tagReason = isReturning ? 'ลูกค้าเก่า ได้รับสถานะ VIP อัตโนมัติ' : 'ลูกค้าใหม่';

      customers.push({
        id,
        nickname,
        fullName: nickname,
        phone,
        lineId: lineId || '-',
        socialHandle: socialHandle || '-',
        citizenId: '-',
        idCardVerified: false,
        tag,
        tagReason,
        notes,
        createdAt: new Date().toISOString().split('T')[0]
      });
      LineUpDB.setCustomers(customers);
      window.App.showToast(`เพิ่มลูกค้าใหม่ ${nickname} สำเร็จ! ${tag === 'VIP' ? '(สถานะ VIP ⭐)' : ''}`, 'success');
    }

    this.closeModal();
  },

  // View Rental History Modal
  viewCustomerHistory(custId) {
    const customers = LineUpDB.getCustomers();
    const cust = customers.find(c => c.id === custId);
    if (!cust) return;

    const bookings = LineUpDB.getBookings().filter(b => b.customerId === cust.id || b.customerPhone === cust.phone);

    const modal = document.getElementById('cust-history-modal');
    const title = document.getElementById('cust-history-title');
    const content = document.getElementById('cust-history-content');
    if (!modal || !content) return;

    if (title) {
      title.innerHTML = `
        ประวัติการเช่าย้อนหลัง: <span class="text-emerald-700 font-bold">${cust.nickname}</span> 
        <span class="text-xs font-normal text-slate-500">(${cust.phone})</span>
      `;
    }

    let html = `
      <div class="space-y-3">
        <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div>
            <span class="text-slate-500">สถานะลูกค้า:</span>
            <span class="font-bold text-slate-800 ml-1">${cust.tag}</span>
            ${cust.tagReason ? `<div class="text-slate-500 text-[11px] mt-0.5">${cust.tagReason}</div>` : ''}
          </div>
          <div class="text-right">
            <span class="text-slate-500">เช่าทั้งหมด:</span>
            <span class="font-bold text-slate-800 ml-1">${bookings.length} ครั้ง</span>
          </div>
        </div>

        <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider">รายการเช่าย้อนหลังทั้งหมด</h4>
    `;

    if (bookings.length === 0) {
      html += `
        <div class="py-8 text-center text-slate-400 text-xs">
          ยังไม่มีประวัติการเช่าสำหรับลูกค้ารายนี้
        </div>
      `;
    } else {
      html += `
        <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
          ${bookings.map(b => `
            <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div class="flex items-center justify-between">
                <div class="font-bold text-slate-800 text-sm">
                  ${b.eventName}
                </div>
                <span class="font-mono text-xs font-bold text-emerald-700">฿${(b.totalRental || 0).toLocaleString()}</span>
              </div>
              <div class="text-xs text-slate-600 flex items-center gap-2">
                <span>📱 ${b.deviceSummary}</span>
                <span>•</span>
                <span>📅 ${b.startDate} ถึง ${b.endDate}</span>
              </div>
              <div class="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                <span>วิธีส่ง: ${b.deliveryMethod === 'venue' ? 'นัดรับหน้าคอน' : (b.deliveryMethod === 'messenger' ? 'แมสเซนเจอร์' : 'รับที่ร้าน')}</span>
                <span class="font-medium ${b.deliveryStatus === 'returned' ? 'text-emerald-600' : 'text-amber-600'}">
                  สถานะ: ${b.deliveryStatus}
                </span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    html += `</div>`;
    content.innerHTML = html;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  closeHistoryModal() {
    const modal = document.getElementById('cust-history-modal');
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
  },

  // Printable Rental Agreement Generator
  viewContractForBooking(bookingId) {
    const bookings = LineUpDB.getBookings();
    const b = bookings.find(item => item.id === bookingId);
    if (!b) return;

    const customers = LineUpDB.getCustomers();
    const cust = customers.find(c => c.id === b.customerId || c.phone === b.customerPhone) || {
      fullName: b.customerName,
      nickname: b.customerNickname,
      phone: b.customerPhone,
      lineId: b.customerLine,
      citizenId: '1-XXXX-XXXXX-XX-X'
    };

    this.renderContractView(b, cust);
  },

  createContractForCustomer(custId) {
    const customers = LineUpDB.getCustomers();
    const cust = customers.find(c => c.id === custId);
    if (!cust) return;

    const bookings = LineUpDB.getBookings().filter(b => b.customerId === cust.id || b.customerPhone === cust.phone);
    const latestBooking = bookings[0] || {
      id: `BK-DRAFT-${Date.now().toString().slice(-4)}`,
      eventName: "งานคอนเสิร์ต / อีเวนต์ด่วน",
      venue: "ราชมังคลากีฬาสถาน / อิมแพ็ค อารีน่า",
      deviceSummary: "Samsung Galaxy S24 Ultra (512GB) พร้อมอุปกรณ์ครบชุด",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      days: 1,
      totalRental: 1600,
      deposit: 2000,
      deliveryMethod: "venue"
    };

    this.renderContractView(latestBooking, cust);
  },

  renderContractView(booking, customer) {
    const modal = document.getElementById('printable-contract-modal');
    const content = document.getElementById('printable-contract-content');
    if (!modal || !content) return;

    content.innerHTML = `
      <div class="p-6 md:p-8 bg-white max-w-3xl mx-auto border border-slate-300 rounded-2xl shadow-lg text-slate-800 text-xs">
        <!-- Contract Header -->
        <div class="flex items-center justify-between pb-4 border-b-2 border-emerald-500">
          <div class="flex items-center gap-3">
            <img src="assets/logo.jpg" class="w-14 h-14 rounded-xl object-contain border border-slate-200" alt="Line.Up Logo">
            <div>
              <h2 class="text-xl font-extrabold text-emerald-800 brand-font tracking-tight">Line.Up PHONE RENTAL</h2>
              <p class="text-slate-500 text-[11px]">สัญญาเช่าโทรศัพท์มือถือและอุปกรณ์ถ่ายภาพคอนเสิร์ต</p>
              <p class="text-slate-400 text-[10px]">Line Official: @lineup.rental | Tel: 082-999-8877</p>
            </div>
          </div>
          <div class="text-right">
            <div class="text-xs font-bold font-mono text-slate-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              เลขที่สัญญา: ${booking.id}
            </div>
            <div class="text-[10px] text-slate-400 mt-1">วันที่ทำสัญญา: ${new Date().toLocaleDateString('th-TH')}</div>
          </div>
        </div>

        <!-- Customer & Event Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <h4 class="font-bold text-emerald-800 text-xs uppercase mb-1">ข้อมูลผู้เช่า (Customer Details)</h4>
            <div class="space-y-0.5 text-slate-700">
              <p>ชื่อผู้เช่า: <strong class="text-slate-900">${customer.nickname}</strong></p>
              ${customer.citizenId && customer.citizenId !== '-' ? `<p>เลขบัตรประชาชน: <strong class="font-mono">${customer.citizenId}</strong></p>` : ''}
              <p>เบอร์โทรศัพท์: <strong>${customer.phone}</strong> | Line ID: <strong>${customer.lineId || '-'}</strong></p>
              <p>สถานะสมาชิก: <span class="font-bold text-emerald-700">${customer.tag === 'VIP' ? '⭐ VIP (ลูกค้าเก่า)' : (customer.tag || 'Regular')}</span></p>
            </div>
          </div>

          <div>
            <h4 class="font-bold text-emerald-800 text-xs uppercase mb-1">รายละเอียดงานคอนเสิร์ต / ระยะเวลาเช่า</h4>
            <div class="space-y-0.5 text-slate-700">
              <p>ชื่องาน: <strong class="text-slate-900">${booking.eventName}</strong></p>
              <p>สถานที่จัดงาน: ${booking.venue || '-'}</p>
              <p>ระยะเวลาเช่า: <strong>${booking.startDate} ถึง ${booking.endDate}</strong> (${booking.days || 1} วัน)</p>
              <p>วิธีส่งมอบ-รับคืน: <strong>${booking.deliveryMethod === 'venue' ? 'นัดรับหน้างานคอนเสิร์ต' : (booking.deliveryMethod === 'messenger' ? 'แมสเซนเจอร์' : 'รับที่หน้าร้าน')}</strong></p>
            </div>
          </div>
        </div>

        <!-- Equipment & Financials -->
        <div class="my-4">
          <h4 class="font-bold text-slate-800 text-xs mb-2">รายการอุปกรณ์และค่าบริการ (Equipment & Rental Fee)</h4>
          <table class="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
            <thead class="bg-emerald-100/60 text-emerald-950 font-bold text-[11px]">
              <tr>
                <th class="p-2 border-b">รายการอุปกรณ์</th>
                <th class="p-2 border-b text-center">รหัสเครื่อง/เลนส์</th>
                <th class="p-2 border-b text-right">ค่าเช่ารวม</th>
                <th class="p-2 border-b text-right">เงินประกันมัดจำ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td class="p-2.5">
                  <span class="font-bold text-slate-800">${booking.deviceSummary}</span>
                  <div class="text-[10px] text-slate-400">พร้อมอุปกรณ์: เคสกันกระแทก, สายคล้องคอกันตกหล่น, ฟิล์มกระจก 9H, หัวชาร์จและสายชาร์จ</div>
                </td>
                <td class="p-2.5 text-center font-mono font-bold text-emerald-700">
                  ${[booking.assignedPhoneId, booking.assignedLensId].filter(Boolean).join(' + ') || '-'}
                </td>
                <td class="p-2.5 text-right font-bold text-slate-800">
                  ฿${(booking.totalRental || 0).toLocaleString()}
                </td>
                <td class="p-2.5 text-right font-bold text-amber-700">
                  ฿${(booking.deposit || 2000).toLocaleString()}
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-slate-50 font-bold text-slate-800">
              <tr>
                <td colspan="2" class="p-2 text-right">ยอดชำระสุทธิ (รวมเงินมัดจำ):</td>
                <td colspan="2" class="p-2 text-right text-emerald-700 text-sm">
                  ฿${((booking.totalRental || 0) - (booking.deposit || 2000)).toLocaleString()} บาท
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Terms & Conditions -->
        <div class="my-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-600 space-y-1">
          <p class="font-bold text-slate-700 text-[11px]">ข้อตกลงและเงื่อนไขการเช่า:</p>
          <p>1. ผู้เช่าต้องดูแลรักษาอุปกรณ์ให้อยู่ในสภาพสมบูรณ์ ห้ามลอกฟิล์ม ห้ามถอดสายคล้องคอระหว่างอยู่ในบริเวณคอนเสิร์ต</p>
          <p>2. ผู้เช่าต้องส่งมอบอุปกรณ์คืนตรงตามเวลาที่นัดหมาย หากเกินเวลาโดยไม่แจ้งล่วงหน้า มีค่าปรับชั่วโมงละ 100 บาท</p>
          <p>3. ในกรณีที่เครื่องตกหล่น หน้าจอแตก เลนส์มีรอยขีดข่วน หรืออุปกรณ์สูญหาย ผู้เช่าต้องรับผิดชอบค่าซ่อมหรือชดใช้ตามจริงตามใบเสร็จศูนย์บริการ</p>
          <p>4. ทางร้านจะโอนคืนเงินประกันมัดจำเต็มจำนวนทันทีหลังจากตรวจสอบสภาพเครื่องหลังรับคืนเรียบร้อยแล้ว</p>
        </div>

        <!-- Signatures -->
        <div class="grid grid-cols-2 gap-8 pt-6 mt-6 border-t border-slate-200 text-center">
          <div>
            <div class="h-12 border-b border-dashed border-slate-400 w-48 mx-auto"></div>
            <p class="font-bold text-slate-800 mt-2">ลงชื่อ: ${customer.nickname}</p>
            <p class="text-slate-400 text-[10px]">(ผู้เช่า / ผู้รับมอบอุปกรณ์)</p>
          </div>
          <div>
            <div class="h-12 border-b border-dashed border-slate-400 w-48 mx-auto flex items-end justify-center pb-1">
              <span class="text-xs font-serif italic text-emerald-800">Line.Up Admin</span>
            </div>
            <p class="font-bold text-slate-800 mt-2">ลงชื่อ: ตัวแทน Line.Up Service</p>
            <p class="text-slate-400 text-[10px]">(ผู้ให้เช่า / ผู้ตรวจสภาพอุปกรณ์)</p>
          </div>
        </div>

        <!-- Print Action Bar (hidden when printing) -->
        <div class="no-print mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
          <button onclick="CustomersModule.closeContractModal()" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            ปิดหน้าต่าง
          </button>
          <button onclick="window.print()" class="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            พิมพ์สัญญาเช่า (Print / Save as PDF)
          </button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  closeContractModal() {
    const modal = document.getElementById('printable-contract-modal');
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
  }
};

window.CustomersModule = CustomersModule;
