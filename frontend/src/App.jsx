import { useUser } from "@clerk/clerk-react";
import { Navigate, Route, Routes } from "react-router";
import { useState, useEffect } from "react";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import InterviewsPage from "./pages/InterviewsPage";
import InterviewSessionPage from "./pages/InterviewSessionPage";
import RealTimeInterviewPage from "./pages/RealTimeInterviewPage";
import ResultsPage from "./pages/ResultsPage";
import PreparationPage from "./pages/PreparationPage";
import ProfilePage from "./pages/ProfilePage";
import OnboardingPage from "./pages/OnboardingPage";
import SyllabusPage from "./pages/SyllabusPage";
import AssessmentPage from "./pages/AssessmentPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import FeedbackPage from "./pages/FeedbackPage";
import HelpPage from "./pages/HelpPage";
import Footer from "./components/Footer";
import PrivacyPolicy from "./pages/PrivacyPolicy";   // ✅ fixed path
import TermsOfUse from "./pages/TermsOfUse";         // ✅ fixed path
import { Toaster } from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function App() {
  const { isSignedIn, isLoaded, user } = useUser();
  const [isOnboarded, setIsOnboarded] = useState(null);

  useEffect(() => {
    if (isSignedIn && user) {
      checkOnboarding();
    } else if (!isSignedIn && isLoaded) {
      setIsOnboarded(false);
    }
  }, [isSignedIn, user, isLoaded]);

  const checkOnboarding = async () => {
    try {
      const response = await fetch(`${API_URL}/users/profile/${user.id}`);
      const data = await response.json();
      if (data.success && data.data?.onboarded) {
        setIsOnboarded(true);
      } else {
        setIsOnboarded(false);
      }
    } catch {
      setIsOnboarded(true);
    }
  };

  if (!isLoaded || (isSignedIn && isOnboarded === null)) return null;

  const ProtectedRoute = ({ children }) => {
    if (!isSignedIn) return <Navigate to="/" replace />;
    if (!isOnboarded) return <Navigate to="/onboarding" replace />;
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
    );
  };

  const AuthRoute = ({ children }) => {
    if (!isSignedIn) return <Navigate to="/" replace />;
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
    );
  };

  // Public pages that still get the footer
  const PublicRoute = ({ children }) => (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );

  return (
    <>
      <Routes>
        {/* Public */}
        <Route
          path="/"
          element={!isSignedIn ? <HomePage /> : <Navigate to="/dashboard" replace />}
        />
        <Route path="/about"    element={<PublicRoute><AboutPage /></PublicRoute>} />
        <Route path="/contact"  element={<PublicRoute><ContactPage /></PublicRoute>} />
        <Route path="/feedback" element={<PublicRoute><FeedbackPage /></PublicRoute>} />
        <Route path="/help"     element={<PublicRoute><HelpPage /></PublicRoute>} />
        <Route path="/privacy"  element={<PublicRoute><PrivacyPolicy /></PublicRoute>} />   {/* ✅ added */}
        <Route path="/terms"    element={<PublicRoute><TermsOfUse /></PublicRoute>} />       {/* ✅ added */}

        {/* Onboarding */}
        <Route
          path="/onboarding"
          element={
            !isSignedIn ? (
              <Navigate to="/" replace />
            ) : isOnboarded ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <OnboardingPage onComplete={() => setIsOnboarded(true)} />
            )
          }
        />

        {/* Profile — sign-in only */}
        <Route path="/profile" element={<AuthRoute><ProfilePage /></AuthRoute>} />

        {/* Protected routes */}
        <Route path="/dashboard"             element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/syllabus"              element={<ProtectedRoute><SyllabusPage /></ProtectedRoute>} />
        <Route path="/assessment/:id"        element={<ProtectedRoute><AssessmentPage /></ProtectedRoute>} />
        <Route path="/interviews"            element={<ProtectedRoute><InterviewsPage /></ProtectedRoute>} />
      <Route 
  path="/interview/:id" 
  element={!isSignedIn ? <Navigate to="/" replace /> : !isOnboarded ? <Navigate to="/onboarding" replace /> : <RealTimeInterviewPage />} 
/>
        <Route path="/interview-session/:id" element={<ProtectedRoute><InterviewSessionPage /></ProtectedRoute>} />
        <Route path="/interview/:id/results" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
        <Route path="/preparation"           element={<ProtectedRoute><PreparationPage /></ProtectedRoute>} />

        {/* Fallback */}
        <Route
          path="*"
          element={<Navigate to={isSignedIn ? "/dashboard" : "/"} replace />}
        />
      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { background: "#363636", color: "#fff" },
          success: { duration: 3000, iconTheme: { primary: "#10b981", secondary: "#fff" } },
          error: { duration: 4000, iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />
    </>
  );
}

export default App;