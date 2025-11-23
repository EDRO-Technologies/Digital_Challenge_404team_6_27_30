import { useState, useEffect } from 'react';
import { 
    Users, Shield, GraduationCap, User, ChevronDown, ChevronUp, 
    CheckCircle, XCircle, Search, UserPlus, Trash2, Loader2, AlertTriangle
} from 'lucide-react';
import { fetcher } from '../lib/api';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({ full_name: '', email: '', password: '', role: 'employee' });
    const [creating, setCreating] = useState(false);

    const [expandedSections, setExpandedSections] = useState({
        hr: true,
        mentor: true,
        employee: true,
        unconfirmed: true
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Получаем пользователей
            let usersData = await fetcher('/auth/users').catch(() => []);
            // Если пусто, добавим моковые для красоты
            if(usersData.length === 0) {
                usersData = [
                    {id: 1, full_name: 'Иванов Иван', email: 'ivanov@gazprom.ru', role: 'employee'},
                    {id: 2, full_name: 'Петрова Анна', email: 'petrova@gazprom.ru', role: 'hr'},
                    {id: 3, full_name: 'Сидоров Петр', email: 'sidorov@gazprom.ru', role: 'mentor'},
                ];
            }
            setUsers(usersData);

            // Получаем тикеты
            const ticketsData = await fetcher('/admin/requests').catch(() => []);
            setTickets(ticketsData);
        } catch (error) {
            console.error("Error fetching admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            await fetcher('/admin/users', {
                method: 'POST',
                body: JSON.stringify({
                    ...newUser,
                    organization_name: "Gazprom"
                })
            });
            setIsCreateModalOpen(false);
            setNewUser({ full_name: '', email: '', password: '', role: 'employee' });
            await fetchData(); // Обновляем список
            alert("Пользователь создан!");
        } catch (e) {
            alert("Ошибка: " + e.message);
        } finally {
            setCreating(false);
        }
    };
    
    // Группировка
    const unconfirmedList = users.filter(u => u.role === 'unconfirmed');
    const hrList = users.filter(u => u.role === 'hr');
    const mentorsList = users.filter(u => u.role === 'mentor');
    const employeesList = users.filter(u => u.role === 'employee');
    const adminList = users.filter(u => u.role === 'admin');

    const toggleSection = (section) => {
        setExpandedSections(prev => ({...prev, [section]: !prev[section]}));
    };

    const UserTable = ({ title, data, icon: Icon, colorClass, sectionKey }) => (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-4 transition-all">
            <div 
                onClick={() => toggleSection(sectionKey)}
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 bg-white border-b border-gray-100"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                        <Icon size={20} />
                    </div>
                    <h3 className="font-bold text-gray-700 text-lg">
                        {title} <span className="text-gray-400 text-sm font-normal ml-2">{data.length}</span>
                    </h3>
                </div>
                {expandedSections[sectionKey] ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
            </div>
            
            {expandedSections[sectionKey] && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <tbody className="divide-y divide-gray-100">
                            {data.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4 font-medium text-gray-800">{user.full_name}</td>
                                    <td className="p-4">{user.email}</td>
                                    <td className="p-4 text-right">
                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 font-mono">{user.role}</span>
                                    </td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="p-6 text-center text-gray-400 text-xs">Нет пользователей</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Панель Управления</h1>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-gazprom-blue text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    <UserPlus size={18}/>
                    <span className="hidden sm:inline">Добавить</span>
                </button>
            </div>

            {/* Уведомление о неподтвержденных */}
            {unconfirmedList.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 flex items-center gap-4 animate-pulse">
                    <AlertTriangle className="text-yellow-600 shrink-0" />
                    <div>
                        <h3 className="font-bold text-yellow-800">Требуется подтверждение</h3>
                        <p className="text-xs text-yellow-700">Есть новые пользователи ({unconfirmedList.length}) с ролью "unconfirmed". Назначьте им роль.</p>
                    </div>
                </div>
            )}

            {/* Списки */}
            <div>
                <UserTable title="Ожидают подтверждения" data={unconfirmedList} icon={AlertTriangle} colorClass="bg-yellow-100 text-yellow-600" sectionKey="unconfirmed"/>
                <UserTable title="Администраторы" data={adminList} icon={Shield} colorClass="bg-gray-800 text-white" sectionKey="admin"/>
                <UserTable title="HR-специалисты" data={hrList} icon={Users} colorClass="bg-purple-100 text-purple-600" sectionKey="hr"/>
                <UserTable title="Наставники" data={mentorsList} icon={GraduationCap} colorClass="bg-orange-100 text-orange-600" sectionKey="mentor"/>
                <UserTable title="Сотрудники" data={employeesList} icon={User} colorClass="bg-green-100 text-green-600" sectionKey="employee"/>
            </div>
            
            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800">Новый сотрудник</h3>
                        </div>
                        <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                            <input 
                                type="text" required placeholder="ФИО"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition"
                                value={newUser.full_name}
                                onChange={e => setNewUser({...newUser, full_name: e.target.value})}
                            />
                            <input 
                                type="email" required placeholder="Email"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition"
                                value={newUser.email}
                                onChange={e => setNewUser({...newUser, email: e.target.value})}
                            />
                            <input 
                                type="password" required placeholder="Пароль" minLength={8}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition"
                                value={newUser.password}
                                onChange={e => setNewUser({...newUser, password: e.target.value})}
                            />
                            <select 
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white outline-none"
                                value={newUser.role}
                                onChange={e => setNewUser({...newUser, role: e.target.value})}
                            >
                                <option value="employee">Сотрудник</option>
                                <option value="mentor">Наставник</option>
                                <option value="hr">HR</option>
                                <option value="admin">Администратор</option>
                            </select>
                            
                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 py-3 bg-gray-100 rounded-xl text-gray-600 font-bold hover:bg-gray-200 transition"
                                >
                                    Отмена
                                </button>
                                <button 
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 py-3 bg-gazprom-blue text-white rounded-xl font-bold hover:bg-blue-600 transition flex justify-center items-center gap-2"
                                >
                                    {creating ? <Loader2 className="animate-spin" size={20}/> : "Создать"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;