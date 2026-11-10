import { SERVICES } from '../../../../data/services.js';
import ServiceCard from './ServiceCard.jsx';
import styles from './Services.module.css';

export default function Services() {
  return (
    <section id="services" className={styles.section}>
      <div className="container">
        <div className={styles.head}>
          <div>
            <span className="eyebrow">System Capabilities</span>
            <h2>Proposed Parish Services</h2>
          </div>
          <div className={styles.notice}>
            <i className="fa-solid fa-triangle-exclamation" />
            <p><b>Important Notice:</b> These are proposed system service workflows. Services become officially active once configured and approved by parish administration.</p>
          </div>
        </div>

        <div className={styles.grid}>
          {SERVICES.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      </div>
    </section>
  );
}
