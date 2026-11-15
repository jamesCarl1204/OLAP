import styles from './About.module.css';

const FEATURES = [
  { icon: 'fa-database', title: 'Organized Parish Information', text: 'A centralized place for staff to manage parish requests, appointments, and sacramental record information.', tag: 'Staff Operations' },
  { icon: 'fa-box-archive', title: 'Sacramental Records', text: 'Support for Baptism, Confirmation, and Marriage record management and certificate requests.', tag: 'Parish Records' },
  { icon: 'fa-hand-holding-heart', title: 'Online Parish Services', text: 'Parishioners can submit certificate requests and booking inquiries through the public website without creating an account.', tag: 'Public Access' },
  { icon: 'fa-chart-pie', title: 'Reports and Analytics', text: 'Provide staff with summaries of requests, appointments, and parish records to support daily operations.', tag: 'Staff Insights' },
];

export default function About() {
  return (
    <section id="about" className={styles.section}>
      <div className="container">
        <div className={styles.head}>
          <span className="eyebrow">Purpose &amp; Vision</span>
          <h2>Modernizing Parish Service Management</h2>
          <div className="divider" />
          <p>OLAP is being designed for Our Lady of the Airways Parish to organize certificate requests, appointment bookings, and sacramental record workflows in one place.</p>
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
