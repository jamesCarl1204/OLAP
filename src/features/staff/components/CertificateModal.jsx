import { useRef, useState } from 'react';
import Modal from './Modal.jsx';
import EmailModal from './EmailModal.jsx';
import Certificate, { printCertificate } from './Certificate.jsx';
import { useStaff, actions, buildEmail } from '../data/store.js';
import styles from '../styles/Staff.module.css';
import { PARISH_PRIEST } from '../data/mock.js';

// One place for the whole certificate flow: generate -> print -> send by email / release.
export default function CertificateModal({ id, onClose }) {
  const { requests, issued, records } = useStaff();
 const [signedBy, setSignedBy] = useState(PARISH_PRIEST);
  const [mailKind, setMailKind] = useState(null);
  const certRef = useRef(null);

  const req = requests.find((r) => r.id === id);
  if (!req) return null;

  const iss = issued[id];
  const rec = records[id];
  const digital = req.format === 'digital';
  const ready = req.status === 'ready';

  // Live preview before generating (certificate no. is assigned on generate).
  const draft = iss || {
    certificate_no: digital ? 'OLAP-CERT-####' : null,
    verify_token: digital ? 'preview' : null,
    signed_by: signedBy.trim() || PARISH_PRIEST,
    issued_at: new Date().toISOString(),
  };

  const send = () => { actions.sendEmail(id, mailKind, buildEmail(req, iss, mailKind)); setMailKind(null); };

  return (
    <>
      <Modal title={`${digital ? 'E-certificate' : 'Certificate'} · ${req.reference_no}`} wide onClose={onClose}
        footer={!iss ? (
          ready
            ? <button type="button" className={styles.btn} onClick={() => actions.generate(id, signedBy)}><i className="fa-solid fa-file-circle-plus" /> Generate {digital ? 'e-certificate' : 'certificate'}</button>
            : <span className={styles.muted} style={{ fontSize: '0.8rem' }}>Available once the record is found.</span>
        ) : <>
          <button type="button" className={styles.btnGhost} onClick={() => printCertificate(certRef.current)}><i className="fa-solid fa-print" /> Print / Save as PDF</button>
          <a className={styles.btnGhost} href={`/api/staff/requests/${id}/certificate.pdf`} target="_blank" rel="noreferrer">
            <i className="fa-solid fa-file-pdf" /> Download PDF
          </a>
          {digital && (ready || req.status === 'sent') && (
            <button type="button" className={styles.btn} onClick={() => setMailKind('certificate')}>
              <i className="fa-solid fa-paper-plane" /> {req.status === 'sent' ? 'Resend by email' : 'Send by email'}
            </button>
          )}
          {!digital && ready && <>
            <button type="button" className={styles.btnGhost} onClick={() => setMailKind('pickup')}><i className="fa-solid fa-envelope" /> Email: ready for pickup</button>
            <button type="button" className={styles.btn} onClick={() => actions.release(id)}><i className="fa-solid fa-hand-holding" /> Mark as released</button>
          </>}
        </>}>
        {!iss && ready && (
          <label className={styles.signField} style={{ textAlign: 'left' }}>
            <span>Signed by</span>
            <input className={styles.input} value={signedBy} onChange={(e) => setSignedBy(e.target.value)} />
          </label>
        )}
        <Certificate innerRef={certRef} req={req} record={rec} issued={draft} />
      </Modal>

      {mailKind && <EmailModal mail={buildEmail(req, iss, mailKind)} onSend={send} onClose={() => setMailKind(null)} />}
    </>
  );
}