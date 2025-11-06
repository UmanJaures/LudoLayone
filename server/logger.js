/**
 * Logger centralisé - Gère tous les logs de l'application
 * Niveaux: ERROR, WARN, DEBUG
 */

import { LOG_LEVEL, LOG_LEVELS, IS_PRODUCTION } from './config.js';

class Logger {
    constructor() {
        this.level = LOG_LEVELS[LOG_LEVEL] || LOG_LEVELS.DEBUG;
        this.colors = {
            ERROR: '\x1b[31m', // Rouge
            WARN: '\x1b[33m',  // Jaune
            DEBUG: '\x1b[36m', // Cyan
            RESET: '\x1b[0m'
        };
    }

    /**
     * Formater le message avec timestamp et contexte
     */
    _format(level, context, message, data = null) {
        const timestamp = new Date().toISOString();
        const color = IS_PRODUCTION ? '' : this.colors[level];
        const reset = IS_PRODUCTION ? '' : this.colors.RESET;
        
        let formatted = `${color}[${timestamp}] [${level}] [${context}]${reset} ${message}`;
        
        if (data && Object.keys(data).length > 0) {
            formatted += ` ${JSON.stringify(data)}`;
        }
        
        return formatted;
    }

    /**
     * Logger ERROR - Erreurs critiques
     */
    error(context, message, data = null) {
        if (this.level >= LOG_LEVELS.ERROR) {
            console.error(this._format('ERROR', context, message, data));
        }
    }

    /**
     * Logger WARN - Avertissements
     */
    warn(context, message, data = null) {
        if (this.level >= LOG_LEVELS.WARN) {
            console.warn(this._format('WARN', context, message, data));
        }
    }

    /**
     * Logger DEBUG - Infos détaillées
     */
    debug(context, message, data = null) {
        if (this.level >= LOG_LEVELS.DEBUG) {
            console.log(this._format('DEBUG', context, message, data));
        }
    }

    /**
     * Raccourci pour les erreurs non capturées
     */
    fatal(context, message, error) {
        this.error(context, message, {
            errorName: error?.name,
            errorMessage: error?.message,
            stack: error?.stack
        });
    }
}

export default new Logger();