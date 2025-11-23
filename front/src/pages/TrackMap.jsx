import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Circle, Lock, ArrowRight, Map, Loader2 } from 'lucide-react';
import { fetcher } from '../lib/api';

const TrackMap = () => {
    const navigate = useNavigate();
    const [track, setTrack] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadTrack = async () => {
            try {
                // Используем endpoint, который мы починили в бэкенде
                const data = await fetcher('/quests/my-track');
                setTrack(data);
            } catch (err) {
                console.error(err);
                // Если 404 или ошибка, не показываем белый экран, а показываем ошибку
                setError("Маршрут адаптации пока не назначен или произошла ошибка.");
            } finally {
                setLoading(false);
            }
        };
        loadTrack();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <Loader2 className="w-12 h-12 text-gazprom-blue animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Загружаем ваш путь...</p>
            </div>
        );
    }

    if (error || !track) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                <div className="bg-red-50 p-4 rounded-full mb-4">
                    <Map className="w-12 h-12 text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Маршрут не найден</h2>
                <p className="text-gray-500 max-w-md mb-6">{error}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-gazprom-blue text-white rounded-xl font-bold hover:bg-blue-600 transition"
                >
                    Попробовать снова
                </button>
            </div>
        );
    }

    // Сортируем этапы по порядку
    const sortedStages = track.stages?.sort((a, b) => a.order_index - b.order_index) || [];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{track.title}</h1>
                <p className="text-gray-500">{track.description || "Ваш персональный план адаптации"}</p>
            </div>

            <div className="relative">
                {/* Линия соединения (Timeline) */}
                <div className="absolute left-8 top-8 bottom-8 w-1 bg-gray-100 rounded-full hidden md:block"></div>

                <div className="space-y-8">
                    {sortedStages.length === 0 ? (
                        // UI ЗАГЛУШКА ЕСЛИ ЭТАПОВ НЕТ
                        <div className="p-6 bg-white rounded-3xl border border-dashed border-gray-300 text-center">
                            <p className="text-gray-400">В этом треке пока нет этапов.</p>
                        </div>
                    ) : (
                        sortedStages.map((stage, index) => {
                            // Логика доступности (упрощенная)
                            // Если предыдущий этап не выполнен, текущий заблокирован
                            // В реальности надо смотреть на status из user_track_progress
                            const isLocked = false; // Пока открываем всё для демо
                            const isCompleted = false; 
                            const isCurrent = index === 0; // Заглушка: первый всегда активный

                            return (
                                <div 
                                    key={stage.id} 
                                    className={`relative pl-0 md:pl-24 transition-all duration-300 ${isLocked ? 'opacity-60 grayscale' : 'opacity-100'}`}
                                >
                                    {/* Иконка на Timeline */}
                                    <div className={`hidden md:flex absolute left-0 top-0 w-16 h-16 rounded-2xl items-center justify-center z-10 border-4 transition-colors ${
                                        isCompleted 
                                            ? 'bg-green-100 border-white text-green-600 shadow-lg shadow-green-100' 
                                            : isCurrent
                                                ? 'bg-gazprom-blue border-white text-white shadow-lg shadow-blue-200 scale-110'
                                                : 'bg-gray-50 border-white text-gray-300'
                                    }`}>
                                        {isCompleted ? <CheckCircle size={28} /> : isLocked ? <Lock size={24} /> : <span className="text-xl font-bold">{index + 1}</span>}
                                    </div>

                                    {/* Карточка этапа */}
                                    <div 
                                        className={`bg-white p-6 rounded-3xl border transition-all group cursor-pointer hover:shadow-lg ${
                                            isCurrent ? 'border-gazprom-blue shadow-md ring-1 ring-blue-100' : 'border-gray-100'
                                        }`}
                                        onClick={() => !isLocked && navigate(`/app/stage/${stage.id}`)}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1 md:hidden">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${isCurrent ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                                        Этап {index + 1}
                                                    </span>
                                                </div>
                                                <h3 className={`text-xl font-bold ${isCurrent ? 'text-gazprom-blue' : 'text-gray-800'}`}>
                                                    {stage.title}
                                                </h3>
                                                <p className="text-gray-500 text-sm mt-1 line-clamp-2">{stage.description}</p>
                                            </div>
                                            <div className={`p-2 rounded-full transition-colors ${isLocked ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-gazprom-blue group-hover:bg-gazprom-blue group-hover:text-white'}`}>
                                                {isLocked ? <Lock size={20}/> : <ArrowRight size={20}/>}
                                            </div>
                                        </div>

                                        {/* Задачи внутри этапа (Preview) */}
                                        <div className="space-y-2">
                                            {stage.tasks && stage.tasks.length > 0 ? (
                                                stage.tasks.slice(0, 2).map(task => (
                                                    <div key={task.id} className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                                                        <Circle size={14} className="text-gray-400 shrink-0"/>
                                                        <span className="truncate">{task.title}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-xs text-gray-400 italic">Нет задач</div>
                                            )}
                                            {stage.tasks && stage.tasks.length > 2 && (
                                                <p className="text-xs text-gray-400 pl-2">+ еще {stage.tasks.length - 2}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrackMap;