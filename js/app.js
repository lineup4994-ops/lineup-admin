/**
 * Line.Up Phone Rental Service - Main Application Controller
 * Handles SPA navigation across 5 views, mobile drawer, toasts, and initialization.
 */

const App = {
  currentView: 'dashboard',

  init() {
    this.setupNavigation();
    this.setupMobileMenu();
    this.setupResetButton();

    // Initialize individual modules
    if (window.CalendarModule) window.CalendarModule.init();
    if (window.InventoryModule) window.InventoryModule.init();
    if (window.BookingsModule) window.BookingsModule.init();
    if (window.CustomersModule) window.CustomersModule.init();
    if (window.RevenueModule) window.RevenueModule.init();
    if (window.GoogleSheetsSync) window.GoogleSheetsSync.init();

    // Initialize Lucide icons if loaded
    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  setupNavigation() {
    const navLinks = document.querySelectorAll('[data-nav-target]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = link.getAttribute('data-nav-target');
        this.navigateTo(targetView);
      });
    });
  },

  navigateTo(viewId) {
    this.currentView = viewId;

    // Hide all view sections
    const views = document.querySelectorAll('.view-section');
    views.forEach(v => {
      v.classList.add('hidden');
    });

    // Show target section
    const targetSection = document.getElementById(`view-${viewId}`);
    if (targetSection) {
      targetSection.classList.remove('hidden');
      targetSection.classList.add('animate-fade-in');
    }

    // Update active nav button styles in Desktop sidebar and Mobile bar
    const navLinks = document.querySelectorAll('[data-nav-target]');
    navLinks.forEach(link => {
      const linkTarget = link.getAttribute('data-nav-target');
      if (linkTarget === viewId) {
        link.classList.add('bg-emerald-500', 'text-white', 'shadow-sm');
        link.classList.remove('text-slate-600', 'hover:bg-slate-100');
        // If has badge or svg
        const icon = link.querySelector('svg');
        if (icon) icon.classList.add('text-white');
      } else {
        link.classList.remove('bg-emerald-500', 'text-white', 'shadow-sm');
        link.classList.add('text-slate-600', 'hover:bg-slate-100');
        const icon = link.querySelector('svg');
        if (icon) icon.classList.remove('text-white');
      }
    });

    // Close mobile drawer if open
    this.closeMobileDrawer();

    // Trigger module render / resize if needed
    if (viewId === 'revenue' && window.RevenueModule) {
      setTimeout(() => window.RevenueModule.render(), 50);
    } else if (viewId === 'dashboard' && window.CalendarModule) {
      setTimeout(() => window.CalendarModule.render(), 50);
    } else if (viewId === 'inventory' && window.InventoryModule) {
      window.InventoryModule.render();
    } else if (viewId === 'bookings' && window.BookingsModule) {
      window.BookingsModule.render();
    } else if (viewId === 'customers' && window.CustomersModule) {
      window.CustomersModule.render();
    }

    // Scroll top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  setupMobileMenu() {
    const toggleBtn = document.getElementById('mobile-menu-btn');
    const drawer = document.getElementById('mobile-drawer');
    const backdrop = document.getElementById('mobile-drawer-backdrop');
    const closeBtn = document.getElementById('mobile-drawer-close');

    toggleBtn?.addEventListener('click', () => {
      drawer?.classList.remove('-translate-x-full');
      backdrop?.classList.remove('hidden');
    });

    closeBtn?.addEventListener('click', () => this.closeMobileDrawer());
    backdrop?.addEventListener('click', () => this.closeMobileDrawer());
  },

  closeMobileDrawer() {
    const drawer = document.getElementById('mobile-drawer');
    const backdrop = document.getElementById('mobile-drawer-backdrop');
    drawer?.classList.add('-translate-x-full');
    backdrop?.classList.add('hidden');
  },

  setupResetButton() {
    document.getElementById('reset-demo-data-btn')?.addEventListener('click', () => {
      if (confirm('คุณต้องการรีเซ็ตข้อมูลตัวอย่างทั้งหมดกลับสู่ค่าเริ่มต้นหรือไม่? (การจองและข้อมูลที่แก้ไขจะถูกแทนที่ด้วยข้อมูลตัวอย่าง)')) {
        LineUpDB.resetAllData();
      }
    });
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const typeStyles = {
      success: 'bg-emerald-600 text-white border-emerald-700',
      error: 'bg-rose-600 text-white border-rose-700',
      info: 'bg-slate-800 text-white border-slate-900',
      warning: 'bg-amber-500 text-white border-amber-600'
    };

    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠'
    };

    toast.className = `flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-medium animate-fade-in transition-all ${typeStyles[type] || typeStyles.info}`;
    toast.innerHTML = `
      <span class="font-bold text-sm">${icons[type] || '•'}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
};

window.App = App;

// Bootstrap once DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
