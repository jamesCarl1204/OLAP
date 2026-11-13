import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout/PublicLayout.jsx';
import LandingPage from './pages/Landing/LandingPage.jsx';
import AuthPage from './pages/Auth/AuthPage.jsx';
import RequestPage from './pages/Request/RequestPage.jsx';
import BaptismalRequestPage from './pages/Request/BaptismalRequestPage.jsx';

function ScrollToHash() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <PublicLayout>
      <ScrollToHash />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/request" element={<RequestPage />} />
        <Route path="/request/baptismal" element={<BaptismalRequestPage />} />
     </Routes>
    </PublicLayout>
  );
}