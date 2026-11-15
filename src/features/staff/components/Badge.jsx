import styles from '../styles/Staff.module.css';

export default function Badge({ tone = 'muted', children }) {
  return <span className={`${styles.badge} ${styles[`t_${tone}`]}`}>{children}</span>;
}