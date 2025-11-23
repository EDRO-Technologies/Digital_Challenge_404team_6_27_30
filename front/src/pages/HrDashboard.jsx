import React from 'react';
import { useSearchParams } from 'react-router-dom';
import UserAssignment from '../components/hr/UserAssignment';
import MentorAssignment from '../components/hr/MentorAssignment';

const HrDashboard = () => {
    const [searchParams] = useSearchParams();
    // Определяем активную вкладку из URL (по умолчанию 'users')
    const activeView = searchParams.get('view') || 'users';

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Заголовок страницы меняется в зависимости от вкладки */}
            <h1 className="text-2xl font-bold text-gray-800 px-2 md:px-0">
                {activeView === 'users' && "Управление сотрудниками"}
                {activeView === 'mentors' && "Назначение менторов"}
            </h1>

            {/* Контентная область */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
                <div className="p-6">
                    {activeView === 'users' && <UserAssignment />}
                    {activeView === 'mentors' && <MentorAssignment />}
                </div>
            </div>
        </div>
    );
};

export default HrDashboard;