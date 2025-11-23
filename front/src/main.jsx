import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './index.css'

// Layouts
import Layout from './components/Layout'
import ThreeBackground from './components/ThreeBackground'

// Pages
import Login from './pages/Login'
import Registration from './pages/Registration'
import AppDashboard from './pages/AppDashboard'
import Profile from './pages/Profile'
import TrackMap from './pages/TrackMap'
import StageDetail from './pages/StageDetail'
import QuizPage from './pages/QuizPage'
import TaskList from './pages/TaskList'
import KnowledgeBase from './pages/KnowledgeBase'

// Role Dashboards
import AdminDashboard from './pages/AdminDashboard'
import MentorDashboard from './pages/MentorDashboard'
import HrDashboard from './pages/HrDashboard'
import UnconfirmedDashboard from './pages/UnconfirmedDashboard'

// Получение данных пользователя
const getUser = () => {
    const str = localStorage.getItem('kb_user');
    return str ? JSON.parse(str) : null;
};

// 1. Базовая защита (авторизован ли вообще)
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('kb_token');
  return token ? children : <Navigate to="/login" />;
};

// 2. Ролевая защита (имеет ли право на конкретный URL)
const RoleRoute = ({ children, allowedRoles }) => {
    const user = getUser();
    const location = useLocation();

    if (!user) return <Navigate to="/login" />;
    
    // Если роль не в списке разрешенных -> редирект на главную /app
    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/app" replace state={{ from: location }} />;
    }

    return children;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThreeBackground />
      
      <div className="relative z-10 min-h-screen">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registration" element={<Registration />} />
          
          {/* Корневой маршрут приложения */}
          <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
            
            {/* Главная страница - Умный роутинг внутри компонента AppDashboard */}
            <Route index element={<AppDashboard />} />
            
            {/* Общие страницы (Доступны всем подтвержденным) */}
            <Route path="profile" element={<RoleRoute allowedRoles={['employee', 'mentor', 'hr', 'admin']}><Profile /></RoleRoute>} />
            
            {/* Страницы Сотрудника */}
            <Route path="track" element={<RoleRoute allowedRoles={['employee', 'mentor', 'hr']}><TrackMap /></RoleRoute>} />
            <Route path="track/:stageId" element={<RoleRoute allowedRoles={['employee', 'mentor', 'hr']}><StageDetail /></RoleRoute>} />
            <Route path="quiz/:taskId" element={<RoleRoute allowedRoles={['employee', 'mentor', 'hr']}><QuizPage /></RoleRoute>} />
            <Route path="tasks" element={<RoleRoute allowedRoles={['employee']}><TaskList /></RoleRoute>} />
            <Route path="knowledge" element={<RoleRoute allowedRoles={['employee', 'mentor', 'hr', 'admin']}><KnowledgeBase /></RoleRoute>} />
            
            {/* Страницы Ролей (Строгий доступ) */}
            <Route path="admin" element={<RoleRoute allowedRoles={['admin']}><AdminDashboard /></RoleRoute>} />
            <Route path="mentor" element={<RoleRoute allowedRoles={['mentor']}><MentorDashboard /></RoleRoute>} />
            <Route path="hr" element={<RoleRoute allowedRoles={['hr']}><HrDashboard /></RoleRoute>} />
            
            {/* Страница ожидания */}
            <Route path="unconfirmed" element={<RoleRoute allowedRoles={['unconfirmed']}><UnconfirmedDashboard /></RoleRoute>} />

          </Route>
          
          <Route path="/" element={<Navigate to="/app" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  </React.StrictMode>,
)