import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Auth      from './pages/Auth';
import Shell     from './pages/Shell';

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
        element={<RequireAuth><Shell /></RequireAuth>}
      />
    </Routes>
  );
}
