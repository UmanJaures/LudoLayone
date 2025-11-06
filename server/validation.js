/**
 * Validation des données côté serveur
 * Prévient les mouvements invalides et la triche
 */

import { GAME_CONFIG, BASE_POSITIONS, HOME_POSITIONS, HOME_ENTRANCE, TURNING_POINTS } from './config.js';
import logger from './logger.js';

class Validator {
    /**
     * Valider un nom de joueur
     */
    static validatePlayerName(name) {
        if (!name || typeof name !== 'string') {
            return { valid: false, error: 'Player name must be a string' };
        }
        
        const trimmed = name.trim();
        if (trimmed.length < 1 || trimmed.length > 50) {
            return { valid: false, error: 'Player name must be 1-50 characters' };
        }
        
        // Empêcher les injections
        if (!/^[a-zA-Z0-9àâäçèéêëîïôûüœ\s\-']{1,50}$/.test(trimmed)) {
            return { valid: false, error: 'Player name contains invalid characters' };
        }
        
        return { valid: true, value: trimmed };
    }

    /**
     * Valider un ID de partie
     */
    static validateGameId(gameId) {
        if (!gameId || typeof gameId !== 'string') {
            return { valid: false, error: 'Invalid game ID' };
        }
        
        if (!/^[A-Z0-9]{4,6}$/.test(gameId)) {
            return { valid: false, error: 'Game ID format invalid' };
        }
        
        return { valid: true, value: gameId };
    }

    /**
     * Valider un numéro de pion
     */
    static validatePiece(piece) {
        if (typeof piece !== 'number') {
            return { valid: false, error: 'Piece must be a number' };
        }
        
        if (piece < 0 || piece >= GAME_CONFIG.TOTAL_PIECES) {
            return { valid: false, error: `Piece must be 0-${GAME_CONFIG.TOTAL_PIECES - 1}` };
        }
        
        return { valid: true, value: piece };
    }

    /**
     * Valider une position sur le plateau
     */
    static validatePosition(position, player) {
        const type = typeof position;
        
        if (type !== 'number') {
            return { valid: false, error: 'Position must be a number' };
        }
        
        // Cas spéciaux (passe ton tour)
        if (position === -1 || position === -2) {
            return { valid: true, value: position };
        }
        
        // Position plateau normal (0-51)
        if (position >= 0 && position <= 51) {
            return { valid: true, value: position };
        }
        
        // Position entrée maison
        if (player === 'P1' && position >= 100 && position <= 105) {
            return { valid: true, value: position };
        }
        if (player === 'P2' && position >= 200 && position <= 205) {
            return { valid: true, value: position };
        }
        
        // Position base
        if (player === 'P1' && position >= 500 && position <= 503) {
            return { valid: true, value: position };
        }
        if (player === 'P2' && position >= 600 && position <= 603) {
            return { valid: true, value: position };
        }
        
        return { valid: false, error: `Invalid position: ${position}` };
    }

    /**
     * Valider un coup de dé
     */
    static validateDiceValue(value) {
        if (typeof value !== 'number') {
            return { valid: false, error: 'Dice value must be a number' };
        }
        
        if (value < GAME_CONFIG.DICE_MIN || value > GAME_CONFIG.DICE_MAX) {
            return { valid: false, error: `Dice must be ${GAME_CONFIG.DICE_MIN}-${GAME_CONFIG.DICE_MAX}` };
        }
        
        return { valid: true, value };
    }

    /**
     * Valider le rôle d'un joueur
     */
    static validatePlayerRole(role) {
        const validRoles = ['P1', 'P2'];
        
        if (!validRoles.includes(role)) {
            return { valid: false, error: 'Invalid player role' };
        }
        
        return { valid: true, value: role };
    }

    /**
     * Valider un mouvement complet - CORRIGÉ
     */
    static validateMove(game, player, piece, newPosition, oldPosition) {
        // Valider le pion
        const pieceVal = this.validatePiece(piece);
        if (!pieceVal.valid) return pieceVal;
        
        // Valider la nouvelle position
        const posVal = this.validatePosition(newPosition, player);
        if (!posVal.valid) return posVal;
        
        // Vérifier que c'est le tour du joueur
        if (game.currentTurn !== player) {
            logger.warn('VALIDATOR', 'Move attempted out of turn', { player, currentTurn: game.currentTurn });
            return { valid: false, error: 'Not your turn' };
        }
        
        // Vérifier que la position actuelle du pion correspond
        if (game.positions[player][piece] !== oldPosition) {
            logger.warn('VALIDATOR', 'Position mismatch', {
                player,
                piece,
                expected: game.positions[player][piece],
                received: oldPosition
            });
            return { valid: false, error: 'Position mismatch (possible desync)' };
        }
        
        // Cas spécial: passe ton tour
        if (newPosition === -1 || newPosition === -2) {
            return { valid: true, value: newPosition };
        }
        
        return { valid: true, value: newPosition };
    }

    /**
     * Valider si un mouvement est possible avec le dé actuel
     */
    static validateMoveWithDice(game, player, piece, diceValue, currentPos, newPos) {
        // Vérifier si le pion peut sortir de la base
        const playerBase = BASE_POSITIONS[player];
        if (playerBase.includes(currentPos)) {
            if (diceValue !== 6) {
                return { valid: false, error: 'Need a 6 to leave base' };
            }
            return { valid: true };
        }
        
        // Vérifier si le mouvement dans l'entrée de maison est valide
        const homeEntrance = player === 'P1' ? HOME_ENTRANCE.P1 : HOME_ENTRANCE.P2;
        if (homeEntrance.includes(currentPos)) {
            const currentIndex = homeEntrance.indexOf(currentPos);
            const movesToHome = homeEntrance.length - currentIndex;
            
            if (diceValue > movesToHome) {
                return { valid: false, error: 'Dice value too high for home entrance' };
            }
        }
        
        return { valid: true };
    }
}

export default Validator;