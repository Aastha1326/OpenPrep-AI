import { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser, checkTokenFreshness, setAiQuotaExceededUntil, setAiQuotaErrorMsg } from './store/slices/authSlice';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import CustomCursor from './components/CustomCursor';
import ScrollToTop from './components/ScrollToTop';
import MobileNavDrawer from './components/MobileNavDrawer';
import PageSkeleton from './components/PageSkeleton';
import SessionTimeoutModal from './components/SessionTimeoutModal';
import QuotaExceededModal from './components/dashboard/QuotaExceededModal';
import CommandPalette from './components/search/CommandPalette';
import OfflineBanner from './components/common/OfflineBanner';
import PwaInstallPrompt from './components/common/PwaInstallPrompt';
import OfflineIndicator from './components/common/OfflineIndicator';
import Walkthrough from './components/tutorial/Walkthrough';
import './App.css';

const Landing = lazy(() => import('./pages/Landing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Register = lazy(() => import('./pages/Register'));
const Login = lazy(() => import('./pages/Login'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const BattleArena = lazy(() => import('./pages/BattleArena'));
const NotFound = lazy(() => import('./pages/NotFound'));
const FlashcardReview = lazy(() => import('./pages/FlashcardReview'));
const PyqDashboard = lazy(() => import('./pages/PyqDashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Flashcards = lazy(() => import('./pages/Flashcards'));
const CommunityDecks = lazy(() => import('./pages/CommunityDecks'));
const PublicShare = lazy(() => import('./pages/PublicShare'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const StudyGroupChat = lazy(() => import('./pages/StudyGroupChat'));
const AiAssistant = lazy(() => import('./pages/AiAssistant'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));
const PYQAnalytics = lazy(() => import('./pages/PYQAnalytics'));
const QuizSession = lazy(() => import('./pages/QuizSession'));
const MindMapViewer = lazy(() => import('./pages/MindMapViewer'));
const StudyPlanner = lazy(() => import('./pages/StudyPlanner'));
const VivaSimulator = lazy(() => import('./pages/VivaSimulator'));
const CollaborativeNoteView = lazy(() => import('./pages/CollaborativeNoteView'));
const SquadsPage = lazy(() => import('./pages/SquadsPage'));

function App() {
  const dispatch = useDispatch();
  const { sessionExpired, aiQuotaExceededUntil } = useSelector((state) => state.auth);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      dispatch(loadUser());
    }
  }, [dispatch]);

  useEffect(() => {
    const checkQuota = () => {
      const resetTimeStr = localStorage.getItem('ai_quota_reset_time');
      if (resetTimeStr) {
        const resetTime = parseInt(resetTimeStr, 10);
        if (Date.now() < resetTime) {
          dispatch(setAiQuotaExceededUntil(resetTime));
          const msg = localStorage.getItem('ai_quota_error_msg');
          dispatch(setAiQuotaErrorMsg(msg));
        } else {
          localStorage.removeItem('ai_quota_reset_time');
          localStorage.removeItem('ai_quota_error_msg');
          dispatch(setAiQuotaExceededUntil(null));
          dispatch(setAiQuotaErrorMsg(null));
        }
      }
    };

    checkQuota();
    const interval = setInterval(checkQuota, 1000);

    const handleQuotaExceeded = (e) => {
      const { retryInSeconds, message } = e.detail;
      const resetTime = Date.now() + retryInSeconds * 1000;
      localStorage.setItem('ai_quota_reset_time', String(resetTime));
      localStorage.setItem('ai_quota_error_msg', message);
      dispatch(setAiQuotaExceededUntil(resetTime));
      dispatch(setAiQuotaErrorMsg(message));
    };

    window.addEventListener('quota-exceeded', handleQuotaExceeded);

    return () => {
      clearInterval(interval);
      window.removeEventListener('quota-exceeded', handleQuotaExceeded);
    };
  }, [dispatch]);

  // Check token freshness when the user returns to a background tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        dispatch(checkTokenFreshness());
      }
    };
    const handleFocus = () => {
      dispatch(checkTokenFreshness());
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [dispatch]);

  return (
    <>
      {aiQuotaExceededUntil && (
        <div className="bg-red-900 border-b border-red-700 text-red-50 text-center py-2 text-xs font-semibold select-none flex items-center justify-center gap-2 relative z-[9998]">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span>AI features are temporarily locked due to rate limit/quota limits.</span>
        </div>
      )}
      <OfflineBanner />
      <PwaInstallPrompt />
      <OfflineIndicator />
      <CustomCursor />
      <ScrollToTop />
      <MobileNavDrawer />
      <QuotaExceededModal />
      <Walkthrough />
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/share/:token" element={<PublicShare />} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/flashcards/review"
            element={
              <ProtectedRoute>
                <FlashcardReview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/flashcards"
            element={
              <ProtectedRoute>
                <Flashcards />
              </ProtectedRoute>
            }
          />
          <Route
            path="/community/decks"
            element={
              <ProtectedRoute>
                <CommunityDecks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/battle"
            element={
              <ProtectedRoute>
                <BattleArena />
              </ProtectedRoute>
            }
          />
          <Route
            path="/battle/join/:roomId"
            element={
              <ProtectedRoute>
                <BattleArena />
              </ProtectedRoute>
            }
          />
          <Route
            path="/study-group"
            element={
              <ProtectedRoute>
                <StudyGroupChat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/squads"
            element={
              <ProtectedRoute>
                <SquadsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/squads/:id"
            element={
              <ProtectedRoute>
                <StudySquadDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/collab-note/:id"
            element={
              <ProtectedRoute>
                <CollabNote />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-assistant"
            element={
              <ProtectedRoute>
                <AiAssistant />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pyqs"
            element={
              <ProtectedRoute>
                <PyqDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pyq-analytics"
            element={
              <ProtectedRoute>
                <PYQAnalytics />
              </ProtectedRoute>
            }
          />

          <Route
            path="/study-planner"
            element={
              <ProtectedRoute>
                <StudyPlanner />
              </ProtectedRoute>
            }
          />

          <Route
            path="/viva-simulator"
            element={
              <ProtectedRoute>
                <VivaSimulator />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notes/collaborative/:noteId"
            element={
              <ProtectedRoute>
                <CollaborativeNoteView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/quiz/:id"
            element={
              <ProtectedRoute>
                <QuizSession />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mind-map"
            element={
              <ProtectedRoute>
                <MindMapViewer />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/squads"
            element={
              <ProtectedRoute>
                <SquadsPage />
              </ProtectedRoute>
            }
          />

          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <MobileBottomNav />
    </>
  );
}

export default App;
