import styles from './About.module.css';

const FEATURES = [
  { icon: 'fa-database', title: 'Centralized Information', text: 'Single unified database for managing parish schedules, parishioner profiles, and administrative records with data integrity.', tag: 'Unified Operations' },
  { icon: 'fa-box-archive', title: 'Digitized Sacramental Records', text: 'Secure digital archiving of Baptismal, Marriage, Confirmation, and Funeral registries for faster processing.', tag: 'Fast Retrieval' },
  { icon: 'fa-hand-holding-heart', title: 'Accessible Services', text: 'Seamless online service requests allowing parishioners to submit certificate applications and mass intentions remotely.', tag: 'Remote Request' },
  { icon: 'fa-chart-pie', title: 'Data Analytics', text: 'Analytical dashboards offering parish priests and staff clear visualization of sacramental statistics and parish growth.', tag: 'Strategic Insights' },
];

export default function About() {
  return (
    <section id="about" className={styles.section}>
      <div className="container">
        <div className={styles.head}>
          <span className="eyebrow">Purpose &amp; Vision</span>
          <h2>Modernizing Faith Community Management</h2>
          <div className="divider" />
          <p>OLAP is tailored specifically for Our Lady of the Airways Parish to unify parish administration, optimize record retrieval, and maintain meaningful engagement with our growing congregation.</p>
        </div>

        <div className={styles.grid}>
          {FEATURES.map((f) => (
            <article key={f.title} className={styles.card}>
              <div>
                <div className={styles.icon}><i className={`fa-solid ${f.icon}`} /></div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
              <div className={styles.tag}>{f.tag} <i className="fa-solid fa-check" /></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
