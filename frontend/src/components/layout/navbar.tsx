import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import LanguageSelector from './LanguageSelector';
import './navbar.css';

interface NavbarProps {
    collapsed?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ collapsed }) => {
    const { theme, toggleTheme } = useTheme();
    const { t } = useTranslation();

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <div className="navbar-brand">
                    <img src="/IconFLintres.png" alt="FlintrexBETA" className="navbar-logo" />
                    <span className={`navbar-brand-text ${collapsed ? 'hidden' : ''}`}>
                        {t('nav.brand')}
                    </span>
                </div>
                <div className="navbar-actions">
                    <span className="navbar-subtitle">{t('nav.subtitle')}</span>
                    <LanguageSelector />
                    <button
                        onClick={toggleTheme}
                        className="navbar-theme-btn"
                        title={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
                    >
                        {theme === 'dark' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                                <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
