/**
 * main.js - Point d'entrée principal de l'application
 * Refactorisé avec logs centralisés et meilleure organisation
 * ADAPTÉ POUR 3 JOUEURS
 */

import { OnlineLudo } from './onlineLudo.js';
import { SpectateLudo } from './SpectateLudo.js';
import { OnlineManager } from './online.js';
import { clientLogger, CLIENT_CONFIG } from './ludo/constants-client.js';

const onlineManager = new OnlineManager();
let onlineGame;
let spectateGame;

const onlineSetup = document.getElementById('online-setup');
const ludoContainer = document.querySelector('.ludo-container');

// ===== DOM HELPERS =====

/**
 * Obtenir l'élément du message de statut
 */
function getGameStatus() {
    return document.getElementById('game-status');
}

/**
 * Obtenir l'input du nom du joueur
 */
function getPlayerName() {
    return document.getElementById('player-name');
}

/**
 * Mettre à jour le message de statut
 */
function updateStatus(message, color = 'black') {
    const gameStatus = getGameStatus();
    if (gameStatus) {
        gameStatus.innerHTML = message.replace(/\n/g, '<br>');
        gameStatus.style.color = color;
        clientLogger.debug('UI', 'Status updated', { color });
    }
}

/**
 * Afficher l'écran du jeu
 */
function showGameScreen() {
    if (onlineSetup) onlineSetup.style.display = 'none';
    if (ludoContainer) ludoContainer.style.display = 'block';
}

/**
 * Trouver le pion surligné aux coordonnées du clic
 */
function findHighlightedPieceAtClick(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const allPieces = document.querySelectorAll('.player-piece');

    for (const piece of allPieces) {
        const pieceRect = piece.getBoundingClientRect();
        const pieceX = pieceRect.left - rect.left;
        const pieceY = pieceRect.top - rect.top;
        const pieceWidth = pieceRect.width;
        const pieceHeight = pieceRect.height;

        if (clickX >= pieceX && clickX <= pieceX + pieceWidth &&
            clickY >= pieceY && clickY <= pieceY + pieceHeight) {

            if (piece.classList.contains('highlight')) {
                return piece;
            }
        }
    }

    return null;
}

/**
 * Rediriger les clics vers le jeu (mode joueur)
 */
function redirectClicksToOnlineGame(game) {
    const diceBtn = document.getElementById('dice-btn');
    if (diceBtn) {
        diceBtn.onclick = null;
        diceBtn.addEventListener('click', () => game.onDiceClick());
    }

    const playerPieces = document.querySelector('.player-pieces');
    if (playerPieces) {
        playerPieces.onclick = null;
        playerPieces.addEventListener('click', (event) => {
            const highlightedPiece = findHighlightedPieceAtClick(event);

            if (highlightedPiece) {
                const player = highlightedPiece.getAttribute('player-id');
                const piece = parseInt(highlightedPiece.getAttribute('piece'));
                game.onPieceClick(player, piece);
            }
        });
    }

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.onclick = null;
        resetBtn.addEventListener('click', () => {
            location.reload();
        });
    }
}

/**
 * Désactiver les clics pour le mode spectateur
 */
function disableClicksForSpectator() {
    const playerPieces = document.querySelector('.player-pieces');
    if (playerPieces) {
        playerPieces.onclick = null;
        playerPieces.style.pointerEvents = 'none';
    }

    const diceBtn = document.getElementById('dice-btn');
    if (diceBtn) {
        diceBtn.onclick = null;
        diceBtn.disabled = true;
        diceBtn.style.pointerEvents = 'none';
        diceBtn.style.opacity = '0.5';
    }

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.onclick = null;
        resetBtn.addEventListener('click', () => {
            location.reload();
        });
    }
}

/**
 * Démarrer le jeu pour un joueur
 */
function startGameAutomatically(gameData) {
    clientLogger.debug('GAME', 'Starting game', gameData);

    const currentPlayerId = onlineManager.getPlayerId();

    if (!currentPlayerId) {
        clientLogger.error('GAME', 'Player ID not defined');
        updateStatus('❌ Erreur: Rôle non défini', 'red');
        return;
    }

    showGameScreen();

    onlineGame = new OnlineLudo(onlineManager, currentPlayerId);
    
    // Stocker la référence globale pour la resynchronisation
    window.onlineLudoGame = onlineGame;
    
    redirectClicksToOnlineGame(onlineGame);

    updateStatus(`🎮 Partie démarrée! Vous êtes ${currentPlayerId}`, 'green');

    setTimeout(() => {
        const currentTurn = gameData.currentTurn || 'P1';
        if (window.handleTurnChanged) {
            window.handleTurnChanged(currentTurn);
        }
    }, 500);
}

/**
 * Démarrer le mode spectateur
 */
function startSpectateMode(spectatorName, gameData) {
    clientLogger.debug('GAME', 'Starting spectate mode', { name: spectatorName });

    showGameScreen();

    spectateGame = new SpectateLudo(onlineManager, spectatorName);
    disableClicksForSpectator();

    updateStatus(`👁️ Vous regardez la partie en tant que spectateur`, 'blue');

    if (gameData && spectateGame.handleSpectateMode) {
        setTimeout(() => {
            spectateGame.handleSpectateMode(gameData);
        }, CLIENT_CONFIG.ANIMATION_DELAY_SPECTATE);
    }
}

/**
 * Créer l'interface du setup
 */
function createSetupInterface() {
    const setupContent = onlineSetup.querySelector('.setup-content');
    if (!setupContent) return;

    setupContent.innerHTML = `
        <h2>Ludo en Ligne - 3 Joueurs</h2>
        <div class="input-group">
            <input type="text" id="player-name" placeholder="Votre nom" class="form-input">
        </div>
        <div class="button-group">
            <button id="create-game-btn" class="btn btn-create">
                Créer une partie
            </button>
            <div class="join-section">
                <div class="input-row">
                    <input type="text" id="join-code" placeholder="Code de partie" class="form-input join-input">
                    <button id="join-game-btn" class="btn btn-join">
                        Rejoindre (Jouer)
                    </button>
                </div>
                <div class="input-row">
                    <input type="text" id="join-code-spectate" placeholder="Code de partie" class="form-input join-input">
                    <button id="spectate-game-btn" class="btn btn-spectate">
                        Regarder (Spectateur)
                    </button>
                </div>
            </div>
        </div>
        <div id="game-status" class="status-message"></div>
    `;

    // Attach event listeners
    const createGameBtn = document.getElementById('create-game-btn');
    const joinGameBtn = document.getElementById('join-game-btn');
    const spectateGameBtn = document.getElementById('spectate-game-btn');
    const joinCodeInput = document.getElementById('join-code');
    const joinCodeSpectateInput = document.getElementById('join-code-spectate');

    // CORRECTION : Validation pour la création de partie
    createGameBtn.addEventListener('click', () => {
        const playerName = getPlayerName().value.trim();
        
        // VALIDATION - Empêcher la création si pas de nom
        if (!playerName) {
            updateStatus('❌ Veuillez entrer votre nom pour créer une partie', 'red');
            getPlayerName().focus();
            return;
        }
        
        if (playerName.length < 2) {
            updateStatus('❌ Le nom doit contenir au moins 2 caractères', 'red');
            getPlayerName().focus();
            return;
        }

        updateStatus('⏳ Création de la partie...', 'blue');
        onlineManager.createGame(playerName);
    });

    // CORRECTION : Validation pour rejoindre une partie (joueur)
    joinGameBtn.addEventListener('click', () => {
        const playerName = getPlayerName().value.trim();
        const gameCode = joinCodeInput.value.trim();

        // VALIDATION - Empêcher de rejoindre si pas de nom
        if (!playerName) {
            updateStatus('❌ Veuillez entrer votre nom pour rejoindre une partie', 'red');
            getPlayerName().focus();
            return;
        }

        if (playerName.length < 2) {
            updateStatus('❌ Le nom doit contenir au moins 2 caractères', 'red');
            getPlayerName().focus();
            return;
        }

        if (!gameCode) {
            updateStatus('❌ Veuillez entrer un code de partie', 'red');
            joinCodeInput.focus();
            return;
        }

        updateStatus(`⏳ Tentative de rejoindre la partie ${gameCode}...`, 'blue');
        onlineManager.joinGame(gameCode, playerName);
    });

    // CORRECTION : Validation pour le mode spectateur
    spectateGameBtn.addEventListener('click', () => {
        const spectatorName = getPlayerName().value.trim();
        const gameCode = joinCodeSpectateInput.value.trim();

        // VALIDATION - Empêcher de regarder si pas de nom
        if (!spectatorName) {
            updateStatus('❌ Veuillez entrer votre nom pour regarder une partie', 'red');
            getPlayerName().focus();
            return;
        }

        if (spectatorName.length < 2) {
            updateStatus('❌ Le nom doit contenir au moins 2 caractères', 'red');
            getPlayerName().focus();
            return;
        }

        if (!gameCode) {
            updateStatus('❌ Veuillez entrer un code de partie', 'red');
            joinCodeSpectateInput.focus();
            return;
        }

        updateStatus(`⏳ Connexion en tant que spectateur pour ${gameCode}...`, 'blue');
        onlineManager.watchGame(gameCode, spectatorName);
    });
}

// ===== SETUP =====

createSetupInterface();
const socket = onlineManager.getSocket();

// ===== SOCKET.IO EVENTS =====

socket.on('game-created', (data) => {
    clientLogger.debug('EVENT', 'Game created', { gameId: data.gameId });

    updateStatus(`✅ Partie créée avec succès!

📋 Code: <strong>${data.gameId}</strong>

En attente de joueurs...`, 'green');
});

socket.on('player-joined', (playerData) => {
    clientLogger.debug('EVENT', 'Player joined', { name: playerData.name });

    updateStatus(`👥 ${playerData.name} a rejoint la partie!

Démarrage du jeu...`, 'blue');
});

// ✅ AJOUT : Gérer quand un joueur quitte la partie
socket.on('player-left', (data) => {
    clientLogger.debug('EVENT', 'Player left', data);
    
    let statusMessage;
    if (data.wasCurrentTurn) {
        statusMessage = `🚪 ${data.playerName} (${data.playerRole}) a quitté la partie (c'était son tour). 
        ${data.remainingPlayers} joueur(s) restant(s). Passage automatique au joueur suivant...`;
    } else {
        statusMessage = `🚪 ${data.playerName} (${data.playerRole}) a quitté la partie. 
        ${data.remainingPlayers} joueur(s) restant(s). La partie continue !`;
    }
    
    updateStatus(statusMessage, 'orange');

    // Mettre à jour l'interface pour refléter le départ du joueur
    if (onlineGame && onlineGame.handlePlayerLeft) {
        onlineGame.handlePlayerLeft(data);
    }
    
    if (spectateGame && spectateGame.handlePlayerLeft) {
        spectateGame.handlePlayerLeft(data);
    }
});

socket.on('spectate-mode', (data) => {
    clientLogger.debug('EVENT', 'Spectate mode', { gameId: data.gameId });

    const playerNames = data.players.map(p => p.name).join(', ');
    updateStatus(`✅ Connecté en tant que spectateur!

Partie: <strong>${data.gameId}</strong>
Joueurs: ${playerNames}

Redirection vers la partie...`, 'blue');

    const playerNameInput = document.getElementById('player-name');
    const spectatorName = playerNameInput ? playerNameInput.value.trim() : 'Spectateur';

    showGameScreen();
    spectateGame = new SpectateLudo(onlineManager, spectatorName);
    disableClicksForSpectator();

    if (spectateGame.handleSpectateMode) {
        spectateGame.handleSpectateMode(data);
    }
});

socket.on('game-ready', (data) => {
    clientLogger.debug('EVENT', 'Game ready', { gameId: data.gameId });

    const currentRole = onlineManager.getPlayerId();

    if (!currentRole) {
        const playerNameInput = document.getElementById('player-name');
        const playerName = playerNameInput?.value.trim();
        if (data.players && data.players.length === 3) {
            // Trouver le rôle basé sur le nom
            const player = data.players.find(p => p.name === playerName);
            if (player) {
                onlineManager.setPlayerId(player.role);
                clientLogger.debug('GAME', 'Role corrected', { role: player.role });
            }
        }
    }

    updateStatus('🎮 Partie prête! Démarrage du jeu...', 'green');

    setTimeout(() => {
        startGameAutomatically(data);
    }, 1000);
});

// NOUVEAUX ÉVÉNEMENTS POUR RESYNCHRONISATION
socket.on('position_mismatch', (data) => {
    clientLogger.warn('SYNC', 'Position mismatch detected', data);
    
    // Demander un état complet du jeu
    socket.emit('request_game_state', { gameId: onlineManager.getGameId() });
});

socket.on('game_state', (data) => {
    clientLogger.debug('SYNC', 'Received game state for resync', data);
    
    if (onlineGame && onlineGame.resyncWithServer) {
        onlineGame.resyncWithServer(data.gameState);
    }
});

socket.on('error', (error) => {
    clientLogger.error('SOCKET', 'Error', { error });
    updateStatus(`❌ Erreur: ${error}`, 'red');
});

socket.on('connect', () => {
    clientLogger.debug('SOCKET', 'Connected');
    updateStatus('🔗 Connecté au serveur', 'green');
});

socket.on('disconnect', () => {
    clientLogger.warn('SOCKET', 'Disconnected');
    updateStatus('❌ Déconnecté du serveur', 'red');
});

// ===== INITIALIZATION =====

onlineManager.connect();
clientLogger.debug('MAIN', 'Application initialized');

