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
    api.get(URL, { headers: { Authorization: `Bearer ${getToken()}` } }).then(({ data }) => { if (active) setClasses(data.classes); })
      .catch(error => { if (active) setMessage(error.response?.data?.message || 'Could not load pricing settings'); });
    return () => { active = false; };
  }, []);
  async function save(event) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true; setSaving(true); setMessage('');
    try {
      const values = Object.fromEntries(Object.entries(classes).map(([key, value]) => [key, { adjustment: Number(value.adjustment), minimum: Number(value.minimum) }]));
      const { data } = await api.put(URL, { classes: values }, { headers: { Authorization: `Bearer ${getToken()}` } });
      setClasses(data.classes); setMessage('Pricing settings saved. Customer pricing updates on refresh.');
    } catch (error) { setMessage(error.response?.data?.message || 'Could not save pricing settings'); }
    finally { busy.current = false; setSaving(false); }
  }
  return <div className="page"><h1>Pricing Settings</h1><p>Adjustments apply to the product base price before product discounts. Minimums use the final merchandise total.</p>
    <p role="status">{message}</p>{classes && <form onSubmit={save}>
      {['A', 'B', 'C'].map(key => <fieldset key={key} disabled={saving}><legend>Class {key}</legend>
        <label>Adjustment (%) <input required type="number" min="-90" max="200" step="any" value={classes[key].adjustment}
          onChange={event => setClasses(previous => ({ ...previous, [key]: { ...previous[key], adjustment: event.target.value } }))} /></label>
        <label> Minimum order ($) <input required type="number" min="0" max="1000000" step="0.01" value={classes[key].minimum}
          onChange={event => setClasses(previous => ({ ...previous, [key]: { ...previous[key], minimum: event.target.value } }))} /></label>
      </fieldset>)}<button disabled={saving}>{saving ? 'Saving…' : 'Save pricing settings'}</button>
    </form>}</div>;
}
