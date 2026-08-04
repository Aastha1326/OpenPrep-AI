import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // TEMPORARY BYPASS FOR LOCAL TESTING
  const isAuthenticated = true; // bypass auth check

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;