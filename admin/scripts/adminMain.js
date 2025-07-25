// scripts/adminMain.js
import { initAuthListeners } from "./listeners/authListeners.js";
import { initArtistListeners } from "./listeners/artistListeners.js";
import { initProductListeners } from "./listeners/productListeners.js";
import { initSectionSwitcher } from "./ui/sectionSwitcher.js";

function showSection(sectionId) {
  // Hide all admin sections
  document.querySelectorAll(".admin-section").forEach((section) => {
    section.style.display = "none";
  });

  // Show the selected section
  const section = document.getElementById(sectionId);
  if (section) section.style.display = "block";

  // Update active button
  document.querySelectorAll("nav button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.section === sectionId);
  });
}

function initNavButtons() {
  const buttons = document.querySelectorAll("nav button[data-section]");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      showSection(btn.dataset.section);
    });
  });
}

window.addEventListener("DOMContentLoaded", () => {
  initAuthListeners();
  initArtistListeners();
  initProductListeners();
  initSectionSwitcher();

  initNavButtons(); // attach listeners to nav buttons

  showSection("artists"); // show default section on load
});
