import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/layout';
import HomePage from './pages/HomePage';
import TransformPage from './pages/TransformPage';
import DashboardPage from './pages/DashboardPage';
import ReportPage from './pages/ReportPage';
import { AnalyticsTracker } from './components/AnalyticsTracker';
import { initGA } from './analytics/ga';

function App() {
  useEffect(() => {
    // Inicializar GA al arrancar la app
    initGA();
  }, []);

  return (
    <Router>
      <Layout>
        <AnalyticsTracker /> {/* ← Esto registra los cambios de ruta */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/transform" element={<TransformPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/report" element={<ReportPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
