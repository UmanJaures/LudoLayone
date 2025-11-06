/**
 * OnlineManager - Gère la connexion Socket.io avec le serveur
 * VERSION 2 JOUEURS - CORRIGÉE POUR LA PRODUCTION
 */

import { io } from 'https://cdn.socket.io/4.7.5/socket.io.esm.min.js';

export class OnlineManager {
    constructor() {
        // ✅ CORRECTION : URL dynamique pour production
        const socketUrl = window.location.origin;
        this.socket = io(socketUrl, {
            timeout: 10000,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });
        
        this.gameId = null;
        this.playerId = null;
        this.isSpectator = false;
        
        console.log(`🎮 OnlineManager V2 - URL: ${socketUrl}`);
        this.setupSocketListeners();
    }

    setPlayerId(playerId) {
        this.playerId = playerId;
        console.log(`👤 Player ID défini: ${playerId}`);
    }

    getPlayerId() {
        return this.playerId;
    }

    setGameId(gameId) {
        this.gameId = gameId;
        console.log(`🎯 Game ID défini: ${gameId}`);
    }

    getGameId() {
        return this.gameId;
    }

    getSocket() {
        return this.socket;
    }

    setIsSpectator(isSpectator) {
        this.isSpectator = isSpectator;
        console.log(`👁️ Mode spectateur: ${isSpectator}`);
    }

    getIsSpectator() {
        return this.isSpectator;
    }

    createGame(playerName) {
        // ✅ VERSION 2 JOUEURS
        this.socket.emit('create-game', { playerName, gameMode: 2 });
        console.log(`🔄 Création partie V2 - Joueur: ${playerName}`);
    }

    joinGame(gameId, playerName) {
        this.socket.emit('join-game', { gameId, playerName });
        // ✅ CORRECTION : Plus de rôle hardcodé
        this.setGameId(gameId);
        console.log(`🔗 Rejoindre partie V2: ${gameId} - Joueur: ${playerName}`);
    }

    watchGame(gameId, spectatorName) {
        this.socket.emit('watch-game', { gameId, spectatorName });
        this.setIsSpectator(true);
        this.setGameId(gameId);
        console.log(`👁️ Spectateur V2: ${spectatorName}`);
    }

    sendDiceRoll() {
        if (!this.gameId) {
            console.error('❌ Cannot send dice: gameId missing');
            return;
        }
        
        console.log(`🎲 Lancer dé V2 - Partie: ${this.gameId}`);
        this.socket.emit('roll-dice', this.gameId);
    }

    sendPieceMove(player, piece, newPosition, oldPosition, captured = false) {
        if (!this.gameId) {
            console.error('❌ Cannot send move: gameId missing');
            return;
        }
        
        console.log(`♟️ Mouvement V2 - ${player}P${piece} ${oldPosition}→${newPosition}`);
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
        console.log('🔌 Connexion V2...');
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            console.log('🔌 Déconnexion V2');
        }
    }

    setupSocketListeners() {
        this.socket.on('connect', () => {
            console.log('✅ Connecté au serveur V2');
        });

        this.socket.on('disconnect', (reason) => {
            console.warn('❌ Déconnecté V2:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('🔌 Erreur connexion V2:', error.message);
            setTimeout(() => {
                console.log('🔄 Reconnexion V2...');
                this.socket.connect();
            }, 2000);
        });

        this.socket.on('error', (error) => {
            console.error('💥 Erreur Socket V2:', error.message);
        });

        this.socket.on('position_mismatch', (data) => {
            console.warn('🔄 Resync V2:', data);
            this.socket.emit('request_game_state', {
                gameId: this.gameId,
                playerId: this.playerId
            });
        });

        this.socket.on('game_state', (data) => {
            console.log('📡 État jeu V2 reçu');
            if (window.onlineLudoGame && window.onlineLudoGame.resyncWithServer) {
                window.onlineLudoGame.resyncWithServer(data.gameState);
            }
        });

        this.socket.on('game-created', (data) => {
            console.log('🎉 Partie créée V2:', data);
            this.setPlayerId(data.player);
            this.setGameId(data.gameId);
            if (window.handleGameCreated) window.handleGameCreated(data);
        });

        this.socket.on('player-role-assigned', (data) => {
            console.log('🎭 Rôle attribué V2:', data.role);
            this.setPlayerId(data.role);
        });

        this.socket.on('game-ready', (data) => {
            console.log('🚀 Partie prête V2');
            if (window.handleGameReady) window.handleGameReady(data);
        });

        this.socket.on('spectate-mode', (data) => {
            console.log('👁️ Spectateur V2 activé');
            if (window.handleSpectateMode) window.handleSpectateMode(data);
        });

        this.socket.on('spectators-count', (data) => {
            console.log(`👥 Spectateurs V2: ${data.count}`);
            if (window.handleSpectatorsUpdate) window.handleSpectatorsUpdate(data);
        });

        this.socket.on('spectator-move', (data) => {
            console.log('♟️ Mouvement spectateur V2');
            if (window.handleSpectatorMove) window.handleSpectatorMove(data);
        });

        this.socket.on('dice-rolled', (data) => {
            console.log(`🎲 Dé V2: ${data.value} par ${data.player}`);
            if (window.handleDiceResult) window.handleDiceResult(data);
        });

        this.socket.on('piece-moved', (data) => {
            console.log('♟️ Pièce V2 déplacée');
            if (window.handlePieceMoved) window.handlePieceMoved(data);
        });

        this.socket.on('turn-changed', (currentPlayer) => {
            console.log(`🔄 Tour V2: ${currentPlayer}`);
            if (window.handleTurnChanged) window.handleTurnChanged(currentPlayer);
        });

        this.socket.on('player-joined', (data) => {
            console.log('👤 Joueur V2 rejoint:', data);
            if (window.handlePlayerJoined) window.handlePlayerJoined(data);
        });

        this.socket.on('player-left', (data) => {
            console.log('🚪 Joueur V2 parti:', data);
            if (window.handlePlayerLeft) window.handlePlayerLeft(data);
        });

        this.socket.on('game-winner', (data) => {
            console.log('🏆 Vainqueur V2:', data);
            if (window.handleGameWinner) {
                window.handleGameWinner(data);
            } else {
                console.error('❌ window.handleGameWinner V2 non défini');
            }
        });
    }
}