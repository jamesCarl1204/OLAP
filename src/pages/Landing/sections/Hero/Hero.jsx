import styles from './Hero.module.css';

export default function Hero() {
  return (
    <section id="home" className={styles.hero}>
      <div className={styles.glow} />
      <div className={`container ${styles.grid}`}>
        <div className={styles.left}>
          <div className={styles.badge}>
            <i className="fa-solid fa-cross" />
            <span>Our Lady of the Airways Parish Community</span>
          </div>

          <h1 className={styles.title}>
            <span className={styles.gold}>Sacramental Records,</span> Marriage Bookings &amp;{' '}
            <span className={styles.gold}>Service Requests</span>
          </h1>

          <p className={styles.desc}>
            Welcome to the digital portal of Our Lady of the Airways Parish. Request certificates,
            book marriages, and submit parish service requests anytime, anywhere.
          </p>

          <div className={styles.cta}>
            <a href="#services" className={styles.secondary}>
              <span>Explore Services</span> <i className="fa-solid fa-arrow-down" />
            </a>
          </div>

          <div className={styles.stats}>
            <div><b>100%</b><span>Digitized Records Capability</span></div>
            <div><b>24 / 7</b><span>Online Requests Access</span></div>
            <div><b>Real-Time</b><span>Parish Analytics</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}