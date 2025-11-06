/**
 * Mode de jeu pour 4 joueurs
 */

import { BASE_POSITIONS, HOME_POSITIONS, HOME_ENTRANCE, SAFE_POSITIONS } from '../constants/constants-4.js';

export class GameMode4 {
    static TOTAL_PLAYERS = 4;
    static PLAYERS = ['P1', 'P2', 'P3', 'P4'];

    /**
     * Vérifier si une position permet la capture
     */
    static canCaptureAtPosition(position, capturingPlayer) {
        if (SAFE_POSITIONS.includes(position)) {
            return false;
        }
        
        // Vérifier toutes les bases pour 4 joueurs
        if (BASE_POSITIONS.P1.includes(position) || 
            BASE_POSITIONS.P2.includes(position) ||
            BASE_POSITIONS.P3.includes(position) ||
            BASE_POSITIONS.P4.includes(position)) {
            return false;
        }
        
        // Vérifier toutes les entrées de maison pour 4 joueurs
        if (HOME_ENTRANCE.P1.includes(position) || 
            HOME_ENTRANCE.P2.includes(position) ||
            HOME_ENTRANCE.P3.includes(position) ||
            HOME_ENTRANCE.P4.includes(position)) {
            return false;
        }
        
        // Vérifier toutes les positions maison pour 4 joueurs
        if (position === HOME_POSITIONS.P1 || 
            position === HOME_POSITIONS.P2 ||
            position === HOME_POSITIONS.P3 ||
            position === HOME_POSITIONS.P4) {
            return false;
        }
        
        return true;
    }

    /**
     * Vérifier et gérer les captures
     */
    static checkAndHandleCapture(game, movingPlayer, newPosition) {
        let capturedPiece = null;

        if (!this.canCaptureAtPosition(newPosition, movingPlayer)) {
            return null;
        }

        // Vérifier tous les adversaires (4 joueurs)
        const adversaries = this.PLAYERS.filter(player => player !== movingPlayer);

        for (const adversary of adversaries) {
            for (let piece = 0; piece < 4; piece++) {
                if (game.positions[adversary][piece] === newPosition) {
                    capturedPiece = { 
                        player: adversary, 
                        piece: piece,
                        fromPosition: newPosition,
                        toPosition: BASE_POSITIONS[adversary][piece]
                    };
                    
                    console.log('CAPTURE', 'Piece captured', {
                        capturingPlayer: movingPlayer,
                        capturedPlayer: adversary,
                        capturedPiece: piece,
                        position: newPosition
                    });
                    
                    game.positions[adversary][piece] = BASE_POSITIONS[adversary][piece];
                    return capturedPiece; // Un seul pion peut être capturé
                }
            }
        }

        return null;
    }

    /**
     * Vérifier si un joueur a gagné
     */
    static checkWinner(game, player) {
        const allInHome = [0, 1, 2, 3].every(piece =>
            game.positions[player][piece] === HOME_POSITIONS[player]
        );

        if (allInHome) {
            game.state = 'finished';
            console.log('GAME', 'Game finished', { gameId: game.id, winner: player });
            return player;
        }

        return null;
    }

    /**
     * Obtenir le prochain joueur - CORRIGÉ POUR GÉRER LES JOUEURS INACTIFS
     */
    static getNextPlayer(currentPlayer, diceValue, hasMoved, activePlayers = null) {
        console.log('GameMode4.getNextPlayer called:', { 
            currentPlayer, 
            diceValue, 
            hasMoved, 
            activePlayers 
        });

        // ✅ CORRECTION : Rejoue seulement si 6 ET a bougé
        if (diceValue === 6 && hasMoved) {
            console.log('Player gets another turn (rolled 6 and moved)');
            return currentPlayer;
        }
        
        // ✅ CORRECTION CRITIQUE : Si on a la liste des joueurs actifs, l'utiliser
        // Sinon, utiliser tous les joueurs par défaut
        const availablePlayers = activePlayers || this.PLAYERS;
        
        const currentIndex = availablePlayers.indexOf(currentPlayer);
        
        // ✅ CORRECTION : Si le joueur actuel n'est pas dans la liste (a quitté), commencer au début
        let nextIndex;
        if (currentIndex === -1) {
            nextIndex = 0;
            console.log('Current player not in active list, starting from first player');
        } else {
            nextIndex = (currentIndex + 1) % availablePlayers.length;
        }
        
        const nextPlayer = availablePlayers[nextIndex];
        
        console.log('Turn passed to next player:', { 
            from: currentPlayer, 
            to: nextPlayer,
            currentIndex,
            nextIndex,
            availablePlayers
        });
        
        return nextPlayer;
    }

    /**
     * Initialiser les positions
     */
    static initializePositions() {
        return {
            P1: [...BASE_POSITIONS.P1],
            P2: [...BASE_POSITIONS.P2],
            P3: [...BASE_POSITIONS.P3],
            P4: [...BASE_POSITIONS.P4]
        };
    }

    /**
     * Valider si un joueur peut rejoindre
     */
    static canPlayerJoin(game) {
        return game.players.length < this.TOTAL_PLAYERS;
    }

    /**
     * Attribuer un rôle à un nouveau joueur
     */
    static assignPlayerRole(game) {
        const usedRoles = game.players.map(p => p.role);
        const availableRole = this.PLAYERS.find(role => !usedRoles.includes(role));
        return availableRole;
    }
}