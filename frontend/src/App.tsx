import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/layout';
import HomePage from './pages/HomePage';
import TransformPage from './pages/TransformPage';
import DashboardPage from './pages/DashboardPage';
import ReportPage from './pages/ReportPage';

function App() {
  return (
    <Router>
      <Layout>
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
