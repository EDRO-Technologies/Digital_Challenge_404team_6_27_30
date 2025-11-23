import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Check, X, AlertCircle } from 'lucide-react';
import { fetcher } from '../lib/api';

const QuizPage = () => {
    const { taskId } = useParams(); // В роуте у нас /quiz/:taskId - это ID Квиза на самом деле
    // Поправка: URL /quiz/:quizId?taskId=... чтобы знать какой таск закрыть?
    // Но backend закрывает таск автоматически если мы привязали квиз.
    // Давайте считать что параметр URL это quizId.
    const quizId = taskId; 
    
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [answers, setAnswers] = useState([]); // [{question_id, selected_option_id}]
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadQuiz = async () => {
            try {
                const data = await fetcher(`/quizzes/${quizId}`);
                setQuiz(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadQuiz();
    }, [quizId]);

    const handleNext = async () => {
        // Сохраняем ответ
        const currentQ = quiz.questions[currentStep];
        const newAnswers = [...answers, { 
            question_id: currentQ.id, 
            selected_option_id: selectedOption 
        }];
        setAnswers(newAnswers);

        if (currentStep < quiz.questions.length - 1) {
            setCurrentStep(curr => curr + 1);
            setSelectedOption(null);
        } else {
            // Финиш - отправляем на сервер
            try {
                const res = await fetcher(`/quizzes/${quizId}/submit`, {
                    method: 'POST',
                    body: JSON.stringify({ answers: newAnswers })
                });
                setResult(res);
            } catch (e) {
                alert("Ошибка отправки: " + e.message);
            }
        }
    };

    if (loading) return <div className="p-10 text-center">Загрузка теста...</div>;
    if (!quiz) return <div className="p-10 text-center">Тест не найден</div>;

    if (result) {
        const isPassed = result.passed;
        const percentage = Math.round(result.score * 100);

        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-white/50 animate-in zoom-in duration-300">
                    <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6 ${isPassed ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}>
                        {isPassed ? <Check size={40} strokeWidth={4} /> : <X size={40} strokeWidth={4} />}
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        {isPassed ? "Тест сдан!" : "Тест не сдан"}
                    </h2>
                    <p className="text-gray-500 mb-6">
                        Результат: <span className={`font-bold ${isPassed ? 'text-green-600' : 'text-red-500'}`}>{percentage}%</span>
                        <br/>
                        {result.message}
                    </p>

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => navigate('/app/track')}
                            className="w-full py-3 bg-gazprom-blue text-white rounded-xl font-bold shadow-lg hover:bg-blue-600 transition"
                        >
                            Вернуться к треку
                        </button>
                        {!isPassed && (
                            <button 
                                onClick={() => window.location.reload()}
                                className="w-full py-3 bg-blue-50 text-gazprom-blue rounded-xl font-bold hover:bg-blue-100 transition"
                            >
                                Попробовать еще раз
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const question = quiz.questions[currentStep];

    return (
        <div className="max-w-2xl mx-auto mt-10">
            {/* Прогресс бар */}
            <div className="mb-8">
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>Вопрос {currentStep + 1} из {quiz.questions.length}</span>
                    <span>{quiz.title}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gazprom-blue transition-all duration-500 ease-out"
                        style={{ width: `${((currentStep + 1) / quiz.questions.length) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* Карточка вопроса */}
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-white/60">
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                    {question.text}
                </h2>

                <div className="space-y-3">
                    {question.options.map((opt) => (
                        <div 
                            key={opt.id}
                            onClick={() => setSelectedOption(opt.id)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between
                                ${selectedOption === opt.id 
                                    ? 'border-gazprom-blue bg-blue-50 text-gazprom-blue shadow-md scale-[1.02]' 
                                    : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'}`}
                        >
                            <span className="font-medium">{opt.text}</span>
                            {selectedOption === opt.id && <div className="w-4 h-4 bg-gazprom-blue rounded-full"></div>}
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex justify-end">
                    <button 
                        onClick={handleNext}
                        disabled={!selectedOption}
                        className="px-8 py-3 bg-gazprom-blue text-white rounded-xl font-bold shadow-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {currentStep === quiz.questions.length - 1 ? "Завершить" : "Далее"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuizPage;