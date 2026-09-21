import { useEffect, useState } from "react";

const API_URL = "https://mystore-backend-u6ey.onrender.com";
const emptyForm = { name: "", image: "", order: "0", active: true };

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

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

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEdit = (department) => {
    setEditing(department);
    setForm({
      name: department.name || "",
      image: department.image || "",
      order: String(department.order ?? 0),
      active: department.active !== false,
    });
    setShowModal(true);
  };

  const save = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const order = Number(form.order);
    if (!name) return alert("Department name is required.");
    if (!form.order.trim() || !Number.isFinite(order)) return alert("Enter a valid order.");
    try {
      setSaving(true);
      const response = await fetch(
        editing ? `${API_URL}/departments/${editing._id}` : `${API_URL}/departments`,
        {
          method: editing ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            image: form.image.trim(),
            order,
            ...(editing ? { active: form.active } : {}),
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save department");
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
      const response = await fetch(`${API_URL}/departments/${department._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
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
                    <td><div className="management-name"><div className="management-icon">{item.image ? <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🏬"}</div><strong>{item.name}</strong></div></td>
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
      {showModal && <div className="management-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setShowModal(false); }}>
        <div className="management-modal">
          <div className="management-modal-header"><div><h2>{editing ? "Edit Department" : "Add Department"}</h2><p>Set the department name, image URL and order.</p></div><button type="button" className="management-modal-close" disabled={saving} onClick={() => setShowModal(false)}>✕</button></div>
          <form className="management-form" onSubmit={save}>
            <div className="management-form-group"><label htmlFor="department-name">Department Name *</label><input id="department-name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
            <div className="management-form-group"><label htmlFor="department-image">Image URL (optional)</label><input id="department-image" type="url" placeholder="https://..." value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} />{form.image && <img src={form.image} alt="Department preview" style={{ width: 90, height: 90, objectFit: "cover", marginTop: 12, borderRadius: 12 }} />}</div>
            <div className="management-form-group"><label htmlFor="department-order">Display Order *</label><input id="department-order" type="number" required step="1" value={form.order} onChange={(event) => setForm({ ...form, order: event.target.value })} /></div>
            {editing && <div className="management-form-group"><label><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Active</label></div>}
            <div className="management-form-actions"><button type="button" className="management-cancel-button" disabled={saving} onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="management-save-button" disabled={saving}>{saving ? "Saving..." : editing ? "Update Department" : "Add Department"}</button></div>
          </form>
        </div>
      </div>}
    </div>
  );
}
