import { Navigate, useParams } from 'react-router-dom';
import NoRecordRequest from '../components/NoRecordRequest/NoRecordRequest.jsx';
import { NO_RECORD_TYPES } from '../../../data/certificates.js';
import styles from './RequestPage.module.css';

export default function NoRecordRequestPage() {
  const { kind } = useParams(); // 'baptism' | 'confirmation'
  if (!NO_RECORD_TYPES[kind]) return <Navigate to="/request" replace />;

  return (
    <section className={styles.page}>
      <div className={styles.wrap}>
        {/* key resets the form when switching between the two kinds */}
        <NoRecordRequest key={kind} kind={kind} />
      </div>
    </section>
  );
}