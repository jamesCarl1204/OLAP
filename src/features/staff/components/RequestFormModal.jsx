import { Link } from 'react-router-dom';
import Modal from './Modal.jsx';
import Badge from './Badge.jsx';
import { useStaff, actions } from '../data/store.js';
import { STATUS, PAYMENT_STATUS, CERT_LABELS, peso, fmtDate, fmtDateTime } from '../data/mock.js';
import styles from '../styles/Staff.module.css';

function KV({ label, value }) {
  return <div><small>{label}</small><strong>{value || '—'}</strong></div>;
}

const Sect = ({ icon, children }) => (
  <h3 style={{ margin: '1.25rem 0 0.75rem', fontSize: '1rem', fontFamily: 'var(--font-serif)', color: 'var(--navy-900)' }}>
    <i className={icon} style={{ color: 'var(--gold-600)', marginRight: '0.4rem' }} />{children}
  </h3>
);

// Staff reads the whole form the requester filled out, then approves, holds, or rejects.
export default function RequestFormModal({ id, onClose }) {
  const { requests } = useStaff();
  const req = requests.find((r) => r.id === id);
  if (!req) return null;

  const pay = req.payment;
  const digital = req.format === 'digital';
  const gcash = pay.method === 'gcash';
  const noRec = req.certificate_type.startsWith('no_record');
  const submitted = req.status === 'submitted';

  const approve = async () => { await actions.start(id); onClose(); };
  const hold = async () => { await actions.hold(id); onClose(); };
  const reject = async () => { await actions.reject(id); onClose(); };

  const footer = submitted ? (
    <>
      <button type="button" className={styles.btnDanger} onClick={reject}><i className="fa-solid fa-ban" /> Reject</button>
      <button type="button" className={styles.btnGhost} onClick={hold}><i className="fa-solid fa-pause" /> Put on hold</button>
      <button type="button" className={styles.btn} onClick={approve}>
        <i className="fa-solid fa-circle-check" /> Approve &amp; {gcash ? 'check payment' : 'check record'}
      </button>
    </>
  ) : (
    <>
      <Link to={`/staff/requests/${id}`} className={styles.btnGhost} onClick={onClose}>Open full request</Link>
      <button type="button" className={styles.btn} onClick={onClose}>Close</button>
    </>
  );

  return (
    <Modal title={`Request form · ${req.reference_no}`} wide onClose={onClose} footer={footer}>
      <div style={{ textAlign: 'left' }}>
        <div className={styles.cardHead}>
          <h2 style={{ fontSize: '1.3rem' }}>{CERT_LABELS[req.certificate_type]} Certificate</h2>
          <Badge tone={STATUS[req.status].tone}>{STATUS[req.status].label}</Badge>
        </div>

        <div className={styles.kv}>
          <KV label="Reference" value={req.reference_no} />
          <KV label="Submitted" value={fmtDateTime(req.submitted_at)} />
          <KV label="Format" value={digital ? 'Digital · sent by email' : 'Hardcopy · pickup at parish office'} />
          <KV label="Privacy consent" value={req.consent_at ? `Agreed ${fmtDateTime(req.consent_at)}` : '—'} />
        </div>

        <Sect icon="fa-solid fa-user">Person on the certificate</Sect>
        <div className={styles.kv}>
          <KV label="Full name" value={req.subject_name} />
          <KV label="Purpose" value={req.purpose} />
          <KV label="Father" value={req.father_name} />
          <KV label="Mother (maiden)" value={req.mother_name} />
          <KV label="Date of birth" value={req.birth_date && fmtDate(req.birth_date)} />
          <KV label="Place of birth" value={req.birth_place} />
          <KV label="Date of event" value={req.event_date && fmtDate(req.event_date)} />
          {noRec && <KV label="Destination church" value={`${req.destination_church || ''}${req.destination_city ? `, ${req.destination_city}` : ''}`} />}
        </div>

        <Sect icon="fa-solid fa-address-book">Requester</Sect>
        <div className={styles.kv}>
          <KV label="Name" value={req.requester_name} />
          <KV label="Email" value={req.contact_email} />
          <KV label="Phone" value={req.contact_phone} />
        </div>

        <Sect icon="fa-solid fa-money-check-dollar">Payment</Sect>
        <div className={styles.cardHead} style={{ marginBottom: '0.6rem' }}>
          <strong>{peso(req.fee_amount)}</strong>
          <Badge tone={PAYMENT_STATUS[pay.status].tone}>{PAYMENT_STATUS[pay.status].label}</Badge>
        </div>
        <div className={styles.kv}>
          <KV label="Method" value={gcash ? 'GCash' : 'Pay upon pickup'} />
          {gcash && <KV label="Sender" value={`${pay.sender_account_name || '—'} · ${pay.sender_gcash_number || '—'}`} />}
        </div>
        {gcash && pay.proof && (
          <p style={{ marginTop: '0.6rem', fontSize: '0.8rem' }}>
            <i className="fa-solid fa-paperclip" /> {pay.proof.name} ·{' '}
            <a href={pay.proof.url} target="_blank" rel="noreferrer" style={{ color: 'var(--gold-700)', fontWeight: 700 }}>View proof</a>
          </p>
        )}

        {req.duplicates > 0 && (
          <p className={styles.note} style={{ marginTop: '1rem' }}>
            <b>Possible duplicate:</b> {req.duplicates} other request(s) with the same name, type, and email.
          </p>
        )}
      </div>
    </Modal>
  );
}