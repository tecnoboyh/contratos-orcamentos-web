import { Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from './components/layout/AppLayout';
import { useAuthStore } from './stores/authStore';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Contracts from './pages/Contracts';
import NewContract from './pages/NewContract';
import Obras from './pages/Obras';
import Signatures from './pages/Signatures';

function PublicRoute({ children }) {
  const { token } = useAuthStore();

  if (token) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/contracts" element={<Contracts />} />
        <Route path="/contracts/new" element={<NewContract />} />
        <Route path="/signatures" element={<Signatures />} />
        <Route path="/obras" element={<Obras />} />
      </Route>
    </Routes>
  );
}
