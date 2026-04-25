import React from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardBuilder } from '../components/dashboard';

const DashboardPage: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('pages.dashboard.title')}</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    {t('pages.dashboard.description')}
                </p>
            </div>

            <DashboardBuilder />
        </div>
    );
};

export default DashboardPage;
