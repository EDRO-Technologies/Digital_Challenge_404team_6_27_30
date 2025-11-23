import React, { useState, useEffect } from 'react';
import { User, BookOpen, Loader2, CheckCircle } from 'lucide-react';
import { fetcher } from '../../lib/api';

const MenteeManagement = () => {
    const [mentees, setMentees] = useState([]);
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [assigningTo, setAssigningTo] = useState(null); 
    const [selectedTrack, setSelectedTrack] = useState('');

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const [mList, tList] = await Promise.all([
                    fetcher('/mentor/mentees'),
                    fetcher('/quests/tracks')
                ]);
                setMentees(mList);
                setTracks(tList);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        init();
    }, []);

    const handleAssignTrack = async () => {
        if (!assigningTo || !selectedTrack) return;
        try {
            await fetcher(`/quests/assign/${assigningTo}/${selectedTrack}`, { method: 'POST' });
            alert("Трек успешно назначен!");
            setAssigningTo(null);
            const mList = await fetcher('/mentor/mentees');
            setMentees(mList);
        } catch (e) {
            alert(e.message);
        }
    };

    if(loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline text-gray-400"/></div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mentees.map(user => (
                <div key={user.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                            {user.full_name[0]}
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-gray-800">{user.full_name}</h3>
                            <p className="text-xs text-gray-500">{user.email}</p>
                            <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-[10px] rounded text-gray-600 font-medium">
                                <User size={10}/> Уровень {user.level} • {user.xp_points} XP
                            </div>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-gray-50">
                        {user.track_id ? (
                            <div className="text-xs text-green-600 font-bold flex items-center gap-1.5 bg-green-50 p-2 rounded-lg justify-center">
                                <CheckCircle size={14}/> Трек назначен
                            </div>
                        ) : (
                            assigningTo === user.id ? (
                                <div className="animate-in fade-in slide-in-from-top-1">
                                    <select 
                                        className="w-full p-1.5 mb-2 bg-gray-50 rounded text-xs border border-gray-200 outline-none"
                                        value={selectedTrack}
                                        onChange={e => setSelectedTrack(e.target.value)}
                                    >
                                        <option value="">Выберите трек...</option>
                                        {tracks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={handleAssignTrack}
                                            className="flex-1 bg-blue-600 text-white py-1.5 rounded text-xs font-bold hover:bg-blue-700"
                                        >
                                            OK
                                        </button>
                                        <button 
                                            onClick={() => setAssigningTo(null)}
                                            className="flex-1 bg-gray-100 text-gray-600 py-1.5 rounded text-xs hover:bg-gray-200"
                                        >
                                            Отмена
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => { setAssigningTo(user.id); setSelectedTrack(''); }}
                                    className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition flex items-center justify-center gap-2"
                                >
                                    <BookOpen size={14}/> Назначить трек
                                </button>
                            )
                        )}
                    </div>
                </div>
            ))}
            {mentees.length === 0 && (
                <div className="col-span-full text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-400 text-sm mb-1">Список пуст.</p>
                    <p className="text-xs text-gray-400">Сотрудники появятся здесь после того, как HR закрепит их за вами.</p>
                </div>
            )}
        </div>
    );
};

export default MenteeManagement;