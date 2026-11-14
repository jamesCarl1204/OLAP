import LoginForm from '../components/LoginForm/LoginForm.jsx';
import styles from './AuthPage.module.css';

export default function AuthPage() {
  return (
    <section className={styles.page}>
      <div className={styles.wrap}>
        <LoginForm />
      </div>
    </section>
  );
}