
import {
  useEffect,
  useState
} from "react";


const API_URL =
  "https://mystore-backend-u6ey.onrender.com";


function Categories() {

  const [
    categories,
    setCategories
  ] = useState([]);


  const [
    search,
    setSearch
  ] = useState("");


  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    saving,
    setSaving
  ] = useState(false);


  const [
    error,
    setError
  ] = useState("");


  const [
    showModal,
    setShowModal
  ] = useState(false);


  const [
    editingCategory,
    setEditingCategory
  ] = useState(null);


  const [
    name,
    setName
  ] = useState("");


  const [
    image,
    setImage
  ] = useState(null);


  const [
    imagePreview,
    setImagePreview
  ] = useState("");


  // ============================================================
  // TOKEN
  // ============================================================

  const getToken = () => {

    return localStorage.getItem(
      "accessToken"
    );

  };


  // ============================================================
  // GET CATEGORIES
  // ============================================================

  const fetchCategories =
    async () => {

      try {

        setLoading(true);

        setError("");


        const response =
          await fetch(
            `${API_URL}/categories`
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
            "Failed to load categories"
          );

        }


        setCategories(
          data.categories || []
        );

      } catch (error) {

        console.log(
          "GET CATEGORIES ERROR:",
          error
        );


        setError(
          error.message ||
          "Failed to load categories"
        );

      } finally {

        setLoading(false);

      }

    };


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {

    fetchCategories();

  }, []);


  // ============================================================
  // IMAGE URL
  // ============================================================

  const buildImageUrl =
    (imagePath) => {

      if (!imagePath) {

        return "";

      }


      // MongoDB now stores the complete
      // Supabase public URL.

      if (
        imagePath.startsWith(
          "http://"
        ) ||
        imagePath.startsWith(
          "https://"
        ) ||
        imagePath.startsWith(
          "blob:"
        )
      ) {

        return imagePath;

      }


      // Fallback for old records
      // that may still contain a backend path.

      return `${API_URL}/${imagePath.replace(
        /^\/+/,
        ""
      )}`;

    };


  // ============================================================
  // OPEN ADD
  // ============================================================

  const openAddModal = () => {

    setEditingCategory(null);

    setName("");

    setImage(null);

    setImagePreview("");

    setShowModal(true);

  };


  // ============================================================
  // OPEN EDIT
  // ============================================================

  const openEditModal =
    (category) => {

      setEditingCategory(
        category
      );

      setName(
        category.name || ""
      );

      setImage(null);

      setImagePreview(
        buildImageUrl(
          category.image
        )
      );

      setShowModal(true);

    };


  // ============================================================
  // IMAGE CHANGE
  // ============================================================

  const handleImageChange =
    (event) => {

      const file =
        event.target.files?.[0];


      if (!file) {

        return;

      }


      const allowedTypes = [

        "image/jpeg",

        "image/jpg",

        "image/png",

        "image/webp"

      ];


      if (
        !allowedTypes.includes(
          file.type
        )
      ) {

        alert(
          "Please select a JPG, JPEG, PNG or WEBP image."
        );

        event.target.value = "";

        return;

      }


      if (
        file.size >
        5 * 1024 * 1024
      ) {

        alert(
          "Image must be smaller than 5MB."
        );

        event.target.value = "";

        return;

      }


      // ======================================================
      // CLEAN OLD PREVIEW URL
      // ======================================================

      if (
        imagePreview &&
        imagePreview.startsWith(
          "blob:"
        )
      ) {

        URL.revokeObjectURL(
          imagePreview
        );

      }


      setImage(
        file
      );


      setImagePreview(
        URL.createObjectURL(
          file
        )
      );

    };


  // ============================================================
  // CLOSE MODAL
  // ============================================================

  const closeModal = () => {

    if (saving) {

      return;

    }


    if (
      imagePreview &&
      imagePreview.startsWith(
        "blob:"
      )
    ) {

      URL.revokeObjectURL(
        imagePreview
      );

    }


    setShowModal(false);

    setEditingCategory(null);

    setName("");

    setImage(null);

    setImagePreview("");

  };


  // ============================================================
  // ADD / UPDATE
  // ============================================================

  const handleSubmit =
    async (event) => {

      event.preventDefault();


      const trimmedName =
        name.trim();


      if (!trimmedName) {

        alert(
          "Please enter a category name."
        );

        return;

      }


      try {

        setSaving(true);


        let url;

        let method;


        // ======================================================
        // ADD
        // ======================================================

        if (
          editingCategory
        ) {

          url =
            `${API_URL}/categories/${editingCategory._id}`;

          method =
            "PUT";

        } else {

          url =
            `${API_URL}/categories`;

          method =
            "POST";

        }


        // ======================================================
        // FORM DATA
        // ======================================================

        const formData =
          new FormData();


        formData.append(
          "name",
          trimmedName
        );


        // ======================================================
        // SEND REAL FILE
        // ======================================================

        if (
          image
        ) {

          formData.append(
            "image",
            image
          );

        }


        console.log(
          "Saving category..."
        );

        console.log(
          "Name:",
          trimmedName
        );

        console.log(
          "Image:",
          image
            ? image.name
            : "No new image"
        );


        // ======================================================
        // SEND TO BACKEND
        // ======================================================

        const response =
          await fetch(
            url,
            {

              method,

              headers: {

                Authorization:
                  `Bearer ${getToken()}`

              },

              body:
                formData

            }
          );


        const data =
          await response.json();


        console.log(
          "CATEGORY RESPONSE:",
          data
        );


        if (!response.ok) {

          throw new Error(
            data.message ||
            "Something went wrong"
          );

        }


        // ======================================================
        // SUCCESS
        // ======================================================

        alert(
          editingCategory
            ? "Category updated successfully."
            : "Category added successfully."
        );


        closeModal();


        await fetchCategories();

      } catch (error) {

        console.log(
          "SAVE CATEGORY ERROR:",
          error
        );


        alert(
          error.message ||
          "Error saving category"
        );

      } finally {

        setSaving(false);

      }

    };


  // ============================================================
  // DELETE
  // ============================================================

  const handleDelete =
    async (category) => {

      const confirmed =
        window.confirm(
          `Are you sure you want to delete "${category.name}"?`
        );


      if (!confirmed) {

        return;

      }


      try {

        const response =
          await fetch(
            `${API_URL}/categories/${category._id}`,
            {

              method:
                "DELETE",

              headers: {

                Authorization:
                  `Bearer ${getToken()}`

              }

            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
            "Failed to delete category"
          );

        }


        alert(
          "Category deleted successfully."
        );


        await fetchCategories();

      } catch (error) {

        console.log(
          "DELETE CATEGORY ERROR:",
          error
        );


        alert(
          error.message ||
          "Error deleting category"
        );

      }

    };


  // ============================================================
  // FILTER
  // ============================================================

  const filteredCategories =
    categories.filter(
      (category) =>
        category.name
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          )
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
            Loading categories...
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
            Categories
          </h1>

          <p>
            Manage your product categories.
          </p>

        </div>


        <button
          type="button"
          className="management-add-button"
          onClick={
            openAddModal
          }
        >
          + Add Category
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
            placeholder="Search categories..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

        </div>


        {search && (

          <button
            type="button"
            className="management-clear-button"
            onClick={() =>
              setSearch("")
            }
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
            onClick={
              fetchCategories
            }
          >
            Try Again
          </button>

        </div>

      )}


      {/* COUNT */}

      <div className="management-count">

        {filteredCategories.length}

        {" "}

        {filteredCategories.length === 1
          ? "category"
          : "categories"}

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
                Category
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

            {filteredCategories.length === 0 ? (

              <tr>

                <td
                  colSpan="4"
                  className="management-empty"
                >

                  <div>

                    <span>
                      📂
                    </span>

                    <h3>
                      No categories found
                    </h3>

                    <p>
                      Try another search or
                      add a new category.
                    </p>

                  </div>

                </td>

              </tr>

            ) : (

              filteredCategories.map(
                (
                  category,
                  index
                ) => (

                  <tr
                    key={
                      category._id
                    }
                  >

                    <td>
                      {index + 1}
                    </td>


                    <td>

                      <div
                        className="management-name"
                      >

                        <div
                          className="management-icon"
                        >

                          {category.image ? (

                            <img
                              src={
                                buildImageUrl(
                                  category.image
                                )
                              }
                              alt={
                                category.name
                              }
                              style={{
                                width:
                                  "100%",

                                height:
                                  "100%",

                                objectFit:
                                  "cover",

                                borderRadius:
                                  "inherit"
                              }}
                            />

                          ) : (

                            <span>
                              📂
                            </span>

                          )}

                        </div>


                        <strong>
                          {category.name}
                        </strong>

                      </div>

                    </td>


                    <td>

                      {category.createdAt
                        ? new Date(
                            category.createdAt
                          ).toLocaleDateString()
                        : "—"}

                    </td>


                    <td>

                      <div
                        className="management-actions"
                      >

                        <button
                          type="button"
                          className="management-edit-button"
                          onClick={() =>
                            openEditModal(
                              category
                            )
                          }
                        >
                          Edit
                        </button>


                        <button
                          type="button"
                          className="management-delete-button"
                          onClick={() =>
                            handleDelete(
                              category
                            )
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

          <div
            className="management-modal"
          >

            <div
              className="management-modal-header"
            >

              <div>

                <h2>

                  {editingCategory
                    ? "Edit Category"
                    : "Add Category"}

                </h2>


                <p>

                  {editingCategory
                    ? "Update the category name or image."
                    : "Create a new product category."}

                </p>

              </div>


              <button
                type="button"
                className="management-modal-close"
                onClick={
                  closeModal
                }
              >
                ✕
              </button>

            </div>


            <form
              className="management-form"
              onSubmit={
                handleSubmit
              }
            >

              {/* NAME */}

              <div
                className="management-form-group"
              >

                <label>
                  Category Name *
                </label>


                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="Enter category name"
                  required
                  autoFocus
                />

              </div>


              {/* IMAGE */}

              <div
                className="management-form-group"
              >

                <label>
                  Category Image
                </label>


                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={
                    handleImageChange
                  }
                />


                <small
                  style={{
                    display:
                      "block",

                    marginTop:
                      "6px",

                    color:
                      "#888"
                  }}
                >
                  JPG, PNG or WEBP. Max 5MB.
                </small>


                {imagePreview && (

                  <div
                    style={{
                      marginTop:
                        "12px",

                      width:
                        "90px",

                      height:
                        "90px",

                      borderRadius:
                        "16px",

                      overflow:
                        "hidden",

                      border:
                        "1px solid #E0E0E0"
                    }}
                  >

                    <img
                      src={
                        imagePreview
                      }
                      alt="Preview"
                      style={{
                        width:
                          "100%",

                        height:
                          "100%",

                        objectFit:
                          "cover"
                      }}
                    />

                  </div>

                )}

              </div>


              {/* ACTIONS */}

              <div
                className="management-form-actions"
              >

                <button
                  type="button"
                  className="management-cancel-button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="management-save-button"
                  disabled={
                    saving
                  }
                >

                  {saving
                    ? "Saving..."
                    : editingCategory
                    ? "Update Category"
                    : "Add Category"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );

}


export default Categories;
