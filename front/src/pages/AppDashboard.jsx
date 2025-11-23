import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Map, CheckCircle, BookOpen, LayoutDashboard } from 'lucide-react';

const AppDashboard = () => {
    const navigate = useNavigate();
    const userStr = localStorage.getItem('kb_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const role = user?.role;

    // Логика редиректа по ролям
    useEffect(() => {
        if (role === 'admin') navigate('/app/admin');
        if (role === 'hr') navigate('/app/hr');
        if (role === 'mentor') navigate('/app/mentor');
        if (role === 'unconfirmed') navigate('/app/unconfirmed');
    }, [role, navigate]);

    // Если роль Employee, показываем стандартный дашборд новичка
    if (role !== 'employee') return null; // Или лоадер, пока идет редирект

    // Моковые данные прогресса
    const progress = 15;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Welcome Card */}
            <div className="bg-white/70 backdrop-blur rounded-3xl p-8 shadow-xl border border-white relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-2 text-gray-800">Добро пожаловать, {user?.full_name}!</h2>
                    <p className="text-gray-600 max-w-xl mb-6">
                        Ваш цифровой наставник уже подготовил план ввода в должность. 
                        Начните с первого этапа, чтобы познакомиться с компанией.
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="max-w-md">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gazprom-blue">Общий прогресс</span>
                            <span className="font-bold text-gray-700">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-gazprom-blue h-2.5 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                </div>
                
                <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-gazprom-light/20 to-transparent rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div 
                    onClick={() => navigate('/app/track')}
                    className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-white hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group"
                >
                    <div className="w-12 h-12 bg-blue-100 text-gazprom-blue rounded-xl flex items-center justify-center mb-4 group-hover:bg-gazprom-blue group-hover:text-white transition-colors">
                        <Map size={24} />
                    </div>
                    <h3 className="font-bold text-lg text-gray-800 mb-1">Мой Трек</h3>
                    <p className="text-sm text-gray-500">Текущий этап: <span className="text-gazprom-blue font-medium">Знакомство</span></p>
                </div>

                <div 
                    onClick={() => navigate('/app/tasks')}
                    className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-white hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group"
                >
                    <div className="w-12 h-12 bg-green-100 text-gazprom-success rounded-xl flex items-center justify-center mb-4 group-hover:bg-gazprom-success group-hover:text-white transition-colors">
                        <CheckCircle size={24} />
                    </div>
                    <h3 className="font-bold text-lg text-gray-800 mb-1">Задания</h3>
                    <p className="text-sm text-gray-500">Проверьте список дел</p>
                </div>

                <div 
                    onClick={() => navigate('/app/knowledge')}
                    className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-white hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group"
                >
                    <div className="w-12 h-12 bg-yellow-100 text-gazprom-gold rounded-xl flex items-center justify-center mb-4 group-hover:bg-gazprom-gold group-hover:text-white transition-colors">
                        <BookOpen size={24} />
                    </div>
                    <h3 className="font-bold text-lg text-gray-800 mb-1">База знаний</h3>
                    <p className="text-sm text-gray-500">Регламенты и инструкции</p>
                </div>
            </div>
        </div>
    );
};

export default AppDashboard;