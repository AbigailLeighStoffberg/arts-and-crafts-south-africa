// scripts/ui/sectionSwitcher.js

export function initSectionSwitcher() {
  const buttons = document.querySelectorAll("nav button");
  const sections = document.querySelectorAll(".admin-section");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      buttons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");

      const targetId = button.textContent.toLowerCase();

      sections.forEach(section => {
        section.style.display = section.id === targetId ? "block" : "none";
      });
    });
  });
}
