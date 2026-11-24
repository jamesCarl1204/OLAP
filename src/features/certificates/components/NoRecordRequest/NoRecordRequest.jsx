import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FORMATS, PAYMENTS, GCASH, NO_RECORD_TYPES, NO_RECORD_FEE } from '../../../../data/certificates.js';
// Same look as the other certificate requests, so the stylesheet is shared.
import styles from '../BaptismalRequest/BaptismalRequest.module.css';

const STEPS = ['Format', 'Details', 'Payment', 'Done'];
const TODAY = new Date().toISOString().slice(0, 10);
const EMPTY = {
  fullName: '', dob: '', pob: '', father: '', mother: '',
  church: '', city: '',
  requester: '', email: '', phone: '', consent: false,
};
const PAY_EMPTY = { method: '', gcashNumber: '', gcashName: '', proof: null };

const peso = (n) => `₱${n.toFixed(2)}`;

function Field({ label, hint, ...props }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input {...props} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

// kind: 'baptism' | 'confirmation' (see NO_RECORD_TYPES).
export default function NoRecordRequest({ kind }) {
  const cfg = NO_RECORD_TYPES[kind];
  const [step, setStep] = useState(1);
  const [format, setFormat] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [pay, setPay] = useState(PAY_EMPTY);
  const [error, setError] = useState('');
  const [refNo, setRefNo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const go = (n) => { setError(''); setStep(n); window.scrollTo(0, 0); };

  const setText = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const setUpper = (e) => setForm({ ...form, [e.target.name]: e.target.value.toUpperCase() });
  const setPayField = (e) => setPay({ ...pay, [e.target.name]: e.target.value });

  const pickFormat = (f) => {
    setFormat(f);
    setPay({ ...PAY_EMPTY, method: f.payments.length === 1 ? f.payments[0] : '' });
    go(2);
  };

  const submitDetails = (e) => {
    e.preventDefault();
    if (!/^(09|\+639)\d{9}$/.test(form.phone.replace(/[\s-]/g, '')))
      return setError('Enter a valid mobile number, e.g. 0917 123 4567.');
    if (!form.consent) return setError('Please agree to the data privacy notice to continue.');
    go(3);
  };

  const onProof = (e) => {
    const file = e.target.files[0];
    if (!file) return setPay({ ...pay, proof: null });
    if (!/^(image\/(jpeg|png)|application\/pdf)$/.test(file.type)) {
      e.target.value = '';
      return setError('Proof of payment must be a JPG, PNG, or PDF file.');
    }
    if (file.size > 5 * 1024 * 1024) {
      e.target.value = '';
      return setError('File is too large. Maximum size is 5 MB.');
    }
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
      fd.append('format', format.id);
      fd.append('fullName', form.fullName);
      if (cfg.askBirth) {
        fd.append('dob', form.dob);
        fd.append('pob', form.pob);
      }
      fd.append('father', form.father);
      fd.append('mother', form.mother);
      fd.append('church', form.church);
      fd.append('city', form.city);
      fd.append('requester', form.requester);
      fd.append('email', form.email);
      fd.append('phone', form.phone);
      fd.append('consent', String(form.consent));
      fd.append('method', pay.method);
      if (pay.method === 'gcash') {
        fd.append('gcashNumber', pay.gcashNumber);
        fd.append('gcashName', pay.gcashName);
        fd.append('proof', pay.proof);
      }

      const res = await fetch(`/api/requests/no-record/${kind}`, { method: 'POST', body: fd });
      let data = {};
      try { data = await res.json(); } catch { /* non-JSON response */ }

      if (!res.ok) return setError(data.message || 'Could not submit your request. Please try again.');
      setRefNo(data.reference_no);
      go(4);
    } catch {
      setError('Cannot reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <span className="eyebrow">Certificate Request</span>
        <h1>{cfg.title}</h1>
      </div>

      <ol className={styles.steps} aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className={`${i + 1 === step ? styles.cur : ''} ${i + 1 < step ? styles.done : ''}`}
              aria-current={i + 1 === step ? 'step' : undefined}>
            <b>{i + 1 < step ? <i className="fa-solid fa-check" /> : i + 1}</b><span>{s}</span>
          </li>
        ))}
      </ol>

      {error && <p className={styles.error} role="alert">{error}</p>}

      {step === 1 && (
        <div className={styles.stack}>
          <p className={styles.lead}>How would you like to receive your certificate?</p>
          {FORMATS.map((f) => (
            <button key={f.id} type="button" className={styles.option} onClick={() => pickFormat(f)}>
              <span className={styles.optIcon}><i className={f.icon} /></span>
              <span className={styles.optText}>
                <strong>{f.title}</strong>
                <small>{f.id === 'hardcopy'
                  ? 'Receive a physical copy of the certificate at the parish office. Payment will be made upon pickup.'
                  : 'Receive the electronic certificate (with QR code) at your registered email address.'}</small>
              </span>
              <span className={styles.fee}>{peso(NO_RECORD_FEE)}</span>
            </button>
          ))}
          <p className={styles.note}>Fees are not yet set. The amount shown is a sample pending parish confirmation.</p>
        </div>
      )}

      {step === 2 && (
        <form className={styles.stack} onSubmit={submitDetails}>
          <fieldset>
            <legend>Personal information</legend>
            <p className={styles.note}>All names are converted to uppercase automatically.</p>
            <Field label="Full name" name="fullName" value={form.fullName} onChange={setUpper} placeholder="JUAN TOLONGES DELA CRUZ" required autoComplete="off" />
            {cfg.askBirth && (
              <div className={styles.row2}>
                <Field label="Date of birth" type="date" name="dob" value={form.dob} onChange={setText} max={TODAY} required />
                <Field label="Place of birth" name="pob" value={form.pob} onChange={setUpper} placeholder="MANILA" required />
              </div>
            )}
            <Field label="Father's full name" name="father" value={form.father} onChange={setUpper} required />
            <Field label="Mother's full name (maiden name)" name="mother" value={form.mother} onChange={setUpper} required />
          </fieldset>

          <fieldset>
            <legend>Destination church</legend>
            <p className={styles.note}>The church or parish that asked for the certificate.</p>
            <Field label="Parish / church" name="church" value={form.church} onChange={setUpper} placeholder="ST. ANDREW CATHEDRAL" required />
            <Field label="City / location" name="city" value={form.city} onChange={setUpper} placeholder="PARAÑAQUE CITY" required />
          </fieldset>

          <fieldset>
            <legend>Contact information</legend>
            <p className={styles.note}>Your email address and contact number will be used for request updates and certificate notifications.</p>
            <Field label="Requester's full name" name="requester" value={form.requester} onChange={setUpper} required />
            <Field label="Email address" type="email" name="email" value={form.email} onChange={setText} placeholder="juan@email.com" required hint="Updates and your certificate (if digital) are sent here." />
            <Field label="Contact number" type="tel" name="phone" value={form.phone} onChange={setText} placeholder="09XX XXX XXXX" required />
          </fieldset>

          <label className={styles.consent}>
            <input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
            <span>I agree that the parish may use these details to process this request. {/* TODO: final privacy notice wording */}</span>
          </label>

          <div className={styles.actions}>
            <button type="button" className={styles.back} onClick={() => go(1)}>Back</button>
            <button type="submit" className={styles.primary}>Continue</button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form className={styles.stack} onSubmit={submitRequest}>
          <div className={styles.summary}>
            <div><small>Certificate</small><strong>{cfg.title} – {format.title.split(' – ')[0]}</strong></div>
            <div><small>For</small><strong>{form.fullName}</strong></div>
            <div><small>Fee</small><strong>{peso(NO_RECORD_FEE)}</strong></div>
          </div>

          <p className={styles.lead}>Select how you would like to pay.</p>
          {format.payments.map((id) => (
            <label key={id} className={`${styles.option} ${pay.method === id ? styles.picked : ''}`}>
              <input type="radio" name="method" value={id} checked={pay.method === id} onChange={setPayField} />
              <span className={styles.optIcon}><i className={PAYMENTS[id].icon} /></span>
              <span className={styles.optText}><strong>{PAYMENTS[id].title}</strong><small>{PAYMENTS[id].desc}</small></span>
              <span className={styles.tag}>{PAYMENTS[id].tag}</span>
            </label>
          ))}
          {format.id === 'digital' && <p className={styles.note}>Digital copies are paid online, so GCash is the only option.</p>}

          {pay.method === 'gcash' && (
            <fieldset>
              <legend>GCash payment</legend>
              <div className={styles.gcash}>
                <div><small>Send to</small><strong>{GCASH.number}</strong></div>
                <div><small>Account name</small><strong>{GCASH.name}</strong></div>
              </div>
              <Field label="Sender's GCash number" type="tel" name="gcashNumber" value={pay.gcashNumber} onChange={setPayField} placeholder="09XX XXX XXXX" required />
              <Field label="Sender's account name" name="gcashName" value={pay.gcashName} onChange={(e) => setPay({ ...pay, gcashName: e.target.value.toUpperCase() })} required />
              <Field label="Proof of payment" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={onProof} hint="JPG, PNG, or PDF. Max 5 MB. Staff will verify your payment before processing." required />
            </fieldset>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.back} onClick={() => go(2)} disabled={submitting}>Back</button>
            <button type="submit" className={styles.primary} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit request'}
            </button>
          </div>
        </form>
      )}

      {step === 4 && (
        <div className={styles.success}>
          <span className={styles.check}><i className="fa-solid fa-check" /></span>
          <h2>Request submitted</h2>
          <p>
            Your Certificate of No Record request was submitted. Please wait for an update at <b>{form.email}</b> or {form.phone}
            {format.id === 'digital' ? ', where your e-certificate will be sent once it is ready.' : '. You will be emailed when your hardcopy is ready for pickup.'}
          </p>
          <div className={styles.ref}><small>Request reference number</small><strong>{refNo}</strong></div>
          <p className={styles.note}>Keep this number for follow-ups.</p>
          <Link to="/" className={styles.primary}>Back to home</Link>
        </div>
      )}
    </div>
  );
}