import BaptismalRequest from '../components/BaptismalRequest/BaptismalRequest.jsx';
import styles from './RequestPage.module.css';

export default function BaptismalRequestPage() {
  return (
    <section className={styles.page}>
      <div className={styles.wrap}>
        <BaptismalRequest />
      </div>
    </section>
  );
}