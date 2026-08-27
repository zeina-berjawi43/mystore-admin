import { useEffect, useState } from "react";

const API_URL = "https://mystore-backend-u6ey.onrender.com";

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

  // ============================================================
  // TOKEN
  // ============================================================

  const getToken = () => {
    return localStorage.getItem("accessToken");
  };

  // ============================================================
  // HEADERS
  // ============================================================

  const getHeaders = () => {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`
    };
  };

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
        error
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
    fetchBrands();
  }, []);

  // ============================================================
  // OPEN ADD
  // ============================================================

  const openAddModal = () => {
    setEditingBrand(null);
    setName("");
    setShowModal(true);
  };

  // ============================================================
  // OPEN EDIT
  // ============================================================

  const openEditModal = (brand) => {
    setEditingBrand(brand);
    setName(brand.name || "");
    setShowModal(true);
  };

  // ============================================================
  // CLOSE MODAL
  // ============================================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingBrand(null);
    setName("");
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

    try {
      setSaving(true);

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

      const response = await fetch(
        url,
        {
          method,
          headers: getHeaders(),
          body: JSON.stringify({
            name: trimmedName
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

      closeModal();

      await fetchBrands();
    } catch (error) {
      console.log(
        "SAVE BRAND ERROR:",
        error
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
      const response = await fetch(
        `${API_URL}/brands/${brand._id}`,
        {
          method: "DELETE",
          headers: getHeaders()
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
        error
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
            Manage your product brands.
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
                  colSpan="4"
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

                        <div className="management-icon">
                          🏷️
                        </div>

                        <strong>
                          {brand.name}
                        </strong>

                      </div>

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
                    ? "Update the brand name."
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

                <label>
                  Brand Name *
                </label>

                <input
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
