import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { clearArtistForm } from "./artists.js";
import { clearProductForm } from "./products.js";

export function setupAuth() {
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const loginError = document.getElementById("login-error");

  loginBtn?.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    loginError.textContent = "";

    if (!email || !password) {
      loginError.textContent = "Please enter email and password.";
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      loginError.textContent = "Login failed. Check your credentials.";
      console.error(err);
    }
  });

  logoutBtn?.addEventListener("click", async () => {
    await signOut(auth);
  });

  onAuthStateChanged(auth, (user) => {
    if (user) {
      document.getElementById("login-section").style.display = "none";
      document.getElementById("dashboard-section").style.display = "block";
      window.showSection("artists");

      // ✅ Only run these if user is logged in
      setupArtistForm();
      setupProductForm();
      loadArtists();
      loadProducts();
      populateArtistDropdown();
      populateArtistFilter();
    } else {
      document.getElementById("login-section").style.display = "block";
      document.getElementById("dashboard-section").style.display = "none";
      clearArtistForm?.();
      clearProductForm?.();
      document.getElementById("email").value = "";
      document.getElementById("password").value = "";
      loginError.textContent = "";
    }
});
}
