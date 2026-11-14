import { authorizedFetch as fetch } from '../utils/admin-api';
import { sessionStorageAdapter } from '../utils/session-storage';
import { useEffect, useRef, useState } from "react";
import ImageFrameEditor from "../components/ImageFrameEditor";
import ProductImage from "../components/ProductImage";
import { validFrame } from "../utils/image-frame";

const API_URL = "https://mystore-backend-u6ey.onrender.com";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const HOME_IMAGE_REQUIRED =
  "A brand image is required to show this brand on the Home screen.";
const REMOVE_IMAGE_WHILE_HOME =
  'Turn off "Show on Home Screen" before removing the brand image.';

function Brands() {
  const [brands, setBrands] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingBrand, setEditingBrand] =
    useState(null);

  const [name, setName] = useState("");

  // Optional Home "Shop by Brands" fields.
  const [existingImage, setExistingImage] = useState("");

  const [imageFile, setImageFile] = useState(null);

  const [imagePreview, setImagePreview] = useState("");

  const [showOnHome, setShowOnHome] = useState(false);

  const [order, setOrder] = useState("0");

  // Same framing contract and editor as Product images; null = original logo fit.
  const [imageFrame, setImageFrame] = useState(null);

  const [formError, setFormError] = useState("");

  const fileInputRef = useRef(null);

  const hasImage = !!imageFile || !!existingImage;

  // ============================================================
  // AUTH / TOKEN REFRESH
  // ============================================================

const authorizedFetch = (url, options = {}) => fetch(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${sessionStorageAdapter.getItem("accessToken") || ""}` } });

  // ============================================================
  // GET BRANDS
  // ============================================================

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/brands`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to load brands"
        );
      }

      setBrands(data.brands || []);
    } catch (error) {
      console.log(
        "GET BRANDS ERROR:",
        error instanceof Error ? error.name : 'Error'
      );

      setError(
        error.message ||
        "Failed to load brands"
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    // Cancel a pending initial request on unmount/Strict Mode replay.
    const initialRequest = setTimeout(() => { fetchBrands(); }, 0);
    return () => clearTimeout(initialRequest);
  }, []);

  // ============================================================
  // FORM STATE
  // ============================================================

  const clearPreview = () => {
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
  };

  const resetForm = () => {
    clearPreview();
    setEditingBrand(null);
    setName("");
    setExistingImage("");
    setImageFile(null);
    setImagePreview("");
    setShowOnHome(false);
    setOrder("0");
    setImageFrame(null);
    setFormError("");
  };

  // ============================================================
  // OPEN ADD
  // ============================================================

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  // ============================================================
  // OPEN EDIT
  // ============================================================

  const openEditModal = (brand) => {
    resetForm();
    setEditingBrand(brand);
    setName(brand.name || "");
    setExistingImage(brand.image || "");
    setImagePreview(brand.image || "");
    setShowOnHome(brand.showOnHome === true);
    setOrder(String(brand.order ?? 0));
    setImageFrame(validFrame(brand.imageFrame) ? brand.imageFrame : null);
    setShowModal(true);
  };

  // ============================================================
  // CLOSE MODAL
  // ============================================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    resetForm();
  };

  // ============================================================
  // IMAGE
  // ============================================================

  const chooseImage = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!IMAGE_TYPES.includes(file.type)) {
      setFormError("Choose a JPG, PNG or WEBP image.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setFormError("Image must be smaller than 5 MB.");
      return;
    }

    clearPreview();
    setFormError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    // A new image starts with the original logo fit.
    setImageFrame(null);
  };

  const removeImage = () => {
    if (showOnHome) {
      setFormError(REMOVE_IMAGE_WHILE_HOME);
      return;
    }

    clearPreview();
    setImageFile(null);
    setExistingImage("");
    setImagePreview("");
    setImageFrame(null);
    setFormError("");
  };

  const toggleShowOnHome = (checked) => {
    if (checked && !hasImage) {
      setFormError(HOME_IMAGE_REQUIRED);
      return;
    }

    setFormError("");
    setShowOnHome(checked);
  };

  // Same upload endpoint as Departments/Products/Slideshow.
  const uploadImage = async (file) => {
    const payload = new FormData();
    payload.append("image", file);
    payload.append("type", "brands");

    const response = await authorizedFetch(`${API_URL}/upload/image`, {
      method: "POST",
      body: payload,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Failed to upload image");

    const imageUrl = typeof data.image === "string" ? data.image : "";

    if (!/^https?:\/\//i.test(imageUrl)) {
      throw new Error(
        "Image uploaded but the server did not return a recognized URL."
      );
    }

    return imageUrl;
  };

  // ============================================================
  // ADD / UPDATE
  // ============================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      alert("Please enter a brand name.");
      return;
    }

    const displayOrder = Number(String(order).trim() || "0");

    if (!Number.isInteger(displayOrder) || Math.abs(displayOrder) > 1000000) {
      setFormError("Display order must be a whole number.");
      return;
    }

    if (showOnHome && !hasImage) {
      setFormError(HOME_IMAGE_REQUIRED);
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      // Upload first; the brand is only saved once a public image URL exists.
      const image = imageFile ? await uploadImage(imageFile) : existingImage;

      let url;

      let method;

      if (editingBrand) {
        url =
          `${API_URL}/brands/${editingBrand._id}`;

        method = "PUT";
      } else {
        url =
          `${API_URL}/brands`;

        method = "POST";
      }

      const response = await authorizedFetch(
        url,
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedName,
            image,
            imageFrame: image ? imageFrame : null,
            showOnHome,
            order: displayOrder
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Something went wrong"
        );
      }

      alert(
        editingBrand
          ? "Brand updated successfully."
          : "Brand added successfully."
      );

      setSaving(false);
      setShowModal(false);
      resetForm();

      await fetchBrands();
    } catch (error) {
      console.log(
        "SAVE BRAND ERROR:",
        error instanceof Error ? error.name : 'Error'
      );

      alert(
        error.message ||
        "Error saving brand"
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETE
  // ============================================================

  const handleDelete = async (brand) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${brand.name}"?`
    );

    if (!confirmed) return;

    try {
      const response = await authorizedFetch(
        `${API_URL}/brands/${brand._id}`,
        {
          method: "DELETE"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to delete brand"
        );
      }

      alert(
        "Brand deleted successfully."
      );

      await fetchBrands();
    } catch (error) {
      console.log(
        "DELETE BRAND ERROR:",
        error instanceof Error ? error.name : 'Error'
      );

      alert(
        error.message ||
        "Error deleting brand"
      );
    }
  };

  // ============================================================
  // FILTER
  // ============================================================

  const filteredBrands =
    brands.filter((brand) =>
      brand.name
        ?.toLowerCase()
        .includes(search.toLowerCase())
    );

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="management-page">

        <div className="management-loading">

          <div className="management-spinner" />

          <p>
            Loading brands...
          </p>

        </div>

      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="management-page">

      {/* HEADER */}

      <div className="management-header">

        <div>
          <h1>
            Brands
          </h1>

          <p>
            Manage your product brands and the Home &quot;Shop by Brands&quot; section.
          </p>
        </div>

        <button
          type="button"
          className="management-add-button"
          onClick={openAddModal}
        >
          + Add Brand
        </button>

      </div>


      {/* SEARCH */}

      <div className="management-toolbar">

        <div className="management-search">

          <span>
            🔍
          </span>

          <input
            type="text"
            placeholder="Search brands..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

        </div>

        {search && (

          <button
            type="button"
            className="management-clear-button"
            onClick={() => setSearch("")}
          >
            Clear
          </button>

        )}

      </div>


      {/* ERROR */}

      {error && (

        <div className="management-error">

          <strong>
            Error
          </strong>

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={fetchBrands}
          >
            Try Again
          </button>

        </div>

      )}


      {/* COUNT */}

      <div className="management-count">

        {filteredBrands.length} brand
        {filteredBrands.length !== 1
          ? "s"
          : ""}

      </div>


      {/* TABLE */}

      <div className="management-table-container">

        <table className="management-table">

          <thead>

            <tr>

              <th>
                #
              </th>

              <th>
                Brand Name
              </th>

              <th>
                Home
              </th>

              <th>
                Order
              </th>

              <th>
                Created
              </th>

              <th>
                Actions
              </th>

            </tr>

          </thead>


          <tbody>

            {filteredBrands.length === 0 ? (

              <tr>

                <td
                  colSpan="6"
                  className="management-empty"
                >

                  <div>

                    <span>
                      🏷️
                    </span>

                    <h3>
                      No brands found
                    </h3>

                    <p>
                      Try another search or
                      add a new brand.
                    </p>

                  </div>

                </td>

              </tr>

            ) : (

              filteredBrands.map(
                (brand, index) => (

                  <tr key={brand._id}>

                    <td>
                      {index + 1}
                    </td>


                    <td>

                      <div className="management-name">
                        {brand.image && (
                          <div className="management-icon" style={{ borderRadius: "50%", background: "#FFFFFF" }}>
                            <ProductImage src={brand.image} alt="" imageFrame={brand.imageFrame} style={{ objectFit: "contain" }} />
                          </div>
                        )}
                        <strong>{brand.name}</strong>
                      </div>
                    </td>


                    <td>
                      {brand.showOnHome ? "Shown" : "Hidden"}
                    </td>


                    <td>
                      {brand.order ?? 0}
                    </td>


                    <td>

                      {brand.createdAt
                        ? new Date(
                            brand.createdAt
                          ).toLocaleDateString()
                        : "—"}

                    </td>


                    <td>

                      <div className="management-actions">

                        <button
                          type="button"
                          className="management-edit-button"
                          onClick={() =>
                            openEditModal(brand)
                          }
                        >
                          Edit
                        </button>


                        <button
                          type="button"
                          className="management-delete-button"
                          onClick={() =>
                            handleDelete(brand)
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )

            )}

          </tbody>

        </table>

      </div>


      {/* MODAL */}

      {showModal && (

        <div
          className="management-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }

          }}
        >

          <div className="management-modal">


            {/* HEADER */}

            <div className="management-modal-header">

              <div>

                <h2>
                  {editingBrand
                    ? "Edit Brand"
                    : "Add Brand"}
                </h2>

                <p>
                  {editingBrand
                    ? "Update the brand details."
                    : "Create a new product brand."}
                </p>

              </div>


              <button
                type="button"
                className="management-modal-close"
                onClick={closeModal}
              >
                ✕
              </button>

            </div>


            {/* FORM */}

            <form
              className="management-form"
              onSubmit={handleSubmit}
            >

              <div className="management-form-group">

                <label htmlFor="brand-name">
                  Brand Name *
                </label>

                <input
                  id="brand-name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Enter brand name"
                  required
                  autoFocus
                />

              </div>


              {/* BRAND IMAGE (optional) */}

              <div className="management-form-group">

                <label>
                  Brand Image{showOnHome ? " *" : " (optional)"}
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  disabled={saving}
                  onChange={chooseImage}
                  style={{ display: "none" }}
                />

                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: "50%",
                      border: "1px solid #E7DED1",
                      background: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Brand preview"
                        style={{ width: 68, height: 68, objectFit: "contain" }}
                      />
                    ) : (
                      <span style={{ fontSize: 12, color: "#817B71" }}>No image</span>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button
                      type="button"
                      className="management-cancel-button"
                      disabled={saving}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {hasImage ? "Replace image" : "Choose image"}
                    </button>

                    {hasImage && (
                      <button
                        type="button"
                        className="management-delete-button"
                        disabled={saving}
                        onClick={removeImage}
                      >
                        Remove image
                      </button>
                    )}
                  </div>
                </div>

                <span style={{ fontSize: 12, color: "#817B71" }}>
                  JPG, PNG or WEBP · max 5 MB · square logos look best
                </span>

                {imagePreview && (
                  <ImageFrameEditor
                    circle
                    src={imagePreview}
                    value={imageFrame}
                    onChange={setImageFrame}
                    onClear={() => setImageFrame(null)}
                    disabled={saving}
                  />
                )}

              </div>


              {/* SHOW ON HOME */}

              <div className="management-form-group">

                <label htmlFor="brand-show-on-home">
                  <input
                    id="brand-show-on-home"
                    type="checkbox"
                    checked={showOnHome}
                    disabled={saving}
                    onChange={(event) => toggleShowOnHome(event.target.checked)}
                  />
                  {" "}Show on Home Screen
                </label>

                <span style={{ fontSize: 12, color: "#817B71" }}>
                  Shows this brand in &quot;Shop by Brands&quot;. Requires an image. Brands without products stay hidden.
                </span>

              </div>


              {/* DISPLAY ORDER */}

              <div className="management-form-group">

                <label htmlFor="brand-order">
                  Display Order
                </label>

                <input
                  id="brand-order"
                  type="number"
                  step="1"
                  value={order}
                  disabled={saving}
                  onChange={(event) => setOrder(event.target.value)}
                />

                <span style={{ fontSize: 12, color: "#817B71" }}>
                  Lower numbers appear first. Equal numbers are sorted by name.
                </span>

              </div>


              {formError && (
                <div className="management-error" role="alert">
                  <span>{formError}</span>
                </div>
              )}


              <div className="management-form-actions">

                <button
                  type="button"
                  className="management-cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="management-save-button"
                  disabled={saving}
                >

                  {saving
                    ? "Saving..."
                    : editingBrand
                    ? "Update Brand"
                    : "Add Brand"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Brands;
