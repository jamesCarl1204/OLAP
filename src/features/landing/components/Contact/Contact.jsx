import styles from './Contact.module.css';

const INFO = [
  { icon: 'fa-solid fa-location-dot', label: 'Parish Address', title: 'Chapel Rd. cor. Ninoy Aquino Avenue', text: 'Our Lady of the Airways Parish, Pasay City' },
  { icon: 'fa-solid fa-phone', label: 'Telephone / Mobile', title: '(02) 8851-4371', text: 'Mobile: 0956-3647788 / 0919-4639797' },
  { icon: 'fa-solid fa-envelope', label: 'Email Address', title: 'airways_parish@yahoo.com', text: 'Official parish communications & online support email.' },
  // office hours: keep for now, kailangan pang i-confirm sa parish
  { icon: 'fa-regular fa-clock', label: 'Parish Office Hours', title: 'Tuesday – Sunday: 8:00 AM – 5:00 PM', text: 'Closed on Mondays & Major Canonical Holidays', warn: true },
];

export default function Contact() {
  return (
    <section id="contact" className={styles.section}>
      <div className="container">
        <div className={styles.head}>
          <span className="eyebrow">Get In Touch</span>
          <h2>Parish Office Information &amp; Contact</h2>
          <div className="divider" />
          <p>Reach out to the parish office for inquiries, sacramental scheduling, or administrative support.</p>
        </div>

        <div className={styles.grid}>
          <div className={styles.list}>
            {INFO.map((i) => (
              <div key={i.label} className={styles.item}>
                <div className={styles.icon}><i className={i.icon} /></div>
                <div>
                  <span className={styles.label}>{i.label}</span>
                  <h3>{i.title}</h3>
                  <p className={i.warn ? styles.warn : ''}>{i.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.map}>
            <div className={styles.mapInner}>
              <div className={styles.pin}><i className="fa-solid fa-map-location-dot" /></div>
              <h3>Parish Location Map Container</h3>
              <p>[ Interactive Map Embed Placeholder ]<br />Google Maps / OpenStreetMap integration slot ready for exact parish coordinates.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
