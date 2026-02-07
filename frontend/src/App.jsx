import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getToken, getUserInfo, logout } from './utils/auth';
import StarfieldBackground from './components/StarfieldBackground';
import ProfilePage from './pages/ProfilePage';
import ProjectsPage from './pages/ProjectsPage';
import './App.css';

function AppContent() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      const userInfo = getUserInfo();
      setUser(userInfo);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-error">
        <h2>未登录</h2>
        <p>请先登录以访问设置</p>
        <a href="https://main.d2fozf421c6ftf.amplifyapp.com" className="btn btn-primary">
          前往登录
        </a>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">设置</h1>
          <nav className="app-nav">
            <Link
              to="/profile"
              className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
            >
              个人资料
            </Link>
            <Link
              to="/projects"
              className={`nav-link ${location.pathname.startsWith('/projects') ? 'active' : ''}`}
            >
              项目管理
            </Link>
          </nav>
          <div className="header-user">
            <span className="user-name">{user.username}</span>
            <button className="btn-logout" onClick={logout}>
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/profile" replace />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectsPage />} />
          <Route path="*" element={<Navigate to="/profile" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <StarfieldBackground />
      <AppContent />
    </Router>
  );
}

export default App;
