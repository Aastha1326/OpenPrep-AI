import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser, checkTokenFreshness } from './store/slices/authSlice';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import CustomCursor from './components/CustomCursor';
import ScrollToTop from './components/ScrollToTop';
import MobileNavDrawer from './components/MobileNavDrawer';
import PageLoader from './components/PageLoader';
import SessionTimeoutModal from './components/dashboard/SessionTimeoutModal';
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
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const StudyGroupChat = lazy(() => import('./pages/StudyGroupChat'));

function App() {
  const dispatch = useDispatch();
  const { sessionExpired } = useSelector((state) => state.auth);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      dispatch(loadUser());
    }
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
      <CustomCursor />
      <ScrollToTop />
      <MobileNavDrawer />
      <SessionTimeoutModal isOpen={sessionExpired} />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
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
            path="/battle"
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
            path="/pyqs"
            element={
              <ProtectedRoute>
                <PyqDashboard />
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

          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
