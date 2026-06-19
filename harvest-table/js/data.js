/*
  data.js
  Single place that owns all stored data for the site.
  Everything lives in localStorage so the whole project runs
  without a server. Every page (public and admin) reads and
  writes through the functions in this file only.
*/

const STORAGE_KEYS = {
  menu: "ht_menu",
  orders: "ht_orders",
  reservations: "ht_reservations",
  messages: "ht_messages",
  adminSession: "ht_admin_session"
};

const DEFAULT_MENU = [
  {
    id: "m1",
    category: "Starters",
    name: "Skillet Cornbread",
    description: "Baked in cast iron, served warm with honey butter.",
    price: 6.5,
    available: true
  },
  {
    id: "m2",
    category: "Starters",
    name: "Roasted Tomato Soup",
    description: "Slow roasted tomatoes, basil, a swirl of cream.",
    price: 7,
    available: true
  },
  {
    id: "m3",
    category: "Mains",
    name: "Herb Roasted Chicken",
    description: "Half chicken, garlic herb butter, root vegetables.",
    price: 17.5,
    available: true
  },
  {
    id: "m4",
    category: "Mains",
    name: "Braised Short Rib",
    description: "Red wine braise, mashed potato, charred green beans.",
    price: 21,
    available: true
  },
  {
    id: "m5",
    category: "Mains",
    name: "Wild Mushroom Tagliatelle",
    description: "Fresh pasta, mixed mushrooms, parmesan, thyme.",
    price: 15.5,
    available: true
  },
  {
    id: "m6",
    category: "Desserts",
    name: "Buttermilk Pie",
    description: "Classic Southern recipe, lightly torched top.",
    price: 6,
    available: true
  },
  {
    id: "m7",
    category: "Drinks",
    name: "Fresh Lemonade",
    description: "Squeezed daily, mint leaf.",
    price: 3.5,
    available: true
  }
];

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function initData() {
  if (!localStorage.getItem(STORAGE_KEYS.menu)) {
    writeJSON(STORAGE_KEYS.menu, DEFAULT_MENU);
  }
  if (!localStorage.getItem(STORAGE_KEYS.orders)) {
    writeJSON(STORAGE_KEYS.orders, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.reservations)) {
    writeJSON(STORAGE_KEYS.reservations, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.messages)) {
    writeJSON(STORAGE_KEYS.messages, []);
  }
}

function makeId(prefix) {
  return prefix + "_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}

/* Menu */
function getMenu() {
  return readJSON(STORAGE_KEYS.menu, []);
}

function getAvailableMenu() {
  return getMenu().filter(function (item) {
    return item.available;
  });
}

function saveMenuItem(item) {
  const menu = getMenu();
  if (item.id) {
    const index = menu.findIndex(function (m) {
      return m.id === item.id;
    });
    if (index !== -1) {
      menu[index] = item;
    }
  } else {
    item.id = makeId("m");
    menu.push(item);
  }
  writeJSON(STORAGE_KEYS.menu, menu);
  return item;
}

function deleteMenuItem(id) {
  const menu = getMenu().filter(function (item) {
    return item.id !== id;
  });
  writeJSON(STORAGE_KEYS.menu, menu);
}

/* Orders */
function getOrders() {
  return readJSON(STORAGE_KEYS.orders, []);
}

function addOrder(order) {
  const orders = getOrders();
  order.id = makeId("o");
  order.status = "received";
  order.createdAt = new Date().toISOString();
  orders.unshift(order);
  writeJSON(STORAGE_KEYS.orders, orders);
  return order;
}

function updateOrderStatus(id, status) {
  const orders = getOrders();
  const index = orders.findIndex(function (o) {
    return o.id === id;
  });
  if (index !== -1) {
    orders[index].status = status;
    writeJSON(STORAGE_KEYS.orders, orders);
  }
}

function deleteOrder(id) {
  const orders = getOrders().filter(function (o) {
    return o.id !== id;
  });
  writeJSON(STORAGE_KEYS.orders, orders);
}

/* Reservations */
function getReservations() {
  return readJSON(STORAGE_KEYS.reservations, []);
}

function addReservation(reservation) {
  const reservations = getReservations();
  reservation.id = makeId("r");
  reservation.status = "pending";
  reservation.createdAt = new Date().toISOString();
  reservations.unshift(reservation);
  writeJSON(STORAGE_KEYS.reservations, reservations);
  return reservation;
}

function updateReservationStatus(id, status) {
  const reservations = getReservations();
  const index = reservations.findIndex(function (r) {
    return r.id === id;
  });
  if (index !== -1) {
    reservations[index].status = status;
    writeJSON(STORAGE_KEYS.reservations, reservations);
  }
}

function deleteReservation(id) {
  const reservations = getReservations().filter(function (r) {
    return r.id !== id;
  });
  writeJSON(STORAGE_KEYS.reservations, reservations);
}

/* Messages */
function getMessages() {
  return readJSON(STORAGE_KEYS.messages, []);
}

function addMessage(message) {
  const messages = getMessages();
  message.id = makeId("msg");
  message.read = false;
  message.createdAt = new Date().toISOString();
  messages.unshift(message);
  writeJSON(STORAGE_KEYS.messages, messages);
  return message;
}

function markMessageRead(id) {
  const messages = getMessages();
  const index = messages.findIndex(function (m) {
    return m.id === id;
  });
  if (index !== -1) {
    messages[index].read = true;
    writeJSON(STORAGE_KEYS.messages, messages);
  }
}

function deleteMessage(id) {
  const messages = getMessages().filter(function (m) {
    return m.id !== id;
  });
  writeJSON(STORAGE_KEYS.messages, messages);
}

/* Admin auth (demo only, not secure, fine for a static showcase site) */
const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "harvest123"
};

function attemptAdminLogin(username, password) {
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    localStorage.setItem(STORAGE_KEYS.adminSession, "active");
    return true;
  }
  return false;
}

function isAdminLoggedIn() {
  return localStorage.getItem(STORAGE_KEYS.adminSession) === "active";
}

function adminLogout() {
  localStorage.removeItem(STORAGE_KEYS.adminSession);
}

function requireAdminLogin() {
  if (!isAdminLoggedIn()) {
    window.location.href = "login.html";
  }
}

initData();
