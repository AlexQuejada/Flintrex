import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './sidebar.css';

const Sidebar: React.FC<{ collapsed?: boolean; onCollapsedChange?: (collapsed: boolean) => void }> = ({
    collapsed: externalCollapsed,
    onCollapsedChange
}) => {
    const { t } = useTranslation();
    const [internalCollapsed, setInternalCollapsed] = useState(false);
    const collapsed = externalCollapsed ?? internalCollapsed;
    const location = useLocation();

    const navigation = [
        {
            name: t('sidebar.transform'),
            href: "/transform",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
            ),
        },
        {
            name: t('sidebar.dashboard'),
            href: "/dashboard",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
            ),
        },
        {
            name: t('sidebar.report'),
            href: "/report",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                </svg>
            ),
        },
    ];

    const toggleCollapse = () => {
        const newCollapsed = !collapsed;
        setInternalCollapsed(newCollapsed);
        onCollapsedChange?.(newCollapsed);
    };

    return (
        <div className={`sidebar-container ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-bg" />

            <div className="sidebar-content">
                <button
                    onClick={toggleCollapse}
                    className="sidebar-toggle"
                    title={collapsed ? t('common.expand') : t('common.collapse')}
                >
                    <svg
                        className="sidebar-icon"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                </button>

                <nav className="sidebar-nav">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`sidebar-link ${isActive ? 'active' : ''}`}
                            >
                                <span className="sidebar-link-icon">{item.icon}</span>
                                <span className="sidebar-link-text">{item.name}</span>
                                <span className="sidebar-tooltip">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
};

export default Sidebar;
