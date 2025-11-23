import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { LogOut, Flame, BookOpen, Users, UserPlus, FolderOpen, LayoutDashboard, PieChart } from 'lucide-react';
import ChatWidget from './ChatWidget';

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const userStr = localStorage.getItem('kb_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const role = user?.role || 'unconfirmed';

    const handleLogout = () => {
        localStorage.removeItem('kb_token');
        localStorage.removeItem('kb_user');
        navigate('/login');
    };

    // Хелпер для активного класса
    const isActive = (path, queryParam = null) => {
        if (queryParam) {
            const params = new URLSearchParams(location.search);
            // Если путь совпадает и параметр совпадает
            // ИЛИ если это дефолтный view (например, для HR view=users по умолчанию при пустом search)
            const currentView = params.get('view');
            
            // Специальная логика для дефолтных вкладок, если параметры не переданы
            if (path === '/app/hr' && !currentView && queryParam === 'users') {
                 return location.pathname === path ? 'bg-blue-50 text-gazprom-blue' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700';
            }
            if (path === '/app/mentor' && !currentView && queryParam === 'mentees') {
                 return location.pathname === path ? 'bg-blue-50 text-gazprom-blue' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700';
            }

            return location.pathname === path && currentView === queryParam 
                ? 'bg-blue-50 text-gazprom-blue' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700';
        }
        return location.pathname.startsWith(path) 
            ? 'bg-blue-50 text-gazprom-blue' 
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700';
    };

    if (role === 'unconfirmed') {
        return (
            <div className="flex flex-col h-screen bg-[#F3F4F6]">
                <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/50 p-4">
                    <div className="container mx-auto max-w-6xl flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-gazprom-blue p-2 rounded-lg text-white">
                                <Flame size={24} fill="currentColor" />
                            </div>
                            <span className="font-bold text-gray-800">АДАПТАЦИЯ</span>
                        </div>
                        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500">Выйти</button>
                    </div>
                </header>
                <main className="flex-1 p-4">
                    <div className="container mx-auto max-w-6xl">
                        <Outlet />
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-[#F3F4F6]">
            <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/50 p-4 sticky top-0 z-40">
                <div className="container mx-auto max-w-6xl flex justify-between items-center">
                    <Link to="/app" className="flex items-center gap-3 hover:opacity-80 transition">
                        <div className="bg-gazprom-blue p-2 rounded-lg text-white shadow-lg shadow-blue-500/20">
                            <Flame size={24} fill="currentColor" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-800 leading-none hidden sm:block">АДАПТАЦИЯ</h1>
                            <span className="text-xs text-gazprom-light font-medium">Газпром трансгаз Сургут</span>
                        </div>
                    </Link>
                    
                    <nav className="hidden md:flex items-center gap-1 bg-gray-100/50 p-1 rounded-xl overflow-x-auto">
                        
                        {/* --- Вкладки СОТРУДНИКА --- */}
                        {role === 'employee' && (
                            <>
                                <Link to="/app/track" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/app/track')}`}>
                                    Мой Трек
                                </Link>
                                <Link to="/app/tasks" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/app/tasks')}`}>
                                    Задания
                                </Link>
                            </>
                        )}

                        {/* --- Вкладки МЕНТОРА --- */}
                        {role === 'mentor' && (
                            <>
                                <Link to="/app/mentor?view=mentees" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isActive('/app/mentor', 'mentees')}`}>
                                    <Users size={16}/> Подопечные
                                </Link>
                                <Link to="/app/mentor?view=tracks" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isActive('/app/mentor', 'tracks') || isActive('/app/mentor', 'builder') ? 'bg-blue-50 text-gazprom-blue' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
                                    <FolderOpen size={16}/> Управление треками
                                </Link>
                            </>
                        )}

                        {/* --- Вкладки HR --- */}
                        {role === 'hr' && (
                            <>
                                <Link to="/app/hr?view=users" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isActive('/app/hr', 'users')}`}>
                                    <Users size={16}/> Сотрудники
                                </Link>
                                <Link to="/app/hr?view=mentors" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isActive('/app/hr', 'mentors')}`}>
                                    <UserPlus size={16}/> Назначение менторов
                                </Link>
                            </>
                        )}

                        {/* --- Вкладки ADMIN --- */}
                        {role === 'admin' && (
                            <Link to="/app/admin" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isActive('/app/admin')}`}>
                                <LayoutDashboard size={16}/> Администрирование
                            </Link>
                        )}

                        {/* --- ОБЩАЯ Вкладка: База Знаний --- */}
                        <Link to="/app/knowledge" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isActive('/app/knowledge')}`}>
                            <BookOpen size={16}/> База знаний
                        </Link>
                    </nav>

                    <div className="flex items-center gap-3">
                        <Link to="/app/profile" className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full bg-white border border-gray-100 hover:shadow-md transition-all cursor-pointer">
                            <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center text-gray-500 font-bold">
                                {user?.full_name?.[0] || "U"}
                            </div>
                            <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[100px] truncate">
                                {user?.full_name || "User"}
                            </span>
                        </Link>
                        <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all" title="Выйти">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 pb-24 md:pb-6">
                <div className="container mx-auto max-w-6xl">
                    <Outlet />
                </div>
            </main>

            {role !== 'admin' && <ChatWidget />}
        </div>
    );
};

export default Layout;