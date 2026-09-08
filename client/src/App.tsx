import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AppShell from './components/layout/AppShell';
import Home from './pages/Home';
import AgentChat from './pages/AgentChat';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import AuthPage from './pages/AuthPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Protected — wrapped in AppShell */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="agent/:agentId" element={<AgentChat />} />
          <Route path="agent/:agentId/conversation/:conversationId" element={<AgentChat />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
