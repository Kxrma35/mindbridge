import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuth } from './contexts/AuthContext';
import Auth from './pages/Auth';
const Shell = lazy(() => import('./pages/Shell'));

const LoadingFallback = () => <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;

function RequireAuth({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  const { currentUser } = useAuth();
  return (
    <Routes>
      <Route
        path="/auth"
        element={currentUser ? <Navigate to="/" replace /> : <Auth />}
      />
      <Route
        path="/*"
        element={<RequireAuth><Suspense fallback={<LoadingFallback />}><Shell /></Suspense></RequireAuth>}
      />
    </Routes>
  );
}
