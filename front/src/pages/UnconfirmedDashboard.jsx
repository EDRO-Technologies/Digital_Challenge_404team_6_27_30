import { Clock, Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UnconfirmedDashboard = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('kb_token');
        localStorage.removeItem('kb_user');
        navigate('/login');
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-white/90 backdrop-blur-xl p-10 rounded-3xl shadow-2xl max-w-lg w-full border border-white/50 text-center">
                <div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="text-yellow-500" size={48} />
                </div>
                
                <h1 className="text-3xl font-bold text-gray-800 mb-4">Ожидание подтверждения</h1>
                <p className="text-gray-500 mb-8 leading-relaxed">
                    Ваша заявка на регистрацию успешно отправлена. Администратор системы рассмотрит её и назначит вам соответствующую роль (Сотрудник, Наставник или HR).
                </p>

                <div className="bg-blue-50 p-4 rounded-2xl mb-8 flex items-start gap-3 text-left">
                    <Shield className="text-gazprom-blue shrink-0 mt-1" size={20} />
                    <div>
                        <h4 className="font-bold text-gazprom-blue text-sm">Что делать дальше?</h4>
                        <p className="text-xs text-blue-700/70 mt-1">
                            Просто ожидайте. Как только роль будет назначена, при следующем входе вы увидите ваш рабочий кабинет.
                        </p>
                    </div>
                </div>

                <button 
                    onClick={handleLogout}
                    className="w-full py-3 border-2 border-gray-100 text-gray-500 rounded-xl font-bold hover:bg-gray-50 hover:text-red-500 transition flex items-center justify-center gap-2"
                >
                    <LogOut size={18} /> Выйти
                </button>
            </div>
        </div>
    );
};

export default UnconfirmedDashboard;