import { useState, useEffect } from 'react';
import { Award, Zap, TrendingUp, Book, Target, LogOut, Shield, Clock, Star } from 'lucide-react';
import { fetcher } from '../lib/api';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const userData = await fetcher('/auth/me');
                setUser(userData);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) return <div className="p-10 text-center">Загрузка профиля...</div>;
    if (!user) return <div>Ошибка загрузки</div>;

    // --- STUB DATA ---
    const achievements = [
        { id: 1, title: "Первые шаги", desc: "Завершить этап 'Знакомство'", icon: <Zap size={24} className="text-yellow-500"/>, done: true },
        { id: 2, title: "Книжный червь", desc: "Изучить 5 регламентов", icon: <Book size={24} className="text-blue-500"/>, done: user.xp_points > 50 },
        { id: 3, title: "Безопасность - наше всё", desc: "Сдать тест по ПБ на 100%", icon: <Shield size={24} className="text-green-500"/>, done: false },
        { id: 4, title: "Пунктуальность", desc: "Заходить в систему 5 дней подряд", icon: <Clock size={24} className="text-purple-500"/>, done: false },
    ];

    const stats = [
        { label: "Пройдено этапов", value: Math.floor(user.xp_points / 100), icon: <Target size={16}/> },
        { label: "Тестов сдано", value: Math.floor(user.xp_points / 50), icon: <Award size={16}/> },
        { label: "Дней в компании", value: 3, icon: <Clock size={16}/> },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            {/* Header Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-xl border border-white relative overflow-hidden">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center relative z-10">
                    <div className="relative">
                        <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-gazprom-blue to-gazprom-light p-1 shadow-lg shrink-0">
                            <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center text-4xl font-bold text-gray-300 select-none">
                                {user.full_name?.[0]}
                            </div>
                        </div>
                        <div className="absolute bottom-0 right-0 bg-gazprom-gold text-white text-xs font-bold px-2 py-1 rounded-full shadow-md border-2 border-white">
                            Lvl {user.level}
                        </div>
                    </div>
                    
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{user.full_name}</h2>
                        <p className="text-gray-500 font-medium text-sm md:text-base">{user.email}</p>
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-2">
                            <span className="text-xs text-gazprom-blue bg-blue-50 px-3 py-1 rounded-full uppercase font-bold tracking-wide border border-blue-100">
                                {user.role}
                            </span>
                            <span className="text-xs text-yellow-700 bg-yellow-50 px-3 py-1 rounded-full font-bold tracking-wide border border-yellow-100 flex items-center gap-1">
                                <Star size={12} fill="currentColor"/> {user.xp_points} XP
                            </span>
                        </div>
                    </div>
                </div>

                {/* XP Bar */}
                <div className="mt-8 relative z-10">
                    <div className="flex justify-between text-xs mb-2 font-bold text-gray-500 uppercase tracking-wider">
                        <span>Прогресс уровня {user.level}</span>
                        <span>{user.xp_points % 1000} / 1000 XP</span>
                    </div>
                    <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden border border-gray-200">
                        <div 
                            className="bg-gradient-to-r from-gazprom-light to-gazprom-blue h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,114,206,0.5)]"
                            style={{ width: `${Math.min(100, ((user.xp_points % 1000) / 1000) * 100)}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-center mt-2 text-gray-400">До следующего уровня осталось {1000 - (user.xp_points % 1000)} XP</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 md:gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <div className="text-gazprom-blue mb-2 flex justify-center opacity-80">{stat.icon}</div>
                        <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                        <div className="text-[10px] md:text-xs text-gray-400 uppercase font-bold tracking-wider">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Achievements */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 px-2">Достижения</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {achievements.map(ach => (
                        <div key={ach.id} className={`p-4 rounded-2xl border transition-all flex items-center gap-4 ${ach.done ? 'bg-white border-green-100 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60 grayscale'}`}>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${ach.done ? 'bg-white shadow-inner' : 'bg-gray-200'}`}>
                                {ach.icon}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 text-sm">{ach.title}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">{ach.desc}</p>
                                {ach.done && <span className="text-[10px] text-green-600 font-bold uppercase mt-1 inline-block">Получено</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Profile;