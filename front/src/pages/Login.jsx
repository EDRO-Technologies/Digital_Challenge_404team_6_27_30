import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, LogIn } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const response = await fetch('/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Ошибка входа');
            }

            localStorage.setItem('kb_token', data.access_token);
            localStorage.setItem('kb_user', JSON.stringify(data.user));
            
            navigate('/app');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl max-w-md w-full border border-white/50 transform transition-all hover:scale-[1.01]">
                <div className="flex justify-center mb-6 text-gazprom-blue">
                    <div className="p-3 bg-blue-50 rounded-2xl shadow-inner">
                        <LogIn size={48} />
                    </div>
                </div>
                
                <h1 className="text-2xl font-bold text-center mb-2 text-gray-800">Вход в систему</h1>
                <p className="text-center text-gray-500 mb-8 text-sm">
                    Единая система адаптации сотрудников<br/>ООО «Газпром трансгаз Сургут»
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 text-center animate-pulse">
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-gazprom-blue transition-colors">
                            <Mail size={20} />
                        </div>
                        <input 
                            type="email" 
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gazprom-light focus:border-gazprom-light transition-all"
                            placeholder="Корпоративная почта"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-gazprom-blue transition-colors">
                            <Lock size={20} />
                        </div>
                        <input 
                            type="password" 
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gazprom-light focus:border-gazprom-light transition-all"
                            placeholder="Пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full px-6 py-3 bg-gazprom-blue text-white rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? 'Входим...' : 'Войти'}
                        {!loading && <ArrowRight size={20} />}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <span className="text-gray-500">Нет аккаунта? </span>
                    <Link to="/registration" className="text-gazprom-blue font-semibold hover:underline">
                        Получить доступ
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;