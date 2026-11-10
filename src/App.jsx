import PublicLayout from './layouts/PublicLayout/PublicLayout.jsx';
import LandingPage from './pages/Landing/LandingPage.jsx';

// When portals are added, replace this with react-router routes:
//   "/"           -> PublicLayout > LandingPage
//   "/admin/*"    -> AdminLayout  > admin pages
//   "/staff/*"    -> StaffLayout  > staff pages  ... etc.
export default function App() {
  return (
    <PublicLayout>
      <LandingPage />
    </PublicLayout>
  );
}
