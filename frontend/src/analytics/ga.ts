// src/analytics/ga.ts
import ReactGA from 'react-ga4';

// Tu Measurement ID de Google Analytics
const MEASUREMENT_ID = 'G-WTLM3YZZRR';

// Inicializar GA
export const initGA = () => {
    if (!MEASUREMENT_ID) {
        console.warn('⚠️ Google Analytics Measurement ID no configurado');
        return;
    }
    ReactGA.initialize(MEASUREMENT_ID);
    console.log('✅ Google Analytics inicializado');
};

// Trackear página vista (se llama en cada cambio de ruta)
export const trackPageView = (path: string) => {
    ReactGA.send({ hitType: 'pageview', page: path });
};

// Trackear eventos personalizados
export const trackEvent = (action: string, params?: Record<string, any>) => {
    ReactGA.event({
        category: 'User Action',
        action,
        ...params,
    });
};