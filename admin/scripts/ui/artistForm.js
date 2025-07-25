// scripts/ui/artistForm.js
import {
  artistNameInput,
  artistEmailInput,
  artistPhoneInput,
  artistCityInput,
  artistCountryInput,
  artistBioInput,
  artistFacebookLinkInput,
  artistInstagramLinkInput,
  artistTwitterLinkInput,
  artistShippingCheckbox,
  artistImageInput,
  currentArtistImage,
  addArtistBtn,
  cancelEditBtn,
  submitSuccessMsg,
  submitErrorMsg
} from "./domElements.js";

export let editingArtistId = null;
export let editingArtistImageUrl = null;

export function clearArtistForm() {
  editingArtistId = null;
  editingArtistImageUrl = null;

  artistNameInput.value = "";
  artistEmailInput.value = "";
  artistPhoneInput.value = "";
  artistCityInput.value = "";
  artistCountryInput.value = "";
  artistBioInput.value = "";
  artistFacebookLinkInput.value = "";
  artistInstagramLinkInput.value = "";
  artistTwitterLinkInput.value = "";
  artistShippingCheckbox.checked = false;
  artistImageInput.value = "";
  currentArtistImage.innerHTML = "";
  addArtistBtn.textContent = "Add Artist";
  cancelEditBtn.style.display = "none";
  submitSuccessMsg.textContent = "";
  submitErrorMsg.textContent = "";
}
