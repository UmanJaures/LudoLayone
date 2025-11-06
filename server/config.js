/**
 * Configuration centralisée du projet Ludo
 * Contient toutes les constantes, paramètres et traductions
 */

// === MODE ENVIRONNEMENT ===
export const ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = ENV === 'production';
export const IS_DEVELOPMENT = ENV === 'development';

// === LOGS ===
export const LOG_LEVEL = process.env.LOG_LEVEL || (IS_PRODUCTION ? 'WARN' : 'DEBUG');
export const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    DEBUG: 2
};

// === SERVER ===
export const PORT = process.env.PORT || 3000;
export const HOSTNAME = process.env.SERVER_HOST || 'localhost';
export const USE_HTTPS = process.env.USE_HTTPS === 'true';
export const HTTPS_KEY = process.env.HTTPS_KEY_PATH || './certs/key.pem';
export const HTTPS_CERT = process.env.HTTPS_CERT_PATH || './certs/cert.pem';

// === GAME CONFIG ===
export const GAME_CONFIG = {
    TURN_TIMEOUT: 15000, // ms
    MAX_SPECTATORS_PER_GAME: 100,
    DICE_MIN: 1,
    DICE_MAX: 6,
    TOTAL_PIECES: 4,
    TOTAL_PLAYERS: 2,
};

// === POSITIONS (from constants.js) ===
export const HOME_POSITIONS = {
    P1: 105,
    P2: 205
};

export const HOME_ENTRANCE = {
    P1: [100, 101, 102, 103, 104],
    P2: [200, 201, 202, 203, 204]
};

export const BASE_POSITIONS = {
    P1: [500, 501, 502, 503],
    P2: [600, 601, 602, 603]
};

export const START_POSITIONS = {
    P1: 0,
    P2: 26
};

export const TURNING_POINTS = {
    P1: 50,
    P2: 24
};

// ✅ AJOUT : Cases sûres où on ne peut pas être capturé
export const SAFE_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47];

// === SOCKET.IO CONFIG ===
export const SOCKET_CONFIG = {
    cors: {
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST"]
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
};

// === ANIMATIONS (temps en ms) ===
export const ANIMATION_CONFIG = {
    PIECE_MOVE: 300,
    HOME_ENTRANCE: 400,
    CAPTURE_RETURN: 500,
    DICE_ROLL: 1000,
    TRANSITION: 500
};

// === MULTI-LANGUE ===
export const SUPPORTED_LANGUAGES = ['fr', 'en'];
export const DEFAULT_LANGUAGE = 'fr';

export const TRANSLATIONS = {
    fr: {
        // Erreurs
        ERROR_GAME_NOT_FOUND: 'Partie non trouvée',
        ERROR_GAME_FULL: 'Partie pleine',
        ERROR_SPECTATOR_LIMIT: 'Limite de spectateurs atteinte',
        ERROR_INVALID_PLAYER: 'Joueur invalide',
        ERROR_INVALID_MOVE: 'Mouvement invalide',
        ERROR_NOT_YOUR_TURN: "Ce n'est pas votre tour",
        ERROR_INVALID_PIECE: 'Pion invalide',
        ERROR_DICE_NOT_ROLLED: 'Le dé n\'a pas encore été lancé',
        ERROR_CONNECTION_LOST: 'Connexion perdue',
        
        // Messages
        MSG_GAME_CREATED: 'Partie créée avec succès',
        MSG_PLAYER_JOINED: 'a rejoint la partie',
        MSG_SPECTATOR_JOINED: 'a rejoint en tant que spectateur',
        MSG_SPECTATOR_LEFT: 'a quitté en tant que spectateur',
        MSG_PLAYER_DISCONNECTED: 'Joueur déconnecté',
        MSG_GAME_STARTED: 'Partie démarrée',
        MSG_TURN_CHANGED: 'Tour changé',
        MSG_PLAYER_WON: 'a gagné la partie',
        MSG_PIECE_MOVED: 'Pion déplacé',
        MSG_CAPTURE: 'Pion capturé',
    },
    en: {
        // Errors
        ERROR_GAME_NOT_FOUND: 'Game not found',
        ERROR_GAME_FULL: 'Game is full',
        ERROR_SPECTATOR_LIMIT: 'Spectator limit reached',
        ERROR_INVALID_PLAYER: 'Invalid player',
        ERROR_INVALID_MOVE: 'Invalid move',
        ERROR_NOT_YOUR_TURN: 'It\'s not your turn',
        ERROR_INVALID_PIECE: 'Invalid piece',
        ERROR_DICE_NOT_ROLLED: 'Dice hasn\'t been rolled yet',
        ERROR_CONNECTION_LOST: 'Connection lost',
        
        // Messages
        MSG_GAME_CREATED: 'Game created successfully',
        MSG_PLAYER_JOINED: 'joined the game',
        MSG_SPECTATOR_JOINED: 'joined as a spectator',
        MSG_SPECTATOR_LEFT: 'left as a spectator',
        MSG_PLAYER_DISCONNECTED: 'Player disconnected',
        MSG_GAME_STARTED: 'Game started',
        MSG_TURN_CHANGED: 'Turn changed',
        MSG_PLAYER_WON: 'won the game',
        MSG_PIECE_MOVED: 'Piece moved',
        MSG_CAPTURE: 'Piece captured',
    }
};

/**
 * Obtenir une traduction
 * @param {string} key - Clé de traduction
 * @param {string} lang - Langue (défaut: fr)
 * @returns {string}
 */
export function t(key, lang = DEFAULT_LANGUAGE) {
    if (!SUPPORTED_LANGUAGES.includes(lang)) {
        lang = DEFAULT_LANGUAGE;
    }
    return TRANSLATIONS[lang]?.[key] || key;
}