import { useEffect, useRef, useState } from "react";

const API_URL = "https://mystore-backend-u6ey.onrender.com";
const emptyForm = { name: "", image: "", order: "0", active: true };
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [draggingImage, setDraggingImage] = useState(false);
  const previewUrl = useRef(null);
  const fileInputRef = useRef(null);

  const clearPreview = () => {
    if (previewUrl.current) {
      URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = null;
    }
  };

  useEffect(() => () => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/departments`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load departments");
      setDepartments(data.departments || []);
    } catch (err) {
      setError(err.message || "Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const closeModal = () => {
    if (saving) return;
    clearPreview();
    setImageFile(null);
    setImagePreview("");
    setShowModal(false);
  };

  const openAdd = () => {
    clearPreview();
    setEditing(null);
    setForm({ ...emptyForm });
    setImageFile(null);
    setImagePreview("");
    setShowModal(true);
  };

  const openEdit = (department) => {
    clearPreview();
    setEditing(department);
    setForm({
      name: department.name || "",
      image: department.image || "",
      order: String(department.order ?? 0),
      active: department.active !== false,
    });
    setImageFile(null);
    setImagePreview(department.image || "");
    setShowModal(true);
  };

  const setSelectedImage = (file) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Choose a JPG, PNG or WEBP image.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      alert("Image must be smaller than 5 MB.");
      return;
    }
    clearPreview();
    const url = URL.createObjectURL(file);
    previewUrl.current = url;
    setImageFile(file);
    setImagePreview(url);
  };

  const chooseImage = (event) => {
    setSelectedImage(event.target.files?.[0]);
    event.target.value = "";
  };

  const dropImage = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDraggingImage(false);
    setSelectedImage(event.dataTransfer.files?.[0]);
  };

  const refreshAdminAccessToken = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) throw new Error("Session expired. Please log in again.");

    const response = await fetch(`${API_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await response.json();

    if (!response.ok || !data?.accessToken) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("isLoggedIn");
      throw new Error("Session expired. Please log in again.");
    }

    localStorage.setItem("accessToken", data.accessToken);
    return data.accessToken;
  };

  const getValidAdminToken = async () => {
    const token = localStorage.getItem("accessToken");
    return token || refreshAdminAccessToken();
  };

  const authorizedFetch = async (url, options = {}) => {
    let token = await getValidAdminToken();

    const makeRequest = (accessToken) =>
      fetch(url, {
        ...options,
        headers: { ...(options.headers || {}), Authorization: `Bearer ${accessToken}` },
      });

    let response = await makeRequest(token);
    if (response.status === 401) {
      token = await refreshAdminAccessToken();
      response = await makeRequest(token);
    }
    return response;
  };

  const uploadImage = async (file) => {
    const payload = new FormData();
    payload.append("image", file);
    // Existing backend image validation recognizes "categories".
    // If the upload endpoint has a dedicated "departments" type, change this value there and here.
    payload.append("type", "categories");

    const response = await authorizedFetch(`${API_URL}/upload/image`, {
      method: "POST",
      body: payload,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to upload image");

    const imageUrl =
  data.image ||
  data.url ||
  data.imageUrl ||
  data.image?.url ||
  data.data?.url;
    if (typeof url !== "string" || !/^https?:\/\//i.test(url)) {
      throw new Error("Image uploaded but the server did not return a recognized URL. Check /upload/image response format.");
    }
    return url;
  };

  const save = async (event) => {
    event.preventDefault();
    if (saving) return;
    const name = form.name.trim();
    const order = Number(form.order);
    if (!name) return alert("Department name is required.");
    if (!form.order.trim() || !Number.isFinite(order) || !Number.isInteger(order)) {
      return alert("Enter a valid whole-number order.");
    }
    try {
      setSaving(true);
      // Upload first; only save the department once a public image URL is available.
      const image = imageFile ? await uploadImage(imageFile) : form.image;
      const response = await authorizedFetch(
        editing ? `${API_URL}/departments/${editing._id}` : `${API_URL}/departments`,
        {
          method: editing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            image,
            order,
            ...(editing ? { active: form.active } : {}),
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save department");
      clearPreview();
      setImageFile(null);
      setImagePreview("");
      setShowModal(false);
      await load();
    } catch (err) {
      alert(err.message || "Failed to save department");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (department) => {
    if (!window.confirm(`Delete "${department.name}"? Departments with categories cannot be deleted.`)) return;
    try {
      const response = await authorizedFetch(`${API_URL}/departments/${department._id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete department");
      await load();
    } catch (err) {
      alert(err.message || "Failed to delete department");
    }
  };

  const filtered = departments.filter((item) =>
    item.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="management-page">
      <div className="management-header">
        <div><h1>Departments</h1><p>Manage store departments and their display order.</p></div>
        <button type="button" className="management-add-button" onClick={openAdd}>+ Add Department</button>
      </div>
      <div className="management-toolbar">
        <div className="management-search"><span>🔍</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search departments..." /></div>
        {search && <button type="button" className="management-clear-button" onClick={() => setSearch("")}>Clear</button>}
      </div>
      {error && <div className="management-error"><strong>Error</strong><span>{error}</span><button type="button" onClick={load}>Try Again</button></div>}
      {loading ? <div className="management-loading"><div className="management-spinner" /><p>Loading departments...</p></div> : (
        <>
          <div className="management-count">{filtered.length} departments</div>
          <div className="management-table-container">
            <table className="management-table">
              <thead><tr><th>#</th><th>Department</th><th>Order</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.length === 0 ? <tr><td colSpan="5" className="management-empty">No departments found.</td></tr> : filtered.map((item, index) => (
                  <tr key={item._id}>
                    <td>{index + 1}</td>
                    <td><div className="management-name"><div className="management-icon">{item.image ? <img src={item.image} alt="" /> : "🏬"}</div><strong>{item.name}</strong></div></td>
                    <td>{item.order ?? 0}</td>
                    <td>{item.active === false ? "Inactive" : "Active"}</td>
                    <td><div className="management-actions"><button type="button" className="management-edit-button" onClick={() => openEdit(item)}>Edit</button><button type="button" className="management-delete-button" onClick={() => remove(item)}>Delete</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {showModal && <div className="management-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
        <div className="management-modal">
          <div className="management-modal-header"><div><h2>{editing ? "Edit Department" : "Add Department"}</h2><p>Choose a department image, then set its name and order.</p></div><button type="button" className="management-modal-close" disabled={saving} onClick={closeModal}>✕</button></div>
          <form className="management-form" onSubmit={save}>
            <div className="management-form-group"><label htmlFor="department-name">Department Name *</label><input id="department-name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
            <div className="management-form-group">
              <label>Department Image (optional)</label>
              <input ref={fileInputRef} id="department-image" type="file" accept="image/jpeg,image/png,image/webp" disabled={saving} onChange={chooseImage} style={{ display: "none" }} />
              <div
                role="button"
                tabIndex={0}
                onClick={() => !saving && fileInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (!saving && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragEnter={(event) => { event.preventDefault(); event.stopPropagation(); if (!saving) setDraggingImage(true); }}
                onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); }}
                onDragLeave={(event) => { event.preventDefault(); event.stopPropagation(); if (event.currentTarget === event.target) setDraggingImage(false); }}
                onDrop={dropImage}
                style={{
                  minHeight: 150,
                  border: `2px dashed ${draggingImage ? "#E35B3F" : "#D8CFC3"}`,
                  borderRadius: 16,
                  background: draggingImage ? "#FFF7F3" : "#FAF7F2",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: 18,
                  cursor: saving ? "not-allowed" : "pointer",
                  textAlign: "center",
                }}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Department preview" style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 14 }} />
                    <strong>{draggingImage ? "Drop image here" : "Drop another image to replace"}</strong>
                    <span style={{ fontSize: 12, color: "#817B71" }}>JPG, PNG or WEBP · max 5 MB</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 34 }}>🖼️</span>
                    <strong>{draggingImage ? "Drop image here" : "Drag & drop image here"}</strong>
                    <span style={{ fontSize: 12, color: "#817B71" }}>or click this area to browse · JPG, PNG or WEBP · max 5 MB</span>
                  </>
                )}
              </div>
              {(imageFile || form.image) && <button type="button" disabled={saving} className="management-cancel-button" onClick={() => { clearPreview(); setImageFile(null); setImagePreview(""); setForm((previous) => ({ ...previous, image: "" })); }}>Remove image</button>}
            </div>
            <div className="management-form-group"><label htmlFor="department-order">Display Order *</label><input id="department-order" type="number" required step="1" value={form.order} onChange={(event) => setForm({ ...form, order: event.target.value })} /></div>
            {editing && <div className="management-form-group"><label><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Active</label></div>}
            <div className="management-form-actions"><button type="button" className="management-cancel-button" disabled={saving} onClick={closeModal}>Cancel</button><button type="submit" className="management-save-button" disabled={saving}>{saving ? "Saving..." : editing ? "Update Department" : "Add Department"}</button></div>
          </form>
        </div>
      </div>}
    </div>
  );
}
