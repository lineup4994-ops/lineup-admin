/**
 * Line.Up Phone Rental Service - Booking Management Module
 * Dynamic pricing calculation, delivery tracking, condition inspection upload & notes.
 */

const BookingsModule = {
  filterStatus: 'all', // 'all', 'pending', 'delivered', 'returned'
  filterEvent: 'all',
  searchQuery: '',
  activeBookingId: null,

  init() {
    this.render();
    this.bindEvents();

    window.addEventListener('lineup:bookings-updated', () => {
      this.render();
    });
    window.addEventListener('lineup:events-updated', () => {
      this.populateEventSelects();
      this.render();
    });
  },

  bindEvents() {
    // Filter controls
    document.getElementById('booking-filter-status')?.addEventListener('change', (e) => {
      this.filterStatus = e.target.value;
      this.renderTable();
    });

    document.getElementById('booking-filter-event')?.addEventListener('change', (e) => {
      this.filterEvent = e.target.value;
      this.renderTable();
    });

    document.getElementById('booking-search-input')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderTable();
    });

    // Create Booking Button
    document.getElementById('booking-create-btn')?.addEventListener('click', () => {
      this.openNewBookingModal();
    });

    // Live customer check for returning VIP status
    const checkCustHandler = () => this.checkReturningCustomer();
    document.getElementById('bk-form-cust-nickname')?.addEventListener('input', checkCustHandler);
    document.getElementById('bk-form-cust-phone')?.addEventListener('input', checkCustHandler);

    // Event Pricing Master Button
    document.getElementById('booking-manage-events-btn')?.addEventListener('click', () => {
      this.openEventPricingModal();
    });

    // Form dynamic price calculator hooks
    document.getElementById('bk-form-event')?.addEventListener('change', () => {
      this.onEventSelected();
      this.recalculatePrice();
    });
    document.getElementById('bk-form-type')?.addEventListener('change', () => {
      this.updateDeviceDropdowns();
      this.recalculatePrice();
    });
    document.getElementById('bk-form-start-date')?.addEventListener('change', () => {
      this.updateDeviceDropdowns();
      this.recalculatePrice();
    });
    document.getElementById('bk-form-end-date')?.addEventListener('change', () => {
      this.updateDeviceDropdowns();
      this.recalculatePrice();
    });

    // Submit Booking Form
    document.getElementById('bk-new-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveNewBooking();
    });

    // Save Inspection Form
    document.getElementById('inspection-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveInspection();
    });

    // Save Booking Slip Form
    document.getElementById('bk-slip-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveBookingSlip();
    });

    // Save Closing Slip Form
    document.getElementById('cl-slip-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveClosingSlip();
    });
  },

  populateEventSelects() {
    const events = LineUpDB.getEvents();
    const filterSelect = document.getElementById('booking-filter-event');
    const formSelect = document.getElementById('bk-form-event');

    if (filterSelect) {
      filterSelect.innerHTML = `<option value="all">คอนเสิร์ต / อีเวนต์ทั้งหมด</option>` +
        events.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
    }

    if (formSelect) {
      formSelect.innerHTML = `<option value="">-- กรุณาเลือกงานคอนเสิร์ต / อีเวนต์ --</option>` +
        events.map(e => `
          <option value="${e.id}" data-phone="${e.pricing.phone}" data-lens="${e.pricing.lens}" data-fullset="${e.pricing.fullset}" data-deposit="${e.pricing.deposit}">
            ${e.name} (${e.venue.split('(')[0].trim()})
          </option>
        `).join('');
    }
  },

  render() {
    this.populateEventSelects();
    this.renderStats();
    this.renderTable();
  },

  renderStats() {
    const bookings = LineUpDB.getBookings();
    const pendingCount = bookings.filter(b => b.deliveryStatus === 'pending').length;
    const deliveredCount = bookings.filter(b => b.deliveryStatus === 'delivered').length;
    const returnedCount = bookings.filter(b => b.deliveryStatus === 'returned').length;

    const statEl = document.getElementById('booking-stats-strip');
    if (statEl) {
      statEl.innerHTML = `
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg font-bold shrink-0">🟡</span>
            <div>
              <p class="text-[11px] text-slate-500 font-medium">รอส่งมอบ (Pending)</p>
              <h4 class="text-lg font-bold text-slate-800">${pendingCount} <span class="text-xs font-normal text-slate-400">คิว</span></h4>
            </div>
          </div>
          <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold shrink-0">🛵</span>
            <div>
              <p class="text-[11px] text-slate-500 font-medium">ส่งมอบแล้ว (In Use)</p>
              <h4 class="text-lg font-bold text-slate-800">${deliveredCount} <span class="text-xs font-normal text-slate-400">เครื่อง</span></h4>
            </div>
          </div>
          <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-bold shrink-0">✅</span>
            <div>
              <p class="text-[11px] text-slate-500 font-medium">รับคืนสำเร็จ (Returned)</p>
              <h4 class="text-lg font-bold text-slate-800">${returnedCount} <span class="text-xs font-normal text-slate-400">งาน</span></h4>
            </div>
          </div>
          <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center text-lg font-bold shrink-0">📋</span>
            <div>
              <p class="text-[11px] text-slate-500 font-medium">ยอดจองรวมทั้งหมด</p>
              <h4 class="text-lg font-bold text-slate-800">${bookings.length} <span class="text-xs font-normal text-slate-400">รายการ</span></h4>
            </div>
          </div>
        </div>
      `;
    }
  },

  renderTable() {
    const tableBody = document.getElementById('booking-table-body');
    if (!tableBody) return;

    let bookings = LineUpDB.getBookings();

    // Filter by status
    if (this.filterStatus !== 'all') {
      bookings = bookings.filter(b => b.deliveryStatus === this.filterStatus);
    }

    // Filter by event
    if (this.filterEvent !== 'all') {
      bookings = bookings.filter(b => b.eventId === this.filterEvent);
    }

    // Search query
    if (this.searchQuery) {
      bookings = bookings.filter(b => 
        b.customerNickname.toLowerCase().includes(this.searchQuery) ||
        (b.customerName && b.customerName.toLowerCase().includes(this.searchQuery)) ||
        (b.eventName && b.eventName.toLowerCase().includes(this.searchQuery)) ||
        (b.deviceSummary && b.deviceSummary.toLowerCase().includes(this.searchQuery)) ||
        b.id.toLowerCase().includes(this.searchQuery)
      );
    }

    if (bookings.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="py-12 text-center text-slate-400">
            <div class="flex flex-col items-center justify-center">
              <span class="text-4xl mb-2">🎟️</span>
              <p class="text-sm font-medium">ไม่พบคิวการจองตามเงื่อนไขที่เลือก</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    bookings.forEach(b => {
      // Status formatting
      const statusBadges = {
        'pending': '<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">🟡 รอส่งมอบ</span>',
        'delivered': '<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">🛵 ส่งมอบแล้ว</span>',
        'returned': '<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">✅ รับคืนแล้ว</span>',
        'cancelled': '<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">❌ ยกเลิก</span>'
      };

      // Delivery Method badge
      let deliveryMethodBadge = '';
      if (b.deliveryMethod === 'venue') {
        deliveryMethodBadge = '<span class="text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">🏟️ นัดรับหน้าคอน</span>';
      } else if (b.deliveryMethod === 'messenger') {
        deliveryMethodBadge = '<span class="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">🛵 แมสเซนเจอร์</span>';
      } else {
        deliveryMethodBadge = '<span class="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">🏬 รับที่ร้าน</span>';
      }

      // Payment Slips status
      const bkSlip = b.paymentSlips?.bookingSlip || b.bookingSlip || null;
      const clSlip = b.paymentSlips?.closingSlip || b.closingSlip || null;
      const hasBkSlip = !!(bkSlip && bkSlip.uploaded && bkSlip.imageUrl);
      const hasClSlip = !!(clSlip && clSlip.uploaded && clSlip.imageUrl);

      let slipBadgesHtml = '';
      if (hasBkSlip) {
        slipBadgesHtml += `
          <button type="button" onclick="BookingsModule.openSlipPreviewModal('${b.id}', 'booking')" class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 transition-colors shadow-2xs" title="คลิกเพื่อดูรูปสลิปการจอง">
            <img src="${bkSlip.imageUrl}" class="w-4 h-4 rounded object-cover border border-emerald-400" alt="สลิปจอง">
            <span class="text-[10px] font-bold">สลิปจอง ฿${(bkSlip.amount || ((b.totalRental || 0) - (b.deposit || 0))).toLocaleString()}</span>
          </button>
        `;
      } else {
        slipBadgesHtml += `
          <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 border border-rose-200">
            ⚠️ ยังไม่มีสลิปจอง
          </span>
        `;
      }

      if (hasClSlip) {
        slipBadgesHtml += `
          <button type="button" onclick="BookingsModule.openSlipPreviewModal('${b.id}', 'closing')" class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-800 transition-colors shadow-2xs" title="คลิกเพื่อดูรูปสลิปปิดยอด">
            <img src="${clSlip.imageUrl}" class="w-4 h-4 rounded object-cover border border-purple-400" alt="สลิปปิดยอด">
            <span class="text-[10px] font-bold">สลิปปิดยอด ฿${(clSlip.amount || b.deposit || 0).toLocaleString()}</span>
          </button>
        `;
      } else if (b.deliveryStatus === 'returned' || b.deliveryStatus === 'delivered') {
        slipBadgesHtml += `
          <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-800 border border-amber-200">
            ⏳ รอสลิปปิดยอด
          </span>
        `;
      }

      // Condition inspection status
      const beforeDone = b.conditionCheck?.beforeDelivery?.checked;
      const afterDone = b.conditionCheck?.afterReturn?.checked;
      let inspectionPill = '';
      if (beforeDone && afterDone) {
        inspectionPill = '<span class="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium border border-emerald-200">✓ ตรวจครบ 2 รอบ</span>';
      } else if (beforeDone) {
        inspectionPill = '<span class="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium border border-amber-200">✓ ตรวจก่อนส่งแล้ว</span>';
      } else {
        inspectionPill = '<span class="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-medium border border-rose-200">⚠️ ยังไม่ตรวจสภาพ</span>';
      }

      // Customer returning check:
      // เงื่อนไข: ถ้าลูกค้าเช่า 1 ครั้ง -> ไม่มีป้ายสถานะ
      // ถ้าลูกค้าชื่อเดิม ID เดิม เช่าเป็นครั้งที่ 2 เป็นต้นไป -> ขึ้น ป้ายลูกค้าเก่า
      const custBookings = bookings.filter(item => 
        (b.customerId && item.customerId === b.customerId) ||
        (b.customerPhone && item.customerPhone && item.customerPhone.replace(/[^0-9]/g, '') === b.customerPhone.replace(/[^0-9]/g, '')) ||
        (b.customerNickname && item.customerNickname && item.customerNickname.toLowerCase() === b.customerNickname.toLowerCase())
      );
      const isOldCustomer = custBookings.length >= 2;

      html += `
        <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
          <!-- Booking ID & Customer -->
          <td class="py-3.5 px-4">
            <div class="flex items-center gap-2">
              <span class="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                ${b.id}
              </span>
              ${isOldCustomer ? `<span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300 shadow-2xs">⭐ ลูกค้าเก่า</span>` : ''}
            </div>
            <div class="font-bold text-slate-800 text-sm mt-1">
              ${b.customerNickname}
            </div>
            <div class="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
              <span>📞 ${b.customerPhone}</span>
              ${b.customerLine && b.customerLine !== '-' ? `<span>💬 Line: ${b.customerLine}</span>` : ''}
            </div>
          </td>

          <!-- Event & Dates -->
          <td class="py-3.5 px-4">
            <div class="font-bold text-slate-800 text-xs truncate max-w-xs" title="${b.eventName}">
              ${b.eventName}
            </div>
            <div class="text-[11px] text-slate-500 mt-0.5">
              📅 ${b.startDate} ถึง ${b.endDate} (${b.days} วัน)
            </div>
            <div class="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">
              📍 ${b.venue || '-'}
            </div>
          </td>

          <!-- Equipment -->
          <td class="py-3.5 px-4">
            <div class="font-semibold text-xs text-slate-800">
              ${b.deviceSummary}
            </div>
            <div class="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
              <span class="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-700 font-medium">
                ${b.rentalType === 'fullset' ? '✨ แบบครบเซ็ต' : (b.rentalType === 'phone' ? '📱 โทรศัพท์' : '📷 เลนส์')}
              </span>
              ${b.assignedPhoneId ? `<span class="font-mono text-[10px] font-bold text-emerald-700">${b.assignedPhoneId}</span>` : ''}
              ${b.assignedLensId ? `<span class="font-mono text-[10px] font-bold text-pink-600">${b.assignedLensId}</span>` : ''}
            </div>
          </td>

          <!-- Price & Deposit -->
          <td class="py-3.5 px-4">
            <div class="font-bold text-emerald-600 text-sm">
              ค่าเช่า: ฿${(b.totalRental || 0).toLocaleString()}
            </div>
            <div class="text-[11px] text-slate-500 mt-0.5">
              มัดจำ: ฿${(b.deposit || 0).toLocaleString()}
            </div>
            <div class="text-[10px] text-amber-800 font-semibold mt-0.5">
              ยอดชำระสุทธิ: ฿${((b.totalRental || 0) - (b.deposit || 0)).toLocaleString()}
            </div>
          </td>

          <!-- Delivery Method & Info -->
          <td class="py-3.5 px-4">
            <div>${deliveryMethodBadge}</div>
            <div class="text-[11px] text-slate-600 mt-1 max-w-xs truncate" title="${b.deliveryAddress}">
              ${b.deliveryAddress || '-'}
            </div>
          </td>

          <!-- Delivery Status & Quick Selector -->
          <td class="py-3.5 px-4">
            <div class="space-y-1">
              <div>${statusBadges[b.deliveryStatus] || b.deliveryStatus}</div>
              <select onchange="BookingsModule.updateDeliveryStatus('${b.id}', this.value)" class="text-[10px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 cursor-pointer">
                <option value="pending" ${b.deliveryStatus === 'pending' ? 'selected' : ''}>รอส่งมอบ (Pending)</option>
                <option value="delivered" ${b.deliveryStatus === 'delivered' ? 'selected' : ''}>ส่งมอบแล้ว (Delivered)</option>
                <option value="returned" ${b.deliveryStatus === 'returned' ? 'selected' : ''}>รับคืนแล้ว (Returned)</option>
                <option value="cancelled" ${b.deliveryStatus === 'cancelled' ? 'selected' : ''}>ยกเลิก (Cancelled)</option>
              </select>
            </div>
          </td>

          <!-- Slips & Actions -->
          <td class="py-3.5 px-4 text-right">
            <div class="flex flex-col items-end gap-1.5">
              <div class="flex flex-wrap items-center justify-end gap-1.5">
                <!-- 1. อัปโหลดสลิป การจอง -->
                <button onclick="BookingsModule.openBookingSlipModal('${b.id}')" class="px-2.5 py-1 text-xs font-bold rounded-lg ${hasBkSlip ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100' : 'bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100'} transition-all flex items-center gap-1 shadow-2xs" title="อัปโหลดสลิป การจอง">
                  <span>🧾 อัปโหลดสลิป การจอง</span>
                  ${hasBkSlip ? '<span class="text-emerald-600 font-black">✓</span>' : ''}
                </button>

                <!-- 2. อัปโหลดสลิป ปิดยอด -->
                <button onclick="BookingsModule.openClosingSlipModal('${b.id}')" class="px-2.5 py-1 text-xs font-bold rounded-lg ${hasClSlip ? 'bg-purple-50 text-purple-800 border border-purple-300 hover:bg-purple-100' : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'} transition-all flex items-center gap-1 shadow-2xs" title="อัปโหลดสลิป ปิดยอด">
                  <span>💳 อัปโหลดสลิป ปิดยอด</span>
                  ${hasClSlip ? '<span class="text-purple-600 font-black">✓</span>' : ''}
                </button>

                <!-- 3. ลบรายการ -->
                <button onclick="BookingsModule.confirmDeleteBooking('${b.id}', '${(b.customerNickname || '').replace(/'/g, "\\'")}')" class="px-2 py-1 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors flex items-center gap-1 shadow-2xs" title="ลบรายการ (กรณีพิมพ์ผิด)">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  <span>ลบ</span>
                </button>
              </div>

              <!-- Slips Preview & Status Badges -->
              <div class="flex flex-wrap items-center justify-end gap-1.5 pt-0.5">
                ${slipBadgesHtml}
              </div>

              <!-- Extra actions -->
              <div class="flex items-center gap-2 pt-0.5 text-[10px]">
                <button onclick="CustomersModule.viewContractForBooking('${b.id}')" class="text-slate-500 hover:text-emerald-700 font-medium underline">
                  📄 พิมพ์สัญญาเช่า
                </button>
                <span class="text-slate-300">•</span>
                <button onclick="BookingsModule.openInspectionModal('${b.id}')" class="text-slate-400 hover:text-slate-700">
                  📸 ตรวจสภาพ
                </button>
              </div>
            </div>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
  },

  confirmDeleteBooking(bookingId, customerNickname) {
    const displayName = customerNickname ? `ของคุณ "${customerNickname}"` : '';
    if (confirm(`คุณต้องการลบรายการคิวการจอง ${bookingId} ${displayName} ใช่หรือไม่?\n\n(กรณีพิมพ์ผิดหรือยกเลิกรายการ อุปกรณ์จะกลับมามีสถานะว่างพร้อมให้เช่าทันที)`)) {
      const bookings = LineUpDB.getBookings().filter(b => b.id !== bookingId);
      LineUpDB.setBookings(bookings);
      window.App.showToast(`ลบรายการคิวการจอง ${bookingId} เรียบร้อยแล้ว`, 'info');
    }
  },

  updateDeliveryStatus(bookingId, newStatus) {
    const bookings = LineUpDB.getBookings();
    const b = bookings.find(item => item.id === bookingId);
    if (!b) return;

    b.deliveryStatus = newStatus;
    LineUpDB.setBookings(bookings);

    const statusTexts = {
      'pending': 'รอส่งมอบ',
      'delivered': 'ส่งมอบแล้ว',
      'returned': 'รับคืนแล้ว',
      'cancelled': 'ยกเลิก'
    };

    window.App.showToast(`อัปเดตสถานะคิว ${bookingId} เป็น "${statusTexts[newStatus] || newStatus}" เรียบร้อยแล้ว`, 'success');
  },

  checkReturningCustomer() {
    const nicknameInput = document.getElementById('bk-form-cust-nickname')?.value.trim();
    const phoneInput = document.getElementById('bk-form-cust-phone')?.value.trim();
    const alertEl = document.getElementById('bk-returning-vip-alert');
    const alertText = document.getElementById('bk-returning-vip-text');

    if (!nicknameInput && !phoneInput) {
      alertEl?.classList.add('hidden');
      return;
    }

    const customers = LineUpDB.getCustomers();
    const bookings = LineUpDB.getBookings();

    const matched = customers.find(c => 
      (phoneInput && c.phone && c.phone.replace(/[^0-9]/g, '') === phoneInput.replace(/[^0-9]/g, '')) ||
      (nicknameInput && c.nickname && c.nickname.toLowerCase() === nicknameInput.toLowerCase())
    );

    const pastBookings = bookings.filter(b => 
      (phoneInput && b.customerPhone && b.customerPhone.replace(/[^0-9]/g, '') === phoneInput.replace(/[^0-9]/g, '')) ||
      (nicknameInput && b.customerNickname && b.customerNickname.toLowerCase() === nicknameInput.toLowerCase())
    );

    if (pastBookings.length >= 1) {
      const nick = matched ? matched.nickname : (pastBookings[0]?.customerNickname || nicknameInput);
      const totalRented = pastBookings.length;
      alertEl?.classList.remove('hidden');
      if (alertText) {
        alertText.innerHTML = `ตรวจพบลูกค้าเก่า: <strong>${nick}</strong> (เคยเช่า ${totalRented} ครั้ง) — <strong>การจองครั้งนี้ (ครั้งที่ ${totalRented + 1}) จะได้รับป้าย "⭐ ลูกค้าเก่า"</strong>`;
      }
      // Auto-fill Line ID if present and input empty
      const lineInput = document.getElementById('bk-form-cust-line');
      if (lineInput && !lineInput.value && (matched?.lineId || pastBookings[0]?.customerLine)) {
        lineInput.value = matched?.lineId || pastBookings[0]?.customerLine;
      }
    } else {
      alertEl?.classList.add('hidden');
    }
  },

  openNewBookingModal(prefillDate = null) {
    const modal = document.getElementById('bk-new-modal');
    const form = document.getElementById('bk-new-form');
    if (!modal || !form) return;

    form.reset();
    document.getElementById('bk-returning-vip-alert')?.classList.add('hidden');
    this.populateEventSelects();

    // Default dates
    const startDateInput = document.getElementById('bk-form-start-date');
    const endDateInput = document.getElementById('bk-form-end-date');

    if (prefillDate) {
      startDateInput.value = prefillDate;
      endDateInput.value = prefillDate;
    } else {
      startDateInput.value = '2026-11-06';
      endDateInput.value = '2026-11-07';
    }

    // Auto next Booking ID
    const bookings = LineUpDB.getBookings();
    const nextNum = 1000 + bookings.length + 1;
    document.getElementById('bk-form-id-display').innerText = `BK-${nextNum}`;

    this.updateDeviceDropdowns();
    this.recalculatePrice();

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  closeNewBookingModal() {
    const modal = document.getElementById('bk-new-modal');
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
  },

  onEventSelected() {
    const eventSelect = document.getElementById('bk-form-event');
    const eventId = eventSelect?.value;
    if (!eventId) return;

    const events = LineUpDB.getEvents();
    const ev = events.find(e => e.id === eventId);
    if (ev) {
      const startDateInput = document.getElementById('bk-form-start-date');
      const endDateInput = document.getElementById('bk-form-end-date');
      if (startDateInput && ev.startDate) startDateInput.value = ev.startDate;
      if (endDateInput && ev.endDate) endDateInput.value = ev.endDate;
      this.updateDeviceDropdowns();
    }
  },

  updateDeviceDropdowns() {
    const rentalType = document.getElementById('bk-form-type')?.value || 'fullset';
    const startDate = document.getElementById('bk-form-start-date')?.value || '';
    const endDate = document.getElementById('bk-form-end-date')?.value || '';
    const inventory = LineUpDB.getInventory();

    const phoneWrapper = document.getElementById('bk-phone-selection-wrapper');
    const lensWrapper = document.getElementById('bk-lens-selection-wrapper');

    const phoneSelect = document.getElementById('bk-form-phone-select');
    const lensSelect = document.getElementById('bk-form-lens-select');

    if (rentalType === 'phone') {
      phoneWrapper?.classList.remove('hidden');
      lensWrapper?.classList.add('hidden');
    } else if (rentalType === 'lens') {
      phoneWrapper?.classList.add('hidden');
      lensWrapper?.classList.remove('hidden');
    } else {
      // Full set
      phoneWrapper?.classList.remove('hidden');
      lensWrapper?.classList.remove('hidden');
    }

    // Filter phones dynamically based on date range availability
    const allPhones = inventory.filter(i => i.category === 'phone');
    const availPhones = [];
    const bookedPhones = [];

    allPhones.forEach(p => {
      if (p.status === 'maintenance') {
        bookedPhones.push({ ...p, reason: 'ส่งซ่อมบำรุงรักษา' });
      } else {
        const check = LineUpDB.isDeviceAvailableForDates(p.id, startDate, endDate);
        if (check.available) {
          availPhones.push(p);
        } else {
          bookedPhones.push({ ...p, reason: check.reason });
        }
      }
    });

    // Filter lenses dynamically based on date range availability
    const allLenses = inventory.filter(i => i.category === 'lens');
    const availLenses = [];
    const bookedLenses = [];

    allLenses.forEach(l => {
      if (l.status === 'maintenance') {
        bookedLenses.push({ ...l, reason: 'ส่งซ่อมบำรุงรักษา' });
      } else {
        const check = LineUpDB.isDeviceAvailableForDates(l.id, startDate, endDate);
        if (check.available) {
          availLenses.push(l);
        } else {
          bookedLenses.push({ ...l, reason: check.reason });
        }
      }
    });

    const dateRangeLabel = startDate && endDate ? `ช่วงวันที่ ${startDate} ถึง ${endDate}` : 'วันที่เลือก';

    if (phoneSelect) {
      let optionsHtml = `<option value="">-- เลือกโทรศัพท์มือถือ (${availPhones.length} เครื่องว่าง) --</option>`;
      if (availPhones.length > 0) {
        optionsHtml += `<optgroup label="✅ เครื่องที่ว่างพร้อมเช่า (${dateRangeLabel})">` +
          availPhones.map(p => `<option value="${p.id}">${p.model} [${p.id}] - สี ${p.color || '-'}</option>`).join('') +
          `</optgroup>`;
      }
      if (bookedPhones.length > 0) {
        optionsHtml += `<optgroup label="❌ เครื่องที่ไม่ว่าง (${dateRangeLabel})">` +
          bookedPhones.map(p => `<option value="${p.id}" disabled class="text-slate-400 bg-slate-100">${p.model} [${p.id}] - (${p.reason})</option>`).join('') +
          `</optgroup>`;
      }
      phoneSelect.innerHTML = optionsHtml;
    }

    if (lensSelect) {
      let optionsHtml = `<option value="">-- เลือกเลนส์เสริม (${availLenses.length} เลนส์ว่าง) --</option>`;
      if (availLenses.length > 0) {
        optionsHtml += `<optgroup label="✅ เลนส์ที่ว่างพร้อมเช่า (${dateRangeLabel})">` +
          availLenses.map(l => `<option value="${l.id}">${l.model} [${l.id}]</option>`).join('') +
          `</optgroup>`;
      }
      if (bookedLenses.length > 0) {
        optionsHtml += `<optgroup label="❌ เลนส์ที่ไม่ว่าง (${dateRangeLabel})">` +
          bookedLenses.map(l => `<option value="${l.id}" disabled class="text-slate-400 bg-slate-100">${l.model} [${l.id}] - (${l.reason})</option>`).join('') +
          `</optgroup>`;
      }
      lensSelect.innerHTML = optionsHtml;
    }
  },

  recalculatePrice() {
    const eventSelect = document.getElementById('bk-form-event');
    const rentalType = document.getElementById('bk-form-type')?.value || 'fullset';
    const startDateVal = document.getElementById('bk-form-start-date')?.value;
    const endDateVal = document.getElementById('bk-form-end-date')?.value;

    const rateDisplay = document.getElementById('bk-calc-rate-display');
    const daysDisplay = document.getElementById('bk-calc-days-display');
    const totalRentalDisplay = document.getElementById('bk-calc-total-rental');
    const depositDisplay = document.getElementById('bk-calc-deposit');
    const grandTotalDisplay = document.getElementById('bk-calc-grand-total');

    if (!eventSelect || !eventSelect.value) {
      if (rateDisplay) rateDisplay.innerText = '฿0';
      if (daysDisplay) daysDisplay.innerText = '0 วัน';
      if (totalRentalDisplay) totalRentalDisplay.innerText = '฿0';
      if (depositDisplay) depositDisplay.innerText = '฿0';
      if (grandTotalDisplay) grandTotalDisplay.innerText = '฿0';
      return;
    }

    const selectedOption = eventSelect.options[eventSelect.selectedIndex];
    const phoneRate = parseFloat(selectedOption.dataset.phone || 0);
    const lensRate = parseFloat(selectedOption.dataset.lens || 0);
    const fullsetRate = parseFloat(selectedOption.dataset.fullset || 0);
    const depositRate = parseFloat(selectedOption.dataset.deposit || 2000);

    let unitRate = fullsetRate;
    if (rentalType === 'phone') unitRate = phoneRate;
    if (rentalType === 'lens') unitRate = lensRate;

    // Calculate days
    let days = 1;
    if (startDateVal && endDateVal) {
      const d1 = new Date(startDateVal);
      const d2 = new Date(endDateVal);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      days = diffDays > 0 ? diffDays : 1;
    }

    const totalRental = unitRate * days;
    // Formula: ยอดชำระสุทธิ (รวมมัดจำ) = ค่าเช่ารวม - เงินประกันมัดจำ
    const grandTotal = totalRental - depositRate;

    if (rateDisplay) rateDisplay.innerText = `฿${unitRate.toLocaleString()}/วัน`;
    if (daysDisplay) daysDisplay.innerText = `${days} วัน`;
    if (totalRentalDisplay) totalRentalDisplay.innerText = `฿${totalRental.toLocaleString()}`;
    if (depositDisplay) depositDisplay.innerText = `฿${depositRate.toLocaleString()}`;
    if (grandTotalDisplay) {
      grandTotalDisplay.innerText = grandTotal >= 0 ? `฿${grandTotal.toLocaleString()}` : `-฿${Math.abs(grandTotal).toLocaleString()}`;
    }
  },

  saveNewBooking() {
    const eventSelect = document.getElementById('bk-form-event');
    const eventId = eventSelect?.value;
    if (!eventId) {
      window.App.showToast('กรุณาเลือกงานคอนเสิร์ต / อีเวนต์', 'error');
      return;
    }

    const events = LineUpDB.getEvents();
    const selectedEvent = events.find(e => e.id === eventId);

    const customerNickname = document.getElementById('bk-form-cust-nickname').value.trim();
    const customerPhone = document.getElementById('bk-form-cust-phone').value.trim();
    const customerLine = document.getElementById('bk-form-cust-line')?.value.trim() || '-';
    const rentalType = document.getElementById('bk-form-type').value;

    const assignedPhoneId = document.getElementById('bk-form-phone-select')?.value || null;
    const assignedLensId = document.getElementById('bk-form-lens-select')?.value || null;

    if (!customerNickname || !customerPhone) {
      window.App.showToast('กรุณากรอกชื่อเล่นและเบอร์โทรศัพท์ลูกค้า', 'error');
      return;
    }

    if (rentalType === 'phone' && !assignedPhoneId) {
      window.App.showToast('กรุณาเลือกโทรศัพท์มือถือที่ต้องการเช่า', 'error');
      return;
    }
    if (rentalType === 'lens' && !assignedLensId) {
      window.App.showToast('กรุณาเลือกเลนส์ที่ต้องการเช่า', 'error');
      return;
    }
    if (rentalType === 'fullset' && (!assignedPhoneId || !assignedLensId)) {
      window.App.showToast('สำหรับแพ็กเกจครบเซ็ต กรุณาเลือกทั้งโทรศัพท์และเลนส์', 'error');
      return;
    }

    const startDate = document.getElementById('bk-form-start-date').value;
    const endDate = document.getElementById('bk-form-end-date').value;
    const deliveryMethod = document.getElementById('bk-form-delivery-method').value;
    const deliveryAddress = document.getElementById('bk-form-delivery-addr').value.trim();

    if (!startDate || !endDate) {
      window.App.showToast('กรุณาระบุวันที่เริ่มเช่าและวันที่สิ้นสุดการเช่า', 'error');
      return;
    }
    if (startDate > endDate) {
      window.App.showToast('วันที่สิ้นสุดการเช่าต้องไม่น้อยกว่าวันที่เริ่มเช่า', 'error');
      return;
    }

    // Strict Date Availability & Overlap Validation
    // Condition: 1 phone or 1 lens cannot be booked on the same date!
    // But if on different dates (e.g. booked 12/5, then on 13/5 it can be rented), it is allowed!
    if (assignedPhoneId) {
      const phoneCheck = LineUpDB.isDeviceAvailableForDates(assignedPhoneId, startDate, endDate);
      if (!phoneCheck.available) {
        window.App.showToast(`ไม่สามารถจองได้: โทรศัพท์เครื่องนี้ ${phoneCheck.reason} (ไม่สามารถจองซ้ำในวันเดียวกันได้)`, 'error');
        return;
      }
    }

    if (assignedLensId) {
      const lensCheck = LineUpDB.isDeviceAvailableForDates(assignedLensId, startDate, endDate);
      if (!lensCheck.available) {
        window.App.showToast(`ไม่สามารถจองได้: เลนส์เสริมนี้ ${lensCheck.reason} (ไม่สามารถจองซ้ำในวันเดียวกันได้)`, 'error');
        return;
      }
    }

    // Calculate rates
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const days = Math.max(1, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);

    let unitRate = selectedEvent.pricing.fullset;
    if (rentalType === 'phone') unitRate = selectedEvent.pricing.phone;
    if (rentalType === 'lens') unitRate = selectedEvent.pricing.lens;

    const totalRental = unitRate * days;
    const deposit = selectedEvent.pricing.deposit;

    // Get device summary text
    const inventory = LineUpDB.getInventory();
    const phoneObj = inventory.find(i => i.id === assignedPhoneId);
    const lensObj = inventory.find(i => i.id === assignedLensId);

    let summaryNames = [];
    if (phoneObj) summaryNames.push(phoneObj.model);
    if (lensObj) summaryNames.push(lensObj.model);

    const bookings = LineUpDB.getBookings();
    const nextId = `BK-${1000 + bookings.length + 1}`;

    // Check if customer is returning (ลูกค้าเก่า)
    let customers = LineUpDB.getCustomers();
    let matchedCust = customers.find(c => 
      (c.phone && c.phone.replace(/[^0-9]/g, '') === customerPhone.replace(/[^0-9]/g, '')) ||
      (c.nickname && c.nickname.toLowerCase() === customerNickname.toLowerCase())
    );

    const pastBookings = bookings.filter(b =>
      (b.customerPhone && b.customerPhone.replace(/[^0-9]/g, '') === customerPhone.replace(/[^0-9]/g, '')) ||
      (b.customerNickname && b.customerNickname.toLowerCase() === customerNickname.toLowerCase())
    );

    // เงื่อนไข: ถ้าเช่า 1 ครั้ง ไม่มีป้ายสถานะ แต่ถ้าลูกค้าชื่อเดิม ID เดิม เช่าเป็นครั้งที่ 2 เป็นต้นไป ให้ขึ้น ป้ายลูกค้าเก่า
    const isReturning = pastBookings.length >= 1;
    let custId = matchedCust ? matchedCust.id : `CUST-${String(customers.length + 1).padStart(3, '0')}`;

    if (matchedCust) {
      if (isReturning) {
        if (matchedCust.tag !== 'Blacklist' && matchedCust.tag !== 'Caution') {
          matchedCust.tag = 'VIP';
          matchedCust.tagReason = `ลูกค้าเก่า (ประวัติเช่า ${pastBookings.length + 1} ครั้ง)`;
        }
      } else {
        if (matchedCust.tag !== 'Blacklist' && matchedCust.tag !== 'Caution') {
          matchedCust.tag = 'Regular';
          matchedCust.tagReason = '';
        }
      }
      if (customerLine && customerLine !== '-') matchedCust.lineId = customerLine;
      LineUpDB.setCustomers(customers);
    } else {
      customers.push({
        id: custId,
        nickname: customerNickname,
        fullName: customerNickname,
        phone: customerPhone,
        lineId: customerLine || '-',
        socialHandle: '-',
        citizenId: '-',
        idCardVerified: false,
        tag: isReturning ? 'VIP' : 'Regular',
        tagReason: isReturning ? `ลูกค้าเก่า (ประวัติเช่า ${pastBookings.length + 1} ครั้ง)` : '',
        notes: '',
        createdAt: new Date().toISOString().split('T')[0]
      });
      LineUpDB.setCustomers(customers);
    }

    const newBooking = {
      id: nextId,
      customerId: custId,
      customerNickname,
      customerName: customerNickname,
      customerPhone,
      customerLine,
      customerTag: isReturning ? 'VIP' : 'Regular',
      eventId: selectedEvent.id,
      eventName: selectedEvent.name,
      venue: selectedEvent.venue,
      rentalType,
      assignedPhoneId,
      assignedLensId,
      deviceSummary: summaryNames.join(' + '),
      startDate,
      endDate,
      days,
      ratePerDay: unitRate,
      totalRental,
      deposit,
      totalPayable: totalRental - deposit,
      paymentStatus: 'paid',
      deliveryMethod,
      deliveryAddress,
      deliveryStatus: 'pending',
      conditionCheck: {
        beforeDelivery: {
          checked: false,
          checkedAt: null,
          batteryLevel: '100%',
          inspector: 'แอดมิน Line.Up',
          photos: [],
          notes: ''
        },
        afterReturn: {
          checked: false,
          checkedAt: null,
          inspector: null,
          photos: [],
          defectNotes: '',
          hasPenalty: false,
          penaltyAmount: 0
        }
      },
      paymentSlips: {
        bookingSlip: {
          uploaded: false,
          imageUrl: null,
          amount: 0,
          datetime: null,
          note: ''
        },
        closingSlip: {
          uploaded: false,
          imageUrl: null,
          type: 'refund',
          amount: 0,
          datetime: null,
          note: ''
        }
      },
      createdAt: new Date().toISOString().split('T')[0]
    };

    bookings.unshift(newBooking);
    LineUpDB.setBookings(bookings);

    this.closeNewBookingModal();
    if (isReturning) {
      window.App.showToast(`สร้างคิวการจอง ${nextId} (${customerNickname}) สำเร็จ! ตรวจพบลูกค้าเก่า ได้รับป้าย "⭐ ลูกค้าเก่า" (เช่าครั้งที่ ${pastBookings.length + 1})`, 'success');
    } else {
      window.App.showToast(`สร้างคิวการจอง ${nextId} (${customerNickname}) สำเร็จแล้ว!`, 'success');
    }
  },

  // ==============================================================
  // Payment Slips Management (สลิปการจอง & สลิปปิดยอด)
  // ==============================================================
  currentEditingSlipImage: null,

  createSampleSlipSvg(type, amount, bookingId, customerName) {
    const isBooking = type === 'booking';
    const title = isBooking ? 'สลิปการจองคิวเช่าอุปกรณ์' : 'สลิปปิดยอดและคืนเงินมัดจำ';
    const headerBg = isBooking ? '#10b981' : '#8b5cf6';
    const bankName = isBooking ? 'K-Bank Mobile Banking' : 'SCB EASY Transfer';
    const dateStr = new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const refNo = `TXN${Date.now().toString().slice(-8)}`;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 560" width="400" height="560">
      <rect width="400" height="560" rx="24" fill="#ffffff"/>
      <path d="M0 24C0 10.745 10.745 0 24 0h352c13.255 0 24 10.745 24 24v110H0V24z" fill="${headerBg}"/>
      <circle cx="200" cy="70" r="32" fill="#ffffff" opacity="0.2"/>
      <path d="M190 70l7 7 15-15" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <text x="200" y="115" font-family="sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">โอนเงินสำเร็จ • ${bankName}</text>
      
      <text x="200" y="160" font-family="sans-serif" font-size="12" fill="#64748b" text-anchor="middle">${title}</text>
      <text x="200" y="200" font-family="sans-serif" font-size="28" font-weight="bold" fill="#0f172a" text-anchor="middle">฿${Number(amount || 0).toLocaleString()}.00</text>
      
      <line x1="30" y1="225" x2="370" y2="225" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="6,6"/>
      
      <text x="40" y="260" font-family="sans-serif" font-size="11" fill="#64748b">รหัสคิวการจอง:</text>
      <text x="360" y="260" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="end">${bookingId || 'BK-000'}</text>
      
      <text x="40" y="295" font-family="sans-serif" font-size="11" fill="#64748b">ชื่อลูกค้า / ผู้ทำรายการ:</text>
      <text x="360" y="295" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="end">${customerName || 'ลูกค้า Line.Up'}</text>
      
      <text x="40" y="330" font-family="sans-serif" font-size="11" fill="#64748b">บัญชีผู้รับ:</text>
      <text x="360" y="330" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="end">Line.Up Phone Rental</text>
      
      <text x="40" y="365" font-family="sans-serif" font-size="11" fill="#64748b">วัน-เวลาที่ทำรายการ:</text>
      <text x="360" y="365" font-family="sans-serif" font-size="11" font-weight="bold" fill="#334155" text-anchor="end">${dateStr}</text>
      
      <text x="40" y="400" font-family="sans-serif" font-size="11" fill="#64748b">เลขที่อ้างอิง (Ref No.):</text>
      <text x="360" y="400" font-family="monospace" font-size="11" font-weight="bold" fill="#64748b" text-anchor="end">${refNo}</text>

      <rect x="155" y="430" width="90" height="90" rx="8" fill="#f8fafc" stroke="#cbd5e1"/>
      <rect x="165" y="440" width="25" height="25" fill="#0f172a"/>
      <rect x="210" y="440" width="25" height="25" fill="#0f172a"/>
      <rect x="165" y="485" width="25" height="25" fill="#0f172a"/>
      <rect x="171" y="446" width="13" height="13" fill="#f8fafc"/>
      <rect x="216" y="446" width="13" height="13" fill="#f8fafc"/>
      <rect x="171" y="491" width="13" height="13" fill="#f8fafc"/>
      <rect x="200" y="475" width="10" height="10" fill="#0f172a"/>
      <rect x="220" y="480" width="12" height="15" fill="#0f172a"/>
      <text x="200" y="535" font-family="sans-serif" font-size="9" fill="#94a3b8" text-anchor="middle">สแกนตรวจสอบสลิปแท้ (B-Scan QR)</text>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  },

  openBookingSlipModal(bookingId) {
    this.activeBookingId = bookingId;
    const bookings = LineUpDB.getBookings();
    const b = bookings.find(item => item.id === bookingId);
    if (!b) return;

    const modal = document.getElementById('booking-slip-modal');
    if (!modal) return;

    document.getElementById('bk-slip-booking-id').value = b.id;
    document.getElementById('bk-slip-subtitle').innerText = `คิวการจอง: ${b.id} • ลูกค้า: ${b.customerNickname}`;
    document.getElementById('bk-slip-cust-display').innerText = `${b.customerNickname} (เบอร์โทร: ${b.customerPhone})`;
    document.getElementById('bk-slip-event-display').innerText = `${b.eventName} • ${b.deviceSummary}`;
    
    const payable = (b.totalRental || 0) - (b.deposit || 0);
    document.getElementById('bk-slip-payable-display').innerText = `฿${payable.toLocaleString()} (ค่าเช่า ฿${(b.totalRental || 0).toLocaleString()} - มัดจำ ฿${(b.deposit || 0).toLocaleString()})`;

    const existingSlip = b.paymentSlips?.bookingSlip || b.bookingSlip;
    const amountVal = existingSlip?.amount != null ? existingSlip.amount : payable;
    document.getElementById('bk-slip-amount-input').value = amountVal;

    const nowIso = new Date().toISOString().slice(0, 16);
    document.getElementById('bk-slip-datetime-input').value = existingSlip?.datetime || nowIso;
    document.getElementById('bk-slip-notes-input').value = existingSlip?.note || '';

    this.currentEditingSlipImage = existingSlip?.imageUrl || null;
    this.renderSlipImagePreview('booking', this.currentEditingSlipImage);

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  closeBookingSlipModal() {
    const modal = document.getElementById('booking-slip-modal');
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
    this.currentEditingSlipImage = null;
  },

  openClosingSlipModal(bookingId) {
    this.activeBookingId = bookingId;
    const bookings = LineUpDB.getBookings();
    const b = bookings.find(item => item.id === bookingId);
    if (!b) return;

    const modal = document.getElementById('closing-slip-modal');
    if (!modal) return;

    document.getElementById('cl-slip-booking-id').value = b.id;
    document.getElementById('cl-slip-subtitle').innerText = `คิวการจอง: ${b.id} • ลูกค้า: ${b.customerNickname}`;
    document.getElementById('cl-slip-cust-display').innerText = `${b.customerNickname} (เบอร์โทร: ${b.customerPhone})`;
    document.getElementById('cl-slip-deposit-display').innerText = `฿${(b.deposit || 0).toLocaleString()}`;
    
    const statusMap = {
      'pending': '🟡 รอส่งมอบ',
      'delivered': '🛵 ส่งมอบแล้ว (In Use)',
      'returned': '✅ รับคืนเครื่องแล้ว',
      'cancelled': '❌ ยกเลิก'
    };
    document.getElementById('cl-slip-status-display').innerText = statusMap[b.deliveryStatus] || b.deliveryStatus;

    const existingSlip = b.paymentSlips?.closingSlip || b.closingSlip;
    const amountVal = existingSlip?.amount != null ? existingSlip.amount : (b.deposit || 2000);
    document.getElementById('cl-slip-amount-input').value = amountVal;

    const nowIso = new Date().toISOString().slice(0, 16);
    document.getElementById('cl-slip-datetime-input').value = existingSlip?.datetime || nowIso;
    document.getElementById('cl-slip-notes-input').value = existingSlip?.note || '';
    if (existingSlip?.type) {
      document.getElementById('cl-slip-type-select').value = existingSlip.type;
    }

    this.currentEditingSlipImage = existingSlip?.imageUrl || null;
    this.renderSlipImagePreview('closing', this.currentEditingSlipImage);

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  closeClosingSlipModal() {
    const modal = document.getElementById('closing-slip-modal');
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
    this.currentEditingSlipImage = null;
  },

  handleSlipFileSelected(type, inputEl) {
    const file = inputEl.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      window.App.showToast('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WebP)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.currentEditingSlipImage = e.target.result;
      this.renderSlipImagePreview(type, this.currentEditingSlipImage);
      window.App.showToast('เลือกไฟล์รูปภาพสลิปเรียบร้อยแล้ว กด "บันทึกสลิป" เพื่อยืนยัน', 'success');
    };
    reader.readAsDataURL(file);
    inputEl.value = '';
  },

  generateAndSetSampleSlip(type) {
    const bookings = LineUpDB.getBookings();
    const b = bookings.find(item => item.id === this.activeBookingId) || {};
    const amount = type === 'booking' ? 
      ((b.totalRental || 0) - (b.deposit || 0)) : (b.deposit || 2000);

    const sampleDataUrl = this.createSampleSlipSvg(type, amount, b.id || 'BK-1001', b.customerNickname || 'น้องมายด์');
    this.currentEditingSlipImage = sampleDataUrl;
    this.renderSlipImagePreview(type, sampleDataUrl);
    window.App.showToast('สร้างรูปภาพสลิปตัวอย่างเรียบร้อยแล้ว กด "บันทึกสลิป" เพื่อบันทึก', 'info');
  },

  removeSlipImage(type) {
    this.currentEditingSlipImage = null;
    this.renderSlipImagePreview(type, null);
    window.App.showToast('ลบรูปภาพสลิปเรียบร้อยแล้ว', 'info');
  },

  renderSlipImagePreview(type, imageUrl) {
    const containerId = type === 'booking' ? 'bk-slip-preview-container' : 'cl-slip-preview-container';
    const removeBtnId = type === 'booking' ? 'bk-slip-remove-btn' : 'cl-slip-remove-btn';
    const container = document.getElementById(containerId);
    const removeBtn = document.getElementById(removeBtnId);

    if (!container) return;

    if (imageUrl) {
      container.innerHTML = `
        <div class="relative max-h-72 w-full flex flex-col items-center justify-center">
          <img src="${imageUrl}" class="max-h-64 object-contain rounded-xl shadow-md border border-slate-200 cursor-pointer" alt="สลิป" onclick="BookingsModule.openSlipPreviewDirect('${imageUrl}')" title="คลิกเพื่อขยายดูรูปขนาดเต็ม">
          <div class="mt-2 flex items-center gap-2">
            <span class="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
              ✓ รูปภาพสลิปพร้อมบันทึก
            </span>
            <button type="button" onclick="BookingsModule.openSlipPreviewDirect('${imageUrl}')" class="text-[11px] text-blue-600 hover:underline">
              🔍 ดูรูปขนาดเต็ม
            </button>
          </div>
        </div>
      `;
      removeBtn?.classList.remove('hidden');
    } else {
      const isBooking = type === 'booking';
      container.innerHTML = `
        <span class="text-3xl mb-1">${isBooking ? '🧾' : '💳'}</span>
        <p class="text-xs font-semibold ${isBooking ? 'text-emerald-800' : 'text-purple-900'}">
          ยังไม่ได้อัปโหลดรูปภาพสลิป${isBooking ? 'การจอง' : 'ปิดยอด'}
        </p>
        <p class="text-[11px] text-slate-400 mt-0.5">
          กดปุ่มด้านล่างเพื่ออัปโหลดไฟล์รูปภาพจากเครื่อง หรือใช้รูปตัวอย่าง
        </p>
      `;
      removeBtn?.classList.add('hidden');
    }
  },

  async saveBookingSlip() {
    const bookingId = document.getElementById('bk-slip-booking-id')?.value || this.activeBookingId;
    const bookings = LineUpDB.getBookings();
    const b = bookings.find(item => item.id === bookingId);
    if (!b) return;

    if (!this.currentEditingSlipImage) {
      window.App.showToast('กรุณาอัปโหลดรูปภาพสลิปการจอง หรือกดปุ่ม "ใช้สลิปตัวอย่าง"', 'error');
      return;
    }

    const amount = parseFloat(document.getElementById('bk-slip-amount-input').value) || 0;
    const datetime = document.getElementById('bk-slip-datetime-input').value;
    const note = document.getElementById('bk-slip-notes-input').value.trim();

    let finalImageUrl = this.currentEditingSlipImage;
    if (window.GoogleSheetsSync && GoogleSheetsSync.scriptUrl && this.currentEditingSlipImage.startsWith('data:image/')) {
      window.App.showToast('กำลังอัปโหลดสลิปการจองเข้าโฟลเดอร์ LineUp_Slips1...', 'info');
      const uploadRes = await GoogleSheetsSync.uploadImageToDrive(this.currentEditingSlipImage, `slip_booking_${bookingId}.jpg`, 'LineUp_Slips1');
      if (uploadRes && uploadRes.fileUrl) {
        finalImageUrl = uploadRes.fileUrl;
      }
    }

    b.paymentSlips = b.paymentSlips || {};
    b.paymentSlips.bookingSlip = {
      uploaded: true,
      imageUrl: finalImageUrl,
      amount,
      datetime,
      note,
      updatedAt: new Date().toISOString()
    };

    LineUpDB.setBookings(bookings);
    this.closeBookingSlipModal();
    window.App.showToast(`บันทึกสลิปการจองของคิว ${bookingId} (${b.customerNickname}) เรียบร้อยแล้ว! 🧾`, 'success');
  },

  async saveClosingSlip() {
    const bookingId = document.getElementById('cl-slip-booking-id')?.value || this.activeBookingId;
    const bookings = LineUpDB.getBookings();
    const b = bookings.find(item => item.id === bookingId);
    if (!b) return;

    if (!this.currentEditingSlipImage) {
      window.App.showToast('กรุณาอัปโหลดรูปภาพสลิปปิดยอด หรือกดปุ่ม "ใช้สลิปตัวอย่าง"', 'error');
      return;
    }

    const type = document.getElementById('cl-slip-type-select').value;
    const amount = parseFloat(document.getElementById('cl-slip-amount-input').value) || 0;
    const datetime = document.getElementById('cl-slip-datetime-input').value;
    const note = document.getElementById('cl-slip-notes-input').value.trim();

    let finalImageUrl = this.currentEditingSlipImage;
    if (window.GoogleSheetsSync && GoogleSheetsSync.scriptUrl && this.currentEditingSlipImage.startsWith('data:image/')) {
      window.App.showToast('กำลังอัปโหลดสลิปปิดยอดเข้าโฟลเดอร์ LineUp_Slips2...', 'info');
      const uploadRes = await GoogleSheetsSync.uploadImageToDrive(this.currentEditingSlipImage, `slip_closing_${bookingId}.jpg`, 'LineUp_Slips2');
      if (uploadRes && uploadRes.fileUrl) {
        finalImageUrl = uploadRes.fileUrl;
      }
    }

    b.paymentSlips = b.paymentSlips || {};
    b.paymentSlips.closingSlip = {
      uploaded: true,
      imageUrl: finalImageUrl,
      type,
      amount,
      datetime,
      note,
      updatedAt: new Date().toISOString()
    };

    LineUpDB.setBookings(bookings);
    this.closeClosingSlipModal();
    window.App.showToast(`บันทึกสลิปปิดยอดของคิว ${bookingId} (${b.customerNickname}) เรียบร้อยแล้ว! 💳`, 'success');
  },

  openSlipPreviewModal(bookingId, type) {
    const bookings = LineUpDB.getBookings();
    const b = bookings.find(item => item.id === bookingId);
    if (!b) return;

    const slip = type === 'booking' ? 
      (b.paymentSlips?.bookingSlip || b.bookingSlip) : 
      (b.paymentSlips?.closingSlip || b.closingSlip);

    if (!slip || !slip.imageUrl) {
      window.App.showToast(`คิว ${bookingId} ยังไม่มีการอัปโหลดรูปสลิป${type === 'booking' ? 'การจอง' : 'ปิดยอด'}`, 'warning');
      return;
    }

    const titleEl = document.getElementById('slip-preview-title');
    const imgEl = document.getElementById('slip-preview-img');
    const infoEl = document.getElementById('slip-preview-info');
    const modal = document.getElementById('slip-preview-modal');

    if (titleEl) {
      titleEl.innerText = `${type === 'booking' ? '🧾 สลิปการจอง' : '💳 สลิปปิดยอด'}: คิว ${b.id} (${b.customerNickname})`;
    }
    if (imgEl) {
      imgEl.src = slip.imageUrl;
    }
    if (infoEl) {
      infoEl.innerText = `ยอดเงิน: ฿${(slip.amount || 0).toLocaleString()} • วันที่: ${slip.datetime ? new Date(slip.datetime).toLocaleString('th-TH') : '-'} ${slip.note ? `• ${slip.note}` : ''}`;
    }

    modal?.classList.remove('hidden');
    modal?.classList.add('flex');
  },

  openSlipPreviewDirect(imageUrl) {
    const imgEl = document.getElementById('slip-preview-img');
    const titleEl = document.getElementById('slip-preview-title');
    const infoEl = document.getElementById('slip-preview-info');
    const modal = document.getElementById('slip-preview-modal');

    if (titleEl) titleEl.innerText = 'รูปภาพสลิปหลักฐานการชำระเงิน';
    if (imgEl) imgEl.src = imageUrl;
    if (infoEl) infoEl.innerText = 'หลักฐานการโอนเงิน Line.Up Phone Rental';

    modal?.classList.remove('hidden');
    modal?.classList.add('flex');
  },

  closeSlipPreviewModal() {
    const modal = document.getElementById('slip-preview-modal');
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
  },

  // Condition Inspection Modal
  openInspectionModal(bookingId) {
    this.activeBookingId = bookingId;
    const bookings = LineUpDB.getBookings();
    const b = bookings.find(item => item.id === bookingId);
    if (!b) return;

    const modal = document.getElementById('inspection-modal');
    const headerTitle = document.getElementById('inspection-modal-title');
    if (!modal) return;

    if (headerTitle) {
      headerTitle.innerText = `ระบบตรวจสภาพอุปกรณ์: คิว ${b.id} (${b.customerNickname})`;
    }

    const before = b.conditionCheck?.beforeDelivery || {};
    const after = b.conditionCheck?.afterReturn || {};

    // Populate Before Delivery
    document.getElementById('insp-before-checked').checked = !!before.checked;
    document.getElementById('insp-before-inspector').value = before.inspector || 'แอดมิน Line.Up';
    document.getElementById('insp-before-battery').value = before.batteryLevel || '100%';
    document.getElementById('insp-before-notes').value = before.notes || '';
    this.renderInspectionPhotoList('insp-before-photos-container', before.photos || []);

    // Populate After Return
    document.getElementById('insp-after-checked').checked = !!after.checked;
    document.getElementById('insp-after-inspector').value = after.inspector || 'แอดมิน Line.Up';
    document.getElementById('insp-after-penalty').value = after.penaltyAmount || 0;
    document.getElementById('insp-after-notes').value = after.defectNotes || '';
    this.renderInspectionPhotoList('insp-after-photos-container', after.photos || []);

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  renderInspectionPhotoList(containerId, photos) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!photos || photos.length === 0) {
      container.innerHTML = `<span class="text-xs text-slate-400 italic">ยังไม่มีรูปถ่าย</span>`;
      return;
    }

    container.innerHTML = photos.map((imgUrl, idx) => `
      <div class="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-300 shrink-0">
        <img src="${imgUrl}" class="w-full h-full object-cover" alt="สภาพเครื่อง">
        <button type="button" onclick="BookingsModule.removeInspectionPhoto('${containerId}', ${idx})" class="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          ×
        </button>
      </div>
    `).join('');
  },

  triggerPhotoUpload(type) {
    // Hidden file input or preset selector
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const containerId = type === 'before' ? 'insp-before-photos-container' : 'insp-after-photos-container';
          this.addPhotoToInspection(containerId, event.target.result);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  },

  addSamplePhoto(type) {
    const samples = [
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=60"
    ];
    const picked = samples[Math.floor(Math.random() * samples.length)];
    const containerId = type === 'before' ? 'insp-before-photos-container' : 'insp-after-photos-container';
    this.addPhotoToInspection(containerId, picked);
  },

  addPhotoToInspection(containerId, dataUrl) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const existingImgs = Array.from(container.querySelectorAll('img')).map(i => i.src);
    existingImgs.push(dataUrl);
    this.renderInspectionPhotoList(containerId, existingImgs);
  },

  removeInspectionPhoto(containerId, index) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const existingImgs = Array.from(container.querySelectorAll('img')).map(i => i.src);
    existingImgs.splice(index, 1);
    this.renderInspectionPhotoList(containerId, existingImgs);
  },

  closeInspectionModal() {
    const modal = document.getElementById('inspection-modal');
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
    this.activeBookingId = null;
  },

  saveInspection() {
    if (!this.activeBookingId) return;
    const bookings = LineUpDB.getBookings();
    const b = bookings.find(item => item.id === this.activeBookingId);
    if (!b) return;

    const beforePhotos = Array.from(document.querySelectorAll('#insp-before-photos-container img')).map(i => i.src);
    const afterPhotos = Array.from(document.querySelectorAll('#insp-after-photos-container img')).map(i => i.src);

    const beforeChecked = document.getElementById('insp-before-checked').checked;
    const afterChecked = document.getElementById('insp-after-checked').checked;
    const penalty = parseFloat(document.getElementById('insp-after-penalty').value || 0);

    b.conditionCheck = {
      beforeDelivery: {
        checked: beforeChecked,
        checkedAt: beforeChecked ? (b.conditionCheck?.beforeDelivery?.checkedAt || new Date().toLocaleString('th-TH')) : null,
        inspector: document.getElementById('insp-before-inspector').value.trim(),
        batteryLevel: document.getElementById('insp-before-battery').value.trim(),
        notes: document.getElementById('insp-before-notes').value.trim(),
        photos: beforePhotos
      },
      afterReturn: {
        checked: afterChecked,
        checkedAt: afterChecked ? (b.conditionCheck?.afterReturn?.checkedAt || new Date().toLocaleString('th-TH')) : null,
        inspector: document.getElementById('insp-after-inspector').value.trim(),
        defectNotes: document.getElementById('insp-after-notes').value.trim(),
        hasPenalty: penalty > 0,
        penaltyAmount: penalty,
        photos: afterPhotos
      }
    };

    LineUpDB.setBookings(bookings);
    this.closeInspectionModal();
    window.App.showToast(`บันทึกผลการตรวจสภาพเครื่องของคิว ${b.id} สำเร็จ!`, 'success');
  },

  // Dynamic Event Pricing Master Modal
  openEventPricingModal() {
    const modal = document.getElementById('event-pricing-modal');
    this.renderEventPricingList();
    modal?.classList.remove('hidden');
    modal?.classList.add('flex');
  },

  closeEventPricingModal() {
    const modal = document.getElementById('event-pricing-modal');
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
  },

  renderEventPricingList() {
    const container = document.getElementById('event-pricing-list');
    if (!container) return;

    const events = LineUpDB.getEvents();

    let html = events.map(e => `
      <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span class="w-3 h-3 rounded-full" style="background-color: ${e.color || '#3ec29e'}"></span>
              ${e.name}
            </h4>
            <p class="text-xs text-slate-500 mt-0.5">🏟️ ${e.venue} | 📅 ${e.startDate} ถึง ${e.endDate}</p>
          </div>
          <button onclick="BookingsModule.deleteEvent('${e.id}')" class="text-xs text-rose-500 hover:text-rose-700 p-1" title="ลบอีเวนต์">
            ลบ
          </button>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200/60 text-xs">
          <div>
            <label class="text-[10px] text-slate-500 font-semibold block">📱 เรทมือถือ/วัน (THB)</label>
            <input type="number" id="ev-price-phone-${e.id}" value="${e.pricing.phone}" class="w-full mt-0.5 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-slate-700 text-xs">
          </div>
          <div>
            <label class="text-[10px] text-slate-500 font-semibold block">📷 เรทเลนส์/วัน (THB)</label>
            <input type="number" id="ev-price-lens-${e.id}" value="${e.pricing.lens}" class="w-full mt-0.5 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-slate-700 text-xs">
          </div>
          <div>
            <label class="text-[10px] text-slate-500 font-semibold block">✨ เรทครบเซ็ต/วัน (THB)</label>
            <input type="number" id="ev-price-fullset-${e.id}" value="${e.pricing.fullset}" class="w-full mt-0.5 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-pink-600 text-xs">
          </div>
          <div>
            <label class="text-[10px] text-slate-500 font-semibold block">🔒 เงินมัดจำ (THB)</label>
            <input type="number" id="ev-price-deposit-${e.id}" value="${e.pricing.deposit}" class="w-full mt-0.5 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-slate-700 text-xs">
          </div>
        </div>

        <div class="text-right pt-1">
          <button onclick="BookingsModule.saveSingleEventPricing('${e.id}')" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors">
            บันทึกราคาใหม่
          </button>
        </div>
      </div>
    `).join('');

    container.innerHTML = html;
  },

  saveSingleEventPricing(eventId) {
    const events = LineUpDB.getEvents();
    const ev = events.find(e => e.id === eventId);
    if (!ev) return;

    const phoneRate = parseFloat(document.getElementById(`ev-price-phone-${eventId}`).value || 0);
    const lensRate = parseFloat(document.getElementById(`ev-price-lens-${eventId}`).value || 0);
    const fullsetRate = parseFloat(document.getElementById(`ev-price-fullset-${eventId}`).value || 0);
    const depositRate = parseFloat(document.getElementById(`ev-price-deposit-${eventId}`).value || 2000);

    ev.pricing = {
      phone: phoneRate,
      lens: lensRate,
      fullset: fullsetRate,
      deposit: depositRate
    };

    LineUpDB.setEvents(events);
    window.App.showToast(`อัปเดตเรทราคาของงาน "${ev.name}" สำเร็จ!`, 'success');
  },

  addNewEvent() {
    const name = document.getElementById('new-ev-name').value.trim();
    const venue = document.getElementById('new-ev-venue').value.trim();
    const start = document.getElementById('new-ev-start').value;
    const end = document.getElementById('new-ev-end').value;
    const phone = parseFloat(document.getElementById('new-ev-phone').value || 1500);
    const lens = parseFloat(document.getElementById('new-ev-lens').value || 400);
    const fullset = parseFloat(document.getElementById('new-ev-fullset').value || 1800);
    const deposit = parseFloat(document.getElementById('new-ev-deposit').value || 2000);

    if (!name || !venue || !start || !end) {
      window.App.showToast('กรุณากรอกข้อมูลคอนเสิร์ตและวันที่ให้ครบถ้วน', 'error');
      return;
    }

    const events = LineUpDB.getEvents();
    const newId = `EV-${String(events.length + 1).padStart(2, '0')}`;
    const colors = ['#ff7b9d', '#3ec29e', '#ffd53d', '#ff9f43', '#a55eea', '#2bcbba', '#45aaf2'];
    const color = colors[events.length % colors.length];

    events.push({
      id: newId,
      name,
      venue,
      startDate: start,
      endDate: end,
      color,
      pricing: { phone, lens, fullset, deposit },
      notes: ''
    });

    LineUpDB.setEvents(events);
    document.getElementById('new-event-form').reset();
    this.renderEventPricingList();
    window.App.showToast(`เพิ่มอีเวนต์ใหม่ "${name}" พร้อมกำหนดเรทราคาสำเร็จ!`, 'success');
  },

  deleteEvent(eventId) {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบอีเวนต์นี้ออกจากระบบ?')) {
      const events = LineUpDB.getEvents().filter(e => e.id !== eventId);
      LineUpDB.setEvents(events);
      this.renderEventPricingList();
      window.App.showToast('ลบอีเวนต์เรียบร้อยแล้ว', 'info');
    }
  }
};

window.BookingsModule = BookingsModule;
