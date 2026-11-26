import { Link } from 'react-router-dom';
import { useAuth, ROLE_HOME } from '../context/AuthContext';

export default function NotFound() {
  const { user } = useAuth();
  const home = user ? (user.hasProfile ? ROLE_HOME[user.role] : '/onboarding') : '/';
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <p className="font-serif text-7xl text-navy leading-none">404</p>
        <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-gold" />
        <h1 className="mt-6 text-xl">This page wandered off the map</h1>
        <p className="mt-2 text-sm text-slatemuted">
          The link may be broken, or the page may have moved. Let&apos;s get you back somewhere useful.
        </p>
        <Link to={home} className="btn-primary mt-6 inline-flex">
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.7 4.3a1 1 0 010 1.4L6.4 9H16a1 1 0 110 2H6.4l3.3 3.3a1 1 0 01-1.4 1.4l-5-5a1 1 0 010-1.4l5-5a1 1 0 011.4 0z" clipRule="evenodd" />
          </svg>
          Back to {user ? 'my dashboard' : 'home'}
        </Link>
      </div>
    </div>
  );
}
