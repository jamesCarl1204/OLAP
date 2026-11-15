import ConfirmationRequest from '../components/ConfirmationRequest/ConfirmationRequest.jsx';
import styles from './RequestPage.module.css';

export default function ConfirmationRequestPage() {
  return (
    <section className={styles.page}>
      <div className={styles.wrap}>
        <ConfirmationRequest />
      </div>
    </section>
  );
}