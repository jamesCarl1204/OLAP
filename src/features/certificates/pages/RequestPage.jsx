import { Link } from 'react-router-dom';
import { CERT_TYPES } from '../../../data/certificates.js';
import styles from './RequestPage.module.css';

export default function RequestPage() {
  return (
    <section className={styles.page}>
      <div className={styles.wrap}>
        <div className={styles.head}>
          <span className="eyebrow">Certificate Request</span>
          <h1>Which certificate do you need?</h1>
          <p>Select the type of certificate you wish to request.</p>
        </div>
        <div className={styles.list}>
          {CERT_TYPES.map((c) => {
            const body = (
              <>
                <span className={styles.icon}><i className={c.icon} /></span>
                <div>
                  <h3>{c.title}</h3>
                  <p>{c.desc}</p>
                </div>
                <span className={`${styles.state} ${c.to ? styles.on : styles.soon}`}>
                  {c.to ? 'Available now' : 'Coming later'}
                </span>
              </>
            );
            return c.to
              ? <Link key={c.id} to={c.to} className={styles.item}>{body}</Link>
              : <div key={c.id} className={`${styles.item} ${styles.off}`} aria-disabled="true">{body}</div>;
          })}
        </div>
      </div>
    </section>
  );
}