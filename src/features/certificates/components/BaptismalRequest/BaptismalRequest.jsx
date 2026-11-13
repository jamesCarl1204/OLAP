import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FORMATS, PAYMENTS, PURPOSES, GCASH } from '../../../../data/certificates.js';
import styles from './BaptismalRequest.module.css';

const STEPS = ['Format', 'Details', 'Payment', 'Done'];
const TODAY = new Date().toISOString().slice(0, 10);
const EMPTY = {
  fullName: '', dob: '', pob: '', father: '', mother: '', baptismDate: '',
  purpose: PURPOSES[0], email: '', phone: '', consent: false,
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

// UI only. Wire up the real API (create request, upload proof, get reference no.) later.
export default function BaptismalRequest() {
  const [step, setStep] = useState(1);
  const [format, setFormat] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [pay, setPay] = useState(PAY_EMPTY);
  const [error, setError] = useState('');
  const [refNo, setRefNo] = useState('');

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
    if (form.baptismDate && form.dob && form.baptismDate < form.dob)
      return setError('Baptism date cannot be earlier than the date of birth.');
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

  const submitRequest = (e) => {
    e.preventDefault();
    if (!pay.method) return setError('Select a payment method.');
    if (pay.method === 'gcash' && !pay.proof) return setError('Upload your proof of payment.');
    // TODO: POST request + proof to API; use the reference number it returns.
    const n = String(Math.floor(Math.random() * 99999) + 1).padStart(5, '0');
    setRefNo(`REQ-${new Date().getFullYear()}-${n}`);
    go(4);
  };

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <span className="eyebrow">Certificate Request</span>
        <h1>Baptismal Certificate</h1>
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
              <span className={styles.optText}><strong>{f.title}</strong><small>{f.desc}</small></span>
              <span className={styles.fee}>{peso(f.fee)}</span>
            </button>
          ))}
          <p className={styles.note}>Fees shown are sample amounts pending parish confirmation.</p>
        </div>
      )}

      {step === 2 && (
        <form className={styles.stack} onSubmit={submitDetails}>
          <fieldset>
            <legend>Person on the certificate</legend>
            <p className={styles.note}>Names are converted to uppercase automatically.</p>
            <Field label="Full name" name="fullName" value={form.fullName} onChange={setUpper} placeholder="JUAN TOLONGES DELA CRUZ" required autoComplete="off" />
            <div className={styles.row2}>
              <Field label="Date of birth" type="date" name="dob" value={form.dob} onChange={setText} max={TODAY} required />
              <Field label="Place of birth" name="pob" value={form.pob} onChange={setUpper} placeholder="MANILA" required />
            </div>
            <Field label="Father's full name" name="father" value={form.father} onChange={setUpper} required />
            <Field label="Mother's full name (maiden name)" name="mother" value={form.mother} onChange={setUpper} required />
            <Field label="Date of baptism" type="date" name="baptismDate" value={form.baptismDate} onChange={setText} max={TODAY} hint="Optional. Enter it if you know it." />
          </fieldset>

          <fieldset>
            <legend>Purpose of request</legend>
            <div className={styles.radios}>
              {PURPOSES.map((p) => (
                <label key={p}>
                  <input type="radio" name="purpose" value={p} checked={form.purpose === p} onChange={setText} /> {p}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Contact information</legend>
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
            <div><small>Certificate</small><strong>Baptismal – {format.title.split(' – ')[0]}</strong></div>
            <div><small>For</small><strong>{form.fullName}</strong></div>
            <div><small>Fee</small><strong>{peso(format.fee)}</strong></div>
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
              <Field label="Your GCash number" type="tel" name="gcashNumber" value={pay.gcashNumber} onChange={setPayField} placeholder="09XX XXX XXXX" required />
              <Field label="Your GCash account name" name="gcashName" value={pay.gcashName} onChange={(e) => setPay({ ...pay, gcashName: e.target.value.toUpperCase() })} required />
              <Field label="Proof of payment" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={onProof} hint="JPG, PNG, or PDF. Max 5 MB. Staff will verify your payment before processing." required />
            </fieldset>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.back} onClick={() => go(2)}>Back</button>
            <button type="submit" className={styles.primary}>Submit request</button>
          </div>
        </form>
      )}

      {step === 4 && (
        <div className={styles.success}>
          <span className={styles.check}><i className="fa-solid fa-check" /></span>
          <h2>Request submitted</h2>
          <p>
            Your baptismal certificate request was submitted. We will update you at <b>{form.email}</b> or {form.phone} once it has been processed
            {format.id === 'digital' ? ' and send your e-certificate by email.' : '. You will be emailed when your hardcopy is ready for pickup.'}
          </p>
          <div className={styles.ref}><small>Request reference number</small><strong>{refNo}</strong></div>
          <p className={styles.note}>Keep this number for follow-ups.</p>
          <Link to="/" className={styles.primary}>Back to home</Link>
        </div>
      )}
    </div>
  );
}