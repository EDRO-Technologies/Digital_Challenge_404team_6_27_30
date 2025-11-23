import React, { useState, useEffect } from 'react';
import { Search, UserPlus, UserCheck, Shield } from 'lucide-react';
import { fetcher } from '../../lib/api';

const MentorAssignment = () => {
    const [users, setUsers] = useState([]);
    const [mentors, setMentors] = useState([]); // Список доступных менторов
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const allUsers = await fetcher('/hr/employees');
            
            // 1. Кого назначаем (только сотрудники и менторы, исключаем админов)
            // Исключаем админов из списка тех, КОМУ назначают ментора (хотя технически можно, но обычно нет)
            setUsers(allUsers.filter(u => u.role !== 'admin'));

            // 2. КТО может быть ментором (только роль mentor, исключаем admin)
            // ИСПРАВЛЕНИЕ: Фильтруем список, чтобы админы не попадали в выпадающий список
            setMentors(allUsers.filter(u => u.role === 'mentor'));
            
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignMentor = async (menteeId, mentorId) => {
        try {
            await fetcher(`/hr/assign-mentor`, { 
                method: 'POST',
                body: JSON.stringify({ mentee_id: menteeId, mentor_id: mentorId })
            });
            alert('Ментор назначен!');
            loadData();
        } catch (e) {
            alert(e.message);
        }
    };

    const filteredUsers = users.filter(u => 
        (u.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-10 text-center text-gray-400">Загрузка...</div>;

    return (
        <div>
            {/* ИСПРАВЛЕНИЕ: Убраны жесткие рамки и лишние скроллы */}
            <div className="flex justify-between items-center mb-6">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input 
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition"
                        placeholder="Поиск сотрудника..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-100">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 text-xs text-gray-500 uppercase border-b border-gray-100">
                            <th className="p-4 font-semibold">Сотрудник</th>
                            <th className="p-4 font-semibold">Текущий Ментор</th>
                            <th className="p-4 font-semibold">Назначить</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50/50 transition">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                                            {user.full_name?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-800 text-sm">{user.full_name}</div>
                                            <div className="text-xs text-gray-400">{user.role === 'mentor' ? 'Уже ментор' : 'Сотрудник'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    {user.mentor_id ? (
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <UserCheck size={16} className="text-green-500"/>
                                            {/* Находим имя ментора в общем списке или показываем ID если не нашли */}
                                            {mentors.find(m => m.id === user.mentor_id)?.full_name || 'Ментор назначен'}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">Не назначен</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <select 
                                        className="bg-white border border-gray-200 text-gray-700 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500 cursor-pointer hover:border-gray-300 transition w-48"
                                        onChange={(e) => {
                                            if (e.target.value) handleAssignMentor(user.id, e.target.value);
                                        }}
                                        value=""
                                    >
                                        <option value="" disabled>Выбрать ментора...</option>
                                        {mentors.map(mentor => (
                                            // Не показываем самого себя в списке
                                            mentor.id !== user.id && (
                                                <option key={mentor.id} value={mentor.id}>
                                                    {mentor.full_name}
                                                </option>
                                            )
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {mentors.length === 0 && (
                <div className="mt-4 p-4 bg-yellow-50 text-yellow-700 rounded-lg text-sm border border-yellow-100">
                    В системе нет пользователей с ролью "Ментор". Сначала измените роль сотруднику в админ-панели.
                </div>
            )}
        </div>
    );
};

export default MentorAssignment;