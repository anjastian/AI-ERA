// =============================================================
// HELPDESK DASHBOARD - CORE LOGIC
// Client-Side State & Event Management
// =============================================================

// Mock Seed Data (Initial states if localStorage is empty)
const SEED_TICKETS = [
  {
    id: "HDK-4821",
    reporter: "10029381",
    division: "Finance & Accounting",
    type: "Printer & Scanner",
    description: "Printer di divisi finance macet terus (paper jam) dan statusnya offline di komputer admin. Mohon bantuan untuk dicek fisiknya.",
    status: "new",
    date: "2026-06-15T10:30:00Z",
    notes: ""
  },
  {
    id: "HDK-9210",
    reporter: "11209382",
    division: "Marketing & Sales",
    type: "Akses Akun / Reset Password",
    description: "Lupa password akun login email marketing. Sudah coba ganti password mandiri tapi link reset tidak masuk ke email alternatif.",
    status: "progress",
    date: "2026-06-15T09:15:00Z",
    notes: "Sedang menunggu konfirmasi dari IT infrastruktur untuk bypass reset email."
  },
  {
    id: "HDK-2311",
    reporter: "20228371",
    division: "IT & Infrastructure",
    type: "Jaringan / Internet / Wi-Fi",
    description: "Kabel LAN di meja development putus atau tidak terdeteksi jaringan. Lampu indikator port switch mati.",
    status: "solve",
    date: "2026-06-14T15:20:00Z",
    notes: "Kabel RJ45 telah dikrimping ulang dan dipasang kembali. Koneksi internet kembali stabil."
  },
  {
    id: "HDK-4820",
    reporter: "30192843",
    division: "Operations & Logistics",
    type: "Hardware / Komputer / Laptop",
    description: "Laptop operasional lambat sekali saat membuka aplikasi logistik ERP. Butuh upgrade RAM atau install ulang OS.",
    status: "close",
    date: "2026-06-13T11:00:00Z",
    notes: "Telah ditambahkan RAM 8GB (total sekarang 16GB) dan file sampah telah dibersihkan. User mengonfirmasi laptop sudah lancar."
  }
];

// App State
let tickets = [];
let currentFilter = "all";
let searchQuery = "";
let selectedTicketId = null;
let navigationSource = "view-portal"; // Tracks where user entered Form Input from

// DOM Elements
const views = {
  portal: document.getElementById("view-portal"),
  login: document.getElementById("view-login"),
  inputMasalah: document.getElementById("view-input-masalah"),
  dashboard: document.getElementById("view-dashboard")
};

// =============================================================
// INITIALIZATION & STATE LOAD
// =============================================================
document.addEventListener("DOMContentLoaded", () => {
  loadTickets();
  setupEventListeners();
  checkSession();
  
  // Apply digit-only constraints to specific inputs
  setupDigitOnlyInputs();
});

// Load tickets from local storage or set seed data
function loadTickets() {
  const stored = localStorage.getItem("helpdesk_tickets");
  if (stored) {
    tickets = JSON.parse(stored);
  } else {
    tickets = [...SEED_TICKETS];
    saveTickets();
  }
  updateDashboardCounts();
  renderTicketsList();
}

// Save tickets state to local storage
function saveTickets() {
  localStorage.setItem("helpdesk_tickets", JSON.stringify(tickets));
}

// Check if there is an active logged-in session
function checkSession() {
  const sessionUser = sessionStorage.getItem("helpdesk_session");
  if (sessionUser) {
    document.getElementById("dashboard-user-display").textContent = sessionUser;
    navigateTo("view-dashboard");
  } else {
    navigateTo("view-portal");
  }
}

// =============================================================
// ROUTING / VIEW NAVIGATION
// =============================================================
function navigateTo(viewId) {
  // Hide all views, activate target view
  Object.keys(views).forEach(key => {
    views[key].classList.remove("active");
  });
  
  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.classList.add("active");
  }
  
  // Specific transitions actions
  if (viewId === "view-dashboard") {
    updateDashboardCounts();
    renderTicketsList();
    resetWorkForm();
  } else if (viewId === "view-input-masalah") {
    // Keep track of where we navigate from
    if (views.dashboard.classList.contains("active")) {
      navigationSource = "view-dashboard";
    } else {
      navigationSource = "view-portal";
    }
  }
}

// =============================================================
// TOAST NOTIFICATIONS
// =============================================================
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  // Icon based on type
  let icon = "";
  if (type === "success") {
    icon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
  } else if (type === "error") {
    icon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  } else {
    icon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
  }
  
  toast.innerHTML = `
    ${icon}
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Remove toast after 3.5 seconds
  setTimeout(() => {
    toast.style.animation = "slideIn 0.3s ease reverse forwards";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// =============================================================
// NUMERIC VALIDATION UTILITIES
// =============================================================
function setupDigitOnlyInputs() {
  const digitInputs = [
    { id: "login-username", length: 8 },
    { id: "login-pin", length: 6 },
    { id: "report-username", length: 8 }
  ];
  
  digitInputs.forEach(item => {
    const el = document.getElementById(item.id);
    if (!el) return;
    
    // Block non-digit keystrokes
    el.addEventListener("keypress", (e) => {
      if (!/[0-9]/.test(e.key)) {
        e.preventDefault();
      }
    });
    
    // Clean up pasted content or mobile inputs
    el.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "");
    });
  });
}

// =============================================================
// EVENT LISTENERS SETUP
// =============================================================
function setupEventListeners() {
  // Portal Cards
  document.getElementById("btn-portal-reporter").addEventListener("click", () => {
    document.getElementById("form-report-issue").reset();
    navigateTo("view-input-masalah");
  });
  
  document.getElementById("btn-portal-agent").addEventListener("click", () => {
    document.getElementById("form-login").reset();
    navigateTo("view-login");
  });
  
  // Login Form Submission
  document.getElementById("form-login").addEventListener("submit", (e) => {
    e.preventDefault();
    handleLogin();
  });
  
  // Input Ticket Form Submission
  document.getElementById("form-report-issue").addEventListener("submit", (e) => {
    e.preventDefault();
    handleTicketSubmission();
  });
  
  // Dashboard Action: Add Ticket
  document.getElementById("btn-dashboard-add-ticket").addEventListener("click", () => {
    document.getElementById("form-report-issue").reset();
    navigateTo("view-input-masalah");
  });
  
  // Logout Action
  document.getElementById("btn-logout").addEventListener("click", () => {
    sessionStorage.removeItem("helpdesk_session");
    showToast("Berhasil keluar dari dashboard.", "info");
    navigateTo("view-portal");
  });
  
  // Work Form Action: Cancel
  document.getElementById("btn-cancel-work").addEventListener("click", () => {
    resetWorkForm();
  });
  
  // Work Form Submission: Save & Update Status
  document.getElementById("form-work-ticket").addEventListener("submit", (e) => {
    e.preventDefault();
    handleWorkUpdate();
  });
  
  // Search Bar logic
  document.getElementById("search-tickets").addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderTicketsList();
  });
  
  // Filter badges click
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      filterBtns.forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      currentFilter = e.target.getAttribute("data-filter");
      renderTicketsList();
    });
  });
}

// =============================================================
// LOGIN LOGIC
// =============================================================
function handleLogin() {
  const usernameVal = document.getElementById("login-username").value;
  const pinVal = document.getElementById("login-pin").value;
  
  // Validation: digits check
  if (usernameVal.length !== 8) {
    showToast("Username harus berupa 8 digit angka!", "error");
    return;
  }
  if (pinVal.length !== 6) {
    showToast("PIN password harus berupa 6 digit angka!", "error");
    return;
  }
  
  // Credentials checking: 00000000 / 000000
  if (usernameVal === "00000000" && pinVal === "000000") {
    sessionStorage.setItem("helpdesk_session", usernameVal);
    document.getElementById("dashboard-user-display").textContent = usernameVal;
    showToast("Login berhasil! Selamat datang Admin.", "success");
    navigateTo("view-dashboard");
  } else {
    showToast("Kredensial salah! Gunakan username 00000000 & PIN 000000.", "error");
  }
}

// =============================================================
// ADD TICKET / INPUT MASALAH LOGIC
// =============================================================
function handleTicketSubmission() {
  const reporterVal = document.getElementById("report-username").value;
  const divisiVal = document.getElementById("report-divisi").value;
  const typeVal = document.getElementById("report-jenis-masalah").value;
  const descVal = document.getElementById("report-detail-masalah").value;
  
  // Form validations
  if (reporterVal.length !== 8) {
    showToast("NIK/ID pelapor harus berupa 8 digit angka!", "error");
    return;
  }
  if (!divisiVal) {
    showToast("Silakan pilih divisi Anda!", "error");
    return;
  }
  if (!typeVal) {
    showToast("Silakan pilih jenis masalah!", "error");
    return;
  }
  if (!descVal.trim()) {
    showToast("Detail masalah tidak boleh kosong!", "error");
    return;
  }
  
  // Create New Ticket Object
  const randomId = Math.floor(1000 + Math.random() * 9000); // 4 digit random
  const newTicket = {
    id: `HDK-${randomId}`,
    reporter: reporterVal,
    division: divisiVal,
    type: typeVal,
    description: descVal,
    status: "new",
    date: new Date().toISOString(),
    notes: ""
  };
  
  // Insert at front of array
  tickets.unshift(newTicket);
  saveTickets();
  
  showToast(`Tiket ${newTicket.id} berhasil diajukan!`, "success");
  
  // Return user to original screen
  if (navigationSource === "view-dashboard") {
    navigateTo("view-dashboard");
  } else {
    navigateTo("view-portal");
  }
}

// =============================================================
// TICKET WORK FORM LOGIC (LEFT PANEL)
// =============================================================
function loadTicketToWorkForm(ticket) {
  selectedTicketId = ticket.id;
  
  // Hide placeholder, show active form
  document.getElementById("work-placeholder").style.display = "none";
  const formEl = document.getElementById("form-work-ticket");
  formEl.style.display = "block";
  
  // Fill text values
  document.getElementById("work-ticket-id").value = ticket.id;
  document.getElementById("work-ticket-id-display").textContent = ticket.id;
  document.getElementById("work-category-display").textContent = ticket.type;
  document.getElementById("work-username-display").textContent = ticket.reporter;
  document.getElementById("work-divisi-display").textContent = ticket.division;
  document.getElementById("work-detail-display").textContent = ticket.description;
  
  // Fill editable values
  document.getElementById("work-status").value = ticket.status;
  document.getElementById("work-notes").value = ticket.notes || "";
  
  // Add highlight border class on roster item
  const ticketItems = document.querySelectorAll(".ticket-item");
  ticketItems.forEach(item => {
    item.classList.remove("active-selection");
    if (item.getAttribute("data-id") === ticket.id) {
      item.classList.add("active-selection");
    }
  });
}

function resetWorkForm() {
  selectedTicketId = null;
  document.getElementById("form-work-ticket").reset();
  document.getElementById("form-work-ticket").style.display = "none";
  document.getElementById("work-placeholder").style.display = "flex";
  
  // Remove selection outline
  const ticketItems = document.querySelectorAll(".ticket-item");
  ticketItems.forEach(item => item.classList.remove("active-selection"));
}

function handleWorkUpdate() {
  if (!selectedTicketId) return;
  
  const statusVal = document.getElementById("work-status").value;
  const notesVal = document.getElementById("work-notes").value;
  
  // Find and update ticket
  const ticketIndex = tickets.findIndex(t => t.id === selectedTicketId);
  if (ticketIndex !== -1) {
    tickets[ticketIndex].status = statusVal;
    tickets[ticketIndex].notes = notesVal;
    saveTickets();
    
    showToast(`Status tiket ${selectedTicketId} diperbarui ke ${statusVal.toUpperCase()}`, "success");
    
    // Refresh views & values
    updateDashboardCounts();
    renderTicketsList();
    
    // Select the updated ticket again to show refreshed fields or reset if it is now filtered out
    const updatedTicket = tickets[ticketIndex];
    
    // If current filter excludes it, reset the form. Else reload it.
    if (currentFilter === "all" || currentFilter === statusVal) {
      loadTicketToWorkForm(updatedTicket);
    } else {
      resetWorkForm();
    }
  }
}

// =============================================================
// LIST RENDERING & FILTER LOGIC (RIGHT PANEL)
// =============================================================
function renderTicketsList() {
  const container = document.getElementById("tickets-list");
  container.innerHTML = "";
  
  // Filter and search
  const filteredTickets = tickets.filter(ticket => {
    // 1. Status Filter
    const matchesFilter = currentFilter === "all" || ticket.status === currentFilter;
    
    // 2. Search Query Matching
    const matchesSearch = 
      ticket.id.toLowerCase().includes(searchQuery) ||
      ticket.reporter.toLowerCase().includes(searchQuery) ||
      ticket.division.toLowerCase().includes(searchQuery) ||
      ticket.type.toLowerCase().includes(searchQuery) ||
      ticket.description.toLowerCase().includes(searchQuery);
      
    return matchesFilter && matchesSearch;
  });
  
  if (filteredTickets.length === 0) {
    container.innerHTML = `
      <div class="no-tickets-found">
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.5; margin-bottom: 0.5rem;"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
        <p>Tidak ada tiket keluhan yang cocok.</p>
      </div>
    `;
    return;
  }
  
  // Draw ticket cards
  filteredTickets.forEach(ticket => {
    const card = document.createElement("div");
    card.className = `ticket-item ${selectedTicketId === ticket.id ? 'active-selection' : ''}`;
    card.setAttribute("data-id", ticket.id);
    
    // Status text formatter for ID (display status value neatly)
    let displayStatus = ticket.status.toUpperCase();
    if (ticket.status === "progress") displayStatus = "PROGRES"; // exact matching for UI labels
    
    // Date Formatter
    const ticketDate = new Date(ticket.date);
    const dateFormatted = ticketDate.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
    
    card.innerHTML = `
      <div class="ticket-item-header">
        <span class="ticket-id">${ticket.id}</span>
        <span class="status-badge ${ticket.status}">${displayStatus}</span>
      </div>
      <div class="ticket-reporter-division">
        <span>${ticket.reporter}</span>
        <span class="ticket-meta-divisi">${ticket.division}</span>
      </div>
      <div class="ticket-item-body">${ticket.description}</div>
      <div class="ticket-item-footer">
        <span class="ticket-type">${ticket.type}</span>
        <span class="ticket-date">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${dateFormatted}
        </span>
      </div>
    `;
    
    // Click listener to load in pengerjaan form
    card.addEventListener("click", () => {
      loadTicketToWorkForm(ticket);
    });
    
    container.appendChild(card);
  });
}

// =============================================================
// INDICATOR COUNTER UPDATES
// =============================================================
function updateDashboardCounts() {
  const counts = {
    new: 0,
    progress: 0,
    solve: 0,
    close: 0
  };
  
  tickets.forEach(ticket => {
    if (counts.hasOwnProperty(ticket.status)) {
      counts[ticket.status]++;
    }
  });
  
  document.getElementById("count-new").textContent = counts.new;
  document.getElementById("count-progress").textContent = counts.progress;
  document.getElementById("count-solve").textContent = counts.solve;
  document.getElementById("count-close").textContent = counts.close;
}
