import React, { useState, useEffect } from 'react';
import { 
    Users, Layout, Plus, Edit, Trash2, Loader2, BookOpen, ArrowLeft 
} from 'lucide-react';
import MenteeManagement from '../components/mentor/MenteeManagement';
import TrackBuilder from '../components/features/TrackBuilder';
import { fetcher } from '../lib/api';

const MentorDashboard = () => {
    const [activeTab, setActiveTab] = useState('mentees'); // 'mentees' | 'tracks'
    
    // Состояние для Треков
    const [tracks, setTracks] = useState([]);
    const [loadingTracks, setLoadingTracks] = useState(false);
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [editingTrack, setEditingTrack] = useState(null);

    // Загрузка треков только при переключении на вкладку
    useEffect(() => {
        if (activeTab === 'tracks') {
            loadTracks();
        }
    }, [activeTab]);

    const loadTracks = async () => {
        setLoadingTracks(true);
        try {
            const data = await fetcher('/quests/tracks');
            setTracks(data);
        } catch (e) {
            console.error("Failed to load tracks", e);
        } finally {
            setLoadingTracks(false);
        }
    };

    // --- TRACK ACTIONS ---
    const handleCreateTrack = () => {
        setEditingTrack(null);
        setIsBuilderOpen(true);
    };

    const handleEditTrack = (track) => {
        setEditingTrack(track);
        setIsBuilderOpen(true);
    };

    const handleDeleteTrack = async (id) => {
        if (!confirm("Вы уверены? Это удалит трек из системы.")) return;
        try {
            await fetcher(`/quests/tracks/${id}`, { method: 'DELETE' });
            setTracks(tracks.filter(t => t.id !== id));
        } catch (e) {
            alert("Ошибка удаления: " + e.message);
        }
    };

    const handleSaveTrack = async (trackData) => {
        try {
            let result;
            if (editingTrack) {
                // Update
                result = await fetcher(`/quests/tracks/${editingTrack.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(trackData)
                });
                setTracks(tracks.map(t => t.id === editingTrack.id ? result : t));
            } else {
                // Create
                result = await fetcher('/quests/tracks', {
                    method: 'POST',
                    body: JSON.stringify(trackData)
                });
                setTracks([...tracks, result]);
            }
            setIsBuilderOpen(false);
            setEditingTrack(null);
        } catch (e) {
            throw e; // Пробрасываем ошибку в TrackBuilder для алерта
        }
    };

    // --- RENDER BUILDER ---
    if (isBuilderOpen) {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                <button 
                    onClick={() => setIsBuilderOpen(false)}
                    className="mb-4 flex items-center gap-2 text-gray-500 hover:text-gazprom-blue transition font-medium"
                >
                    <ArrowLeft size={20}/>
                    Назад к списку треков
                </button>
                <TrackBuilder 
                    existingTrack={editingTrack} 
                    onSave={handleSaveTrack} 
                />
            </div>
        );
    }

    // --- MAIN RENDER ---
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Кабинет Наставника</h1>
                    <p className="text-sm text-gray-500">Следите за успехами подопечных и создавайте программы обучения</p>
                </div>
                
                {/* Tabs Switcher */}
                <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                    <button 
                        onClick={() => setActiveTab('mentees')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${
                            activeTab === 'mentees' 
                                ? 'bg-gazprom-blue text-white shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <Users size={16}/>
                        Подопечные
                    </button>
                    <button 
                        onClick={() => setActiveTab('tracks')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${
                            activeTab === 'tracks' 
                                ? 'bg-gazprom-blue text-white shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <Layout size={16}/>
                        Программы (Треки)
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {activeTab === 'mentees' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
                     <MenteeManagement />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Tracks Header */}
                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="font-bold text-gray-700">Ваши программы адаптации</h2>
                        <button 
                            onClick={handleCreateTrack}
                            className="bg-gazprom-blue text-white px-4 py-2 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-600 transition flex items-center gap-2 font-bold text-sm active:scale-95"
                        >
                            <Plus size={18}/>
                            Создать трек
                        </button>
                    </div>

                    {/* Tracks Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {loadingTracks ? (
                            <div className="col-span-full text-center py-20 text-gray-400">
                                <Loader2 className="animate-spin inline-block mb-2" size={32}/>
                                <p>Загрузка программ...</p>
                            </div>
                        ) : tracks.length === 0 ? (
                            <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400">
                                <Layout size={48} className="mx-auto mb-4 opacity-20"/>
                                <p>Нет созданных программ. Начните с кнопки "Создать трек"</p>
                            </div>
                        ) : (
                            tracks.map(track => (
                                <div key={track.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition group relative flex flex-col h-full">
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition flex gap-2">
                                        <button 
                                            onClick={() => handleEditTrack(track)}
                                            className="p-2 bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-gazprom-blue rounded-lg transition"
                                            title="Редактировать"
                                        >
                                            <Edit size={16}/>
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteTrack(track.id)}
                                            className="p-2 bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500 rounded-lg transition"
                                            title="Удалить"
                                        >
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>

                                    <div className="mb-4">
                                        <span className="bg-blue-50 text-gazprom-blue text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                                            {track.stages?.length || 0} этапов
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-2 pr-16 leading-tight">{track.name}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-3 mb-4 flex-grow">
                                        {track.description || "Описание отсутствует"}
                                    </p>
                                    
                                    <div className="flex items-center gap-4 pt-4 border-t border-gray-50 text-xs text-gray-400 mt-auto">
                                        <div className="flex items-center gap-1">
                                            <BookOpen size={14}/>
                                            <span>{track.files?.length || 0} материалов</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MentorDashboard;