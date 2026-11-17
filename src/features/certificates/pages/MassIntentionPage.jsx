import MassIntention from '../components/MassIntention/MassIntention.jsx';
import styles from './RequestPage.module.css';

export default function MassIntentionPage() {
  return (
    <section className={styles.page}>
      <div className={styles.wrap}>
        <MassIntention />
      </div>
    </section>
  );
}