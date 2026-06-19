/*
  main.js
  Shared behavior across the public pages.
  Page specific logic (forms, order builder) lives at the
  bottom of each HTML file so it stays easy to trace.
*/

function setupNavToggle() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", function () {
    nav.classList.toggle("open");
  });
}

document.addEventListener("DOMContentLoaded", setupNavToggle);
