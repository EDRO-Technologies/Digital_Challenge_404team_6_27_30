import { useState, useEffect } from 'react';
import { Clock, CheckCircle, Lock, PlayCircle } from 'lucide-react';
import { fetcher } from '../lib/api';
import { useNavigate } from 'react-router-dom';

const TaskList = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetcher('/quests/progress');
                setTasks(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const stats = {
        waiting: tasks.filter(t => t.status === 'in_progress' || t.status === 'available').length,
        done: tasks.filter(t => t.status === 'completed').length,
        locked: tasks.filter(t => t.status === 'locked').length
    };

    const getIcon = (status) => {
        if (status === 'completed') return <CheckCircle size={20} />;
        if (status === 'locked') return <Lock size={20} />;
        return <Clock size={20} />;
    };

    const getStatusColor = (status) => {
        if (status === 'completed') return 'bg-green-100 text-green-600';
        if (status === 'locked') return 'bg-gray-100 text-gray-400';
        return 'bg-yellow-100 text-yellow-600';
    };

    const handleTaskClick = (p) => {
        if (p.status !== 'locked' && p.task?.stage_id) {
            // Переходим к этапу, где находится эта задача
            navigate(`/app/track/${p.task.stage_id}`);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in">
            <h1 className="text-3xl font-bold text-gray-800">Мои задания</h1>

            {/* Статистика */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
                    <div className="text-3xl font-bold text-gazprom-blue mb-1">{stats.waiting}</div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">В работе</div>
                </div>
                <div className="bg-green-50 p-4 rounded-2xl border border-green-100 text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">{stats.done}</div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Готово</div>
                </div>
                <div className="bg-gray-100 p-4 rounded-2xl border border-gray-200 text-center">
                    <div className="text-3xl font-bold text-gray-500 mb-1">{stats.locked}</div>
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Закрыто</div>
                </div>
            </div>

            {/* Список */}
            <div className="bg-white/80 backdrop-blur rounded-3xl shadow-lg border border-white overflow-hidden">
                {tasks.length === 0 && !loading && (
                    <div className="p-8 text-center text-gray-400">Список задач пуст</div>
                )}
                
                {tasks.map((p) => (
                    <div 
                        key={p.id} 
                        onClick={() => handleTaskClick(p)}
                        className={`p-5 border-b border-gray-100 last:border-0 flex items-center justify-between hover:bg-white transition-colors cursor-pointer
                        ${p.status === 'locked' ? 'opacity-60' : ''}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(p.status)}`}>
                                {getIcon(p.status)}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800">{p.task?.title || "Задание"}</h4>
                                <span className="text-xs text-gray-500 uppercase">{p.status.replace('_', ' ')}</span>
                            </div>
                        </div>
                        
                        {(p.status === 'available' || p.status === 'in_progress') && (
                            <button className="px-4 py-2 text-sm font-medium text-gazprom-blue bg-blue-50 rounded-lg hover:bg-blue-100 transition flex items-center gap-2">
                                К задаче <PlayCircle size={16}/>
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TaskList;