/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout } from './lib/firebase';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import StudyList from './pages/StudyList';
import Review from './pages/Review';
import MindMapViewer from './pages/MindMapViewer';
import MaterialView from './pages/MaterialView';
import QuizView from './pages/QuizView';
import Forum from './pages/Forum';
import Progress from './pages/Progress';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (u, t) => {
        setUser(u);
        setToken(t);
        setLoading(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      setLoginError(null);
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
      }
    } catch (e: any) {
      if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
        setLoginError('Falha ao autenticar. Tente novamente.');
        alert('Falha ao autenticar com o Google.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50 text-neutral-900">
        <p className="animate-pulse">Carregando AeroMechanic...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {!user || !token ? (
        <Routes>
          <Route path="/" element={<Landing onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <Layout user={user} onLogout={logout}>
          <Routes>
            <Route path="/" element={<Dashboard user={user} token={token} />} />
            <Route path="/study" element={<StudyList user={user} />} />
            <Route path="/material/:id" element={<MaterialView />} />
            <Route path="/quiz/:materialId" element={<QuizView />} />
            <Route path="/review" element={<Review user={user} />} />
            <Route path="/mindmap/:materialId" element={<MindMapViewer />} />
            <Route path="/progress" element={<Progress user={user} />} />
            <Route path="/forum" element={<Forum user={user} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      )}
    </BrowserRouter>
  );
}
