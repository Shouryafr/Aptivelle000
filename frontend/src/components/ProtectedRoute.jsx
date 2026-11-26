import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, ROLE_HOME } from '../context/AuthContext';
import { Spinner } from './ui';

export default function ProtectedRoute({ roles, needsProfile = true, children }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-navy">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] || '/'} replace />;
  }
  if (needsProfile && !user.hasProfile) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}
