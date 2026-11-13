import { authorizedFetch as fetch } from '../utils/admin-api';
import { sessionStorageAdapter } from '../utils/session-storage';
import {
useEffect,
useState
} from "react";

const API_URL =
"https://mystore-backend-u6ey.onrender.com";

function Categories() {
const [departments, setDepartments] = useState([]);
const [departmentId, setDepartmentId] = useState("");
const [departmentFilter, setDepartmentFilter] = useState("");


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

// ============================================================
// TOKEN
// ============================================================

const getToken = () => {


return sessionStorageAdapter.getItem(
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
      error instanceof Error ? error.name : 'Error'
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
const initialRequest = setTimeout(() => { fetchCategories(); }, 0);
fetch(`${API_URL}/departments`).then(async response => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to load departments");
  setDepartments(data.departments || []);
}).catch(error => setError(error.message));
return () => clearTimeout(initialRequest);

}, []);

// ============================================================
// OPEN ADD
// ============================================================

const openAddModal = () => {


setEditingCategory(null);
setDepartmentId("");

setName("");

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
  setDepartmentId(typeof category.department === "object" ? category.department?._id || "" : category.department || "");

  setShowModal(true);

};


// ============================================================
// CLOSE MODAL
// ============================================================

const closeModal = () => {


if (saving) {

  return;

}


setShowModal(false);

setEditingCategory(null);
setDepartmentId("");

setName("");


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


  if (!departmentId) { alert("Please select a department."); return; }

  try {

    setSaving(true);


    let url;

    let method;


    // ======================================================
    // ADD / UPDATE
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


    formData.append("department", departmentId);

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
      error instanceof Error ? error.name : 'Error'
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
      error instanceof Error ? error.name : 'Error'
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
(category.name || "").toLowerCase().includes(search.toLowerCase()) &&
(!departmentFilter || (typeof category.department === "object" ? category.department?._id : category.department) === departmentFilter)
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


    <select aria-label="Filter by department" value={departmentFilter} onChange={event => setDepartmentFilter(event.target.value)}><option value="">All departments</option>{departments.map(dept => <option key={dept._id} value={dept._id}>{dept.name}</option>)}</select>

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

          <th>Department</th>

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
              colSpan="5"
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
                      <span>
                        📂
                      </span>
                    </div>


                    <strong>
                      {category.name}
                    </strong>

                  </div>

                </td>
                <td>{departments.find(dept => dept._id === (typeof category.department === "object" ? category.department?._id : category.department))?.name || category.department?.name || "Unassigned"}</td>



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
                ? "Update the category name or department."
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


          <div className="management-form-group"><label htmlFor="category-department">Department *</label><select id="category-department" value={departmentId} onChange={event => setDepartmentId(event.target.value)} required><option value="">Select department</option>{departments.map(dept => <option key={dept._id} value={dept._id}>{dept.name}</option>)}</select></div>

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
