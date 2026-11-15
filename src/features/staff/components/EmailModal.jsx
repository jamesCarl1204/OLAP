import Modal from './Modal.jsx';
import styles from '../styles/Staff.module.css';

// Preview of the email before it is sent to the requester.
export default function EmailModal({ mail, onSend, onClose }) {
  return (
    <Modal title="Send email" onClose={onClose}
      footer={<>
        <button type="button" className={styles.btnGhost} onClick={onClose}>Cancel</button>
        <button type="button" className={styles.btn} onClick={onSend}><i className="fa-solid fa-paper-plane" /> Send email</button>
      </>}>
      <div className={styles.mail}>
        <div><small>To</small><strong>{mail.to}</strong></div>
        <div><small>Subject</small><strong>{mail.subject}</strong></div>
        {mail.attachment && <div><small>Attachment</small><span className={styles.chip}><i className="fa-solid fa-file-pdf" /> {mail.attachment}</span></div>}
        <pre>{mail.body}</pre>
      </div>
    </Modal>
  );
}