import { useEffect, useRef, useState } from 'react';
import api from '../utils/admin-api';
import { getToken } from '../utils/auth';
const URL = 'https://mystore-backend-u6ey.onrender.com/pricing';
export default function PricingSettings() {
  const [classes, setClasses] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  useEffect(() => {
    let active = true;
    api.get(URL, { headers: { Authorization: `Bearer ${getToken()}` } }).then(({ data }) => { if (active) setClasses({ ...data.classes, C: { ...data.classes.C,
      freeDeliveryThreshold: data.classes.C.freeDeliveryThreshold ?? data.classes.C.minimum, deliveryFeeBelowThreshold: data.classes.C.deliveryFeeBelowThreshold ?? 0 } }); })
      .catch(error => { if (active) setMessage(error.response?.data?.message || 'Could not load pricing settings'); });
    return () => { active = false; };
  }, []);
  async function save(event) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true; setSaving(true); setMessage('');
    try {
      const values = Object.fromEntries(Object.entries(classes).map(([key, value]) => [key, { adjustment: Number(value.adjustment), minimum: Number(value.minimum),
        ...(key === 'C' ? { freeDeliveryThreshold: Number(value.freeDeliveryThreshold), deliveryFeeBelowThreshold: Number(value.deliveryFeeBelowThreshold) } : {}) }]));
      const { data } = await api.put(URL, { classes: values }, { headers: { Authorization: `Bearer ${getToken()}` } });
      setClasses(data.classes); setMessage('Pricing settings saved. Customer pricing updates on refresh.');
    } catch (error) { setMessage(error.response?.data?.message || 'Could not save pricing settings'); }
    finally { busy.current = false; setSaving(false); }
  }
  return <div className="management-page pricing-page">
    <div className="management-header"><div><h1>Pricing Settings</h1><p>Adjustments apply to the product base price before product discounts. Minimums use the final merchandise total.</p></div></div>
    {message && <p className="pricing-status" role="status">{message}</p>}
    {!classes && !message && <p className="pricing-status" role="status">Loading pricing settings...</p>}
    {classes && <form onSubmit={save} aria-busy={saving}>
      <div className="pricing-grid">
      {['A', 'B', 'C'].map(key => <fieldset className="pricing-card" key={key} disabled={saving}><legend>Class {key}</legend>
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
