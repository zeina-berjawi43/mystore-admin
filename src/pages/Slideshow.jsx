import React, {
  useEffect,
  useState,
} from "react";

import "./Slideshow.css";

const API_URL = "https://mystore-backend-u6ey.onrender.com";

// ============================================================
// IMAGE URL
// ============================================================

const getImageUrl = (image) => {
  if (!image) {
    return "";
  }

  // IMPORTANT:
  // blob URLs and complete URLs must NOT be changed.
  if (
    image.startsWith("blob:") ||
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  if (image.startsWith("/")) {
    return `${API_URL}${image}`;
  }

  return `${API_URL}/${image}`;
};

// ============================================================
// COMPONENT
// ============================================================

function Slideshow() {
  const [slides, setSlides] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingSlide, setEditingSlide] =
    useState(null);

  // ============================================================
  // IMAGE STATES
  // ============================================================

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [imagePreview, setImagePreview] =
    useState("");

  const [isDraggingImage, setIsDraggingImage] =
    useState(false);

  // ============================================================
  // FORM
  // ============================================================

  const [form, setForm] = useState({
    image: "",
    order: 1,
    active: true,
  });

  // ============================================================
  // TOKEN
  // ============================================================

  const getToken = () => {
    return localStorage.getItem(
      "accessToken"
    );
  };

  // ============================================================
  // HEADERS
  // ============================================================

  const getHeaders = () => {
    const token = getToken();

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // ============================================================
  // FETCH SLIDES
  // ============================================================

  const fetchSlides = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/slideshows/admin/all`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      const data =
        await response.json();

      console.log(
        "================================================"
      );

      console.log(
        "SLIDESHOW API RESPONSE:"
      );

      console.log(data);

      console.log(
        "SLIDESHOW ARRAY:"
      );

      console.log(
        data.slides
      );

      console.log(
        "================================================"
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load slideshow"
        );
      }

      setSlides(
        data.slides || []
      );
    } catch (error) {
      console.log(
        "SLIDESHOW FETCH ERROR:",
        error
      );

      setError(
        error.message ||
          "Failed to load slideshow"
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // INITIAL
  // ============================================================

  useEffect(() => {
    fetchSlides();
  }, []);

  // ============================================================
  // FORM CHANGE
  // ============================================================

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm(
      (previous) => ({
        ...previous,

        [name]:
          type === "checkbox"
            ? checked
            : value,
      })
    );
  };

  // ============================================================
  // VALIDATE IMAGE
  // ============================================================

  const validateImage = (file) => {
    if (!file) {
      return false;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      alert(
        "Please select a valid image file."
      );

      return false;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      alert(
        "Image size must be less than 5 MB."
      );

      return false;
    }

    return true;
  };

  // ============================================================
  // SET SELECTED IMAGE
  // ============================================================

  const setSelectedImage = (file) => {
    if (!file) {
      return;
    }

    if (!validateImage(file)) {
      return;
    }

    // Revoke old blob URL
    if (
      imagePreview &&
      imagePreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    setSelectedFile(file);

    const preview =
      URL.createObjectURL(file);

    setImagePreview(preview);
  };

  // ============================================================
  // FILE CHANGE
  // ============================================================

  const handleFileChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedImage(file);

    // Allow selecting the same image again
    event.target.value = "";
  };

  // ============================================================
  // DRAG OVER
  // ============================================================

  const handleImageDragOver = (
    event
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (
      !saving &&
      !uploading
    ) {
      setIsDraggingImage(true);
    }
  };

  // ============================================================
  // DRAG ENTER
  // ============================================================

  const handleImageDragEnter = (
    event
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (
      !saving &&
      !uploading
    ) {
      setIsDraggingImage(true);
    }
  };

  // ============================================================
  // DRAG LEAVE
  // ============================================================

  const handleImageDragLeave = (
    event
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDraggingImage(false);
  };

  // ============================================================
  // DROP IMAGE
  // ============================================================

  const handleImageDrop = (
    event
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDraggingImage(false);

    if (
      saving ||
      uploading
    ) {
      return;
    }

    const file =
      event.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    setSelectedImage(file);
  };

  // ============================================================
// UPLOAD IMAGE
// ============================================================

const uploadImage = async () => {
  if (!selectedFile) {
    return null;
  }

  const formData = new FormData();

  formData.append(
    "image",
    selectedFile
  );

  // IMPORTANT:
  // Backend expects "type", not "bucket".
  // "slideshow" will be mapped by the backend
  // to the Supabase bucket "slideshow-images".
  formData.append(
    "type",
    "slideshow"
  );

  const token =
    getToken();

  const response =
    await fetch(
      `${API_URL}/upload/image`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        body: formData,
      }
    );

  const data =
    await response.json();

  console.log(
    "UPLOAD IMAGE RESPONSE:",
    data
  );

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to upload image"
    );
  }

  if (!data.image) {
    throw new Error(
      "Image path was not returned by the server."
    );
  }

  console.log(
    "UPLOADED IMAGE PATH:",
    data.image
  );

  console.log(
    "UPLOADED BUCKET:",
    data.bucket
  );

  console.log(
    "UPLOADED TYPE:",
    data.type
  );

  return data.image;
};

  // ============================================================
  // RESET
  // ============================================================

  const resetForm = () => {
    if (
      imagePreview &&
      imagePreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    setForm({
      image: "",

      order:
        slides.length + 1,

      active: true,
    });

    setSelectedFile(null);
    setImagePreview("");
    setIsDraggingImage(false);
  };

  // ============================================================
  // OPEN ADD
  // ============================================================

  const openAddModal = () => {
    setEditingSlide(null);

    if (
      imagePreview &&
      imagePreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    setSelectedFile(null);
    setImagePreview("");
    setIsDraggingImage(false);

    setForm({
      image: "",

      order:
        slides.length + 1,

      active: true,
    });

    setShowModal(true);
  };

  // ============================================================
  // OPEN EDIT
  // ============================================================

  const openEditModal = (
    slide
  ) => {
    setEditingSlide(slide);

    setSelectedFile(null);
    setIsDraggingImage(false);

    const finalImageUrl =
      getImageUrl(
        slide.image
      );

    console.log(
      "EDIT SLIDE ORIGINAL IMAGE:",
      slide.image
    );

    console.log(
      "EDIT SLIDE FINAL IMAGE URL:",
      finalImageUrl
    );

    setImagePreview(
      finalImageUrl
    );

    setForm({
      image:
        slide.image || "",

      order:
        slide.order || 1,

      active:
        slide.active !== false,
    });

    setShowModal(true);
  };

  // ============================================================
  // CLOSE MODAL
  // ============================================================

  const closeModal = () => {
    if (
      saving ||
      uploading
    ) {
      return;
    }

    setShowModal(false);
    setEditingSlide(null);

    resetForm();
  };

  // ============================================================
  // SAVE
  // ============================================================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (
        !editingSlide &&
        !selectedFile
      ) {
        alert(
          "Please select an image."
        );

        return;
      }

      const order =
        Number(form.order);

      if (
        !Number.isInteger(order) ||
        order < 1
      ) {
        alert(
          "Order must be a positive number."
        );

        return;
      }

      try {
        setSaving(true);

        let imagePath =
          editingSlide
            ? editingSlide.image
            : "";

        // ======================================================
        // UPLOAD NEW IMAGE
        // ======================================================

        if (selectedFile) {
          setUploading(true);

          imagePath =
            await uploadImage();

          setUploading(false);
        }

        if (!imagePath) {
          throw new Error(
            "Image is required."
          );
        }

        // ======================================================
        // BODY
        // ======================================================

        const body = {
          image:
            imagePath,

          order,

          active:
            form.active,
        };

        console.log(
          "SAVE SLIDE BODY:",
          body
        );

        // ======================================================
        // RESPONSE
        // ======================================================

        let response;

        // ======================================================
        // EDIT
        // ======================================================

        if (editingSlide) {
          response =
            await fetch(
              `${API_URL}/slideshows/${editingSlide._id}`,
              {
                method: "PUT",

                headers:
                  getHeaders(),

                body:
                  JSON.stringify(
                    body
                  ),
              }
            );
        }

        // ======================================================
        // ADD
        // ======================================================

        else {
          response =
            await fetch(
              `${API_URL}/slideshows`,
              {
                method: "POST",

                headers:
                  getHeaders(),

                body:
                  JSON.stringify(
                    body
                  ),
              }
            );
        }

        const data =
          await response.json();

        console.log(
          "SAVE SLIDE RESPONSE:",
          data
        );

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to save slide"
          );
        }

        alert(
          editingSlide
            ? "Slide updated successfully."
            : "Slide added successfully."
        );

        setShowModal(false);
        setEditingSlide(null);
        setSelectedFile(null);

        if (
          imagePreview &&
          imagePreview.startsWith("blob:")
        ) {
          URL.revokeObjectURL(
            imagePreview
          );
        }

        setImagePreview("");
        setIsDraggingImage(false);

        await fetchSlides();
      } catch (error) {
        console.log(
          "SAVE SLIDE ERROR:",
          error
        );

        alert(
          error.message ||
            "Error saving slide"
        );
      } finally {
        setSaving(false);
        setUploading(false);
      }
    };

  // ============================================================
  // TOGGLE ACTIVE
  // ============================================================

  const toggleActive =
    async (slide) => {
      try {
        const response =
          await fetch(
            `${API_URL}/slideshows/${slide._id}`,
            {
              method: "PUT",

              headers:
                getHeaders(),

              body:
                JSON.stringify({
                  active:
                    !slide.active,
                }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to update slide"
          );
        }

        setSlides(
          (previous) =>
            previous.map(
              (item) =>
                item._id ===
                slide._id
                  ? {
                      ...item,

                      active:
                        !item.active,
                    }
                  : item
            )
        );
      } catch (error) {
        alert(
          error.message ||
            "Error updating slide"
        );
      }
    };

  // ============================================================
  // DELETE
  // ============================================================

  const handleDelete =
    async (slide) => {
      const confirmed =
        window.confirm(
          "Are you sure you want to delete this slide?"
        );

      if (!confirmed) {
        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}/slideshows/${slide._id}`,
            {
              method: "DELETE",
              headers: getHeaders(),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to delete slide"
          );
        }

        alert(
          "Slide deleted successfully."
        );

        await fetchSlides();
      } catch (error) {
        alert(
          error.message ||
            "Error deleting slide"
        );
      }
    };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="slideshow-page">

        <div className="slideshow-loading">

          <div className="slideshow-spinner" />

          <p>
            Loading slideshow...
          </p>

        </div>

      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="slideshow-page">

      <div className="slideshow-header">

        <div>

          <h1>
            Slideshow
          </h1>

          <p>
            Manage the images displayed
            on the Home page.
          </p>

        </div>

        <button
          type="button"
          className="add-slide-button"
          onClick={openAddModal}
        >
          + Add Slide
        </button>

      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="slideshow-error">

          <strong>
            Error
          </strong>

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={fetchSlides}
          >
            Try Again
          </button>

        </div>
      )}

      {/* ======================================================
          COUNT
      ====================================================== */}

      <div className="slideshow-count">

        {slides.length} slide
        {slides.length !== 1
          ? "s"
          : ""}

      </div>

      {/* ======================================================
          EMPTY
      ====================================================== */}

      {slides.length === 0 ? (

        <div className="slideshow-empty">

          <div className="empty-slide-icon">
            🖼️
          </div>

          <h3>
            No slideshow images
          </h3>

          <p>
            Add images to display them
            on the Home page.
          </p>

          <button
            type="button"
            onClick={
              openAddModal
            }
          >
            + Add First Slide
          </button>

        </div>

      ) : (

        <div className="slideshow-grid">

          {slides.map(
            (slide) => {

              const originalImage =
                slide.image || "";

              const finalImageUrl =
                getImageUrl(
                  originalImage
                );

              console.log(
                "SLIDE ORIGINAL IMAGE:",
                originalImage
              );

              console.log(
                "SLIDE FINAL IMAGE URL:",
                finalImageUrl
              );

              return (
                <div
                  className="slide-card"
                  key={slide._id}
                >

                  <div className="slide-image-container">

                    {finalImageUrl ? (

                      <img
                        src={
                          finalImageUrl
                        }
                        alt={`Slide ${slide.order}`}
                        onLoad={() => {
                          console.log(
                            "SLIDE IMAGE LOADED SUCCESSFULLY:",
                            finalImageUrl
                          );
                        }}
                        onError={(event) => {
                          console.error(
                            "================================================"
                          );

                          console.error(
                            "SLIDE IMAGE LOAD ERROR"
                          );

                          console.error(
                            "Original image:",
                            originalImage
                          );

                          console.error(
                            "Final image URL:",
                            finalImageUrl
                          );

                          console.error(
                            "================================================"
                          );
                        }}
                      />

                    ) : (

                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background:
                            "#f5f5f5",
                          color: "#777",
                          fontSize: "14px",
                        }}
                      >
                        No image
                      </div>

                    )}

                    <span className="slide-order">
                      #{slide.order}
                    </span>

                  </div>

                  <div className="slide-card-content">

                    <div className="slide-info">

                      <span>
                        Slide #
                        {slide.order}
                      </span>

                      <strong
                        className={
                          slide.active
                            ? "active-text"
                            : "inactive-text"
                        }
                      >
                        {slide.active
                          ? "Active"
                          : "Inactive"}
                      </strong>

                    </div>

                    <div className="slide-actions">

                      <button
                        type="button"
                        className="edit-slide-button"
                        onClick={() =>
                          openEditModal(
                            slide
                          )
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="toggle-slide-button"
                        onClick={() =>
                          toggleActive(
                            slide
                          )
                        }
                      >
                        {slide.active
                          ? "Disable"
                          : "Enable"}
                      </button>

                      <button
                        type="button"
                        className="delete-slide-button"
                        onClick={() =>
                          handleDelete(
                            slide
                          )
                        }
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                </div>
              );
            }
          )}

        </div>

      )}

      {/* ======================================================
          MODAL
      ====================================================== */}

      {showModal && (

        <div
          className="slide-modal-overlay"
          onMouseDown={(
            event
          ) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }

          }}
        >

          <div className="slide-modal">

            <div className="slide-modal-header">

              <div>

                <h2>
                  {editingSlide
                    ? "Edit Slide"
                    : "Add Slide"}
                </h2>

                <p>
                  Choose an image for
                  the Home slideshow.
                </p>

              </div>

              <button
                type="button"
                className="slide-modal-close"
                onClick={
                  closeModal
                }
                disabled={
                  saving ||
                  uploading
                }
              >
                ✕
              </button>

            </div>

            <form
              className="slide-form"
              onSubmit={
                handleSubmit
              }
            >

              {/* ==================================================
                  IMAGE UPLOAD / DRAG & DROP
              ================================================== */}

              <div className="slide-form-group">

                <label>
                  Slide Image *
                </label>

                <label
                  htmlFor="slide-image-input"
                  className={`slide-image-upload-box ${
                    isDraggingImage
                      ? "slide-image-upload-dragging"
                      : ""
                  } ${
                    imagePreview
                      ? "has-image"
                      : ""
                  }`}
                  onDragOver={
                    handleImageDragOver
                  }
                  onDragEnter={
                    handleImageDragEnter
                  }
                  onDragLeave={
                    handleImageDragLeave
                  }
                  onDrop={
                    handleImageDrop
                  }
                >

                  {imagePreview ? (

                    <div className="slide-image-preview-wrapper">

                      <img
                        src={
                          imagePreview
                        }
                        alt="Slide preview"
                        className="slide-image-upload-preview"
                      />

                      <div className="slide-image-upload-overlay">

                        <strong>
                          Drop another image
                          or click to replace
                        </strong>

                      </div>

                    </div>

                  ) : (

                    <div className="slide-upload-placeholder">

                      <div className="slide-upload-icon">
                        📷
                      </div>

                      <strong>
                        Drag & Drop your image here
                      </strong>

                      <span>
                        or click to browse
                      </span>

                      <small>
                        JPG, PNG, WEBP
                        or GIF
                        <br />
                        Maximum 5 MB
                      </small>

                    </div>

                  )}

                </label>

                <input
                  id="slide-image-input"
                  className="hidden-slide-file-input"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={
                    handleFileChange
                  }
                  disabled={
                    saving ||
                    uploading
                  }
                />

                {selectedFile && (
                  <div className="selected-slide-image-info">

                    📎{" "}
                    {
                      selectedFile.name
                    }

                    <span>
                      Ready to upload
                    </span>

                  </div>
                )}

                {editingSlide &&
                  !selectedFile && (
                    <small className="current-slide-text">
                      Current image is
                      already uploaded.
                      Drag & drop or choose
                      another image only if
                      you want to replace it.
                    </small>
                  )}

              </div>

              {/* ==================================================
                  ORDER
              ================================================== */}

              <div className="slide-form-group">

                <label>
                  Display Order *
                </label>

                <input
                  type="number"
                  name="order"
                  value={
                    form.order
                  }
                  onChange={
                    handleChange
                  }
                  min="1"
                  step="1"
                  required
                />

              </div>

              {/* ==================================================
                  ACTIVE
              ================================================== */}

              <label className="slide-active-row">

                <input
                  type="checkbox"
                  name="active"
                  checked={
                    form.active
                  }
                  onChange={
                    handleChange
                  }
                />

                <span>
                  Show this image
                  in the slideshow
                </span>

              </label>

              {/* ==================================================
                  ACTIONS
              ================================================== */}

              <div className="slide-form-actions">

                <button
                  type="button"
                  className="slide-cancel-button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving ||
                    uploading
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="slide-save-button"
                  disabled={
                    saving ||
                    uploading
                  }
                >
                  {uploading
                    ? "Uploading..."
                    : saving
                    ? "Saving..."
                    : editingSlide
                    ? "Update Slide"
                    : "Add Slide"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Slideshow;
