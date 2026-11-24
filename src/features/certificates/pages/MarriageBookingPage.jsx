import MarriageBooking from '../components/MarriageBooking/MarriageBooking.jsx';
import styles from './RequestPage.module.css';

export default function MarriageBookingPage() {
  return (
    <section className={styles.page}>
      <div className={styles.wrap}>
        <MarriageBooking />
      </div>
    </section>
  );
}