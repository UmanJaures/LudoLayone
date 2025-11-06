/**
 * Constantes partagées côté client
 * À utiliser dans main.js, online.js, onlineLudo.js, etc.
 */

// === LOG LEVELS ===
export const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    DEBUG: 2
};

// === CONFIG ===
export const CLIENT_CONFIG = {
    LOG_LEVEL: 'DEBUG', // À changer en 'WARN' pour production
    TURN_TIMEOUT: 15, // secondes
    ANIMATION_DELAY_SPECTATE: 100, // ms avant de passer les données spectateur
};

/**
 * Logger client simplifié
 */
export class ClientLogger {
    constructor(level = CLIENT_CONFIG.LOG_LEVEL) {
        this.level = LOG_LEVELS[level] || LOG_LEVELS.DEBUG;
    }

    error(context, message, data = null) {
        if (this.level >= LOG_LEVELS.ERROR) {
            console.error(`[ERROR] [${context}] ${message}`, data || '');
        }
    }

    warn(context, message, data = null) {
        if (this.level >= LOG_LEVELS.WARN) {
            console.warn(`[WARN] [${context}] ${message}`, data || '');
        }
    }

    debug(context, message, data = null) {
        if (this.level >= LOG_LEVELS.DEBUG) {
            console.log(`[DEBUG] [${context}] ${message}`, data || '');
        }
    }
}

// Instance globale
export const clientLogger = new ClientLogger();