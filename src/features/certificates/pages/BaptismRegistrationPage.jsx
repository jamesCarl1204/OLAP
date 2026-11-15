import BaptismRegistration from '../components/BaptismRegistration/BaptismRegistration.jsx';
import styles from './RequestPage.module.css';

export default function BaptismRegistrationPage() {
  return (
    <section className={styles.page}>
      <div className={styles.wrap}>
        <BaptismRegistration />
      </div>
    </section>
  );
}