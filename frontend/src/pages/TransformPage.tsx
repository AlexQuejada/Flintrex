import React from 'react';
import { useTranslation } from 'react-i18next';
import FileUpload from '../components/FileUpload';
import FileMerge from '../components/FileMerge';

const TransformPage: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('pages.transform.title')}</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    {t('pages.transform.description')}
                </p>
            </div>

            <FileUpload />

            <hr className="my-6" />

            <FileMerge />
        </div>
    );
};

export default TransformPage;
