import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BAPTISM_TYPES, BAPTISM_REQUIREMENTS, BAPTISM_REMINDERS, EXTRA_SPONSOR_FEE, baptismFee, GCASH, PAYMENTS,
} from '../../../../data/certificates.js';
import base from '../BaptismalRequest/BaptismalRequest.module.css';
import own from './BaptismRegistration.module.css';

const STEPS = ['Info', 'Schedule', 'Form', 'Files', 'Pay', 'Done'];
const TODAY = new Date().toISOString().slice(0, 10);
const NEW_SPONSOR = () => ({ name: '', address: '' });
const EMPTY = {
  surname: '', given: '', middle: '', dob: '', pob: '',
  father: '', fatherPob: '', mother: '', motherPob: '',
  marriedLegally: false, lateBirthReg: false,
  marriageKind: 'Catholic', venue: '', address: '',
  sponsors: [NEW_SPONSOR(), NEW_SPONSOR()],
  email: '', phone: '', conforme: false, parentName: '',
};
const SCHEDULE_EMPTY = { typeId: '', date: '', time: '' };
const FILES_EMPTY = { birth: null, marriage: null, noRecord: null };
const PAY_EMPTY = { method: '', gcashNumber: '', gcashName: '', proof: null };

const peso = (n) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
const weekday = (d) => new Date(`${d}T00:00:00`).getDay();
const DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const yearsBetween = (dob, on) => {
  const a = new Date(dob), b = new Date(on);
  let y = b.getFullYear() - a.getFullYear();
  const m = b.getMonth() - a.getMonth();
  if (m < 0 || (m === 0 && b.getDate() < a.getDate())) y--;
  return y;
};
const okFile = (file) => /^(image\/(jpeg|png)|application\/pdf)$/.test(file.type);

function Field({ label, hint, ...props }) {
  return (
    <label className={base.field}>
      <span>{label}</span>
      <input {...props} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

export default function BaptismRegistration() {
  const [step, setStep] = useState(1);
  const [sched, setSched] = useState(SCHEDULE_EMPTY);
  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState(FILES_EMPTY);
  const [pay, setPay] = useState(PAY_EMPTY);
  const [error, setError] = useState('');
  const [refNo, setRefNo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const type = BAPTISM_TYPES.find((t) => t.id === sched.typeId);
  const fee = type ? baptismFee(type, form.sponsors.length) : null;
  const childName = [form.given, form.middle, form.surname].filter(Boolean).join(' ');

  const go = (n) => { setError(''); setStep(n); window.scrollTo(0, 0); };
  const setText = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const setUpper = (e) => setForm({ ...form, [e.target.name]: e.target.value.toUpperCase() });
  const setCheck = (e) => setForm({ ...form, [e.target.name]: e.target.checked });
  const setPayField = (e) => setPay({ ...pay, [e.target.name]: e.target.value });

  const pickType = (t) => setSched({ typeId: t.id, date: '', time: t.times.length === 1 ? t.times[0] : '' });

  const setSponsor = (i, key, value) =>
    setForm({ ...form, sponsors: form.sponsors.map((s, idx) => (idx === i ? { ...s, [key]: value.toUpperCase() } : s)) });
  const addSponsor = () => setForm({ ...form, sponsors: [...form.sponsors, NEW_SPONSOR()] });
  const removeSponsor = (i) => setForm({ ...form, sponsors: form.sponsors.filter((_, idx) => idx !== i) });

  const submitSchedule = (e) => {
    e.preventDefault();
    if (!type) return setError('Select a baptism type.');
    if (!sched.date) return setError('Choose your preferred date.');
    if (!type.weekdays.includes(weekday(sched.date)))
      return setError(`${type.title} is only on ${type.days}. You picked a ${DAY[weekday(sched.date)]}.`);
    if (!sched.time) return setError('Choose a time.');
    go(3);
  };

  const submitForm = (e) => {
    e.preventDefault();
    if (type.maxAge && form.dob && yearsBetween(form.dob, sched.date) >= type.maxAge)
      return setError(`Only children below ${type.maxAge} years old can be baptized on Sundays. Pick a Saturday or a Special Baptism.`);
    const sponsors = form.sponsors.filter((s) => s.name.trim() || s.address.trim());
    if (sponsors.length < 2 || sponsors.slice(0, 2).some((s) => !s.name.trim() || !s.address.trim()))
      return setError('Enter the name and address of at least one pair of sponsors (Ninong and Ninang).');
    if (sponsors.some((s) => !s.name.trim() || !s.address.trim()))
      return setError('Complete the name and address of every sponsor, or remove the empty row.');
    if (!/^(09|\+639)\d{9}$/.test(form.phone.replace(/[\s-]/g, '')))
      return setError('Enter a valid mobile number, e.g. 0917 123 4567.');
    if (!form.conforme) return setError('Please confirm the Conforme to continue.');
    setForm({ ...form, sponsors });
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
    if (!files.birth) return setError('Birth Certificate is required. NO REQUIREMENTS, NO BAPTISM.');
    if (form.marriedLegally && !files.marriage) return setError('Upload the Marriage Contract (parents are legally married).');
    if (form.lateBirthReg && !files.noRecord) return setError('Upload the Certificate of No Record (late-registered birth certificate).');
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
      fd.append('typeId', sched.typeId);
      fd.append('date', sched.date);
      fd.append('time', sched.time);
      fd.append('surname', form.surname);
      fd.append('given', form.given);
      fd.append('middle', form.middle);
      fd.append('dob', form.dob);
      fd.append('pob', form.pob);
      fd.append('father', form.father);
      fd.append('fatherPob', form.fatherPob);
      fd.append('mother', form.mother);
      fd.append('motherPob', form.motherPob);
      fd.append('marriageKind', form.marriageKind);
      fd.append('venue', form.venue);
      fd.append('address', form.address);
      fd.append('marriedLegally', String(form.marriedLegally));
      fd.append('lateBirthReg', String(form.lateBirthReg));
      fd.append('sponsors', JSON.stringify(form.sponsors));
      fd.append('email', form.email);
      fd.append('phone', form.phone);
      fd.append('conforme', String(form.conforme));
      fd.append('parentName', form.parentName);
      fd.append('method', pay.method);
      if (files.birth) fd.append('birth', files.birth);
      if (files.marriage) fd.append('marriage', files.marriage);
      if (files.noRecord) fd.append('noRecord', files.noRecord);
      if (pay.method === 'gcash') {
        fd.append('gcashNumber', pay.gcashNumber);
        fd.append('gcashName', pay.gcashName);
        fd.append('proof', pay.proof);
      }

      const res = await fetch('/api/requests/baptism-registration', { method: 'POST', body: fd });
      let data = {};
      try { data = await res.json(); } catch { /* non-JSON response */ }

      if (!res.ok) return setError(data.message || 'Could not submit your registration. Please try again.');
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
        <h1>Baptism Registration</h1>
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
          <p className={base.lead}>Please read this before you register.</p>
          {BAPTISM_TYPES.map((t) => (
            <div key={t.id} className={own.panel}>
              <h3>{t.title} <span className={own.price}>· {peso(t.base + t.stipend)}</span></h3>
              <p><b>{t.days}</b> · {t.times.join(' / ')}</p>
              <p>{t.note} Extra sponsor: {peso(EXTRA_SPONSOR_FEE)} per head.</p>
            </div>
          ))}
          <div className={own.panel}>
            <h3>Baptismal requirements</h3>
            <ol>{BAPTISM_REQUIREMENTS.map((r) => <li key={r}>{r}</li>)}</ol>
          </div>
          <div className={own.panel}>
            <h3>Important reminders</h3>
            <ol>{BAPTISM_REMINDERS.map((r) => <li key={r}>{r}</li>)}</ol>
          </div>
          <p className={base.note}>Fees and schedules are from the draft and are pending parish confirmation.</p>
          <div className={base.actions}>
            <Link to="/" className={base.back}>Cancel</Link>
            <button type="button" className={base.primary} onClick={() => go(2)}>Continue to registration</button>
          </div>
        </div>
      )}

      {/* 2. TYPE + SCHEDULE */}
      {step === 2 && (
        <form className={base.stack} onSubmit={submitSchedule}>
          <p className={base.lead}>Choose a baptism type. The fee is shown beside each option.</p>
          {BAPTISM_TYPES.map((t) => (
            <label key={t.id} className={`${base.option} ${sched.typeId === t.id ? base.picked : ''}`}>
              <input type="radio" name="typeId" checked={sched.typeId === t.id} onChange={() => pickType(t)} />
              <span className={base.optText}>
                <strong>{t.title}</strong>
                <small>{t.days} · {t.times.join(' / ')}. {t.maxAge ? `Children below ${t.maxAge} only.` : ''}</small>
              </span>
              <span className={base.fee}>{peso(t.base + t.stipend)}</span>
            </label>
          ))}

          {type && (
            <fieldset>
              <legend>Preferred schedule</legend>
              <Field label={`Preferred date (${type.days})`} type="date" name="date" value={sched.date} min={TODAY}
                     onChange={(e) => setSched({ ...sched, date: e.target.value })} required />
              {type.times.length > 1 ? (
                <div className={base.radios}>
                  {type.times.map((t) => (
                    <label key={t}><input type="radio" name="time" checked={sched.time === t} onChange={() => setSched({ ...sched, time: t })} /> {t}</label>
                  ))}
                </div>
              ) : <p className={base.note}>Time: {type.times[0]}</p>}
              <p className={base.note}>The parish will confirm the final schedule by email after reviewing the request.</p>
            </fieldset>
          )}

          <div className={base.actions}>
            <button type="button" className={base.back} onClick={() => go(1)}>Back</button>
            <button type="submit" className={base.primary}>Continue</button>
          </div>
        </form>
      )}

      {/* 3. FORM */}
      {step === 3 && (
        <form className={base.stack} onSubmit={submitForm}>
          <p className={base.note}>All names are converted to uppercase automatically.</p>

          <fieldset>
            <legend>A. Child</legend>
            <div className={base.row2}>
              <Field label="Surname" name="surname" value={form.surname} onChange={setUpper} required />
              <Field label="Given name" name="given" value={form.given} onChange={setUpper} required />
            </div>
            <Field label="Middle name" name="middle" value={form.middle} onChange={setUpper} />
            <div className={base.row2}>
              <Field label="Date of birth" type="date" name="dob" value={form.dob} onChange={setText} max={TODAY} required />
              <Field label="Place of birth" name="pob" value={form.pob} onChange={setUpper} placeholder="MANILA" required />
            </div>
          </fieldset>

          <fieldset>
            <legend>B. Parents</legend>
            <div className={base.row2}>
              <Field label="Father's name" name="father" value={form.father} onChange={setUpper} required />
              <Field label="Father's place of birth" name="fatherPob" value={form.fatherPob} onChange={setUpper} required />
            </div>
            <div className={base.row2}>
              <Field label="Mother's name (maiden)" name="mother" value={form.mother} onChange={setUpper} required />
              <Field label="Mother's place of birth" name="motherPob" value={form.motherPob} onChange={setUpper} required />
            </div>
          </fieldset>

          <fieldset>
            <legend>C. Church where the parents married</legend>
            <div className={base.radios}>
              {['Catholic', 'Non-Catholic', 'Civil'].map((k) => (
                <label key={k}><input type="radio" name="marriageKind" value={k} checked={form.marriageKind === k} onChange={setText} /> {k}</label>
              ))}
            </div>
            <Field label="Name and place of church / venue" name="venue" value={form.venue} onChange={setUpper} placeholder="SAMPLE PARISH, PASAY CITY" required />
            <label className={base.consent}>
              <input type="checkbox" name="marriedLegally" checked={form.marriedLegally} onChange={setCheck} />
              <span>The parents are legally married (a Marriage Contract is required).</span>
            </label>
            <label className={base.consent}>
              <input type="checkbox" name="lateBirthReg" checked={form.lateBirthReg} onChange={setCheck} />
              <span>The child's Birth Certificate was late-registered (a Certificate of No Record is required).</span>
            </label>
          </fieldset>

          <fieldset>
            <legend>D. Present address of parents</legend>
            <Field label="Present address" name="address" value={form.address} onChange={setUpper} required />
          </fieldset>

          <fieldset>
            <legend>E. Sponsors (Ninong and Ninang)</legend>
            <p className={base.note}>
              {type.title} includes {type.freeSponsors} sponsors. Extra sponsors cost {peso(EXTRA_SPONSOR_FEE)} each.
            </p>
            {form.sponsors.map((s, i) => (
              <div key={i} className={own.sponsor}>
                <Field label={`Sponsor ${i + 1} name`} value={s.name} onChange={(e) => setSponsor(i, 'name', e.target.value)} />
                <Field label="Address" value={s.address} onChange={(e) => setSponsor(i, 'address', e.target.value)} />
                {i >= 2 ? <button type="button" className={own.rm} onClick={() => removeSponsor(i)}>Remove</button> : <span />}
              </div>
            ))}
            <button type="button" className={own.addBtn} onClick={addSponsor}>+ Add sponsor</button>
          </fieldset>

          <fieldset>
            <legend>F. Contact information</legend>
            <Field label="Email address" type="email" name="email" value={form.email} onChange={setText} placeholder="juan@email.com" required hint="Used for request updates and the schedule confirmation." />
            <Field label="Contact number" type="tel" name="phone" value={form.phone} onChange={setText} placeholder="09XX XXX XXXX" required />
          </fieldset>

          <fieldset>
            <legend>G. Conforme</legend>
            <label className={base.consent}>
              <input type="checkbox" name="conforme" checked={form.conforme} onChange={setCheck} />
              <span>I confirm that the information above is correct and that I have read the Baptismal Information and Reminders.</span>
            </label>
            <Field label="Print name of parent" name="parentName" value={form.parentName} onChange={setUpper} required />
            <p className={base.note}>Date signed: {new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </fieldset>

          <div className={base.actions}>
            <button type="button" className={base.back} onClick={() => go(2)}>Back</button>
            <button type="submit" className={base.primary}>Continue</button>
          </div>
        </form>
      )}

      {/* 4. REQUIREMENTS */}
      {step === 4 && (
        <form className={base.stack} onSubmit={submitFiles}>
          <p className={base.lead}>NO REQUIREMENTS, NO BAPTISM.</p>
          <p className={base.note}>Upload a clear photo or scan of each document. JPG, PNG, or PDF. Max 5 MB.</p>
          <fieldset>
            <legend>Documents</legend>
            <Field label="1. Birth Certificate (required)" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={onFile('birth')} />
            <Field label={`2. Marriage Contract ${form.marriedLegally ? '(required)' : '(only if the parents are legally married)'}`}
                   type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={onFile('marriage')} />
            <Field label={`3. Certificate of No Record ${form.lateBirthReg ? '(required)' : '(only if the birth certificate was late-registered)'}`}
                   type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={onFile('noRecord')} />
          </fieldset>
          <p className={base.note}>On the day of the baptism, bring the hard copies (xerox) of all requirements and your payment receipt for verification.</p>
          <div className={base.actions}>
            <button type="button" className={base.back} onClick={() => go(3)}>Back</button>
            <button type="submit" className={base.primary}>Continue</button>
          </div>
        </form>
      )}

      {/* 5. FEE + PAYMENT */}
      {step === 5 && (
        <form className={base.stack} onSubmit={submitRequest}>
          <div className={own.feeTable}>
            <div className={own.feeRow}><span>{type.title}</span><span>{peso(type.base)}</span></div>
            {type.stipend > 0 && <div className={own.feeRow}><span>Priest's stipend</span><span>{peso(type.stipend)}</span></div>}
            {fee.extra > 0 && <div className={own.feeRow}><span>Extra sponsors: {fee.extra} × {peso(EXTRA_SPONSOR_FEE)}</span><span>{peso(fee.extraFee)}</span></div>}
            <div className={`${own.feeRow} ${own.feeTotal}`}><span>TOTAL BAPTISM FEE</span><span>{peso(fee.total)}</span></div>
          </div>
          <p className={base.note}>
            {form.sponsors.length} sponsor{form.sponsors.length > 1 ? 's' : ''} entered. {type.freeSponsors} are included in the base fee.
          </p>

          <p className={base.lead}>Select how you would like to pay.</p>
          <label className={`${base.option} ${pay.method === 'pickup' ? base.picked : ''}`}>
            <input type="radio" name="method" value="pickup" checked={pay.method === 'pickup'} onChange={setPayField} />
            <span className={base.optIcon}><i className="fa-solid fa-hand-holding-dollar" /></span>
            <span className={base.optText}><strong>Pay at the Parish Office</strong><small>Pay the baptism fee directly at the parish office.</small></span>
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
              <Field label="Proof of payment" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={onProof} hint="JPG, PNG, or PDF. Max 5 MB. Staff will verify your payment." required />
            </fieldset>
          )}

          <div className={base.actions}>
            <button type="button" className={base.back} onClick={() => go(4)} disabled={submitting}>Back</button>
            <button type="submit" className={base.primary} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit request'}
            </button>
          </div>
        </form>
      )}

      {/* 6. DONE */}
      {step === 6 && (
        <div className={base.success}>
          <span className={base.check}><i className="fa-solid fa-check" /></span>
          <h2>Request submitted</h2>
          <p>
            Your baptism request for <b>{childName}</b> was submitted. The parish staff will review your requirements and payment.
            Please wait for the schedule confirmation at <b>{form.email}</b> or {form.phone}.
          </p>
          <div className={base.ref}><small>Request reference number</small><strong>{refNo}</strong></div>
          <p className={own.remind}>
            <b>Reminders:</b> Arrive at least one (1) hour before the scheduled baptism. Bring the hard copies (xerox) of all requirements and your payment receipt for verification.
          </p>
          <p className={base.note}>Keep this number for follow-ups. Requested: {type.title}, {sched.date} {sched.time} (not yet confirmed).</p>
          <Link to="/" className={base.primary}>Back to home</Link>
        </div>
      )}
    </div>
  );
}