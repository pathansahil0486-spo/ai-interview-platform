// App.jsx — complete routing with correct nav for every state

import { useUser } from "@clerk/clerk-react";
import { Navigate, Route, Routes } from "react-router";
import { useState, useEffect } from "react";

// Pages
import HomePage        from "./pages/HomePage";
import DashboardPage   from "./pages/DashboardPage";
import InterviewsPage  from "./pages/InterviewsPage";
import InterviewSessionPage  from "./pages/InterviewSessionPage";
import RealTimeInterviewPage from "./pages/RealTimeInterviewPage";
import ResultsPage     from "./pages/ResultsPage";
import PreparationPage from "./pages/PreparationPage";
import ProfilePage     from "./pages/ProfilePage";
import OnboardingPage  from "./pages/OnboardingPage";
import SyllabusPage    from "./pages/SyllabusPage";
import AssessmentPage  from "./pages/AssessmentPage";
import AboutPage       from "./pages/AboutPage";
import ContactPage     from "./pages/ContactPage";
import FeedbackPage    from "./pages/FeedbackPage";
import HelpPage        from "./pages/HelpPage";
import PrivacyPolicy   from "./pages/PrivacyPolicy";
import TermsOfUse      from "./pages/TermsOfUse";

import HomeNav from "./components/HomeNav";
import Navbar  from "./components/Navbar";
import Footer  from "./components/Footer";

import { Toaster } from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── Layout: BEFORE LOGIN ──────────────────────────────────────────
// HomeNav (fixed 64px) + paddingTop(64) + children + Footer
// Used for public pages (/about /contact /help /feedback /privacy /terms) when NOT signed in
function PublicLayout({ children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <HomeNav />
      <main style={{ flex: 1, paddingTop: 64 }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}

// ── Layout: AFTER LOGIN ───────────────────────────────────────────
// Navbar (sticky, all tabs) + children + Footer
// Used for all app pages AND public pages when signed in AND "/" when signed in
function AppLayout({ children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}

// ── Layout: FULLSCREEN ────────────────────────────────────────────
// No nav, no footer — for live interview session & onboarding
function FullscreenLayout({ children }) {
  return <>{children}</>;
}

// ─────────────────────────────────────────────────────────────────
// Route guards
// ─────────────────────────────────────────────────────────────────

// Public pages — before login → HomeNav, after login → full Navbar
function SmartPublicRoute({ children }) {
  const { isSignedIn } = useUser();
  return isSignedIn
    ? <AppLayout>{children}</AppLayout>
    : <PublicLayout>{children}</PublicLayout>;
}

// Protected app pages — must be signed in AND onboarded
function ProtectedRoute({ children, isOnboarded }) {
  const { isSignedIn } = useUser();
  if (!isSignedIn)  return <Navigate to="/" replace />;
  if (!isOnboarded) return <Navigate to="/onboarding" replace />;
  return <AppLayout>{children}</AppLayout>;
}

// Auth-only — signed in required, onboarding not required (e.g. /profile)
function AuthRoute({ children }) {
  const { isSignedIn } = useUser();
  if (!isSignedIn) return <Navigate to="/" replace />;
  return <AppLayout>{children}</AppLayout>;
}

// ─────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────
function App() {
  const { isSignedIn, isLoaded, user } = useUser();
  const [isOnboarded, setIsOnboarded]  = useState(null);

  useEffect(() => {
    if (isSignedIn && user) {
      checkOnboarding();
    } else if (!isSignedIn && isLoaded) {
      setIsOnboarded(false);
    }
  }, [isSignedIn, user, isLoaded]);

  const checkOnboarding = async () => {
    try {
      const res  = await fetch(`${API_URL}/users/profile/${user.id}`);
      const data = await res.json();
      setIsOnboarded(!!(data.success && data.data?.onboarded));
    } catch {
      setIsOnboarded(true); // fail-open
    }
  };

  if (!isLoaded || (isSignedIn && isOnboarded === null)) return null;

  return (
    <>
      <Routes>

        {/* ── HOME ────────────────────────────────────────────────────
            • Not signed in → HomePage (own HomeNav + HomeFooter)
            • Signed in     → redirect to /dashboard (default landing)
        ────────────────────────────────────────────────────────────── */}
        <Route
          path="/"
          element={isSignedIn
            ? <Navigate to="/dashboard" replace />
            : <HomePage />}
        />

        {/* ── /home — signed-in users can visit landing page ──────────
            AppLayout provides Navbar + Footer; HomePage skips its own
        ────────────────────────────────────────────────────────────── */}
        <Route
          path="/home"
          element={isSignedIn
            ? <AppLayout><HomePage /></AppLayout>
            : <Navigate to="/" replace />}
        />

        {/* ── PUBLIC PAGES ────────────────────────────────────────────
            Before login → HomeNav   |   After login → full Navbar
        ────────────────────────────────────────────────────────────── */}
        <Route path="/about"    element={<SmartPublicRoute><AboutPage /></SmartPublicRoute>} />
        <Route path="/contact"  element={<SmartPublicRoute><ContactPage /></SmartPublicRoute>} />
        <Route path="/feedback" element={<SmartPublicRoute><FeedbackPage /></SmartPublicRoute>} />
        <Route path="/help"     element={<SmartPublicRoute><HelpPage /></SmartPublicRoute>} />
        <Route path="/privacy"  element={<SmartPublicRoute><PrivacyPolicy /></SmartPublicRoute>} />
        <Route path="/terms"    element={<SmartPublicRoute><TermsOfUse /></SmartPublicRoute>} />

        {/* ── ONBOARDING ──────────────────────────────────────────────
            Fullscreen — focused flow, no nav/footer distractions
        ────────────────────────────────────────────────────────────── */}
        <Route
          path="/onboarding"
          element={
            !isSignedIn  ? <Navigate to="/" replace /> :
            isOnboarded  ? <Navigate to="/dashboard" replace /> :
            <FullscreenLayout>
              <OnboardingPage onComplete={() => setIsOnboarded(true)} />
            </FullscreenLayout>
          }
        />

        {/* ── PROFILE ─────────────────────────────────────────────────
            Signed in required, onboarding not required
        ────────────────────────────────────────────────────────────── */}
        <Route path="/profile"
          element={<AuthRoute><ProfilePage /></AuthRoute>}
        />

        {/* ── PROTECTED APP ROUTES ────────────────────────────────────
            Signed in + onboarded. All get AppLayout (Navbar + Footer)
        ────────────────────────────────────────────────────────────── */}
        <Route path="/dashboard"
          element={<ProtectedRoute isOnboarded={isOnboarded}><DashboardPage /></ProtectedRoute>}
        />
        <Route path="/interviews"
          element={<ProtectedRoute isOnboarded={isOnboarded}><InterviewsPage /></ProtectedRoute>}
        />
        <Route path="/preparation"
          element={<ProtectedRoute isOnboarded={isOnboarded}><PreparationPage /></ProtectedRoute>}
        />
        <Route path="/syllabus"
          element={<ProtectedRoute isOnboarded={isOnboarded}><SyllabusPage /></ProtectedRoute>}
        />
        <Route path="/assessment/:id"
          element={<ProtectedRoute isOnboarded={isOnboarded}><AssessmentPage /></ProtectedRoute>}
        />
        <Route path="/interview-session/:id"
          element={<ProtectedRoute isOnboarded={isOnboarded}><InterviewSessionPage /></ProtectedRoute>}
        />
        <Route path="/interview/:id/results"
          element={<ProtectedRoute isOnboarded={isOnboarded}><ResultsPage /></ProtectedRoute>}
        />

        {/* ── REAL-TIME INTERVIEW — fullscreen only ───────────────────
            Live session needs full screen, no nav/footer
        ────────────────────────────────────────────────────────────── */}
        <Route
          path="/interview/:id"
          element={
            !isSignedIn  ? <Navigate to="/" replace /> :
            !isOnboarded ? <Navigate to="/onboarding" replace /> :
            <FullscreenLayout><RealTimeInterviewPage /></FullscreenLayout>
          }
        />

        {/* ── FALLBACK ─────────────────────────────────────────────── */}
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
          error:   { duration: 4000, iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />
    </>
  );
}

export default App;