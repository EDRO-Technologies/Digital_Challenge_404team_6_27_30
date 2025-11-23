import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Привет! Я Дмитрий, твой цифровой наставник. Чем могу помочь?", isBot: true }
    ]);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { id: Date.now(), text: input, isBot: false };
        setMessages(prev => [...prev, userMsg]);
        setInput("");

        // Эмуляция ответа (здесь будет запрос к API)
        setTimeout(() => {
            setMessages(prev => [...prev, { 
                id: Date.now() + 1, 
                text: "Я пока учусь, но скоро смогу отвечать на вопросы по регламентам.", 
                isBot: true 
            }]);
        }, 1000);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Окно чата */}
            {isOpen && (
                <div className="mb-4 w-80 sm:w-96 bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl overflow-hidden flex flex-col h-[500px] transition-all duration-300 ease-out animate-in slide-in-from-bottom-10 fade-in">
                    {/* Шапка чата */}
                    <div className="bg-gazprom-blue p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                            <div className="bg-white/20 p-1.5 rounded-full">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Д.А. Таранов</h3>
                                <span className="text-xs text-blue-100 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    Онлайн
                                </span>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Сообщения */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                                    msg.isBot 
                                        ? 'bg-white shadow-sm text-gray-800 rounded-tl-none border border-gray-100' 
                                        : 'bg-gazprom-blue text-white rounded-tr-none shadow-md'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Ввод */}
                    <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Задайте вопрос..."
                            className="flex-1 bg-gray-100 text-sm rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gazprom-light/50"
                        />
                        <button type="submit" className="bg-gazprom-blue text-white p-2 rounded-xl hover:bg-blue-700 transition active:scale-95">
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}

            {/* Кнопка открытия */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="group flex items-center justify-center w-14 h-14 bg-gazprom-blue text-white rounded-full shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-all hover:scale-110 active:scale-95"
            >
                {isOpen ? <X size={28} /> : <MessageCircle size={28} className="group-hover:animate-bounce" />}
            </button>
        </div>
    );
};

export default ChatWidget;