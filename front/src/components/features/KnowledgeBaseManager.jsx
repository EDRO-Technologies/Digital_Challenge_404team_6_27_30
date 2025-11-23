import React, { useState, useEffect } from 'react';
import { Upload, Trash2, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { fetcher } from '../../lib/api';

// Этот компонент используется админами/HR для управления файлами
// Раньше он стучался в /workspaces/upload, теперь переводим на /knowledge/upload

const KnowledgeBaseManager = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadFiles();
    }, []);

    const loadFiles = async () => {
        try {
            // ИСПРАВЛЕНО: Новый путь
            const data = await fetcher('/knowledge/files');
            setFiles(data);
        } catch (e) {
            console.error("Failed to load KB files", e);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('kb_token');
            // ИСПРАВЛЕНО: Новый путь загрузки
            const res = await fetch('/api/v1/knowledge/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) throw new Error('Upload failed');
            
            await loadFiles(); // Обновляем список
        } catch (error) {
            alert("Ошибка загрузки: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if(!confirm("Удалить файл?")) return;
        try {
            await fetcher(`/knowledge/files/${id}`, { method: 'DELETE' });
            setFiles(files.filter(f => f.id !== id));
        } catch (e) {
            alert("Ошибка удаления: " + e.message);
        }
    };

    if (loading) return <div className="p-4 text-gray-400">Загрузка файлов...</div>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="text-gazprom-blue"/>
                Управление Базой Знаний
            </h3>

            <div className="mb-6">
                <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-2xl appearance-none cursor-pointer hover:border-gazprom-blue focus:outline-none">
                    <div className="flex flex-col items-center space-y-2">
                        {uploading ? (
                            <Loader2 className="w-8 h-8 text-gazprom-blue animate-spin" />
                        ) : (
                            <Upload className="w-8 h-8 text-gray-400" />
                        )}
                        <span className="font-medium text-gray-600">
                            {uploading ? "Загрузка..." : "Нажмите для загрузки документов"}
                        </span>
                        <span className="text-xs text-gray-500">PDF, DOCX, TXT (Макс. 10MB)</span>
                    </div>
                    <input 
                        type="file" 
                        className="hidden" 
                        onChange={handleFileUpload}
                        disabled={uploading} 
                    />
                </label>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {files.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-4">Нет загруженных файлов</p>
                ) : (
                    files.map(file => (
                        <div key={file.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl group hover:bg-blue-50 transition">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="bg-white p-2 rounded-lg shadow-sm shrink-0">
                                    <FileText size={16} className="text-gazprom-blue"/>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-gray-700 truncate">{file.name}</p>
                                    <p className="text-xs text-gray-400">{new Date(file.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDelete(file.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                            >
                                <Trash2 size={18}/>
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default KnowledgeBaseManager;