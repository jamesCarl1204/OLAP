import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout/PublicLayout.jsx';
import StaffLayout from './layouts/StaffLayout/StaffLayout.jsx';
import LandingPage from './features/landing/pages/LandingPage.jsx';
import AuthPage from './features/auth/pages/AuthPage.jsx';
import RequestPage from './features/certificates/pages/RequestPage.jsx';
import BaptismalRequestPage from './features/certificates/pages/BaptismalRequestPage.jsx';
import ConfirmationRequestPage from './features/certificates/pages/ConfirmationRequestPage.jsx';
import DashboardPage from './features/staff/pages/DashboardPages.jsx';
import RequestsPage from './features/staff/pages/RequestPage.jsx';
import RequestDetailPage from './features/staff/pages/RequestDetailPage.jsx';
import PaymentsPage from './features/staff/pages/PaymentsPage.jsx';
import CertificatesPage from './features/staff/pages/CertificatesPage.jsx';
import RecordsPage from './features/staff/pages/RecordsPage.jsx';
import EmailsPage from './features/staff/pages/EmailsPage.jsx';
import NoRecordRequestPage from './features/certificates/pages/NoRecordRequestPage.jsx';
import BaptismRegistrationPage from './features/certificates/pages/BaptismRegistrationPage.jsx';
import MassIntentionPage from './features/certificates/pages/MassIntentionPage.jsx';
import BaptismsPage from './features/staff/pages/BaptismPage.jsx';
import MassIntentionsPage from './features/staff/pages/MassIntentionsPage.jsx';

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
    <>
      <ScrollToHash />
      <Routes>
        {/* Public site (with header + footer) */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/request" element={<RequestPage />} />
          <Route path="/request/baptismal" element={<BaptismalRequestPage />} />
          <Route path="/request/confirmation" element={<ConfirmationRequestPage />} />
          <Route path="/request/no-record/:kind" element={<NoRecordRequestPage />} /> 
          <Route path="/register/baptism" element={<BaptismRegistrationPage />} />
          <Route path="/register/mass-intention" element={<MassIntentionPage />} />
         </Route>

        {/* Staff portal (sidebar layout). TODO: protect with login guard */}
        <Route path="/staff" element={<StaffLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="requests" element={<RequestsPage />} />
          <Route path="requests/:id" element={<RequestDetailPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="certificates" element={<CertificatesPage />} />
          <Route path="records" element={<RecordsPage />} />
          <Route path="emails" element={<EmailsPage />} />
          <Route path="baptisms" element={<BaptismsPage />} />
          <Route path="masses" element={<MassIntentionsPage />} />
       
        </Route>
      </Routes>
    </>
  );
}