// scripts/listeners/authListeners.js
import { login, logout, onAuthChange } from "../firebase/auth.js";
import { 
  loginBtn, emailInput, passwordInput, loginError, loginSection, dashboardSection, logoutBtn 
} from "../ui/domElements.js";

export function initAuthListeners() {
  loginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    loginError.textContent = "";
    try {
      await login(email, password);
    } catch (error) {
      loginError.textContent = error.message;
    }
  });

  logoutBtn.addEventListener("click", async () => {
    await logout();
  });

  onAuthChange(user => {
    if (user) {
      loginSection.style.display = "none";
      dashboardSection.style.display = "block";
    } else {
      loginSection.style.display = "block";
      dashboardSection.style.display = "none";
    }
  });
}
