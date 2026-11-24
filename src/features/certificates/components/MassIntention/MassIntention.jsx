import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MASS_TYPES, MASS_TIMES, MASS_OFFERING_NOTE, GCASH } from '../../../../data/certificates.js';
import base from '../BaptismalRequest/BaptismalRequest.module.css';
import own from './MassIntention.module.css';
const STEPS = ['Details', 'Type', 'Schedule', 'Payment', 'Done'];
const TODAY = new Date().toISOString().slice(0, 10);
const EMPTY = { requestor: '', phone: '', email: '', prayedFor: '', special: '', consent: false };
const PAY_EMPTY = { method: '', gcashRef: '', proof: null };

function Field({ label, hint, ...props }) {
  return (
    <label className={base.field}>
      <span>{label}</span>
      <input {...props} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

export default function MassIntention() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY);
  const [typeId, setTypeId] = useState('');
  const [sched, setSched] = useState({ date: '', time: '' });
  const [pay, setPay] = useState(PAY_EMPTY);
  const [error, setError] = useState('');
  const [refNo, setRefNo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const type = MASS_TYPES.find((t) => t.id === typeId);

  const go = (n) => { setError(''); setStep(n); window.scrollTo(0, 0); };
  const setText = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const setUpper = (e) => setForm({ ...form, [e.target.name]: e.target.value.toUpperCase() });
  const setPayField = (e) => setPay({ ...pay, [e.target.name]: e.target.value });

  const submitDetails = (e) => {
    e.preventDefault();
    if (!/^(09|\+639)\d{9}$/.test(form.phone.replace(/[\s-]/g, '')))
      return setError('Enter a valid mobile number, e.g. 0917 123 4567.');
    if (!form.consent) return setError('Please agree to the data privacy notice to continue.');
    go(2);
  };

  const submitType = () => {
    if (!typeId) return setError('Select the type of Mass Intention.');
    go(3);
  };

  const submitSchedule = (e) => {
    e.preventDefault();
    if (!sched.date) return setError('Choose your preferred date.');
    if (!sched.time) return setError('Choose your preferred Mass time.');
    go(4);
  };

  const onProof = (e) => {
    const file = e.target.files[0];
    if (!file) return setPay({ ...pay, proof: null });
    if (!/^(image\/(jpeg|png)|application\/pdf)$/.test(file.type)) {
      e.target.value = '';
      return setError('Receipt must be a JPG, PNG, or PDF file.');
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
    if (pay.method === 'gcash') {
      if (!pay.gcashRef.trim()) return setError('Enter your GCash reference number.');
      if (!pay.proof) return setError('Upload your GCash payment receipt (screenshot).');
    }

    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('requestor', form.requestor);
      fd.append('phone', form.phone);
      fd.append('email', form.email);
      fd.append('prayedFor', form.prayedFor);
      fd.append('special', form.special);
      fd.append('consent', String(form.consent));
      fd.append('typeId', typeId);
      fd.append('date', sched.date);
      fd.append('time', sched.time);
      fd.append('method', pay.method);
      if (pay.method === 'gcash') {
        fd.append('gcashRef', pay.gcashRef);
        fd.append('proof', pay.proof);
      }

      const res = await fetch('/api/requests/mass-intention', { method: 'POST', body: fd });
      let data = {};
      try { data = await res.json(); } catch { /* non-JSON response */ }

      if (!res.ok) return setError(data.message || 'Could not submit your request. Please try again.');
      setRefNo(data.reference_no);
      go(5);
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
        <h1>Pamisa / Mass Intention</h1>
      </div>

      <ol className={base.steps} style={{ gridTemplateColumns: 'repeat(5, 1fr)' }} aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className={`${i + 1 === step ? base.cur : ''} ${i + 1 < step ? base.done : ''}`}
              aria-current={i + 1 === step ? 'step' : undefined}>
            <b>{i + 1 < step ? <i className="fa-solid fa-check" /> : i + 1}</b><span>{s}</span>
          </li>
        ))}
      </ol>

      {error && <p className={base.error} role="alert">{error}</p>}

      {/* 1. DETAILS */}
      {step === 1 && (
        <form className={base.stack} onSubmit={submitDetails}>
          <p className={base.note}>All names are converted to uppercase automatically. No account needed.</p>
          <fieldset>
            <legend>A. Requestor</legend>
            <Field label="Full name of requestor" name="requestor" value={form.requestor} onChange={setUpper} required autoComplete="off" />
            <Field label="Contact number" type="tel" name="phone" value={form.phone} onChange={setText} placeholder="09XX XXX XXXX" required />
            <Field label="Email address (optional)" type="email" name="email" value={form.email} onChange={setText} placeholder="marites@email.com" hint="Your confirmation can be sent here." />
          </fieldset>
          <fieldset>
            <legend>B. Mass Intention</legend>
            <Field label="Name of person to be prayed for" name="prayedFor" value={form.prayedFor} onChange={setUpper} required />
            <label className={base.field}>
              <span>Special requests (optional)</span>
              <textarea className={own.area} name="special" value={form.special} onChange={setUpper} placeholder="PLEASE INCLUDE THE FAMILY IN THE PRAYER." />
            </label>
            <p className={base.note}>The type of Mass Intention, preferred date, and Mass time are chosen on the next screens.</p>
          </fieldset>

          <label className={base.consent}>
            <input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
            <span>I agree that the parish may use these details to process this request. {/* TODO: final privacy notice wording */}</span>
          </label>

          <div className={base.actions}>
            <Link to="/" className={base.back}>Cancel</Link>
            <button type="submit" className={base.primary}>Continue</button>
          </div>
        </form>
      )}

      {/* 2. TYPE */}
      {step === 2 && (
        <div className={base.stack}>
          <p className={base.lead}>Select the purpose of your Mass Intention.</p>
          {MASS_TYPES.map((t, i) => (
            <label key={t.id} className={`${base.option} ${typeId === t.id ? base.picked : ''}`}>
              <input type="radio" name="type" checked={typeId === t.id} onChange={() => { setTypeId(t.id); setError(''); }} />
              <span className={base.optText}><strong>{i + 1}. {t.title}</strong><small>{t.desc}</small></span>
            </label>
          ))}
          <div className={base.actions}>
            <button type="button" className={base.back} onClick={() => go(1)}>Back</button>
            <button type="button" className={base.primary} onClick={submitType}>Continue</button>
          </div>
        </div>
      )}

      {/* 3. SCHEDULE */}
      {step === 3 && (
        <form className={base.stack} onSubmit={submitSchedule}>
          <p className={base.lead}>Choose your preferred date and Mass time.</p>
          <fieldset>
            <legend>Mass schedule</legend>
            <Field label="Preferred date of Mass" type="date" name="date" value={sched.date} min={TODAY}
                   onChange={(e) => setSched({ ...sched, date: e.target.value })} required />
            <div>
              <p className={base.lead} style={{ fontSize: '0.78rem', marginBottom: '0.4rem' }}>Preferred Mass time</p>
              <div className={base.radios} style={{ gridTemplateColumns: '1fr' }}>
                {MASS_TIMES.map((t) => (
                  <label key={t}><input type="radio" name="time" checked={sched.time === t} onChange={() => setSched({ ...sched, time: t })} /> {t}</label>
                ))}
              </div>
            </div>
          </fieldset>
          <div className={own.panel}>
            <b>Important reminders</b>
            <ul>
              <li>Mass schedules are subject to availability.</li>
              <li>The Parish Office must verify the requested schedule.</li>
              <li>The requested schedule is not automatically confirmed upon submission.</li>
            </ul>
          </div>
          <div className={base.actions}>
            <button type="button" className={base.back} onClick={() => go(2)}>Back</button>
            <button type="submit" className={base.primary}>Continue</button>
          </div>
        </form>
      )}

      {/* 4. PAYMENT */}
      {step === 4 && (
        <form className={base.stack} onSubmit={submitRequest}>
          <div className={base.summary}>
            <div><small>Intention</small><strong>{type.title}</strong></div>
            <div><small>For</small><strong>{form.prayedFor}</strong></div>
            <div><small>Schedule</small><strong>{sched.date} · {sched.time}</strong></div>
          </div>

          <p className={base.lead}>Choose how you will give your offering. {MASS_OFFERING_NOTE}</p>

          <label className={`${base.option} ${pay.method === 'gcash' ? base.picked : ''}`}>
            <input type="radio" name="method" value="gcash" checked={pay.method === 'gcash'} onChange={setPayField} />
            <span className={base.optIcon}><i className="fa-solid fa-mobile-screen" /></span>
            <span className={base.optText}><strong>GCash</strong><small>Send the offering to the parish GCash account, then upload your receipt.</small></span>
            <span className={base.tag}>Online payment</span>
          </label>
          <label className={`${base.option} ${pay.method === 'cash' ? base.picked : ''}`}>
            <input type="radio" name="method" value="cash" checked={pay.method === 'cash'} onChange={setPayField} />
            <span className={base.optIcon}><i className="fa-solid fa-hand-holding-dollar" /></span>
            <span className={base.optText}><strong>Cash at the Parish Office</strong><small>Pay the offering directly to the authorized parish staff.</small></span>
          </label>

          {pay.method === 'gcash' && (
            <fieldset>
              <legend>GCash payment</legend>
              <div className={base.gcash}>
                <div><small>Send to</small><strong>{GCASH.number}</strong></div>
                <div><small>Account name</small><strong>{GCASH.name}</strong></div>
              </div>
              <Field label="GCash reference number" name="gcashRef" value={pay.gcashRef} onChange={setPayField} placeholder="1234 567 890123" required />
              <Field label="GCash payment receipt (screenshot)" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={onProof} hint="JPG, PNG, or PDF. Max 5 MB. Staff will verify your payment." required />
            </fieldset>
          )}
          {pay.method === 'cash' && (
            <p className={own.panel}>Proceed to the Parish Office and pay the offering to the authorized staff. They will record and confirm your payment in the system.</p>
          )}

          <div className={base.actions}>
            <button type="button" className={base.back} onClick={() => go(3)} disabled={submitting}>Back</button>
            <button type="submit" className={base.primary} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit request'}
            </button>
          </div>
        </form>
      )}

      {/* 5. DONE */}
      {step === 5 && (
        <div className={base.success}>
          <span className={base.check}><i className="fa-solid fa-check" /></span>
          <h2>Request submitted</h2>
          <p>
            Your Mass Intention request has been submitted. The Parish Office will verify it. Your requested schedule is
            <b> not yet confirmed</b>. Please wait for the confirmation at {form.email ? <b>{form.email}</b> : 'your registered contact number'}
            {form.email ? <> or {form.phone}</> : <> ({form.phone})</>}.
          </p>
          <div className={base.ref}><small>Request reference number</small><strong>{refNo}</strong></div>
          <span className={own.status}>Request status: Pending</span>
          <p className={base.note}>Requested: {type.title} for {form.prayedFor}, {sched.date} {sched.time}. Keep this number for follow-ups.</p>
          <Link to="/" className={base.primary}>Back to home</Link>
        </div>
      )}
    </div>
  );
}