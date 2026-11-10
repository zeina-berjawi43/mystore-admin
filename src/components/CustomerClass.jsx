import { getPricingClassName } from '../utils/pricing-class';
import { useRef, useState } from 'react';
import api from '../utils/admin-api';
import { getToken } from '../utils/auth';
// Reserved, non-commercial class for screen recordings. It is offered per customer only
// (never in bulk, never as a default) and the backend enforces every DEMO rule again.
const DEMO_CLASS = 'DEMO';
export default function CustomerClass({ user, onSaved, classes }) {
  const initialClass = user.priceClass || 'B';
  const [value, setValue] = useState(initialClass);
  const [saved, setSaved] = useState(initialClass);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const busy = useRef(false);
  async function save() {
    if (busy.current) return;
    const demo = value === DEMO_CLASS;
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'this customer';
    if (demo && !window.confirm(`Switch ${name} to DEMO mode?\n\nDEMO customers see "X$" instead of every price and CANNOT place real orders.\nOnly customers without orders or invoices can be switched.`)) return;
    busy.current = true; setSaving(true); setMessage('');
    try {
      await api.put(`https://mystore-backend-u6ey.onrender.com/pricing/customers/${user._id}`, demo ? { priceClass: value, confirmDemo: true } : { priceClass: value }, { headers: { Authorization: `Bearer ${getToken()}` } });
      setSaved(value); setMessage('Saved');
      onSaved?.(value);
    } catch (error) { setMessage(error.response?.data?.message || 'Could not save class'); }
    finally { busy.current = false; setSaving(false); }
  }
  return <div className="customer-class" aria-busy={saving}><label className="customer-class-label">Price class<select aria-label="Customer price class" disabled={saving} value={value} onChange={event => { setValue(event.target.value); setMessage(''); }}>
    {!classes[value] && value !== DEMO_CLASS && <option value={value} disabled>{getPricingClassName(classes, value)}</option>}
    {Object.keys(classes).filter(key => key !== DEMO_CLASS).map(key => <option key={key} value={key}>{getPricingClassName(classes, key)}</option>)}
    <option value={DEMO_CLASS}>{getPricingClassName(classes, DEMO_CLASS)}</option>
  </select></label><button className="customer-class-save" type="button" disabled={saving || value === saved} onClick={save}>{saving ? 'Saving...' : 'Save'}</button><span className="customer-class-status" role="status">{message ? `${message} ? ` : ''}Current Class: {getPricingClassName(classes, saved)}</span></div>;
}
