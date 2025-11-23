import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, User, ArrowRight, Lock, AlertCircle } from 'lucide-react';

const Registration = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ 
        name: '', 
        email: '', 
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    organization_name: "Газпром трансгаз Сургут"
                })
            });

            const data = await response.json();

            if (!response.ok) {
                // Исправленная обработка ошибок от FastAPI
                let errorMsg = 'Ошибка регистрации';
                if (data.detail) {
                    if (Array.isArray(data.detail)) {
                        // Если это массив ошибок валидации (Pydantic)
                        errorMsg = data.detail.map(err => {
                            // Берем только текст ошибки, убираем технический путь если он очевиден
                            return err.msg;
                        }).join(', ');
                    } else if (typeof data.detail === 'object') {
                        errorMsg = JSON.stringify(data.detail);
                    } else {
                        errorMsg = data.detail;
                    }
                }
                throw new Error(errorMsg);
            }

            // Сохраняем данные и переходим в приложение
            localStorage.setItem('kb_token', data.access_token);
            localStorage.setItem('kb_user', JSON.stringify(data.user));
            
            navigate('/app');

        } catch (err) {
            console.error("Registration error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
            <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl max-w-md w-full border border-white/50 animate-in fade-in slide-in-from-bottom-8 duration-500">
                
                <div className="flex justify-center mb-6 text-gazprom-blue">
                    <div className="p-3 bg-blue-50 rounded-2xl shadow-inner">
                        <UserPlus size={48} />
                    </div>
                </div>
                
                <h1 className="text-2xl font-bold text-center mb-2 text-gray-800">
                    Создание аккаунта
                </h1>
                <p className="text-center text-gray-500 mb-8 text-sm">
                    Заполните данные для регистрации в системе адаптации
                </p>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-2xl border border-red-100 flex items-start gap-3 animate-in slide-in-from-top-2">
                        <AlertCircle className="shrink-0 mt-0.5" size={18} />
                        <div>{error}</div>
                    </div>
                )}
                
                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 transition-colors group-focus-within:text-gazprom-blue">
                            <User size={20} />
                        </div>
                        <input 
                            type="text" 
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white/50 focus:ring-2 focus:ring-gazprom-light focus:border-gazprom-light transition-all outline-none"
                            placeholder="ФИО"
                            value={formData.name} 
                            onChange={(e) => setFormData({...formData, name: e.target.value})} 
                            required
                        />
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 transition-colors group-focus-within:text-gazprom-blue">
                            <Mail size={20} />
                        </div>
                        <input 
                            type="email" 
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white/50 focus:ring-2 focus:ring-gazprom-light focus:border-gazprom-light transition-all outline-none"
                            placeholder="Корпоративная почта"
                            value={formData.email} 
                            onChange={(e) => setFormData({...formData, email: e.target.value})} 
                            required
                        />
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 transition-colors group-focus-within:text-gazprom-blue">
                            <Lock size={20} />
                        </div>
                        <input 
                            type="password" 
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white/50 focus:ring-2 focus:ring-gazprom-light focus:border-gazprom-light transition-all outline-none"
                            placeholder="Пароль (мин. 8 символов)"
                            value={formData.password} 
                            onChange={(e) => setFormData({...formData, password: e.target.value})} 
                            required
                            minLength={8}
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full mt-4 px-6 py-3 bg-gazprom-blue text-white rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
                    >
                        {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                        {!loading && <ArrowRight size={20} />}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <span className="text-gray-500">Уже есть аккаунт? </span>
                    <Link to="/login" className="text-gazprom-blue font-semibold hover:underline">
                        Войти
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Registration;