import React, { useState, useEffect } from 'react';
import { Search, User, CheckCircle, AlertCircle, BookOpen } from 'lucide-react';
import { fetcher } from '../../lib/api';

const UserAssignment = () => {
    const [users, setUsers] = useState([]);
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [usersData, tracksData] = await Promise.all([
                fetcher('/hr/employees'), // Нужно убедиться, что этот эндпоинт есть, иначе используем /users
                fetcher('/quests/tracks')
            ]);
            // Фильтруем только сотрудников (не админов и не HR) для назначения треков
            setUsers(usersData.filter(u => u.role === 'employee' || u.role === 'mentor'));
            setTracks(tracksData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (userId, trackId) => {
        try {
            await fetcher(`/quests/assign/${userId}/${trackId}`, { method: 'POST' });
            alert('Трек успешно назначен!');
            loadData(); // Обновляем список
        } catch (e) {
            alert(e.message);
        }
    };

    const filteredUsers = users.filter(u => 
        (u.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-10 text-center text-gray-400">Загрузка...</div>;

    return (
        <div>
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
                <div className="text-xs text-gray-400">
                    Показано: {filteredUsers.length}
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-100">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 text-xs text-gray-500 uppercase border-b border-gray-100">
                            <th className="p-4 font-semibold">Сотрудник</th>
                            <th className="p-4 font-semibold">Текущий трек</th>
                            <th className="p-4 font-semibold">Действие</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50/50 transition">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                            {user.full_name?.[0] || <User size={14}/>}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-800 text-sm">{user.full_name || 'Без имени'}</div>
                                            <div className="text-xs text-gray-400">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    {user.track_id ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-medium border border-green-100">
                                            <BookOpen size={12}/>
                                            {tracks.find(t => t.id === user.track_id)?.name || 'Назначен'}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-50 text-yellow-700 text-xs font-medium border border-yellow-100">
                                            <AlertCircle size={12}/> Нет трека
                                        </span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <select 
                                        className="bg-white border border-gray-200 text-gray-700 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500 cursor-pointer hover:border-gray-300 transition w-48"
                                        onChange={(e) => {
                                            if (e.target.value) handleAssign(user.id, e.target.value);
                                        }}
                                        value=""
                                    >
                                        <option value="" disabled>Назначить трек...</option>
                                        {tracks.map(track => (
                                            <option key={track.id} value={track.id}>
                                                {track.name}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserAssignment;