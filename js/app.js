/**
 * js/app.js
 * Core Application Script, Theme, Sidebar & Safe Animation Helper
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Safe execution for dbEngine
  if (typeof dbEngine !== 'undefined' && typeof dbEngine.init === 'function') {
    try {
      await dbEngine.init();
    } catch (e) {
      console.warn("dbEngine initialization skipped/failed:", e);
    }
  }

  initTheme();
  initSidebar();
  initAOSAndAnimations();
});

// Theme Management (Light / Dark Mode)
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.innerHTML = savedTheme === 'dark' ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon-stars"></i>';
    toggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      toggleBtn.innerHTML = next === 'dark' ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon-stars"></i>';
    });
  }
}

// Sidebar Toggle Functionality
function initSidebar() {
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const content = document.getElementById('main-content');

  if (toggle && sidebar && content) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      content.classList.toggle('expanded');
    });
  }
}

// Safe AOS & GSAP Animation Initialization (Fixes GSAP Target Warning)
function initAOSAndAnimations() {
  if (typeof AOS !== 'undefined') {
    AOS.init({ duration: 600, once: true });
  }
  // Safe Check: Animates ONLY if elements exist on current page
  if (typeof gsap !== 'undefined' && document.querySelectorAll('.card-custom').length > 0) {
    gsap.from(".card-custom", { opacity: 0, y: 15, duration: 0.4, stagger: 0.05, ease: "power2.out" });
  }
}

// Global Toast Notification System
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }

  const bgClass = type === 'success' ? 'bg-success' : type === 'danger' ? 'bg-danger' : 'bg-primary';

  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white ${bgClass} border-0 show mb-2 shadow`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body fw-semibold">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}