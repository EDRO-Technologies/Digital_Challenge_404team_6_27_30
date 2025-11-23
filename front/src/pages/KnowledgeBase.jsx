import React, { useState, useEffect } from 'react';
import { FolderOpen, Upload, Download, Trash2, FileText, Search, Loader2, File } from 'lucide-react';
import { fetcher } from '../lib/api';

const KnowledgeBase = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [downloadingId, setDownloadingId] = useState(null);
    const [search, setSearch] = useState('');

    const user = JSON.parse(localStorage.getItem('kb_user') || '{}');
    // Разрешаем всем видеть, но редактировать только стаффу
    const canEdit = ['admin', 'hr', 'mentor'].includes(user.role);

    useEffect(() => {
        loadFiles();
    }, []);

    const loadFiles = async () => {
        try {
            // ИСПРАВЛЕНО: Новый упрощенный путь
            const data = await fetcher('/knowledge/files'); 
            setFiles(data);
        } catch (e) {
            console.error("Failed to load files:", e);
            // Fallback для демо, если бэк лежит
            setFiles([
                { id: 1, name: 'Регламент_ПБ_2024.pdf', size: 1024 * 1024 * 2.5, created_at: new Date().toISOString(), type: 'FILE' },
                { id: 2, name: 'Инструкция_по_адаптации.docx', size: 1024 * 500, created_at: new Date().toISOString(), type: 'FILE' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        if (!e.target.files?.length) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', e.target.files[0]);

        try {
            const token = localStorage.getItem('kb_token');
            // ИСПРАВЛЕНО: Новый путь загрузки
            const res = await fetch('/api/v1/knowledge/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Upload failed');
            }
            
            await loadFiles();
        } catch (err) {
            alert('Ошибка загрузки: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (file) => {
        if (!file.id || typeof file.id === 'number') {
            alert("Это демо-файл, скачивание недоступно.");
            return;
        }
        try {
            setDownloadingId(file.id);
            const token = localStorage.getItem('kb_token');
            
            const response = await fetch(`/api/v1/knowledge/files/${file.id}/download`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Ошибка при скачивании файла");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            alert(e.message);
        } finally {
            setDownloadingId(null);
        }
    };

    const handleDelete = async (fileId) => {
        if (!confirm('Удалить файл?')) return;
        try {
            await fetcher(`/knowledge/files/${fileId}`, { method: 'DELETE' });
            setFiles(files.filter(f => f.id !== fileId));
        } catch (e) {
            alert(e.message);
        }
    };

    const formatSize = (bytes) => {
        if (!bytes) return 'Unknown size';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const filteredFiles = files.filter(f => 
        f.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Заголовок и кнопка загрузки */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FolderOpen className="text-gazprom-blue" />
                        База Знаний
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Здесь хранятся все регламенты и инструкции компании
                    </p>
                </div>
                
                {canEdit && (
                    <label className="flex items-center gap-2 bg-gazprom-blue hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl cursor-pointer transition shadow-lg shadow-blue-200 active:scale-95">
                        {uploading ? <Loader2 className="animate-spin" size={20}/> : <Upload size={20}/>}
                        <span className="text-sm font-bold">Загрузить документ</span>
                        <input type="file" className="hidden" onChange={handleUpload} disabled={uploading}/>
                    </label>
                )}
            </div>

            {/* Поиск */}
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                <div className="relative">
                    <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <input 
                        className="w-full pl-12 pr-4 py-3 bg-transparent outline-none text-gray-700 placeholder-gray-400"
                        placeholder="Поиск по названию документа..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Список файлов */}
            <div className="grid grid-cols-1 gap-3">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Loader2 className="animate-spin mb-2" size={32}/>
                        <p>Синхронизация с хранилищем...</p>
                    </div>
                ) : filteredFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                        <FolderOpen size={48} className="mb-4 opacity-20"/>
                        <p>Документы не найдены</p>
                    </div>
                ) : (
                    filteredFiles.map(file => (
                        <div key={file.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition flex items-center justify-between group">
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 text-gazprom-blue flex items-center justify-center shrink-0">
                                    <FileText size={24} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-gray-800 text-sm truncate pr-4">{file.name}</h3>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-mono uppercase">{file.type || 'FILE'}</span>
                                        <span>•</span>
                                        <span>{formatSize(file.content?.size || file.size || 0)}</span>
                                        <span>•</span>
                                        <span>{new Date(file.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => handleDownload(file)}
                                    className="p-2.5 text-gray-400 hover:text-gazprom-blue hover:bg-blue-50 rounded-xl transition"
                                    title="Скачать"
                                    disabled={downloadingId === file.id}
                                >
                                    {downloadingId === file.id ? <Loader2 size={20} className="animate-spin"/> : <Download size={20}/>}
                                </button>
                                
                                {canEdit && (
                                    <button 
                                        onClick={() => handleDelete(file.id)}
                                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                                        title="Удалить"
                                    >
                                        <Trash2 size={20}/>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default KnowledgeBase;