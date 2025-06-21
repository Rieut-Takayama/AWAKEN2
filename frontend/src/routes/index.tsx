import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Layout components
import PublicLayout from '@/layouts/PublicLayout';
import UserLayout from '@/layouts/UserLayout';

// Public pages (P-001)
import LoginPage from '@/pages/public/LoginPage';

// User pages (要認証)
import DashboardPage from '@/pages/user/DashboardPage'; // U-001
import SettingsPage from '@/pages/user/SettingsPage';   // U-002
import HistoryPage from '@/pages/user/HistoryPage';     // U-003

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 公開ルート */}
        <Route path="/login" element={
          <PublicLayout>
            <LoginPage />
          </PublicLayout>
        } />
        
        {/* ユーザールート（要認証） */}
        <Route path="/" element={
          <ProtectedRoute>
            <UserLayout>
              <DashboardPage />
            </UserLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <UserLayout>
              <SettingsPage />
            </UserLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/history" element={
          <ProtectedRoute>
            <UserLayout>
              <HistoryPage />
            </UserLayout>
          </ProtectedRoute>
        } />
        
        {/* 未認証時のリダイレクト */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;