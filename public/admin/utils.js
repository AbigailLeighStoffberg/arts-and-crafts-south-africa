export function clearInputFields(inputs) {
  inputs.forEach((input) => (input.value = ""));
}

export function resetElementContent(elements) {
  elements.forEach((el) => (el.innerHTML = ""));
}

export function disableButton(btn, state) {
  if (btn) btn.disabled = state;
}

function showSection(sectionId) {
  // Hide all sections with class 'section'
  document.querySelectorAll('.section').forEach(section => {
    section.style.display = 'none';
  });

  // Show the requested section
  const el = document.getElementById(sectionId);
  if (el) el.style.display = 'block';
}

// Make it globally accessible (on window)
window.showSection = showSection;