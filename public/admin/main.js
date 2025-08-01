import { setupAuth } from './auth.js';
import { setupArtistForm, loadArtists, populateArtistDropdown } from './artists.js';
import { setupProductForm, loadProducts, populateArtistFilter } from './products.js'; // ⬅️ make sure this is imported

function showSection(sectionId) {
  document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));

  const section = document.getElementById(sectionId);
  if (section) section.style.display = 'block';

  const activeBtn = [...document.querySelectorAll('nav button')].find(btn =>
    btn.getAttribute('onclick')?.includes(sectionId)
  );
  if (activeBtn) activeBtn.classList.add('active');
}
window.showSection = showSection;

document.addEventListener("DOMContentLoaded", () => {
  setupAuth(); // This will handle showing/hiding login/dashboard
});