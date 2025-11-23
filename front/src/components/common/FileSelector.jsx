import React, { useState, useEffect } from 'react';
import { FileText, CheckSquare, Square, Search, Loader2, X } from 'lucide-react';
import { fetcher } from '../../lib/api';

const FileSelector = ({ selectedIds = [], onSelectionChange, label = "Прикрепить материалы" }) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (isOpen && files.length === 0) {
            loadFiles();
        }
    }, [isOpen]);

    const loadFiles = async () => {
        setLoading(true);
        try {
            // Используем исправленный путь
            const data = await fetcher('/knowledge/files');
            setFiles(data);
        } catch (e) {
            console.error("Failed to load files for selector", e);
        } finally {
            setLoading(false);
        }
    };

    const toggleFile = (fileId) => {
        const newSelection = selectedIds.includes(fileId)
            ? selectedIds.filter(id => id !== fileId)
            : [...selectedIds, fileId];
        onSelectionChange(newSelection);
    };

    const filteredFiles = files.filter(f => 
        f.name.toLowerCase().includes(search.toLowerCase())
    );

    const selectedFilesObjects = files.filter(f => selectedIds.includes(f.id));

    return (
        <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">{label}</label>
            
            {/* Отображение выбранных */}
            <div className="flex flex-wrap gap-2 mb-2">
                {selectedFilesObjects.map(file => (
                    <div key={file.id} className="flex items-center gap-1 bg-blue-50 text-gazprom-blue px-2 py-1 rounded-lg text-xs border border-blue-100">
                        <FileText size={12}/>
                        <span className="max-w-[150px] truncate">{file.name}</span>
                        <button 
                            onClick={() => toggleFile(file.id)}
                            className="hover:bg-blue-100 rounded p-0.5"
                        >
                            <X size={12}/>
                        </button>
                    </div>
                ))}
                <button 
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="text-xs font-bold text-gazprom-blue hover:underline px-2 py-1"
                >
                    {isOpen ? 'Скрыть список' : '+ Выбрать из базы знаний'}
                </button>
            </div>

            {/* Выпадающий список выбора */}
            {isOpen && (
                <div className="border border-gray-200 rounded-xl p-3 bg-white shadow-sm animate-in slide-in-from-top-2">
                    <div className="relative mb-3">
                        <Search size={16} className="absolute left-3 top-2.5 text-gray-400"/>
                        <input 
                            type="text" 
                            placeholder="Поиск документа..." 
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-blue-100"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                        {loading ? (
                            <div className="text-center py-4 text-gray-400">
                                <Loader2 className="animate-spin inline-block mb-1" size={16}/>
                                <div className="text-xs">Загрузка...</div>
                            </div>
                        ) : filteredFiles.length === 0 ? (
                            <div className="text-center py-4 text-gray-400 text-xs">Нет файлов в базе</div>
                        ) : (
                            filteredFiles.map(file => {
                                const isSelected = selectedIds.includes(file.id);
                                return (
                                    <div 
                                        key={file.id}
                                        onClick={() => toggleFile(file.id)}
                                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
                                            isSelected ? 'bg-blue-50 text-gazprom-blue' : 'hover:bg-gray-50 text-gray-700'
                                        }`}
                                    >
                                        {isSelected ? <CheckSquare size={18} className="shrink-0"/> : <Square size={18} className="text-gray-300 shrink-0"/>}
                                        <div className="min-w-0 overflow-hidden">
                                            <p className="text-sm truncate font-medium">{file.name}</p>
                                            <p className="text-[10px] opacity-60">{new Date(file.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileSelector;