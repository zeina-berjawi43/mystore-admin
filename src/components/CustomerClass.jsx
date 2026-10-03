import { useRef, useState } from 'react';
import api from '../utils/admin-api';
import { getToken } from '../utils/auth';
export default function CustomerClass({ user }) {
  const initialClass = ['A', 'B', 'C'].includes(user.priceClass) ? user.priceClass : 'B';
  const [value, setValue] = useState(initialClass);
  const [saved, setSaved] = useState(initialClass);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const busy = useRef(false);
  async function save() {
    if (busy.current) return;
    busy.current = true; setSaving(true); setMessage('');
    try {
      await api.put(`https://mystore-backend-u6ey.onrender.com/pricing/customers/${user._id}`, { priceClass: value }, { headers: { Authorization: `Bearer ${getToken()}` } });
      setSaved(value); setMessage('Saved');
    } catch (error) { setMessage(error.response?.data?.message || 'Could not save class'); }
    finally { busy.current = false; setSaving(false); }
  }
  return <div><select aria-label="Customer price class" disabled={saving} value={value} onChange={event => { setValue(event.target.value); setMessage(''); }}>
    {['A', 'B', 'C'].map(key => <option key={key}>{key}</option>)}
  </select><button type="button" disabled={saving || value === saved} onClick={save}>{saving ? 'Saving…' : 'Save'}</button><span role="status">{message}</span></div>;
}
