import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Purchases from './pages/Purchases';
import Transfers from './pages/Transfers';
import Assignments from './pages/Assignments';
import AuditLogs from './pages/AuditLogs';
import Maintenance from './pages/Maintenance';
import Deployments from './pages/Deployments';
import Incidents from './pages/Incidents';
import Training from './pages/Training';
import Locations from './pages/Locations';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { isAuthenticated, loading } = useAuth();

  console.log('App render - isAuthenticated:', isAuthenticated, 'loading:', loading);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="App">
      {!isAuthenticated ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <Layout>
          <Routes>
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/transfers" element={<Transfers />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/deployments" element={<Deployments />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/training" element={<Training />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      )}
    </div>
  );
}

export default App;
