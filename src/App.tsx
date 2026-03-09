import { Routes, Route, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import Homepage from './pages/Homepage';
// import RolePage from './pages/RolePage';
import RolePageVariant from './pages/RolePageVariant';
//import RolePageVariantV2 from './pages/RolePageVariantV2';
import { extractUrlParams, extractEmailFromUrl, hasTrackableParams } from './utils/urlParams';
import { storeUrlParams, getUserData } from './utils/localStorage';
import { analytics } from './services/analytics';
import DesignSystem from './pages/DesignSystem';
import SelectSkillsPage from './pages/SelectSkillsPage';
import LoadingPage from './pages/LoadingPage';

import ContactDetailsPage from './pages/ContactDetailsPage';
import PaymentLoadingPage from './pages/PaymentLoadingPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import SimpleResultsPage from './pages/SimpleResultsPage';
import ResultsPageV2 from './pages/ResultsPageV2';
import ResultsPageV3 from './pages/ResultsPageV3';
import ResultsPageV4 from './pages/ResultsPageV4';
// import AssessmentPageVariant from './pages/AssessmentPageVariant';
import AssessmentPage from './pages/AssessmentPage';
import FunnelDashboard from './pages/admin/FunnelDashboard';
import FunnelDashboardComparison from './pages/admin/FunnelDashboardComparison';
import RoleGeneratorDashboard from './pages/admin/RoleGeneratorDashboard';
import UserLookupDashboard from './pages/admin/UserLookupDashboard';

import AdminDashboard from './pages/AdminDashboard'; // ✨ NEW

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeOrRole />} />
      <Route path="/admin/certificates" element={<AdminDashboard />} /> {/* ✨ NEW */}
      <Route path="/admin/role-generator" element={<RoleGeneratorDashboard />} /> {/* ✨ NEW */}
      <Route path="/admin/user-lookup" element={<UserLookupDashboard />} /> {/* ✨ NEW */}
      <Route path="/design-system" element={<DesignSystem />} />
      <Route path="/select-skills" element={<SelectSkillsPage />} />
      <Route path="/loading" element={<LoadingPage />} />
      <Route path="/assessment" element={<AssessmentPage />} />
      <Route path="/contact-details" element={<ContactDetailsPage />} />
      <Route path="/results" element={<ResultsRouter />} />
      <Route path="/payment-loading" element={<PaymentLoadingPage />} />
      <Route path="/payment-success" element={<PaymentSuccessPage />} />
      <Route path="/results-v2" element={<SimpleResultsPage />} />
      <Route path="/results-v2-page" element={<ResultsPageV2 />} />
      <Route path="/results-v3" element={<ResultsPageV3 />} />
      <Route path="/results-v4" element={<ResultsPageV4 />} />
      <Route path="/assessment-variant" element={<AssessmentPage />} />
      <Route path="/role-variant" element={<RolePageVariant />} />
      <Route path="/admin/dashboard" element={<FunnelDashboard />} />
      <Route path="/admin/comparison" element={<FunnelDashboardComparison />} />
    </Routes>
  );
}

function ResultsRouter() {
  const [searchParams] = useSearchParams();
  const userData = getUserData();

  // Check URL first, then localStorage
  const utmSource = searchParams.get('utm_source') || userData.urlParams?.utm_source;

  // If utm_source is 'Certified2', show the simplified results page
  if (utmSource === 'Certified2') {
    return <SimpleResultsPage />;
  }

  // Default to ResultsPageV4 (with V3 as backup at /results-v3)
  return <ResultsPageV4 />;
}

function HomeOrRole() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');

  // Initialize analytics on app mount
  useEffect(() => {
    analytics.init();
  }, []);

  // Extract and store URL parameters (UTM data, email, role) on component mount
  useEffect(() => {
    // Extract UTM parameters and email if present
    if (hasTrackableParams()) {
      const urlParams = extractUrlParams();
      const email = extractEmailFromUrl();
      storeUrlParams(urlParams, email);
      console.log('App: Stored URL parameters:', urlParams);
      if (email) {
        console.log('App: Stored email:', email);
      }
    }

    // Store role parameter if present
    if (role) {
      const existingData = JSON.parse(localStorage.getItem('userData') || '{}');
      const updatedData = {
        ...existingData,
        role: role,
        timestamp: Date.now()
      };
      localStorage.setItem('userData', JSON.stringify(updatedData));
      console.log('App: Stored role parameter:', role);
    }
  }, [role]); // Re-run if role changes

  if (role) {
    return <RolePageVariant />;
  }

  return <Homepage />;
}

export default App;
