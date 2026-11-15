import styles from './Hero.module.css';

const parishImage = 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?auto=format&fit=crop&w=1200&q=85';

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
            <span className={styles.gold}>Parish Records,</span> Marriage Bookings &amp;{' '}
            <span className={styles.gold}>Certificate Requests</span>
          </h1>
          <p className={styles.desc}>
            Welcome to the digital portal of Our Lady of the Airways Parish. Explore parish services,
            submit certificate requests, and inquire about marriage bookings and appointments.
          </p>
          <div className={styles.cta}>
            <a href="#services" className={styles.secondary}>
              <span>Explore Services</span> <i className="fa-solid fa-arrow-down" />
            </a>
          </div>
          <div className={styles.stats}>
            <div><b>Online</b><span>Parish Service Requests</span></div>
            <div><b>Staff</b><span>Managed Processing</span></div>
            <div><b>Parish</b><span>Records and Appointments</span></div>
          </div>
        </div>
        <div className={styles.right}>
          <img src={parishImage} alt="Church interior" />
        </div>
      </div>
    </section>
  );
}
