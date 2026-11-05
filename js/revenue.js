/**
 * Line.Up Phone Rental Service - Revenue Summary Module
 * Revenue stats, interactive Chart.js charts, category breakdown (Phone vs Lens vs Full Set), and export features.
 */

const RevenueModule = {
  trendChartInstance: null,
  categoryChartInstance: null,
  eventChartInstance: null,

  init() {
    this.render();
    window.addEventListener('lineup:bookings-updated', () => {
      this.render();
    });
  },

  render() {
    this.renderSummaryCards();
    this.renderCategoryBreakdown();
    this.renderCharts();
    this.renderEventRankingTable();
  },

  renderSummaryCards() {
    const bookings = LineUpDB.getBookings().filter(b => b.deliveryStatus !== 'cancelled');
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalRental || 0), 0);
    const totalBookings = bookings.length;
    const avgOrderValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;
    const totalDeposits = bookings.filter(b => b.deliveryStatus === 'pending' || b.deliveryStatus === 'delivered')
      .reduce((sum, b) => sum + (b.deposit || 0), 0);

    const totalRevEl = document.getElementById('rev-total-income');
    const avgOrderEl = document.getElementById('rev-avg-order');
    const totalCountEl = document.getElementById('rev-total-count');
    const depositHoldEl = document.getElementById('rev-deposit-hold');

    if (totalRevEl) totalRevEl.innerText = '฿' + totalRevenue.toLocaleString();
    if (avgOrderEl) avgOrderEl.innerText = '฿' + avgOrderValue.toLocaleString();
    if (totalCountEl) totalCountEl.innerText = totalBookings.toLocaleString() + ' คิว';
    if (depositHoldEl) depositHoldEl.innerText = '฿' + totalDeposits.toLocaleString();
  },

  renderCategoryBreakdown() {
    const bookings = LineUpDB.getBookings().filter(b => b.deliveryStatus !== 'cancelled');

    let phoneRevenue = 0;
    let phoneCount = 0;

    let lensRevenue = 0;
    let lensCount = 0;

    let fullsetRevenue = 0;
    let fullsetCount = 0;

    bookings.forEach(b => {
      const amt = b.totalRental || 0;
      if (b.rentalType === 'phone') {
        phoneRevenue += amt;
        phoneCount++;
      } else if (b.rentalType === 'lens') {
        lensRevenue += amt;
        lensCount++;
      } else {
        // fullset
        fullsetRevenue += amt;
        fullsetCount++;
      }
    });

    const totalRev = phoneRevenue + lensRevenue + fullsetRevenue || 1;
    const phonePct = Math.round((phoneRevenue / totalRev) * 100);
    const lensPct = Math.round((lensRevenue / totalRev) * 100);
    const fullsetPct = Math.round((fullsetRevenue / totalRev) * 100);

    // Update HTML cards
    const phoneRevEl = document.getElementById('rev-phone-amount');
    const phonePctEl = document.getElementById('rev-phone-pct');
    const phoneCountEl = document.getElementById('rev-phone-count');

    const lensRevEl = document.getElementById('rev-lens-amount');
    const lensPctEl = document.getElementById('rev-lens-pct');
    const lensCountEl = document.getElementById('rev-lens-count');

    const fullsetRevEl = document.getElementById('rev-fullset-amount');
    const fullsetPctEl = document.getElementById('rev-fullset-pct');
    const fullsetCountEl = document.getElementById('rev-fullset-count');

    if (phoneRevEl) phoneRevEl.innerText = '฿' + phoneRevenue.toLocaleString();
    if (phonePctEl) phonePctEl.innerText = `${phonePct}%`;
    if (phoneCountEl) phoneCountEl.innerText = `${phoneCount} ออเดอร์`;

    if (lensRevEl) lensRevEl.innerText = '฿' + lensRevenue.toLocaleString();
    if (lensPctEl) lensPctEl.innerText = `${lensPct}%`;
    if (lensCountEl) lensCountEl.innerText = `${lensCount} ออเดอร์`;

    if (fullsetRevEl) fullsetRevEl.innerText = '฿' + fullsetRevenue.toLocaleString();
    if (fullsetPctEl) fullsetPctEl.innerText = `${fullsetPct}%`;
    if (fullsetCountEl) fullsetCountEl.innerText = `${fullsetCount} ออเดอร์`;
  },

  renderCharts() {
    const bookings = LineUpDB.getBookings().filter(b => b.deliveryStatus !== 'cancelled');

    // 1. Category Breakdown Donut Chart
    let phoneRev = 0;
    let lensRev = 0;
    let fullsetRev = 0;

    bookings.forEach(b => {
      const amt = b.totalRental || 0;
      if (b.rentalType === 'phone') phoneRev += amt;
      else if (b.rentalType === 'lens') lensRev += amt;
      else fullsetRev += amt;
    });

    const catCanvas = document.getElementById('chart-category-breakdown');
    if (catCanvas && typeof Chart !== 'undefined') {
      if (this.categoryChartInstance) this.categoryChartInstance.destroy();

      this.categoryChartInstance = new Chart(catCanvas, {
        type: 'doughnut',
        data: {
          labels: ['โทรศัพท์มือถือ (Phone Only)', 'เลนส์เสริม (Lens Only)', 'แบบครบเซ็ต (Full Set)'],
          datasets: [{
            data: [phoneRev, lensRev, fullsetRev],
            backgroundColor: ['#38c29e', '#ffd53d', '#ff7599'],
            hoverBackgroundColor: ['#2ea888', '#facc15', '#f0547d'],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { family: "'Prompt', sans-serif", size: 11 },
                padding: 16,
                usePointStyle: true
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const val = context.raw || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const pct = Math.round((val / total) * 100);
                  return ` ${context.label}: ฿${val.toLocaleString()} (${pct}%)`;
                }
              }
            }
          },
          cutout: '68%'
        }
      });
    }

    // 2. Revenue Trend (Monthly simulated + real)
    const trendCanvas = document.getElementById('chart-revenue-trend');
    if (trendCanvas && typeof Chart !== 'undefined') {
      if (this.trendChartInstance) this.trendChartInstance.destroy();

      const months = ['มิ.ย. 69', 'ก.ค. 69', 'ส.ค. 69', 'ก.ย. 69', 'ต.ค. 69', 'พ.ย. 69 (ปัจจุบัน)'];
      // aggregate or simulated realistic month points
      const trendData = [18500, 24000, 31200, 29800, 42500, 54600];

      this.trendChartInstance = new Chart(trendCanvas, {
        type: 'bar',
        data: {
          labels: months,
          datasets: [{
            label: 'รายได้จากการเช่า (บาท)',
            data: trendData,
            backgroundColor: [
              'rgba(56, 194, 158, 0.4)',
              'rgba(56, 194, 158, 0.5)',
              'rgba(56, 194, 158, 0.6)',
              'rgba(56, 194, 158, 0.7)',
              'rgba(56, 194, 158, 0.85)',
              '#38c29e'
            ],
            borderColor: '#2ea888',
            borderWidth: 1.5,
            borderRadius: 8,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ยอดรายได้: ฿${ctx.raw.toLocaleString()}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                font: { family: "'Prompt', sans-serif", size: 10 },
                callback: (val) => '฿' + (val / 1000) + 'k'
              },
              grid: { color: '#f1f5f9' }
            },
            x: {
              ticks: { font: { family: "'Prompt', sans-serif", size: 11 } },
              grid: { display: false }
            }
          }
        }
      });
    }
  },

  renderEventRankingTable() {
    const tableBody = document.getElementById('rev-event-table-body');
    if (!tableBody) return;

    const events = LineUpDB.getEvents();
    const bookings = LineUpDB.getBookings().filter(b => b.deliveryStatus !== 'cancelled');

    // Aggregate by event
    const eventStats = events.map(ev => {
      const evBookings = bookings.filter(b => b.eventId === ev.id || b.eventName.includes(ev.artist || ev.name));
      const totalRev = evBookings.reduce((sum, b) => sum + (b.totalRental || 0), 0);
      const phoneCount = evBookings.filter(b => b.rentalType === 'phone').length;
      const lensCount = evBookings.filter(b => b.rentalType === 'lens').length;
      const fullsetCount = evBookings.filter(b => b.rentalType === 'fullset').length;

      return {
        id: ev.id,
        name: ev.name,
        venue: ev.venue,
        dates: `${ev.startDate} ถึง ${ev.endDate}`,
        totalBookings: evBookings.length,
        phoneCount,
        lensCount,
        fullsetCount,
        totalRevenue: totalRev,
        color: ev.color
      };
    });

    // Sort descending by total revenue
    eventStats.sort((a, b) => b.totalRevenue - a.totalRevenue);

    let html = '';
    eventStats.forEach((ev, idx) => {
      html += `
        <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
          <td class="py-3 px-4 font-bold text-xs text-slate-500">
            #${idx + 1}
          </td>
          <td class="py-3 px-4">
            <div class="font-bold text-slate-800 text-xs flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${ev.color || '#3ec29e'}"></span>
              ${ev.name}
            </div>
            <div class="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">
              📍 ${ev.venue}
            </div>
          </td>
          <td class="py-3 px-4 text-xs text-slate-600">
            ${ev.dates}
          </td>
          <td class="py-3 px-4 text-xs font-semibold text-slate-700">
            ${ev.totalBookings} คิว
            <span class="text-[10px] text-slate-400 font-normal block">
              (${ev.fullsetCount} ฟูลเซ็ต / ${ev.phoneCount} มือถือ / ${ev.lensCount} เลนส์)
            </span>
          </td>
          <td class="py-3 px-4 text-right">
            <div class="font-bold text-emerald-700 text-sm">
              ฿${ev.totalRevenue.toLocaleString()}
            </div>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
  },

  exportToCSV() {
    const bookings = LineUpDB.getBookings();
    let csv = "ID,Customer,Phone,Event,Device,Type,StartDate,EndDate,Days,TotalRental,Deposit,Status,DeliveryMethod\n";

    bookings.forEach(b => {
      csv += `"${b.id}","${b.customerNickname}","${b.customerPhone}","${b.eventName}","${b.deviceSummary}","${b.rentalType}","${b.startDate}","${b.endDate}",${b.days},${b.totalRental},${b.deposit},"${b.deliveryStatus}","${b.deliveryMethod}"\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `lineup_revenue_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.App.showToast("ส่งออกรายงาน CSV สำเร็จเรียบร้อย", "success");
  }
};

window.RevenueModule = RevenueModule;
