import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ThresholdsPage from './pages/ThresholdsPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { account } = useAuth();
  if (!account) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/thresholds"
        element={
          <RequireAuth>
            <ThresholdsPage />
          </RequireAuth>
        }
      />
      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/thresholds" replace />} />
    </Routes>
  );
}
