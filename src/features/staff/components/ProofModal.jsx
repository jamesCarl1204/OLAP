import { useState } from 'react';
import Modal from './Modal.jsx';
import Badge from './Badge.jsx';
import { useStaff, actions } from '../data/store.js';
import { PAYMENT_STATUS, peso, fmtDateTime } from '../data/mock.js';
import styles from '../styles/Staff.module.css';

// Staff views the uploaded proof of payment and decides: verify or reject.
export default function ProofModal({ id, onClose }) {
  const { requests } = useStaff();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const req = requests.find((r) => r.id === id);
  if (!req) return null;

  const pay = req.payment;
  const proof = pay.proof;
  const canReview = req.status === 'payment_check' && pay.method === 'gcash';

  const verify = () => { actions.verifyPayment(id); onClose(); };
  const reject = () => { if (reason.trim()) { actions.rejectPayment(id, reason.trim()); onClose(); } };

  return (
    <Modal title="Proof of payment" onClose={onClose}
      footer={canReview ? (
        rejecting ? <>
          <button type="button" className={styles.btnGhost} onClick={() => setRejecting(false)}>Cancel</button>
          <button type="button" className={styles.btnDanger} onClick={reject} disabled={!reason.trim()}><i className="fa-solid fa-circle-xmark" /> Confirm rejection</button>
        </> : <>
          <button type="button" className={styles.btnDanger} onClick={() => setRejecting(true)}><i className="fa-solid fa-circle-xmark" /> Reject</button>
          <button type="button" className={styles.btn} onClick={verify}><i className="fa-solid fa-circle-check" /> Verify payment</button>
        </>
      ) : <>
        {proof?.url && <a className={styles.btnGhost} href={proof.url} download={proof.name}><i className="fa-solid fa-download" /> Download</a>}
        <button type="button" className={styles.btn} onClick={onClose}>Close</button>
      </>}>
      <div className={styles.strip}>
        <div><small>Reference</small><strong>{req.reference_no}</strong></div>
        <div><small>Amount to receive</small><strong>{peso(req.fee_amount)}</strong></div>
        <div><small>Sender</small><strong>{pay.sender_account_name || '—'}</strong></div>
        <div><small>Status</small><Badge tone={PAYMENT_STATUS[pay.status].tone}>{PAYMENT_STATUS[pay.status].label}</Badge></div>
      </div>

      {proof ? (
        <>
          {proof.type === 'image'
            ? <img src={proof.url} alt="Proof of payment" />
            : <p className={styles.note}>PDF preview will open from the uploaded file once the backend is connected.</p>}
          <p className={styles.fileInfo}>{proof.name} · {proof.size_kb} KB · uploaded {fmtDateTime(proof.uploaded_at)}</p>
        </>
      ) : <p className={styles.note}>No proof uploaded.</p>}

      {rejecting && (
        <div className={styles.rejectBox} style={{ textAlign: 'left' }}>
          <textarea autoFocus placeholder="Reason for rejecting (sent to the requester by email)" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      )}
    </Modal>
  );
}