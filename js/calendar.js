/**
 * Line.Up Phone Rental Service - Calendar & Dashboard Module
 * Interactive Month and Year view calendar, concert schedules, and booked device tracking.
 */

const CalendarModule = {
  currentDate: new Date(2026, 10, 4), // Set default to November 2026 to showcase the scheduled concerts
  viewMode: 'month', // 'month' or 'year'
  selectedDate: null,

  init() {
    this.renderKPIs();
    this.render();
    this.bindEvents();

    window.addEventListener('lineup:bookings-updated', () => {
      this.renderKPIs();
      this.render();
    });
    window.addEventListener('lineup:events-updated', () => {
      this.render();
    });
    window.addEventListener('lineup:inventory-updated', () => {
      this.renderKPIs();
      this.render();
    });
  },

  bindEvents() {
    document.getElementById('cal-prev-btn')?.addEventListener('click', () => {
      if (this.viewMode === 'month') {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      } else {
        this.currentDate.setFullYear(this.currentDate.getFullYear() - 1);
      }
      this.render();
    });

    document.getElementById('cal-next-btn')?.addEventListener('click', () => {
      if (this.viewMode === 'month') {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      } else {
        this.currentDate.setFullYear(this.currentDate.getFullYear() + 1);
      }
      this.render();
    });

    document.getElementById('cal-today-btn')?.addEventListener('click', () => {
      this.currentDate = new Date(2026, 10, 4);
      this.render();
    });

    document.getElementById('cal-view-month-btn')?.addEventListener('click', () => {
      this.viewMode = 'month';
      this.updateViewButtons();
      this.render();
    });

    document.getElementById('cal-view-year-btn')?.addEventListener('click', () => {
      this.viewMode = 'year';
      this.updateViewButtons();
      this.render();
    });
  },

  updateViewButtons() {
    const monthBtn = document.getElementById('cal-view-month-btn');
    const yearBtn = document.getElementById('cal-view-year-btn');
    if (this.viewMode === 'month') {
      monthBtn?.classList.add('bg-white', 'text-slate-800', 'shadow-sm');
      monthBtn?.classList.remove('text-slate-600');
      yearBtn?.classList.remove('bg-white', 'text-slate-800', 'shadow-sm');
      yearBtn?.classList.add('text-slate-600');
    } else {
      yearBtn?.classList.add('bg-white', 'text-slate-800', 'shadow-sm');
      yearBtn?.classList.remove('text-slate-600');
      monthBtn?.classList.remove('bg-white', 'text-slate-800', 'shadow-sm');
      monthBtn?.classList.add('text-slate-600');
    }
  },

  renderKPIs() {
    const inventory = LineUpDB.getInventory();
    const bookings = LineUpDB.getBookings();

    const activeRentals = bookings.filter(b => b.deliveryStatus === 'pending' || b.deliveryStatus === 'delivered');
    const availablePhones = inventory.filter(i => i.category === 'phone' && i.status !== 'maintenance' && LineUpDB.getDeviceDynamicStatus(i.id) === 'available').length;
    const availableLenses = inventory.filter(i => i.category === 'lens' && i.status !== 'maintenance' && LineUpDB.getDeviceDynamicStatus(i.id) === 'available').length;
    const totalInventoryCount = inventory.length;

    // Monthly revenue for current active calendar month
    const curYear = this.currentDate.getFullYear();
    const curMonth = this.currentDate.getMonth();
    const monthBookings = bookings.filter(b => {
      const d = new Date(b.startDate);
      return d.getFullYear() === curYear && d.getMonth() === curMonth;
    });
    const monthlyTotal = monthBookings.reduce((sum, b) => sum + (b.totalRental || 0), 0);

    const activeCardEl = document.getElementById('kpi-active-rentals');
    if (activeCardEl) activeCardEl.innerText = activeRentals.length;

    const availablePhonesEl = document.getElementById('kpi-available-phones');
    if (availablePhonesEl) availablePhonesEl.innerText = availablePhones;

    const availableLensesEl = document.getElementById('kpi-available-lenses');
    if (availableLensesEl) availableLensesEl.innerText = availableLenses;

    const totalStockEl = document.getElementById('kpi-total-inventory');
    if (totalStockEl) totalStockEl.innerText = totalInventoryCount;

    const monthlyRevenueEl = document.getElementById('kpi-monthly-revenue');
    if (monthlyRevenueEl) monthlyRevenueEl.innerText = '฿' + monthlyTotal.toLocaleString();
  },

  render() {
    const titleEl = document.getElementById('cal-title-display');
    const monthNamesThai = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    if (this.viewMode === 'month') {
      if (titleEl) {
        titleEl.innerHTML = `<span class="font-bold text-slate-800">${monthNamesThai[this.currentDate.getMonth()]}</span> <span class="text-emerald-600 font-semibold">${this.currentDate.getFullYear() + 543}</span> <span class="text-xs text-slate-400 font-normal">(${this.currentDate.getFullYear()})</span>`;
      }
      this.renderMonthView();
    } else {
      if (titleEl) {
        titleEl.innerHTML = `<span class="font-bold text-slate-800">ภาพรวมรายปี พ.ศ.</span> <span class="text-emerald-600 font-semibold">${this.currentDate.getFullYear() + 543}</span> <span class="text-xs text-slate-400 font-normal">(${this.currentDate.getFullYear()})</span>`;
      }
      this.renderYearView();
    }
  },

  renderMonthView() {
    const container = document.getElementById('calendar-grid-container');
    if (!container) return;

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const events = LineUpDB.getEvents();
    const bookings = LineUpDB.getBookings();
    const inventory = LineUpDB.getInventory();

    const invMap = {};
    inventory.forEach(i => invMap[i.id] = i);

    let html = `
      <div class="grid grid-cols-7 gap-px bg-slate-200 rounded-xl overflow-hidden shadow-sm border border-slate-200">
        <!-- Weekday Headers -->
        <div class="bg-rose-50/80 text-rose-600 py-2.5 text-center text-xs font-bold uppercase tracking-wider">อาทิตย์ (Sun)</div>
        <div class="bg-slate-50 text-slate-600 py-2.5 text-center text-xs font-bold uppercase tracking-wider">จันทร์ (Mon)</div>
        <div class="bg-slate-50 text-slate-600 py-2.5 text-center text-xs font-bold uppercase tracking-wider">อังคาร (Tue)</div>
        <div class="bg-slate-50 text-slate-600 py-2.5 text-center text-xs font-bold uppercase tracking-wider">พุธ (Wed)</div>
        <div class="bg-slate-50 text-slate-600 py-2.5 text-center text-xs font-bold uppercase tracking-wider">พฤหัสฯ (Thu)</div>
        <div class="bg-slate-50 text-slate-600 py-2.5 text-center text-xs font-bold uppercase tracking-wider">ศุกร์ (Fri)</div>
        <div class="bg-amber-50/80 text-amber-700 py-2.5 text-center text-xs font-bold uppercase tracking-wider">เสาร์ (Sat)</div>
    `;

    // Days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      html += `
        <div class="bg-slate-50/60 p-2 min-h-[115px] opacity-40 select-none">
          <span class="text-xs font-medium text-slate-400">${dayNum}</span>
        </div>
      `;
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = (year === 2026 && month === 10 && day === 4);

      // Check events happening on this date
      const matchedEvents = events.filter(e => {
        return dateStr >= e.startDate && dateStr <= e.endDate;
      });

      // Check bookings active on this date
      const matchedBookings = bookings.filter(b => {
        return dateStr >= b.startDate && dateStr <= b.endDate && b.deliveryStatus !== 'cancelled';
      });

      html += `
        <div class="bg-white p-2 min-h-[120px] calendar-day-cell flex flex-col justify-between cursor-pointer hover:bg-emerald-50/40 relative group" onclick="CalendarModule.openDayDetailsModal('${dateStr}')">
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-bold ${isToday ? 'bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-sm' : 'text-slate-700'}">
                ${day}
              </span>
              ${matchedBookings.length > 0 ? `
                <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  จอง ${matchedBookings.length} คิว
                </span>
              ` : ''}
            </div>

            <!-- Event Tags -->
            <div class="space-y-1 mb-1.5">
              ${matchedEvents.map(e => `
                <div class="text-[10px] font-semibold px-1.5 py-0.5 rounded-md truncate flex items-center gap-1 shadow-2xs border" 
                     style="background-color: ${e.color}15; border-color: ${e.color}50; color: ${e.color};">
                  <span class="w-1.5 h-1.5 rounded-full shrink-0" style="background-color: ${e.color}"></span>
                  <span class="truncate">${e.name.split(':')[0]}</span>
                </div>
              `).join('')}
            </div>

            <!-- Booked Equipment Pills -->
            <div class="space-y-1">
              ${matchedBookings.slice(0, 3).map(b => {
                let badgeIcon = '📱';
                let shortModel = b.deviceSummary || 'อุปกรณ์';
                if (b.rentalType === 'lens') badgeIcon = '📷';
                if (b.rentalType === 'fullset') badgeIcon = '✨';

                return `
                  <div class="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 truncate flex items-center gap-1">
                    <span class="shrink-0">${badgeIcon}</span>
                    <span class="font-medium text-emerald-700 truncate">${b.customerNickname}:</span>
                    <span class="text-slate-500 truncate">${shortModel}</span>
                  </div>
                `;
              }).join('')}
              ${matchedBookings.length > 3 ? `
                <div class="text-[9px] font-bold text-slate-400 pl-1">
                  + อีก ${matchedBookings.length - 3} เครื่อง
                </div>
              ` : ''}
            </div>
          </div>

          <div class="text-right pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span class="text-[10px] text-emerald-600 font-semibold underline">ดูคิวทั้งหมด →</span>
          </div>
        </div>
      `;
    }

    // Days from next month to fill grid
    const totalCells = firstDayIndex + daysInMonth;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let day = 1; day <= remainingCells; day++) {
      html += `
        <div class="bg-slate-50/60 p-2 min-h-[115px] opacity-40 select-none">
          <span class="text-xs font-medium text-slate-400">${day}</span>
        </div>
      `;
    }

    html += `</div>`;
    container.innerHTML = html;
  },

  renderYearView() {
    const container = document.getElementById('calendar-grid-container');
    if (!container) return;

    const year = this.currentDate.getFullYear();
    const monthNamesThai = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    const events = LineUpDB.getEvents();
    const bookings = LineUpDB.getBookings();

    let html = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">`;

    for (let m = 0; m < 12; m++) {
      const firstDay = new Date(year, m, 1).getDay();
      const daysCount = new Date(year, m + 1, 0).getDate();

      // Find events in this month
      const monthPrefix = `${year}-${String(m + 1).padStart(2, '0')}`;
      const monthEvents = events.filter(e => e.startDate.startsWith(monthPrefix) || e.endDate.startsWith(monthPrefix));
      const monthBookings = bookings.filter(b => (b.startDate.startsWith(monthPrefix) || b.endDate.startsWith(monthPrefix)) && b.deliveryStatus !== 'cancelled');

      html += `
        <div class="bg-white rounded-xl border border-slate-200 p-3 shadow-xs hover:border-emerald-400 transition-all cursor-pointer" onclick="CalendarModule.jumpToMonth(${m})">
          <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <h4 class="font-bold text-slate-800 text-sm">${monthNamesThai[m]}</h4>
            <div class="flex items-center gap-1">
              ${monthEvents.length > 0 ? `<span class="w-2 h-2 rounded-full bg-pink-500" title="${monthEvents.length} คอนเสิร์ต"></span>` : ''}
              <span class="text-xs font-semibold text-emerald-600">${monthBookings.length} คิว</span>
            </div>
          </div>

          <div class="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-400 font-semibold mb-1">
            <span class="text-rose-400">อา</span><span>จ</span><span>อ</span><span>พ</span><span>พฤ</span><span>ศ</span><span class="text-amber-500">ส</span>
          </div>

          <div class="grid grid-cols-7 gap-1 text-center text-[10px]">
      `;

      // Empty days before 1st
      for (let i = 0; i < firstDay; i++) {
        html += `<span class="text-slate-200">·</span>`;
      }

      // Month days
      for (let d = 1; d <= daysCount; d++) {
        const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const hasEvent = events.some(e => dateStr >= e.startDate && dateStr <= e.endDate);
        const hasBookings = bookings.some(b => dateStr >= b.startDate && dateStr <= b.endDate && b.deliveryStatus !== 'cancelled');

        let cellClass = "text-slate-600 rounded-sm py-0.5";
        if (hasEvent && hasBookings) {
          cellClass = "bg-rose-500 text-white font-bold rounded shadow-2xs";
        } else if (hasEvent) {
          cellClass = "bg-pink-100 text-pink-700 font-semibold rounded";
        } else if (hasBookings) {
          cellClass = "bg-emerald-100 text-emerald-800 font-semibold rounded";
        }

        html += `<span class="${cellClass}">${d}</span>`;
      }

      html += `
          </div>

          ${monthEvents.length > 0 ? `
            <div class="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-500 space-y-0.5">
              ${monthEvents.slice(0, 2).map(e => `
                <div class="truncate text-pink-600 font-medium flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0"></span>
                  <span class="truncate">${e.name}</span>
                </div>
              `).join('')}
              ${monthEvents.length > 2 ? `<div class="text-[9px] text-slate-400">+ อีก ${monthEvents.length - 2} งาน</div>` : ''}
            </div>
          ` : `
            <div class="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-400 italic">ไม่มีอีเวนต์ใหญ่</div>
          `}
        </div>
      `;
    }

    html += `</div>`;
    container.innerHTML = html;
  },

  jumpToMonth(monthIndex) {
    this.currentDate.setMonth(monthIndex);
    this.viewMode = 'month';
    this.updateViewButtons();
    this.render();
  },

  openDayDetailsModal(dateStr) {
    this.selectedDate = dateStr;
    const events = LineUpDB.getEvents().filter(e => dateStr >= e.startDate && dateStr <= e.endDate);
    const bookings = LineUpDB.getBookings().filter(b => dateStr >= b.startDate && dateStr <= b.endDate && b.deliveryStatus !== 'cancelled');

    const modal = document.getElementById('day-details-modal');
    const titleEl = document.getElementById('day-modal-title');
    const contentEl = document.getElementById('day-modal-content');

    const dateObj = new Date(dateStr);
    const dateFormatted = dateObj.toLocaleDateString('th-TH', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    if (titleEl) {
      titleEl.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="p-2 rounded-xl bg-emerald-100 text-emerald-700">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          </span>
          <div>
            <h3 class="font-bold text-slate-800 text-lg">รายละเอียดประจำวัน</h3>
            <p class="text-xs text-slate-500 font-medium">${dateFormatted}</p>
          </div>
        </div>
      `;
    }

    let html = `
      <div class="space-y-4">
        <!-- Event Section -->
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <svg class="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"></path></svg>
            งานคอนเสิร์ต / อีเวนต์ในวันนี้ (${events.length})
          </h4>
          ${events.length === 0 ? `
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 text-center">
              ไม่มีคอนเสิร์ตกำหนดไว้ในวันนี้
            </div>
          ` : `
            <div class="space-y-2">
              ${events.map(e => `
                <div class="p-3 rounded-xl border border-pink-200 bg-pink-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div class="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <span class="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                      ${e.name}
                    </div>
                    <div class="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                      สถานที่: <span class="font-medium text-slate-700">${e.venue}</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 text-xs">
                    <span class="px-2 py-1 rounded bg-white border border-pink-200 font-semibold text-pink-700">
                      เรทมือถือ ฿${e.pricing.phone.toLocaleString()}/วัน
                    </span>
                    <span class="px-2 py-1 rounded bg-white border border-pink-200 font-semibold text-pink-700">
                      ครบเซ็ต ฿${e.pricing.fullset.toLocaleString()}/วัน
                    </span>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Booked Equipments Section -->
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
            อุปกรณ์ที่ถูกจองไปแล้วในวันนี้ (${bookings.length} รายการ)
          </h4>
          ${bookings.length === 0 ? `
            <div class="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
              ยังไม่มีการจองอุปกรณ์ในวันนี้ เครื่องทุกรุ่นยังว่างพร้อมรับจอง
            </div>
          ` : `
            <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
              ${bookings.map(b => {
                const statusMap = {
                  'pending': { text: 'รอส่งมอบ', bg: 'bg-amber-100 text-amber-800' },
                  'delivered': { text: 'ส่งมอบแล้ว (กำลังเช่า)', bg: 'bg-blue-100 text-blue-800' },
                  'returned': { text: 'รับคืนแล้ว', bg: 'bg-emerald-100 text-emerald-800' }
                };
                const deliveryIcon = b.deliveryMethod === 'venue' ? '🏟️ นัดรับหน้าคอน' : (b.deliveryMethod === 'messenger' ? '🛵 แมสเซนเจอร์' : '🏬 รับที่ร้าน');

                return `
                  <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-slate-800 text-sm">${b.deviceSummary}</span>
                        <span class="text-xs px-2 py-0.5 rounded-full font-medium ${statusMap[b.deliveryStatus]?.bg || 'bg-slate-100 text-slate-700'}">
                          ${statusMap[b.deliveryStatus]?.text || b.deliveryStatus}
                        </span>
                      </div>
                      <div class="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>ลูกค้า: <strong class="text-emerald-700 font-semibold">${b.customerNickname}</strong> (${b.customerPhone})</span>
                        <span>วิธีส่ง: <strong class="text-slate-700">${deliveryIcon}</strong></span>
                        <span>ยอดเช่า: <strong class="text-slate-800">฿${b.totalRental.toLocaleString()}</strong></span>
                      </div>
                    </div>
                    <button onclick="BookingsModule.openInspectionModal('${b.id}')" class="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors shrink-0">
                      🔍 ตรวจสภาพเครื่อง
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button onclick="CalendarModule.closeDayDetailsModal()" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            ปิดหน้าต่าง
          </button>
          <button onclick="CalendarModule.bookForSelectedDate()" class="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            + จองคิวเช่าสำหรับวันนี้
          </button>
        </div>
      </div>
    `;

    if (contentEl) contentEl.innerHTML = html;
    modal?.classList.remove('hidden');
    modal?.classList.add('flex');
  },

  closeDayDetailsModal() {
    const modal = document.getElementById('day-details-modal');
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
  },

  bookForSelectedDate() {
    this.closeDayDetailsModal();
    // Switch to booking page and prefill date
    window.App.navigateTo('bookings');
    setTimeout(() => {
      BookingsModule.openNewBookingModal(this.selectedDate);
    }, 150);
  }
};

window.CalendarModule = CalendarModule;
