import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, PlayCircle, HelpCircle, CheckCircle2, Lock } from 'lucide-react';
import { fetcher } from '../lib/api';

const StageDetail = () => {
    const { stageId } = useParams();
    const navigate = useNavigate();
    const [stage, setStage] = useState(null);
    const [progressMap, setProgressMap] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Получаем весь трек и ищем нужный этап (API пока не дает отдельный get_stage)
                const track = await fetcher('/quests/my-track');
                const foundStage = track.stages.find(s => s.id === stageId);
                setStage(foundStage);

                // Получаем прогресс
                const progressList = await fetcher('/quests/progress');
                // Превращаем в мапу { task_id: status }
                const pMap = {};
                progressList.forEach(p => {
                    pMap[p.task_id] = p.status;
                });
                setProgressMap(pMap);

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [stageId]);

    const handleTaskClick = async (task, status) => {
        if (status === 'locked') return;

        if (task.type === 'quiz') {
            // Для квиза переходим на страницу квиза
            // task.quiz_id должен быть в данных
            if (task.quiz_id) {
                navigate(`/app/quiz/${task.quiz_id}?taskId=${task.id}`);
            } else {
                alert("Ошибка: ID теста не найден");
            }
        } else if (task.type === 'reading') {
            // Чтение завершается сразу
            try {
                await fetcher(`/quests/tasks/${task.id}/submit`, { 
                    method: 'POST',
                    body: JSON.stringify({})
                });
                // Обновляем локально
                setProgressMap(prev => ({...prev, [task.id]: 'completed'}));
            } catch (e) {
                alert("Ошибка выполнения: " + e.message);
            }
        } else {
            // Action - пока заглушка
            alert("Это задание требует проверки наставником. Функционал в разработке.");
        }
    };

    if (loading) return <div className="p-10 text-center">Загрузка этапа...</div>;
    if (!stage) return <div className="p-10 text-center">Этап не найден</div>;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4">
            <button 
                onClick={() => navigate('/app/track')}
                className="flex items-center gap-2 text-gray-500 hover:text-gazprom-blue mb-6 transition-colors"
            >
                <ArrowLeft size={20} /> Назад к треку
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/80 backdrop-blur p-8 rounded-3xl shadow-xl border border-white">
                        <h1 className="text-3xl font-bold text-gray-800 mb-4">{stage.title}</h1>
                        <p className="text-gray-600 leading-relaxed text-lg">
                            {stage.description}
                        </p>
                    </div>

                    <h2 className="text-xl font-bold text-gray-800 pl-2">Задания этапа</h2>
                    <div className="space-y-4">
                        {stage.tasks.map((task) => {
                            const status = progressMap[task.id] || 'locked'; // Default to locked if no progress found
                            
                            return (
                                <div 
                                    key={task.id}
                                    className={`bg-white p-6 rounded-2xl border border-gray-100 flex items-center justify-between transition-all
                                        ${status === 'locked' ? 'opacity-60 grayscale bg-gray-50' : 'shadow-md hover:shadow-lg cursor-pointer'}`}
                                    onClick={() => handleTaskClick(task, status)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white
                                            ${status === 'completed' ? 'bg-gazprom-success' : 
                                              task.type === 'quiz' ? 'bg-purple-500' : 'bg-gazprom-blue'}`}
                                        >
                                            {status === 'completed' ? <CheckCircle2 /> : 
                                             task.type === 'quiz' ? <HelpCircle /> : <FileText />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">{task.title}</h3>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md uppercase">
                                                {task.type} • {task.reward_xp} XP
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        {(status === 'available' || status === 'in_progress') && (
                                            <button className="px-4 py-2 bg-blue-50 text-gazprom-blue rounded-lg font-medium hover:bg-blue-100 transition flex items-center gap-2">
                                                Начать <PlayCircle size={16} />
                                            </button>
                                        )}
                                        {status === 'locked' && <Lock className="text-gray-400" size={20}/>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-blue-500 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-2">Совет наставника</h3>
                            <p className="text-blue-50 text-sm">
                                Выполняйте задания последовательно. За каждый пройденный этап вы получаете баллы опыта.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StageDetail;