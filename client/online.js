/**
 * OnlineManager - Gère la connexion Socket.io avec le serveur
 * MODIFIÉ POUR ENVOYER LE GAME MODE
 */

import { io } from 'https://cdn.socket.io/4.7.5/socket.io.esm.min.js';

export class OnlineManager {
    constructor() {
        this.socket = io();
        this.gameId = null;
        this.playerId = null;
        this.isSpectator = false;
        
        this.setupSocketListeners();
    }

    setPlayerId(playerId) {
        this.playerId = playerId;
    }

    getPlayerId() {
        return this.playerId;
    }

    setGameId(gameId) {
        this.gameId = gameId;
    }

    getGameId() {
        return this.gameId;
    }

    getSocket() {
        return this.socket;
    }

    setIsSpectator(isSpectator) {
        this.isSpectator = isSpectator;
    }

    getIsSpectator() {
        return this.isSpectator;
    }

    createGame(playerName) {
        // ✅ MODIFICATION : Envoyer le gameMode 2
        this.socket.emit('create-game', { playerName, gameMode: 2 });
    }

    joinGame(gameId, playerName) {
        this.socket.emit('join-game', { gameId, playerName });
        this.setPlayerId('P2');
        this.setGameId(gameId);
    }

    watchGame(gameId, spectatorName) {
        this.socket.emit('watch-game', { gameId, spectatorName });
        this.setIsSpectator(true);
        this.setGameId(gameId);
    }

    sendDiceRoll() {
        if (!this.gameId) {
            console.error('Cannot send dice: gameId missing');
            return;
        }
        
        this.socket.emit('roll-dice', this.gameId);
    }

    sendPieceMove(player, piece, newPosition, oldPosition, captured = false) {
        if (!this.gameId) {
            console.error('Cannot send move: gameId missing');
            return;
        }
        
        this.socket.emit('move-piece', {
            gameId: this.gameId,
            player,
            piece,
            newPosition,
            oldPosition,
            captured
        });
    }

    connect() {
        // Connexion établie automatiquement par le constructeur
    }

    setupSocketListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('disconnect', () => {
            console.warn('Disconnected from server');
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error.message);
        });

        // Gestion de la resynchronisation
        this.socket.on('position_mismatch', (data) => {
            console.warn('Position mismatch received');
            this.socket.emit('request_game_state', {
                gameId: this.gameId,
                playerId: this.playerId
            });
        });

        this.socket.on('game_state', (data) => {
            if (window.onlineLudoGame && window.onlineLudoGame.resyncWithServer) {
                window.onlineLudoGame.resyncWithServer(data.gameState);
            }
        });

        this.socket.on('game-created', (data) => {
            this.setPlayerId(data.player);
            this.setGameId(data.gameId);
            if (window.handleGameCreated) window.handleGameCreated(data);
        });

        this.socket.on('game-ready', (data) => {
            if (!this.playerId) {
                this.setPlayerId('P2');
            }
            if (window.handleGameReady) window.handleGameReady(data);
        });

        this.socket.on('spectate-mode', (data) => {
            if (window.handleSpectateMode) window.handleSpectateMode(data);
        });

        this.socket.on('spectators-count', (data) => {
            if (window.handleSpectatorsUpdate) window.handleSpectatorsUpdate(data);
        });

        this.socket.on('spectator-move', (data) => {
            if (window.handleSpectatorMove) window.handleSpectatorMove(data);
        });

        this.socket.on('dice-rolled', (data) => {
            if (window.handleDiceResult) window.handleDiceResult(data);
        });

        this.socket.on('piece-moved', (data) => {
            if (window.handlePieceMoved) window.handlePieceMoved(data);
        });

        this.socket.on('turn-changed', (currentPlayer) => {
            if (window.handleTurnChanged) window.handleTurnChanged(currentPlayer);
        });

        this.socket.on('player-joined', (data) => {
            if (window.handlePlayerJoined) window.handlePlayerJoined(data);
        });

        this.socket.on('game-winner', (data) => {
            if (window.handleGameWinner) {
                window.handleGameWinner(data);
            } else {
                console.error('window.handleGameWinner is not defined');
            }
        });
    }
}