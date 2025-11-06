/**
 * OnlineLudo - Classe principale pour gérer le jeu en ligne (mode joueur)
 * Refactorisée avec logs centralisés et JSDoc
 * ADAPTÉ POUR 4 JOUEURS
 */

import { BASE_POSITIONS, HOME_ENTRANCE, HOME_POSITIONS, PLAYERS, SAFE_POSITIONS, START_POSITIONS, STATE, TURNING_POINTS } from './ludo/constants.js';
import { UI } from './ludo/UI.js';
import { clientLogger } from './ludo/constants-client.js';

export class OnlineLudo {
    /**
     * Constructeur
     * @param {OnlineManager} onlineManager
     * @param {string} playerRole - 'P1', 'P2', 'P3' ou 'P4'
     */
    constructor(onlineManager, playerRole) {
        this.onlineManager = onlineManager;
        this.playerRole = playerRole;
        this.isMyTurn = false;
        this.hasRolledSix = false;
        this.isInitialized = false;
        this.gameEnded = false;
        this.isResyncing = false;

        this.turnTimer = null;
        this.timeLeft = 15;

        this.currentPositions = {
            P1: [...BASE_POSITIONS.P1],
            P2: [...BASE_POSITIONS.P2],
            P3: [...BASE_POSITIONS.P3],
            P4: [...BASE_POSITIONS.P4] // ✅ NOUVEAU : Ajout du joueur P4
        };

        // ✅ AJOUT : Stocker les noms des joueurs
        this.playerNames = {
            P1: null,
            P2: null,
            P3: null,
            P4: null // ✅ NOUVEAU : Ajout du joueur P4
        };

        // ✅ AJOUT : Stocker l'état des joueurs actifs
        this.activePlayers = {
            P1: true,
            P2: true,
            P3: true,
            P4: true // ✅ NOUVEAU : Ajout du joueur P4
        };

        this._diceValue = 0;
        this._state = STATE.DICE_NOT_ROLLED;

        clientLogger.debug('OnlineLudo', 'Created', { role: playerRole });
        this.initializeGame();
    }

    /**
     * Initialiser le jeu
     * @private
     */
    initializeGame() {
        clientLogger.debug('OnlineLudo', 'Initializing game', { role: this.playerRole });

        window.handleDiceResult = this.handleRemoteDiceRoll.bind(this);
        window.handlePieceMoved = this.handleRemoteMove.bind(this);
        window.handleTurnChanged = this.handleTurnChange.bind(this);
        window.handleGameReady = this.handleGameReady.bind(this);
        window.handleGameWinner = this.handleGameWinner.bind(this);
        window.handlePlayerLeft = this.handlePlayerLeft.bind(this); // ✅ AJOUT

        this.resetUI();
        this.isInitialized = true;

        clientLogger.debug('OnlineLudo', 'Game initialized');
    }

    /**
     * ✅ NOUVELLE MÉTHODE : Gérer le départ d'un joueur
     */
    handlePlayerLeft(data) {
        clientLogger.debug('OnlineLudo', 'Player left handled', data);
        
        // Marquer le joueur comme inactif
        this.activePlayers[data.playerRole] = false;
        
        // Cacher ou désactiver les pions du joueur qui a quitté
        this.hidePlayerPieces(data.playerRole);
        
        // ✅ AJOUT : Si c'était le tour du joueur qui a quitté, on s'attend à un changement de tour automatique
        if (data.wasCurrentTurn) {
            clientLogger.debug('OnlineLudo', 'Waiting for automatic turn change after player left');
            // Le serveur devrait émettre un événement 'turn-changed' automatiquement
        }
        
        clientLogger.debug('OnlineLudo', 'Game continues with remaining players', {
            activePlayers: this.activePlayers,
            remaining: data.remainingPlayers,
            wasCurrentTurn: data.wasCurrentTurn
        });
    }

    /**
     * ✅ NOUVELLE MÉTHODE : Cacher les pions d'un joueur qui a quitté
     */
    hidePlayerPieces(playerRole) {
        [0, 1, 2, 3].forEach(piece => {
            const pieceElement = document.querySelector(`.player-piece[player-id="${playerRole}"][piece="${piece}"]`);
            if (pieceElement) {
                pieceElement.style.opacity = '0.3';
                pieceElement.style.pointerEvents = 'none';
                pieceElement.title = `${playerRole} a quitté la partie`;
                
                // ✅ AJOUT : Ajouter une classe CSS pour un style spécifique
                pieceElement.classList.add('player-left');
            }
        });
        
        // ✅ AJOUT : Mettre à jour visuellement le statut du joueur
        this.updatePlayerStatusDisplay(playerRole, false);
    }

    /**
     * ✅ NOUVELLE MÉTHODE : Mettre à jour l'affichage du statut du joueur
     */
    updatePlayerStatusDisplay(playerRole, isActive) {
        // Vous pouvez ajouter ici une logique pour mettre à jour l'UI
        // Par exemple, mettre à jour un indicateur visuel que le joueur a quitté
        clientLogger.debug('OnlineLudo', 'Player status updated', { 
            player: playerRole, 
            active: isActive 
        });
    }

    /**
     * ✅ NOUVELLE MÉTHODE : Gérer l'événement de victoire du serveur
     * @private
     */
    handleGameWinner(data) {
        clientLogger.debug('OnlineLudo', 'Game winner event received', data);

        if (this.gameEnded) {
            clientLogger.warn('OnlineLudo', 'Game already ended, ignoring duplicate winner event');
            return;
        }

        this.gameEnded = true;
        this.stopTurnTimer();
        
        const isCurrentPlayer = this.playerRole === data.winner;
        const winnerName = data.winnerName || this.playerNames[data.winner] || data.winner;
        const winType = data.winType || 'normal'; // ✅ AJOUT : Type de victoire
        
        clientLogger.debug('OnlineLudo', 'Displaying winner popup', { 
            winnerName, 
            isCurrentPlayer,
            winner: data.winner,
            playerRole: this.playerRole,
            winType // ✅ AJOUT
        });
        
        // ✅ AJOUT : Message spécial pour victoire par abandon
        let message;
        if (winType === 'abandon') {
            if (isCurrentPlayer) {
                message = `FÉLICITATIONS ! Vous avez gagné par abandon de vos adversaires ! 🏆\n\nLes autres joueurs ont quitté la partie.`;
            } else {
                message = `${winnerName} a gagné par abandon ! 🏆\n\nLes autres joueurs ont quitté la partie.`;
            }
        } else {
            if (isCurrentPlayer) {
                message = 'FÉLICITATIONS ! Vous avez gagné la partie ! 🏆';
            } else {
                message = `${winnerName} a gagné la partie ! 🏆`;
            }
        }
        
        UI.showWinnerPopup(winnerName, isCurrentPlayer, message); // ✅ MODIFICATION
        this.disableMyTurn();
        UI.disableDice();
        UI.unhighlightPieces();
    }

    /**
     * Gérer le signal "game-ready" du serveur
     * @private
     */
    handleGameReady(data) {
        clientLogger.debug('OnlineLudo', 'Game ready received', data);
        
        // ✅ AJOUT : Stocker les noms des joueurs
        if (data.players && Array.isArray(data.players)) {
            data.players.forEach(player => {
                if (player.role && player.name) {
                    this.playerNames[player.role] = player.name;
                }
            });
            clientLogger.debug('OnlineLudo', 'Player names stored', this.playerNames);
        }
    }

    /**
     * Gérer le dé lancé
     * @private
     */
    handleRemoteDiceRoll(data) {
        clientLogger.debug('OnlineLudo', 'Dice rolled', { value: data.value });

        this._diceValue = data.value;
        UI.setDiceValue(data.value);

        if (data.player === this.playerRole) {
            this.hasRolledSix = (data.value === 6);
            this.state = STATE.DICE_ROLLED;
            this.checkForEligiblePieces();
            this.startTurnTimer();
        } else {
            this.state = STATE.DICE_ROLLED;
            this.disableMyTurn();
        }
    }

    /**
     * Gérer le mouvement d'un pion distant - CORRIGÉ
     * @private
     */
    handleRemoteMove(data) {
        clientLogger.debug('OnlineLudo', 'Remote move', { 
            player: data.player, 
            piece: data.piece,
            newPosition: data.newPosition,
            captured: data.captured
        });

        if (this.gameEnded) return;

        const oldPosition = this.currentPositions[data.player][data.piece];

        // ✅ CORRECTION : Mettre à jour la position IMMÉDIATEMENT
        this.currentPositions[data.player][data.piece] = data.newPosition;

        if (data.newPosition === -1 || data.newPosition === -2) {
            return;
        }

        const isHomeEntrance = this.isEnteringHomeEntrance(data.player, data.piece, data.newPosition, oldPosition);
        const isExitingBase = BASE_POSITIONS[data.player].includes(oldPosition) && data.newPosition === START_POSITIONS[data.player];

        clientLogger.debug('OnlineLudo', 'Remote move animation', {
            player: data.player,
            piece: data.piece,
            oldPosition,
            newPosition: data.newPosition,
            isHomeEntrance,
            isExitingBase
        });

        // Animation pour TOUS les joueurs
        if (isHomeEntrance) {
            UI.animateHomeEntrance(data.player, data.piece, oldPosition, data.newPosition)
                .catch(error => {
                    clientLogger.error('OnlineLudo', 'Animation error', { error: error.message });
                    UI.setPiecePosition(data.player, data.piece, data.newPosition);
                });
        } else if (isExitingBase) {
            UI.animateBaseExit(data.player, data.piece, oldPosition, data.newPosition)
                .catch(error => {
                    clientLogger.error('OnlineLudo', 'Animation error', { error: error.message });
                    UI.setPiecePosition(data.player, data.piece, data.newPosition);
                });
        } else {
            UI.animatePieceMovement(data.player, data.piece, oldPosition, data.newPosition, this._diceValue || 1)
                .catch(error => {
                    clientLogger.error('OnlineLudo', 'Animation error', { error: error.message });
                    UI.setPiecePosition(data.player, data.piece, data.newPosition);
                });
        }

        // ✅ CORRECTION : Utiliser la capture du serveur plutôt que la détection locale
        if (data.captured) {
            this.handleCaptureFromServer(data.captured);
        }
    }

    /**
     * Gérer la capture provenant du serveur - NOUVELLE MÉTHODE
     * @private
     */
    handleCaptureFromServer(captureData) {
        clientLogger.debug('OnlineLudo', 'Capture from server', captureData);

        const { player, piece, fromPosition, toPosition } = captureData;
        
        // Mettre à jour la position du pion capturé
        this.currentPositions[player][piece] = toPosition;

        // Animation de retour à la base
        UI.animateCaptureReturn(player, piece, fromPosition, toPosition)
            .catch(error => {
                clientLogger.error('OnlineLudo', 'Capture animation error', { error: error.message });
                UI.setPiecePosition(player, piece, toPosition);
            });
    }

    /**
     * Vérifier si un joueur a gagné
     * @private
     */
    checkForWinner(player) {
        if (this.hasPlayerWon(player)) {
            clientLogger.debug('OnlineLudo', 'Winner found', { player });

            this.gameEnded = true;
            this.stopTurnTimer();
            
            // ✅ MODIFICATION : Passer le nom du joueur au lieu du role
            const winnerName = this.playerNames[player] || player;
            const isCurrentPlayer = this.playerRole === player;
            
            UI.showWinnerPopup(winnerName, isCurrentPlayer);
            this.disableMyTurn();
            UI.disableDice();
            UI.unhighlightPieces();
        }
    }

    /**
     * Vérifier si un joueur a gagné
     * @private
     */
    hasPlayerWon(player) {
        return [0, 1, 2, 3].every(piece =>
            this.currentPositions[player][piece] === HOME_POSITIONS[player]
        );
    }

    /**
     * Vérifier les captures possibles (pour highlight des pions)
     * @private
     */
    checkForCaptures(player, piece, newPosition) {
        if (SAFE_POSITIONS.includes(newPosition) ||
            BASE_POSITIONS.P1.includes(newPosition) ||
            BASE_POSITIONS.P2.includes(newPosition) ||
            BASE_POSITIONS.P3.includes(newPosition) ||
            BASE_POSITIONS.P4.includes(newPosition) || // ✅ NOUVEAU : Ajout P4
            Object.values(HOME_ENTRANCE.P1).includes(newPosition) ||
            Object.values(HOME_ENTRANCE.P2).includes(newPosition) ||
            Object.values(HOME_ENTRANCE.P3).includes(newPosition) ||
            Object.values(HOME_ENTRANCE.P4).includes(newPosition) || // ✅ NOUVEAU : Ajout P4
            newPosition === HOME_POSITIONS.P1 ||
            newPosition === HOME_POSITIONS.P2 ||
            newPosition === HOME_POSITIONS.P3 ||
            newPosition === HOME_POSITIONS.P4) { // ✅ NOUVEAU : Ajout P4
            return null;
        }

        // ✅ MODIFICATION : Gérer 4 adversaires possibles
        const adversaries = PLAYERS.filter(p => p !== player);

        for (const adversary of adversaries) {
            for (let i = 0; i < 4; i++) {
                if (this.currentPositions[adversary][i] === newPosition) {
                    return { player: adversary, piece: i };
                }
            }
        }

        return null;
    }

    /**
     * Gérer le changement de tour
     * @private
     */
    handleTurnChange(currentPlayer) {
        clientLogger.debug('OnlineLudo', 'Turn changed', { player: currentPlayer });

        if (!this.isInitialized || this.gameEnded) return;

        this.isMyTurn = (currentPlayer === this.playerRole);
        // ✅ MODIFICATION : Gérer 4 joueurs pour l'index du tour
        const turnIndex = PLAYERS.indexOf(currentPlayer);
        UI.setTurn(turnIndex);

        if (this.isMyTurn) {
            this.enableMyTurn();
            this.startTurnTimer();
        } else {
            this.disableMyTurn();
        }
    }

    /**
     * Activer mon tour
     * @private
     */
    enableMyTurn() {
        clientLogger.debug('OnlineLudo', 'My turn enabled');
        this.isMyTurn = true;
        this.state = STATE.DICE_NOT_ROLLED;
        UI.enableDice();
    }

    /**
     * Désactiver mon tour
     * @private
     */
    disableMyTurn() {
        clientLogger.debug('OnlineLudo', 'My turn disabled');
        this.isMyTurn = false;
        this.state = STATE.DICE_ROLLED;
        UI.disableDice();
        UI.unhighlightPieces();
        this.stopTurnTimer();
    }

    /**
     * Clic sur le dé
     */
    onDiceClick() {
        if (this.gameEnded || !this.isMyTurn || this.state !== STATE.DICE_NOT_ROLLED) {
            return;
        }

        clientLogger.debug('OnlineLudo', 'Dice clicked');
        this.stopTurnTimer();
        this.onlineManager.sendDiceRoll();
        UI.disableDice();
    }

    /**
     * Clic sur un pion
     */
    onPieceClick(player, piece) {
        if (this.gameEnded || !this.isMyTurn || player !== this.playerRole || this.state !== STATE.DICE_ROLLED) {
            return;
        }

        clientLogger.debug('OnlineLudo', 'Piece clicked', { player, piece });

        const currentPosition = this.currentPositions[player][piece];

        // Validation de la position
        if (currentPosition === undefined || currentPosition === null) {
            clientLogger.error('OnlineLudo', 'Invalid current position', { player, piece, currentPosition });
            return;
        }

        // Vérifier que la position locale correspond
        if (this.isPositionInBase(player, piece) && this._diceValue !== 6) {
            clientLogger.warn('OnlineLudo', 'Cannot leave base without 6', { dice: this._diceValue });
            return;
        }

        // Calcul de la nouvelle position
        let newPosition;
        let isExitingBase = false;

        if (BASE_POSITIONS[player].includes(currentPosition)) {
            if (this._diceValue === 6) {
                newPosition = START_POSITIONS[player];
                isExitingBase = true;
                clientLogger.debug('OnlineLudo', 'Piece exiting base', { piece, newPosition });
            } else {
                return;
            }
        } else {
            newPosition = this.getIncrementedPosition(player, piece, this._diceValue);
            
            if (newPosition === currentPosition) {
                clientLogger.warn('OnlineLudo', 'Invalid move - position unchanged');
                return;
            }
        }

        clientLogger.debug('OnlineLudo', 'Move calculation', {
            player, piece, currentPosition, newPosition, dice: this._diceValue,
            isExitingBase
        });

        // Vérifications de sécurité
        if (newPosition === undefined || newPosition === null) {
            clientLogger.error('OnlineLudo', 'Invalid new position calculated');
            return;
        }

        UI.disableDice();
        UI.unhighlightPieces();

        const capturedPiece = this.checkForCaptures(player, piece, newPosition);
        const willCapture = capturedPiece !== null;

        // Envoyer le mouvement au serveur
        this.onlineManager.sendPieceMove(player, piece, newPosition, currentPosition, willCapture);
        
        this.stopTurnTimer();

        clientLogger.debug('OnlineLudo', 'Move sent to server');
    }

    /**
     * Vérifier si un pion est en base
     * @private
     */
    isPositionInBase(player, piece) {
        return BASE_POSITIONS[player].includes(this.currentPositions[player][piece]);
    }

    /**
     * Vérifier si le pion entre dans l'entrée de la maison
     * @private
     */
    isEnteringHomeEntrance(player, piece, newPosition, oldPosition = null) {
        const homeEntrances = HOME_ENTRANCE[player];
        oldPosition = oldPosition || this.currentPositions[player][piece];

        return homeEntrances.includes(newPosition) && !homeEntrances.includes(oldPosition);
    }

    /**
     * Calculer la nouvelle position du pion
     * @private
     */
    getIncrementedPosition(player, piece, moveBy) {
        let currentPosition = this.currentPositions[player][piece];

        clientLogger.debug('OnlineLudo', 'Calculating position', {
            player, piece, currentPosition, moveBy
        });

        // Si le pion est en base, retourner la position de départ
        if (BASE_POSITIONS[player].includes(currentPosition)) {
            return START_POSITIONS[player];
        }

        // Si le pion est dans l'entrée de la maison
        if (HOME_ENTRANCE[player].includes(currentPosition)) {
            const entranceIndex = HOME_ENTRANCE[player].indexOf(currentPosition);
            const newIndex = entranceIndex + moveBy;

            if (newIndex < HOME_ENTRANCE[player].length) {
                return HOME_ENTRANCE[player][newIndex];
            } else if (newIndex === HOME_ENTRANCE[player].length) {
                return HOME_POSITIONS[player];
            } else {
                return currentPosition;
            }
        }

        // Si le pion est déjà à la maison
        if (currentPosition === HOME_POSITIONS[player]) {
            return currentPosition;
        }

        // Mouvement normal sur le plateau
        let finalPosition = currentPosition;

        for (let i = 0; i < moveBy; i++) {
            if (finalPosition === TURNING_POINTS[player]) {
                finalPosition = HOME_ENTRANCE[player][0];
            } else if (finalPosition === 51) {
                finalPosition = 0;
            } else if (finalPosition >= 0 && finalPosition < 51) {
                finalPosition += 1;
            } else {
                break;
            }
        }

        return finalPosition;
    }

    /**
     * Récupérer les pions jouables
     * @private
     */
    checkForEligiblePieces() {
        const eligiblePieces = this.getEligiblePieces(this.playerRole);
        clientLogger.debug('OnlineLudo', 'Eligible pieces', { pieces: eligiblePieces });

        if (eligiblePieces.length) {
            UI.highlightPieces(this.playerRole, eligiblePieces);
        } else {
            clientLogger.debug('OnlineLudo', 'No eligible pieces, passing turn');
            this.sendPassTurn();
        }
    }

    /**
     * Déterminer les pions jouables
     * @private
     */
    getEligiblePieces(player) {
        return [0, 1, 2, 3].filter(piece => {
            const currentPosition = this.currentPositions[player][piece];

            // Validation de la position
            if (currentPosition === undefined || currentPosition === null) {
                return false;
            }

            // Déjà à la maison
            if (currentPosition === HOME_POSITIONS[player]) {
                return false;
            }

            // En base - besoin d'un 6 pour sortir
            if (BASE_POSITIONS[player].includes(currentPosition)) {
                return this._diceValue === 6;
            }

            // En entrée de maison
            if (HOME_ENTRANCE[player].includes(currentPosition)) {
                const entranceIndex = HOME_ENTRANCE[player].indexOf(currentPosition);
                const movesToHome = HOME_ENTRANCE[player].length - entranceIndex;
                return this._diceValue <= movesToHome;
            }

            // Tous les autres cas (en jeu normal)
            return true;
        });
    }

    /**
     * Envoyer "passe ton tour"
     * @private
     */
    sendPassTurn() {
        clientLogger.debug('OnlineLudo', 'Passing turn');
        this.onlineManager.sendPieceMove(this.playerRole, 0, -1);
        this.stopTurnTimer();
        UI.unhighlightPieces();
    }

    /**
     * Envoyer "passe ton tour" automatique
     * @private
     */
    sendAutoPassTurn() {
        clientLogger.debug('OnlineLudo', 'Auto pass turn (timeout)');
        this.onlineManager.sendPieceMove(this.playerRole, 0, -2);
        this.stopTurnTimer();
        UI.unhighlightPieces();
    }

    /**
     * Réinitialiser l'UI
     * @private
     */
    resetUI() {
        PLAYERS.forEach(player => {
            [0, 1, 2, 3].forEach(piece => {
                UI.setPiecePosition(player, piece, this.currentPositions[player][piece]);
            });
        });
        UI.resetPositionMap();
    }

    /**
     * Démarrer le timer du tour
     * @private
     */
    startTurnTimer() {
        this.stopTurnTimer();
        this.timeLeft = 15;
        UI.updateTimer(this.timeLeft);

        this.turnTimer = setInterval(() => {
            this.timeLeft--;
            UI.updateTimer(this.timeLeft);

            if (this.timeLeft <= 0) {
                clientLogger.warn('OnlineLudo', 'Turn timeout');
                this.stopTurnTimer();

                if (this.state === STATE.DICE_ROLLED) {
                    UI.unhighlightPieces();
                    this.sendPassTurn();
                } else if (this.state === STATE.DICE_NOT_ROLLED) {
                    this.sendAutoPassTurn();
                }
            }
        }, 1000);
    }

    /**
     * Arrêter le timer du tour
     * @private
     */
    stopTurnTimer() {
        if (this.turnTimer) {
            clearInterval(this.turnTimer);
            this.turnTimer = null;
        }
    }

    /**
     * Resynchroniser avec l'état du serveur
     */
    resyncWithServer(gameState) {
        clientLogger.debug('OnlineLudo', 'Resyncing with server state', {
            clientPositions: this.currentPositions,
            serverPositions: gameState.positions
        });

        this.isResyncing = true;

        // Mettre à jour les positions avec validation
        if (gameState.positions && gameState.positions.P1 && gameState.positions.P2 && gameState.positions.P3 && gameState.positions.P4) {
            this.currentPositions.P1 = [...gameState.positions.P1];
            this.currentPositions.P2 = [...gameState.positions.P2];
            this.currentPositions.P3 = [...gameState.positions.P3];
            this.currentPositions.P4 = [...gameState.positions.P4]; // ✅ NOUVEAU : Ajout P4
        } else {
            clientLogger.error('OnlineLudo', 'Invalid game state for resync', gameState);
            this.isResyncing = false;
            return;
        }

        // Mettre à jour l'UI
        this.resetUI();

        // Mettre à jour le tour si nécessaire
        if (gameState.currentTurn) {
            const isNowMyTurn = (gameState.currentTurn === this.playerRole);
            if (this.isMyTurn !== isNowMyTurn) {
                this.isMyTurn = isNowMyTurn;
                if (this.isMyTurn) {
                    this.enableMyTurn();
                } else {
                    this.disableMyTurn();
                }
            }
        }

        this.isResyncing = false;

        clientLogger.debug('OnlineLudo', 'Resync completed');
    }

    get state() {
        return this._state;
    }

    set state(value) {
        this._state = value;
        clientLogger.debug('OnlineLudo', 'State changed', { state: value });
    }
}