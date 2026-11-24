import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MARRIAGE_TYPES, MARRIAGE_TIMES, MARRIAGE_REQUIREMENTS, MARRIAGE_REMINDERS, marriageMinDate, GCASH, PAYMENTS,
} from '../../../../data/certificates.js';
import base from '../BaptismalRequest/BaptismalRequest.module.css';
import own from '../BaptismRegistration/BaptismRegistration.module.css';

const STEPS = ['Info', 'Schedule', 'Couple', 'Files', 'Pay', 'Done'];
const TODAY = new Date().toISOString().slice(0, 10);
const MIN_DATE = marriageMinDate();
const EMPTY = {
  groomName: '', groomDob: '', groomPob: '', brideName: '', brideDob: '', bridePob: '',
  address: '', contactName: '', email: '', phone: '', consent: false,
};
const DOCS = [
  { key: 'groomBaptism', label: "1. Groom's Baptismal Certificate (new copy, annotated for marriage)" },
  { key: 'groomConfirmation', label: "2. Groom's Confirmation Certificate (new copy, annotated for marriage)" },
  { key: 'brideBaptism', label: "3. Bride's Baptismal Certificate (new copy, annotated for marriage)" },
  { key: 'brideConfirmation', label: "4. Bride's Confirmation Certificate (new copy, annotated for marriage)" },
  { key: 'license', label: '5. Marriage License (from the Civil Registry)' },
];
const PAY_EMPTY = { method: '', gcashNumber: '', gcashName: '', proof: null };

const peso = (n) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
const okFile = (f) => /^(image\/(jpeg|png)|application\/pdf)$/.test(f.type);

function Field({ label, hint, ...props }) {
  return (
    <label className={base.field}>
      <span>{label}</span>
      <input {...props} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

export default function MarriageBooking() {
  const [step, setStep] = useState(1);
  const [typeId, setTypeId] = useState('');
  const [sched, setSched] = useState({ date: '', time: '' });
  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState({});
  const [pay, setPay] = useState(PAY_EMPTY);
  const [error, setError] = useState('');
  const [refNo, setRefNo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const type = MARRIAGE_TYPES.find((t) => t.id === typeId);

  const go = (n) => { setError(''); setStep(n); window.scrollTo(0, 0); };
  const setText = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const setUpper = (e) => setForm({ ...form, [e.target.name]: e.target.value.toUpperCase() });
  const setPayField = (e) => setPay({ ...pay, [e.target.name]: e.target.value });

  const submitSchedule = (e) => {
    e.preventDefault();
    if (!type) return setError('Select a marriage type.');
    if (!sched.date) return setError('Choose your preferred wedding date.');
    if (sched.date < MIN_DATE) return setError('The wedding must be booked at least 1 month before the wedding date.');
    if (!sched.time) return setError('Choose a time.');
    go(3);
  };

  const submitCouple = (e) => {
    e.preventDefault();
    if (!/^(09|\+639)\d{9}$/.test(form.phone.replace(/[\s-]/g, '')))
      return setError('Enter a valid mobile number, e.g. 0917 123 4567.');
    if (!form.consent) return setError('Please agree to the data privacy notice to continue.');
    go(4);
  };

  const onFile = (key) => (e) => {
    const file = e.target.files[0];
    if (!file) return setFiles({ ...files, [key]: null });
    if (!okFile(file)) { e.target.value = ''; return setError('Files must be JPG, PNG, or PDF.'); }
    if (file.size > 5 * 1024 * 1024) { e.target.value = ''; return setError('File is too large. Maximum size is 5 MB.'); }
    setError('');
    setFiles({ ...files, [key]: file });
  };

  const submitFiles = (e) => {
    e.preventDefault();
    const missing = DOCS.find((d) => !files[d.key]);
    if (missing) return setError(`Upload: ${missing.label.slice(3)}. NO REQUIREMENTS, NO WEDDING.`);
    go(5);
  };

  const onProof = (e) => {
    const file = e.target.files[0];
    if (!file) return setPay({ ...pay, proof: null });
    if (!okFile(file)) { e.target.value = ''; return setError('Proof of payment must be a JPG, PNG, or PDF file.'); }
    if (file.size > 5 * 1024 * 1024) { e.target.value = ''; return setError('File is too large. Maximum size is 5 MB.'); }
    setError('');
    setPay({ ...pay, proof: file });
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!pay.method) return setError('Select a payment method.');
    if (pay.method === 'gcash' && !pay.proof) return setError('Upload your proof of payment.');

    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('typeId', typeId);
      fd.append('date', sched.date);
      fd.append('time', sched.time);
      ['groomName', 'groomDob', 'groomPob', 'brideName', 'brideDob', 'bridePob', 'address', 'contactName', 'email', 'phone']
        .forEach((k) => fd.append(k, form[k]));
      fd.append('consent', String(form.consent));
      fd.append('method', pay.method);
      DOCS.forEach((d) => fd.append(d.key, files[d.key]));
      if (pay.method === 'gcash') {
        fd.append('gcashNumber', pay.gcashNumber);
        fd.append('gcashName', pay.gcashName);
        fd.append('proof', pay.proof);
      }

      const res = await fetch('/api/requests/marriage-booking', { method: 'POST', body: fd });
      let data = {};
      try { data = await res.json(); } catch { /* non-JSON response */ }
      if (!res.ok) return setError(data.message || 'Could not submit your booking. Please try again.');
      setRefNo(data.reference_no);
      go(6);
    } catch {
      setError('Cannot reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={base.card}>
      <div className={base.head}>
        <span className="eyebrow">Parish Services</span>
        <h1>Marriage Booking</h1>
      </div>

      <ol className={base.steps} style={{ gridTemplateColumns: 'repeat(6, 1fr)' }} aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className={`${i + 1 === step ? base.cur : ''} ${i + 1 < step ? base.done : ''}`}
              aria-current={i + 1 === step ? 'step' : undefined}>
            <b>{i + 1 < step ? <i className="fa-solid fa-check" /> : i + 1}</b><span>{s}</span>
          </li>
        ))}
      </ol>

      {error && <p className={base.error} role="alert">{error}</p>}

      {/* 1. INFO */}
      {step === 1 && (
        <div className={base.stack}>
          <p className={base.lead}>Please read this before you book.</p>
          {MARRIAGE_TYPES.map((t) => (
            <div key={t.id} className={own.panel}>
              <h3>{t.title} <span className={own.price}>· {peso(t.fee)}</span></h3>
              <p>{t.desc}</p>
            </div>
          ))}
          <div className={own.panel}>
            <h3>Requirements</h3>
            <ol>{MARRIAGE_REQUIREMENTS.map((r) => <li key={r}>{r}</li>)}</ol>
          </div>
          <div className={own.panel}>
            <h3>Important reminders</h3>
            <ol>{MARRIAGE_REMINDERS.map((r) => <li key={r}>{r}</li>)}</ol>
          </div>
          <p className={base.note}>Fees are from the parish. Wedding times are pending parish confirmation.</p>
          <div className={base.actions}>
            <Link to="/" className={base.back}>Cancel</Link>
            <button type="button" className={base.primary} onClick={() => go(2)}>Continue to booking</button>
          </div>
        </div>
      )}

      {/* 2. TYPE + SCHEDULE */}
      {step === 2 && (
        <form className={base.stack} onSubmit={submitSchedule}>
          <p className={base.lead}>Choose a marriage type.</p>
          {MARRIAGE_TYPES.map((t) => (
            <label key={t.id} className={`${base.option} ${typeId === t.id ? base.picked : ''}`}>
              <input type="radio" name="typeId" checked={typeId === t.id} onChange={() => setTypeId(t.id)} />
              <span className={base.optText}><strong>{t.title}</strong><small>{t.desc}</small></span>
              <span className={base.fee}>{peso(t.fee)}</span>
            </label>
          ))}
          <fieldset>
            <legend>Preferred schedule</legend>
            <Field label="Preferred wedding date" type="date" name="date" value={sched.date} min={MIN_DATE}
                   onChange={(e) => setSched({ ...sched, date: e.target.value })} required
                   hint="Must be at least 1 month from today." />
            <div className={base.radios}>
              {MARRIAGE_TIMES.map((t) => (
                <label key={t}><input type="radio" name="time" checked={sched.time === t} onChange={() => setSched({ ...sched, time: t })} /> {t}</label>
              ))}
            </div>
            <p className={base.note}>Each wedding lasts 1 hour. The parish will confirm the final schedule by email.</p>
          </fieldset>
          <div className={base.actions}>
            <button type="button" className={base.back} onClick={() => go(1)}>Back</button>
            <button type="submit" className={base.primary}>Continue</button>
          </div>
        </form>
      )}

      {/* 3. COUPLE */}
      {step === 3 && (
        <form className={base.stack} onSubmit={submitCouple}>
          <p className={base.note}>All names are converted to uppercase automatically.</p>
          <fieldset>
            <legend>A. Groom</legend>
            <Field label="Full name" name="groomName" value={form.groomName} onChange={setUpper} required autoComplete="off" />
            <div className={base.row2}>
              <Field label="Date of birth" type="date" name="groomDob" value={form.groomDob} onChange={setText} max={TODAY} required />
              <Field label="Place of birth" name="groomPob" value={form.groomPob} onChange={setUpper} required />
            </div>
          </fieldset>
          <fieldset>
            <legend>B. Bride</legend>
            <Field label="Full name (maiden name)" name="brideName" value={form.brideName} onChange={setUpper} required autoComplete="off" />
            <div className={base.row2}>
              <Field label="Date of birth" type="date" name="brideDob" value={form.brideDob} onChange={setText} max={TODAY} required />
              <Field label="Place of birth" name="bridePob" value={form.bridePob} onChange={setUpper} required />
            </div>
          </fieldset>
          <fieldset>
            <legend>C. Contact information</legend>
            <Field label="Present address" name="address" value={form.address} onChange={setUpper} required />
            <Field label="Contact person" name="contactName" value={form.contactName} onChange={setUpper} required />
            <Field label="Email address" type="email" name="email" value={form.email} onChange={setText} required hint="Updates and the schedule confirmation are sent here." />
            <Field label="Contact number" type="tel" name="phone" value={form.phone} onChange={setText} placeholder="09XX XXX XXXX" required />
          </fieldset>
          <label className={base.consent}>
            <input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
            <span>I agree that the parish may use these details to process this booking.</span>
          </label>
          <div className={base.actions}>
            <button type="button" className={base.back} onClick={() => go(2)}>Back</button>
            <button type="submit" className={base.primary}>Continue</button>
          </div>
        </form>
      )}

      {/* 4. FILES */}
      {step === 4 && (
        <form className={base.stack} onSubmit={submitFiles}>
          <p className={base.lead}>NO REQUIREMENTS, NO WEDDING.</p>
          <p className={base.note}>Upload a clear photo or scan. JPG, PNG, or PDF. Max 5 MB each. Baptismal and Confirmation certificates must be new copies with Annotation for Marriage Purposes.</p>
          <fieldset>
            <legend>Documents (all required)</legend>
            {DOCS.map((d) => (
              <Field key={d.key} label={d.label} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={onFile(d.key)} />
            ))}
          </fieldset>
          <div className={base.actions}>
            <button type="button" className={base.back} onClick={() => go(3)}>Back</button>
            <button type="submit" className={base.primary}>Continue</button>
          </div>
        </form>
      )}

      {/* 5. PAYMENT */}
      {step === 5 && (
        <form className={base.stack} onSubmit={submitRequest}>
          <div className={own.feeTable}>
            <div className={`${own.feeRow} ${own.feeTotal}`}><span>{type.title}</span><span>{peso(type.fee)}</span></div>
          </div>
          <p className={base.lead}>Select how you would like to pay.</p>
          <label className={`${base.option} ${pay.method === 'pickup' ? base.picked : ''}`}>
            <input type="radio" name="method" value="pickup" checked={pay.method === 'pickup'} onChange={setPayField} />
            <span className={base.optIcon}><i className="fa-solid fa-hand-holding-dollar" /></span>
            <span className={base.optText}><strong>Pay at the Parish Office</strong><small>Pay the fee directly at the parish office.</small></span>
          </label>
          <label className={`${base.option} ${pay.method === 'gcash' ? base.picked : ''}`}>
            <input type="radio" name="method" value="gcash" checked={pay.method === 'gcash'} onChange={setPayField} />
            <span className={base.optIcon}><i className={PAYMENTS.gcash.icon} /></span>
            <span className={base.optText}><strong>{PAYMENTS.gcash.title}</strong><small>{PAYMENTS.gcash.desc}</small></span>
            <span className={base.tag}>{PAYMENTS.gcash.tag}</span>
          </label>
          {pay.method === 'gcash' && (
            <fieldset>
              <legend>GCash payment</legend>
              <div className={base.gcash}>
                <div><small>Send to</small><strong>{GCASH.number}</strong></div>
                <div><small>Account name</small><strong>{GCASH.name}</strong></div>
              </div>
              <Field label="Sender's GCash number" type="tel" name="gcashNumber" value={pay.gcashNumber} onChange={setPayField} placeholder="09XX XXX XXXX" required />
              <Field label="Sender's account name" name="gcashName" value={pay.gcashName} onChange={(e) => setPay({ ...pay, gcashName: e.target.value.toUpperCase() })} required />
              <Field label="Proof of payment" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={onProof} hint="JPG, PNG, or PDF. Max 5 MB." required />
            </fieldset>
          )}
          <div className={base.actions}>
            <button type="button" className={base.back} onClick={() => go(4)} disabled={submitting}>Back</button>
            <button type="submit" className={base.primary} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit booking'}</button>
          </div>
        </form>
      )}

      {/* 6. DONE */}
      {step === 6 && (
        <div className={base.success}>
          <span className={base.check}><i className="fa-solid fa-check" /></span>
          <h2>Booking submitted</h2>
          <p>
            Your marriage booking for <b>{form.groomName}</b> and <b>{form.brideName}</b> was submitted. The parish staff will review
            your requirements and payment. Please wait for the schedule confirmation at <b>{form.email}</b> or {form.phone}.
          </p>
          <div className={base.ref}><small>Booking reference number</small><strong>{refNo}</strong></div>
          <p className={base.note}>Keep this number for follow-ups. Requested: {type.title}, {sched.date} {sched.time} (not yet confirmed).</p>
          <Link to="/" className={base.primary}>Back to home</Link>
        </div>
      )}
    </div>
  );
}