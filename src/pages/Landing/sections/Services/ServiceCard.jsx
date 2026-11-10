import styles from './ServiceCard.module.css';

export default function ServiceCard({ service }) {
  const { id, title, desc, badge, icon, img, cta } = service;
  return (
    <article id={`service-${id}`} className={styles.card}>
      <div>
        <div className={styles.imgWrap}>
          <img
            src={img}
            alt={title}
            onError={(e) => { e.currentTarget.src = `https://placehold.co/600x400/0f172a/d4af37?text=${encodeURIComponent(badge)}`; }}
          />
          <div className={styles.shade} />
          <span className={styles.badge}><i className={icon} /> {badge}</span>
        </div>
        <div className={styles.body}>
          <h3>{title}</h3>
          <p>{desc}</p>
        </div>
      </div>
      <div className={styles.footer}>
        <button type="button">
          <span>{cta}</span> <i className="fa-solid fa-arrow-right" />
        </button>
      </div>
    </article>
  );
}
