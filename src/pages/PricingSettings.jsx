import { useEffect, useRef, useState } from 'react';
import api from '../utils/admin-api';
import { getToken } from '../utils/auth';
const URL = 'https://mystore-backend-u6ey.onrender.com/pricing';
export default function PricingSettings() {
  const [classes, setClasses] = useState(null);
  const [defaultClass, setDefaultClass] = useState('C');
  const [newClass, setNewClass] = useState({ name: '', adjustment: '0', minimum: '0' });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  useEffect(() => {
    let active = true;
    api.get(URL, { headers: { Authorization: `Bearer ${getToken()}` } }).then(({ data }) => { if (active) { setClasses(data.classes); setDefaultClass(data.defaultClass); } })
      .catch(error => { if (active) setMessage(error.response?.data?.message || 'Could not load pricing settings'); });
    return () => { active = false; };
  }, []);
  async function save(event) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true; setSaving(true); setMessage('');
    try {
      const values = Object.fromEntries(Object.entries(classes).map(([key, value]) => [key, { name: value.name || key, adjustment: Number(value.adjustment), minimum: Number(value.minimum),
        ...(key === 'C' ? { freeDeliveryThreshold: Number(value.freeDeliveryThreshold), deliveryFeeBelowThreshold: Number(value.deliveryFeeBelowThreshold) } : {}) }]));
      const { data } = await api.put(URL, { classes: values }, { headers: { Authorization: `Bearer ${getToken()}` } });
      setClasses(data.classes); setMessage('Pricing settings saved. Customer pricing updates on refresh.');
    } catch (error) { setMessage(error.response?.data?.message || 'Could not save pricing settings'); }
    finally { busy.current = false; setSaving(false); }
  }
  async function manage(action, key) {
    if (busy.current) return;
    busy.current = true; setSaving(true); setMessage('');
    try {
      const options = { headers: { Authorization: `Bearer ${getToken()}` } };
      const { data } = action === 'create' ? await api.post(URL + '/classes', { value: { name: newClass.name.trim(), adjustment: Number(newClass.adjustment), minimum: Number(newClass.minimum) } }, options)
        : action === 'default' ? await api.put(URL + '/classes/' + encodeURIComponent(key) + '/default', {}, options)
        : await api.delete(URL + '/classes/' + encodeURIComponent(key), options);
      setClasses(previous => Object.fromEntries(Object.entries(data.classes).map(([id, value]) => [id, previous?.[id] || value]))); setDefaultClass(data.defaultClass); if (action === 'create') setNewClass({ name: '', adjustment: '0', minimum: '0' }); setMessage('Pricing classes updated');
    } catch (error) { setMessage(action === 'create' && error.response?.status === 404 ? 'Route not found. Class creation requires POST /pricing/classes on the updated backend. Check the backend deployment.' : error.response?.data?.message || 'Could not update pricing classes'); }
    finally { busy.current = false; setSaving(false); }
  }
  return <div className="management-page pricing-page">
    <div className="management-header"><div><h1>Pricing Settings</h1><p>Adjustments apply to the product base price before product discounts. Minimums use the final merchandise total.</p></div></div>
    {message && <p className="pricing-status" role="status">{message}</p>}
    {!classes && !message && <p className="pricing-status" role="status">Loading pricing settings...</p>}
    <form className="pricing-create pricing-card" onSubmit={event => { event.preventDefault(); void manage('create'); }} aria-busy={saving}>
      <h2>Create pricing class</h2>
      <div className="pricing-create-fields">
        <label className="management-form-group">Class Name<input required aria-label="New class name" maxLength={80} value={newClass.name} disabled={saving} onChange={event => setNewClass(current => ({ ...current, name: event.target.value }))} /></label>
        <label className="management-form-group">Adjustment (%)<input required aria-label="New class adjustment" type="number" min="-90" max="200" step="any" value={newClass.adjustment} disabled={saving} onChange={event => setNewClass(current => ({ ...current, adjustment: event.target.value }))} /></label>
        <label className="management-form-group">Minimum Order ($)<input required aria-label="New class minimum" type="number" min="0" max="1000000" step="0.01" value={newClass.minimum} disabled={saving} onChange={event => setNewClass(current => ({ ...current, minimum: event.target.value }))} /></label>
      </div>
      <button className="management-add-button" disabled={saving || !newClass.name.trim() || !newClass.minimum.trim() || !newClass.adjustment.trim()}>Create class</button>
    </form>
    {classes && <form onSubmit={save} aria-busy={saving}>
      <div className="pricing-grid">
      {Object.keys(classes).map(key => <fieldset className={`pricing-card${defaultClass === key ? ' pricing-card-default' : ''}`} key={key} disabled={saving}><legend>{classes[key].name || key}{defaultClass === key && <span className="pricing-default-badge">Default</span>}</legend>
        <label className="management-form-group">Name <input required maxLength={80} value={classes[key].name || key} onChange={event => setClasses(previous => ({ ...previous, [key]: { ...previous[key], name: event.target.value } }))} /></label>
        <div className="pricing-card-actions"><button className="pricing-secondary-button" type="button" disabled={saving || defaultClass === key} onClick={() => manage('default', key)}>Set as Default</button>
        <button className="pricing-delete-button" type="button" disabled={saving || defaultClass === key} onClick={() => manage('delete', key)}>Delete class</button></div>
        <label className="management-form-group">Adjustment (%) <input required type="number" min="-90" max="200" step="any" value={classes[key].adjustment}
          onChange={event => setClasses(previous => ({ ...previous, [key]: { ...previous[key], adjustment: event.target.value } }))} /></label>
        <label className="management-form-group">{key === 'C' ? 'Minimum Checkout Amount ($)' : 'Minimum order ($)'} <input required type="number" min="0" max="1000000" step="0.01" value={classes[key].minimum}
          onChange={event => setClasses(previous => ({ ...previous, [key]: { ...previous[key], minimum: event.target.value } }))} /></label>
        {key === 'C' && <>
          <label className="management-form-group">Free Delivery Threshold ($) <input required type="number" min={classes.C.minimum} max="1000000" step="0.01" value={classes.C.freeDeliveryThreshold}
            onChange={event => setClasses(previous => ({ ...previous, C: { ...previous.C, freeDeliveryThreshold: event.target.value } }))} /></label>
          <label className="management-form-group">Delivery Fee Below Free Delivery Threshold ($) <input required type="number" min="0" max="1000000" step="0.01" value={classes.C.deliveryFeeBelowThreshold}
            onChange={event => setClasses(previous => ({ ...previous, C: { ...previous.C, deliveryFeeBelowThreshold: event.target.value } }))} /></label>
        </>}
      </fieldset>)}</div><div className="pricing-actions"><button className="management-add-button" disabled={saving}>{saving ? 'Saving...' : 'Save pricing settings'}</button></div>
    </form>}</div>;
}
