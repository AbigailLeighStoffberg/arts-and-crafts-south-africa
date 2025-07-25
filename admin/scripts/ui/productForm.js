// scripts/ui/productForm.js
import {
  productNameInput,
  productDescriptionInput,
  productCategoryInput,
  productArtistIdSelect,
  productPriceUSDInput,
  productPriceZARInput,
  productSKUInput,
  productStockInput,
  productMainImageInput,
  currentProductMainImage,
  productThumbnailImageInput,
  currentProductThumbnailImage,
  productAdditionalImagesInput,
  currentProductAdditionalImages,
  addProductBtn,
  cancelEditProductBtn,
  productSubmitSuccessMsg,
  productSubmitErrorMsg
} from "./domElements.js";

export let editingProductId = null;
export let editingProductMainImageUrl = null;
export let editingProductThumbnailImageUrl = null;
export let editingProductAdditionalImagesUrls = [];

export function clearProductForm() {
  editingProductId = null;
  editingProductMainImageUrl = null;
  editingProductThumbnailImageUrl = null;
  editingProductAdditionalImagesUrls = [];

  productNameInput.value = "";
  productDescriptionInput.value = "";
  productCategoryInput.value = "";
  productArtistIdSelect.value = "";
  productPriceUSDInput.value = "";
  productPriceZARInput.value = "";
  productSKUInput.value = "";
  productStockInput.value = "";
  productMainImageInput.value = "";
  currentProductMainImage.innerHTML = "";
  productThumbnailImageInput.value = "";
  currentProductThumbnailImage.innerHTML = "";
  productAdditionalImagesInput.value = "";
  currentProductAdditionalImages.innerHTML = "";
  addProductBtn.textContent = "Add Product";
  cancelEditProductBtn.style.display = "none";
  productSubmitSuccessMsg.textContent = "";
  productSubmitErrorMsg.textContent = "";
}
