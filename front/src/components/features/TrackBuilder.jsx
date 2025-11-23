import React, { useState, useEffect } from 'react';
import { 
    Plus, Save, Trash2, GripVertical, ChevronDown, ChevronUp, 
    FileText, CheckCircle, AlertCircle, List, BookOpen, Zap, Layout, Loader2
} from 'lucide-react';
import FileSelector from '../common/FileSelector';
import { fetcher } from '../../lib/api';

const TASK_TYPES = [
    { value: 'reading', label: 'Изучение материала', icon: BookOpen },
    { value: 'quiz', label: 'Тестирование', icon: CheckCircle },
    { value: 'action', label: 'Практическое задание', icon: Zap },
];

const TrackBuilder = ({ existingTrack = null, onSave }) => {
    const [track, setTrack] = useState({
        name: '',
        description: '',
        file_ids: [],
        stages: []
    });
    
    const [loading, setLoading] = useState(false);
    const [expandedStages, setExpandedStages] = useState({});

    useEffect(() => {
        if (existingTrack) {
            setTrack({
                ...existingTrack,
                file_ids: existingTrack.files?.map(f => f.id) || [],
                stages: existingTrack.stages.map(stage => ({
                    ...stage,
                    file_ids: stage.files?.map(f => f.id) || [],
                    tasks: stage.tasks.map(task => ({
                        ...task,
                        file_ids: task.files?.map(f => f.id) || []
                    }))
                }))
            });
            if(existingTrack.stages.length > 0) {
                setExpandedStages({0: true});
            }
        } else {
            addStage();
        }
    }, [existingTrack]);

    const updateTrack = (field, value) => setTrack(prev => ({ ...prev, [field]: value }));

    const handleSave = async (e) => {
        // PREVENT DEFAULT НА ВСЯКИЙ СЛУЧАЙ
        if (e && typeof e.preventDefault === 'function') {
            e.preventDefault();
        }

        if (!track.name) return alert("Введите название трека");
        if (!onSave) return alert("Ошибка: Функция сохранения не передана");

        setLoading(true);
        try {
            const payload = {
                ...track,
                stages: track.stages.map((stage, sIdx) => ({
                    ...stage,
                    order: sIdx + 1,
                    tasks: stage.tasks.map((task, tIdx) => ({
                        ...task,
                        order: tIdx + 1,
                        quiz_id: task.type === 'quiz' && task.quiz_id ? parseInt(task.quiz_id) : null 
                    }))
                }))
            };

            await onSave(payload);
        } catch (err) {
            console.error(err);
            alert("Ошибка сохранения: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- STAGE LEVEL ---
    const addStage = () => {
        setTrack(prev => {
            const newStage = {
                id: `temp_stage_${Date.now()}`,
                title: `Новый этап ${prev.stages.length + 1}`,
                description: '',
                reward_xp: 100,
                file_ids: [],
                tasks: []
            };
            const updatedStages = [...prev.stages, newStage];
            setExpandedStages(prevExp => ({ ...prevExp, [updatedStages.length - 1]: true }));
            return { ...prev, stages: updatedStages };
        });
    };

    const updateStage = (index, field, value) => {
        const newStages = [...track.stages];
        newStages[index] = { ...newStages[index], [field]: value };
        setTrack(prev => ({ ...prev, stages: newStages }));
    };

    const removeStage = (index) => {
        if (!confirm("Удалить этап и все его задачи?")) return;
        setTrack(prev => ({
            ...prev,
            stages: prev.stages.filter((_, i) => i !== index)
        }));
    };

    const toggleStage = (index) => {
        setExpandedStages(prev => ({ ...prev, [index]: !prev[index] }));
    };

    // --- TASK LEVEL ---
    const addTask = (stageIndex) => {
        const newStages = [...track.stages];
        newStages[stageIndex].tasks.push({
            id: `temp_task_${Date.now()}`,
            title: 'Новая задача',
            description: '',
            type: 'reading',
            reward_xp: 10,
            quiz_id: null,
            file_ids: []
        });
        setTrack(prev => ({ ...prev, stages: newStages }));
    };

    const updateTask = (stageIndex, taskIndex, field, value) => {
        const newStages = [...track.stages];
        newStages[stageIndex].tasks[taskIndex] = { 
            ...newStages[stageIndex].tasks[taskIndex], 
            [field]: value 
        };
        setTrack(prev => ({ ...prev, stages: newStages }));
    };

    const removeTask = (stageIndex, taskIndex) => {
        const newStages = [...track.stages];
        newStages[stageIndex].tasks = newStages[stageIndex].tasks.filter((_, i) => i !== taskIndex);
        setTrack(prev => ({ ...prev, stages: newStages }));
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Top Bar */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Layout className="text-gazprom-blue" />
                    Настройки трека
                </h2>
                
                <div className="grid gap-4">
                    <input 
                        className="w-full text-2xl font-bold placeholder-gray-300 border-b-2 border-transparent focus:border-gazprom-blue outline-none py-2 transition"
                        placeholder="Название трека адаптации"
                        value={track.name}
                        onChange={e => updateTrack('name', e.target.value)}
                    />
                    <textarea 
                        className="w-full text-gray-600 placeholder-gray-300 outline-none resize-none bg-gray-50 p-3 rounded-xl focus:ring-2 focus:ring-blue-100 transition"
                        placeholder="Краткое описание..."
                        rows={2}
                        value={track.description || ''}
                        onChange={e => updateTrack('description', e.target.value)}
                    />
                    <div className="pt-2 border-t border-gray-100">
                        <FileSelector 
                            label="Общие материалы трека"
                            selectedIds={track.file_ids}
                            onSelectionChange={ids => updateTrack('file_ids', ids)}
                        />
                    </div>
                </div>
            </div>

            {/* Stages */}
            <div className="space-y-4">
                {track.stages.map((stage, sIdx) => (
                    <div key={stage.id || sIdx} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all">
                        <div className="bg-gray-50/50 p-4 flex items-start gap-3 border-b border-gray-100">
                            <div className="pt-2 cursor-grab text-gray-300"><GripVertical size={20} /></div>
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className="bg-gazprom-blue text-white text-xs font-bold px-2 py-1 rounded">Этап {sIdx + 1}</span>
                                    <input 
                                        className="font-bold text-gray-800 bg-transparent outline-none w-full focus:bg-white px-2 rounded transition"
                                        value={stage.title}
                                        onChange={e => updateStage(sIdx, 'title', e.target.value)}
                                        placeholder="Название этапа"
                                    />
                                </div>
                                {expandedStages[sIdx] && (
                                    <div className="space-y-3 animate-in fade-in duration-300">
                                        <textarea 
                                            className="w-full text-sm text-gray-600 bg-white border border-gray-200 rounded-lg p-3 outline-none focus:border-blue-300"
                                            placeholder="Описание этапа..."
                                            rows={2}
                                            value={stage.description || ''}
                                            onChange={e => updateStage(sIdx, 'description', e.target.value)}
                                        />
                                        <FileSelector 
                                            label="Материалы этапа"
                                            selectedIds={stage.file_ids}
                                            onSelectionChange={ids => updateStage(sIdx, 'file_ids', ids)}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-lg text-xs font-bold border border-yellow-100">
                                    <Zap size={12} />
                                    <input 
                                        type="number" 
                                        className="w-8 bg-transparent outline-none text-center"
                                        value={stage.reward_xp}
                                        onChange={e => updateStage(sIdx, 'reward_xp', parseInt(e.target.value) || 0)}
                                    />
                                    XP
                                </div>
                                <button onClick={() => toggleStage(sIdx)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                                    {expandedStages[sIdx] ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                                </button>
                                <button onClick={() => removeStage(sIdx)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                    <Trash2 size={20}/>
                                </button>
                            </div>
                        </div>

                        {/* Tasks */}
                        {expandedStages[sIdx] && (
                            <div className="p-4 bg-white space-y-3">
                                {stage.tasks.map((task, tIdx) => (
                                    <div key={task.id || tIdx} className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/30 hover:border-blue-200 transition group">
                                        <div className="pt-1 text-gray-300">{tIdx + 1}.</div>
                                        <div className="flex-1 space-y-3">
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <input 
                                                    className="font-medium text-gray-800 bg-transparent outline-none flex-1 placeholder-gray-400"
                                                    value={task.title}
                                                    onChange={e => updateTask(sIdx, tIdx, 'title', e.target.value)}
                                                    placeholder="Что нужно сделать?"
                                                />
                                                <select 
                                                    className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1 outline-none text-gray-600"
                                                    value={task.type}
                                                    onChange={e => updateTask(sIdx, tIdx, 'type', e.target.value)}
                                                >
                                                    {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                </select>
                                            </div>
                                            <textarea 
                                                className="w-full text-xs text-gray-600 bg-transparent outline-none resize-none"
                                                placeholder="Детали задачи..."
                                                rows={1}
                                                value={task.description || ''}
                                                onChange={e => updateTask(sIdx, tIdx, 'description', e.target.value)}
                                            />
                                            <div className="pt-2 border-t border-gray-100/50">
                                                <FileSelector 
                                                    label="Материалы к задаче"
                                                    selectedIds={task.file_ids}
                                                    onSelectionChange={ids => updateTask(sIdx, tIdx, 'file_ids', ids)}
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => removeTask(sIdx, tIdx)}
                                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition"
                                        >
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    onClick={() => addTask(sIdx)}
                                    className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-bold text-sm hover:border-gazprom-blue hover:text-gazprom-blue hover:bg-blue-50 transition flex items-center justify-center gap-2"
                                >
                                    <Plus size={18}/> Добавить задачу
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <button 
                onClick={addStage}
                className="w-full py-4 bg-white border border-gray-200 shadow-sm rounded-2xl text-gray-600 font-bold hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
                <List size={20}/> Добавить новый этап
            </button>

            <div className="fixed bottom-6 right-6 z-30">
                <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-gazprom-blue text-white px-8 py-4 rounded-full shadow-xl shadow-blue-500/30 font-bold text-lg flex items-center gap-3 hover:bg-blue-600 hover:scale-105 active:scale-95 transition disabled:opacity-70 disabled:scale-100"
                >
                    {loading ? <Loader2 className="animate-spin"/> : <Save />}
                    {loading ? "Сохранение..." : "Сохранить трек"}
                </button>
            </div>
        </div>
    );
};

export default TrackBuilder;