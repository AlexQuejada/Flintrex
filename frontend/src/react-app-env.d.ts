/// <reference types="react-scripts" />

declare module '*.css' {
    const content: { [className: string]: string };
    export default content;
}

// src/globals.d.ts
interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
}

