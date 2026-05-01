// src/components/AnalyticsTracker.tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../analytics/ga';

export const AnalyticsTracker = () => {
    const location = useLocation();

    useEffect(() => {
        // Cada vez que cambia la ruta, se registra en GA
        const path = location.pathname + location.search;
        trackPageView(path);
    }, [location]);

    return null;
};