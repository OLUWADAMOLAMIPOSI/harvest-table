/*
  admin.js
  Drives the admin dashboard: panel switching, rendering the
  menu/orders/reservations/messages tables, and the menu form
  used to add or edit dishes. Everything reads and writes
  through the functions defined in data.js.
*/

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value || "";
  return div.innerHTML;
}

/* Panel switching */

function setupPanelNavigation() {
  const buttons = document.querySelectorAll(".nav-btn");
  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      const panelName = button.getAttribute("data-panel");

      buttons.forEach(function (b) {
        b.classList.remove("active");
      });
      button.classList.add("active");

      document.querySelectorAll(".admin-panel").forEach(function (panel) {
        panel.classList.remove("active");
      });
      document.getElementById("panel-" + panelName).classList.add("active");
    });
  });
}

/* Sidebar counts and overview stats */

function refreshCounts() {
  const openOrders = getOrders().filter(function (o) {
    return o.status !== "completed";
  });
  const pendingReservations = getReservations().filter(function (r) {
    return r.status === "pending";
  });
  const unreadMessages = getMessages().filter(function (m) {
    return !m.read;
  });

  document.getElementById("orders-count").textContent = openOrders.length;
  document.getElementById("reservations-count").textContent = pendingReservations.length;
  document.getElementById("messages-count").textContent = unreadMessages.length;

  document.getElementById("stat-menu-count").textContent = getMenu().length;
  document.getElementById("stat-orders-count").textContent = openOrders.length;
  document.getElementById("stat-reservations-count").textContent = pendingReservations.length;
  document.getElementById("stat-messages-count").textContent = unreadMessages.length;
}

function renderOverviewRecentOrders() {
  const tbody = document.getElementById("overview-recent-orders");
  const orders = getOrders().slice(0, 5);

  if (orders.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="4">No orders yet.</td></tr>';
    return;
  }

  tbody.innerHTML = "";
  orders.forEach(function (order) {
    const itemsSummary = order.items.map(function (i) {
      return i.qty + "x " + i.name;
    }).join(", ");

    const row = document.createElement("tr");
    row.innerHTML =
      "<td>" + escapeHtml(order.customerName) + "</td>" +
      "<td>" + escapeHtml(itemsSummary) + "</td>" +
      "<td>$" + order.total.toFixed(2) + "</td>" +
      '<td><span class="status-pill status-' + order.status + '">' + order.status + "</span></td>";
    tbody.appendChild(row);
  });
}

/* Menu management */

let editingMenuItemId = null;

function renderMenuTable() {
  const tbody = document.getElementById("menu-table-body");
  const menu = getMenu();

  if (menu.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="5">No menu items yet. Add your first dish above.</td></tr>';
    return;
  }

  tbody.innerHTML = "";
  menu.forEach(function (item) {
    const row = document.createElement("tr");
    row.innerHTML =
      "<td>" + escapeHtml(item.name) + "</td>" +
      "<td>" + escapeHtml(item.category) + "</td>" +
      "<td>$" + item.price.toFixed(2) + "</td>" +
      "<td>" + (item.available
        ? '<span class="status-pill status-completed">visible</span>'
        : '<span class="status-pill status-pending">hidden</span>') + "</td>" +
      '<td><div class="row-actions">' +
        '<button type="button" class="btn btn-outline btn-small" data-edit="' + item.id + '">Edit</button>' +
        '<button type="button" class="btn btn-danger btn-small" data-delete="' + item.id + '">Delete</button>' +
      "</div></td>";
    tbody.appendChild(row);
  });

  tbody.querySelectorAll("[data-edit]").forEach(function (button) {
    button.addEventListener("click", function () {
      startEditMenuItem(button.getAttribute("data-edit"));
    });
  });

  tbody.querySelectorAll("[data-delete]").forEach(function (button) {
    button.addEventListener("click", function () {
      const id = button.getAttribute("data-delete");
      const confirmed = window.confirm("Delete this menu item? This cannot be undone.");
      if (confirmed) {
        deleteMenuItem(id);
        renderMenuTable();
        refreshCounts();
      }
    });
  });
}

function startEditMenuItem(id) {
  const item = getMenu().find(function (m) {
    return m.id === id;
  });
  if (!item) return;

  editingMenuItemId = id;

  document.getElementById("menu-item-id").value = item.id;
  document.getElementById("menu-item-name").value = item.name;
  document.getElementById("menu-item-category").value = item.category;
  document.getElementById("menu-item-price").value = item.price;
  document.getElementById("menu-item-available").value = item.available ? "true" : "false";
  document.getElementById("menu-item-description").value = item.description;

  document.getElementById("menu-form-title").textContent = "Edit dish";
  document.getElementById("menu-form-submit").textContent = "Save changes";
  document.getElementById("menu-form-cancel").style.display = "inline-block";

  document.getElementById("panel-menu").scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetMenuForm() {
  editingMenuItemId = null;
  document.getElementById("menu-form").reset();
  document.getElementById("menu-item-id").value = "";
  document.getElementById("menu-form-title").textContent = "Add a new item";
  document.getElementById("menu-form-submit").textContent = "Add item";
  document.getElementById("menu-form-cancel").style.display = "none";
}

function setupMenuForm() {
  const form = document.getElementById("menu-form");

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const item = {
      id: editingMenuItemId,
      name: document.getElementById("menu-item-name").value.trim(),
      category: document.getElementById("menu-item-category").value.trim(),
      price: parseFloat(document.getElementById("menu-item-price").value),
      available: document.getElementById("menu-item-available").value === "true",
      description: document.getElementById("menu-item-description").value.trim()
    };

    if (!item.name || !item.category || isNaN(item.price)) {
      alert("Please fill in the dish name, category, and a valid price.");
      return;
    }

    saveMenuItem(item);
    resetMenuForm();
    renderMenuTable();
    refreshCounts();
  });

  document.getElementById("menu-form-cancel").addEventListener("click", function () {
    resetMenuForm();
  });
}

/* Orders management */

function renderOrdersTable() {
  const tbody = document.getElementById("orders-table-body");
  const orders = getOrders();

  if (orders.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No orders yet.</td></tr>';
    return;
  }

  tbody.innerHTML = "";
  orders.forEach(function (order) {
    const itemsSummary = order.items.map(function (i) {
      return i.qty + "x " + i.name;
    }).join(", ");

    const row = document.createElement("tr");
    row.innerHTML =
      "<td>" + escapeHtml(order.customerName) + "<br><span style='color:var(--ink-soft); font-size:12px;'>" + formatDate(order.createdAt) + "</span></td>" +
      "<td>" + escapeHtml(order.phone) + "<br>" + escapeHtml(order.email) + "</td>" +
      "<td>" + escapeHtml(itemsSummary) + (order.notes ? "<br><span style='color:var(--ink-soft); font-size:12px;'>Note: " + escapeHtml(order.notes) + "</span>" : "") + "</td>" +
      "<td>$" + order.total.toFixed(2) + "</td>" +
      "<td>" + buildOrderStatusSelect(order) + "</td>" +
      '<td><button type="button" class="btn btn-danger btn-small" data-delete-order="' + order.id + '">Delete</button></td>';
    tbody.appendChild(row);
  });

  tbody.querySelectorAll("[data-status-order]").forEach(function (select) {
    select.addEventListener("change", function () {
      updateOrderStatus(select.getAttribute("data-status-order"), select.value);
      renderOrdersTable();
      renderOverviewRecentOrders();
      refreshCounts();
    });
  });

  tbody.querySelectorAll("[data-delete-order]").forEach(function (button) {
    button.addEventListener("click", function () {
      const confirmed = window.confirm("Delete this order?");
      if (confirmed) {
        deleteOrder(button.getAttribute("data-delete-order"));
        renderOrdersTable();
        renderOverviewRecentOrders();
        refreshCounts();
      }
    });
  });
}

function buildOrderStatusSelect(order) {
  const statuses = ["received", "preparing", "ready", "completed"];
  let html = '<select class="status-select" data-status-order="' + order.id + '">';
  statuses.forEach(function (status) {
    html += '<option value="' + status + '"' + (order.status === status ? " selected" : "") + ">" + status + "</option>";
  });
  html += "</select>";
  return html;
}

/* Reservations management */

function renderReservationsTable() {
  const tbody = document.getElementById("reservations-table-body");
  const reservations = getReservations();

  if (reservations.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No reservations yet.</td></tr>';
    return;
  }

  tbody.innerHTML = "";
  reservations.forEach(function (reservation) {
    const row = document.createElement("tr");
    row.innerHTML =
      "<td>" + escapeHtml(reservation.name) + (reservation.notes ? "<br><span style='color:var(--ink-soft); font-size:12px;'>Note: " + escapeHtml(reservation.notes) + "</span>" : "") + "</td>" +
      "<td>" + escapeHtml(reservation.phone) + "<br>" + escapeHtml(reservation.email) + "</td>" +
      "<td>" + escapeHtml(reservation.date) + " at " + escapeHtml(reservation.time) + "</td>" +
      "<td>" + escapeHtml(reservation.guests) + "</td>" +
      "<td>" + buildReservationStatusSelect(reservation) + "</td>" +
      '<td><button type="button" class="btn btn-danger btn-small" data-delete-reservation="' + reservation.id + '">Delete</button></td>';
    tbody.appendChild(row);
  });

  tbody.querySelectorAll("[data-status-reservation]").forEach(function (select) {
    select.addEventListener("change", function () {
      updateReservationStatus(select.getAttribute("data-status-reservation"), select.value);
      renderReservationsTable();
      refreshCounts();
    });
  });

  tbody.querySelectorAll("[data-delete-reservation]").forEach(function (button) {
    button.addEventListener("click", function () {
      const confirmed = window.confirm("Delete this reservation?");
      if (confirmed) {
        deleteReservation(button.getAttribute("data-delete-reservation"));
        renderReservationsTable();
        refreshCounts();
      }
    });
  });
}

function buildReservationStatusSelect(reservation) {
  const statuses = ["pending", "confirmed", "completed"];
  let html = '<select class="status-select" data-status-reservation="' + reservation.id + '">';
  statuses.forEach(function (status) {
    html += '<option value="' + status + '"' + (reservation.status === status ? " selected" : "") + ">" + status + "</option>";
  });
  html += "</select>";
  return html;
}

/* Messages management */

function renderMessagesTable() {
  const tbody = document.getElementById("messages-table-body");
  const messages = getMessages();

  if (messages.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="4">No messages yet.</td></tr>';
    return;
  }

  tbody.innerHTML = "";
  messages.forEach(function (message) {
    const row = document.createElement("tr");
    row.innerHTML =
      "<td>" + (message.read ? "" : '<span class="unread-dot"></span>') + escapeHtml(message.name) + "<br><span style='color:var(--ink-soft); font-size:12px;'>" + formatDate(message.createdAt) + "</span></td>" +
      "<td>" + escapeHtml(message.phone) + "<br>" + escapeHtml(message.email) + "</td>" +
      "<td>" + escapeHtml(message.message) + "</td>" +
      '<td><div class="row-actions">' +
        (message.read ? "" : '<button type="button" class="btn btn-outline btn-small" data-read="' + message.id + '">Mark read</button>') +
        '<button type="button" class="btn btn-danger btn-small" data-delete-message="' + message.id + '">Delete</button>' +
      "</div></td>";
    tbody.appendChild(row);
  });

  tbody.querySelectorAll("[data-read]").forEach(function (button) {
    button.addEventListener("click", function () {
      markMessageRead(button.getAttribute("data-read"));
      renderMessagesTable();
      refreshCounts();
    });
  });

  tbody.querySelectorAll("[data-delete-message]").forEach(function (button) {
    button.addEventListener("click", function () {
      const confirmed = window.confirm("Delete this message?");
      if (confirmed) {
        deleteMessage(button.getAttribute("data-delete-message"));
        renderMessagesTable();
        refreshCounts();
      }
    });
  });
}

/* Logout */

function setupLogout() {
  document.getElementById("logout-btn").addEventListener("click", function () {
    adminLogout();
    window.location.href = "login.html";
  });
}

/* Init */

document.addEventListener("DOMContentLoaded", function () {
  requireAdminLogin();

  setupPanelNavigation();
  setupMenuForm();
  setupLogout();

  renderMenuTable();
  renderOrdersTable();
  renderReservationsTable();
  renderMessagesTable();
  renderOverviewRecentOrders();
  refreshCounts();
});
