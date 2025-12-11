import { UI } from './ludo/UI.js';

// Variable pour contrôler les logs
const DEBUG = false;

function log(message) {
    if (DEBUG) console.log(message);
}

export class SpectateLudo {
    constructor(onlineManager, spectatorName) {
        this.onlineManager = onlineManager;
        this.spectatorName = spectatorName;
        this.isInitialized = false;
        this.gameEnded = false;
        this.gameId = null;
        this.players = [];
        this.currentTurn = 'P1';

        // ✅ SIMPLIFIÉ: Juste une copie locale des positions pour animation
        this.currentPositions = {
            P1: [],
            P2: [],
            P3: [],
            P4: []
        };

        // ✅ AJOUT : Stocker les noms des joueurs
        this.playerNames = {
            P1: null,
            P2: null,
            P3: null,
            P4: null
        };

        // ✅ AJOUT : Stocker l'état des joueurs actifs
        this.activePlayers = {
            P1: true,
            P2: true,
            P3: true,
            P4: true
        };

        log(`👁️ SpectateLudo créé - Spectateur: ${spectatorName}`);
        this.initializeGame();
    }

    initializeGame() {
        log(`👁️ Initialisation mode spectateur`);

        // Rendre les méthodes accessibles globalement
        window.handleSpectateMode = this.handleSpectateMode.bind(this);
        window.handleSpectatorsUpdate = this.handleSpectatorsUpdate.bind(this);
        window.handleSpectatorMove = this.handleSpectatorMove.bind(this);
        window.handleDiceResult = this.handleDiceResult.bind(this);
        window.handleTurnChanged = this.handleTurnChanged.bind(this); // ✅ CHANGEMENT: handleTurnChanged
        window.handlePlayerLeft = this.handlePlayerLeft.bind(this);
        window.handleGameWinner = this.handleGameWinner.bind(this);

        console.log(`👁️ Spectateur prêt à regarder la partie`);
        this.isInitialized = true;
    }

    // ✅ AJOUT : Gérer le départ d'un joueur (mode spectateur)
    handlePlayerLeft(data) {
        log(`🚪 Joueur quitté en mode spectateur: ${data.playerRole}`);
        
        this.activePlayers[data.playerRole] = false;
        this.hidePlayerPieces(data.playerRole);
    }

    // ✅ AJOUT : Cacher les pions d'un joueur qui a quitté
    hidePlayerPieces(playerRole) {
        [0, 1, 2, 3].forEach(piece => {
            const pieceElement = document.querySelector(`.player-piece[player-id="${playerRole}"][piece="${piece}"]`);
            if (pieceElement) {
                pieceElement.style.opacity = '0.3';
                pieceElement.title = `${playerRole} a quitté la partie`;
                pieceElement.classList.add('player-left');
            }
        });
    }

    // ✅ AJOUT : Gérer la victoire par abandon pour les spectateurs
    handleGameWinner(data) {
        log(`🎉 Victoire reçue en mode spectateur: ${data.winner}`);
        
        const winType = data.winType || 'normal';
        let message;
        
        if (winType === 'abandon') {
            message = `${data.winnerName} a gagné par abandon ! 🏆\n\nLes autres joueurs ont quitté la partie.`;
        } else {
            message = `${data.winnerName} a gagné la partie ! 🏆`;
        }
        
        this.gameEnded = true;
        setTimeout(() => {
            UI.showWinnerPopup(data.winnerName, false, message);
        }, 500);
    }

    // ✅ MODIFICATION : Reçoit le snapshot initial de la partie avec noms
    handleSpectateMode(data) {
        log('👁️ Mode spectateur initialisé avec snapshot');
        
        this.gameId = data.gameId;
        this.players = data.players;
        this.currentTurn = data.currentTurn;
        this.currentPositions = { ...data.positions };

        // ✅ AJOUT : Stocker les noms des joueurs depuis le snapshot
        if (data.players && Array.isArray(data.players)) {
            data.players.forEach(player => {
                if (player.role && player.name) {
                    this.playerNames[player.role] = player.name;
                }
            });
            log(`📝 Noms des joueurs stockés depuis spectate-mode:`, this.playerNames);
        }

        // Initialiser le plateau avec les positions reçues
        this.updateBoardFromSnapshot(data.positions);

        // ✅ AJOUT : Mettre à jour l'affichage du tour initial avec le nom
        const initialPlayerName = this.playerNames[this.currentTurn] || this.currentTurn;
        UI.setTurn(this.currentTurn, initialPlayerName);

        console.log(`👁️ Jeu d'observation démarré pour ${this.gameId}`);
    }

    // ✅ Mettre à jour le plateau à partir du snapshot
    updateBoardFromSnapshot(positions) {
        log('📊 Mise à jour du plateau depuis snapshot');
        
        ['P1', 'P2', 'P3', 'P4'].forEach(player => {
            positions[player].forEach((position, piece) => {
                this.currentPositions[player][piece] = position;
                UI.setPiecePosition(player, piece, position);
            });
        });

        UI.resetPositionMap();
    }

    // ✅ OPTIMISÉ: Recevoir un événement de mouvement incrémental
    handleSpectatorMove(data) {
        log(`♟️ Mouvement spectateur reçu: ${data.player} P${data.piece}`);

        const { player, piece, to, dice, captured, winner } = data;

        // Mettre à jour la position locale
        this.currentPositions[player][piece] = to;

        // Animer le mouvement
        this.animateMove(player, piece, data.from, to, dice);

        // Si une capture
        if (captured) {
            log(`🔥 Capture détectée`);
            this.handleCaptureAnimation(player, piece, to);
        }

        // Si victoire (calculée côté serveur)
        if (winner) {
            log(`🎉 Victoire: ${winner}`);
            this.gameEnded = true;
            setTimeout(() => {
                UI.showWinnerPopup(winner, false);
            }, 500);
        }
    }

    // ✅ Animer le mouvement
    animateMove(player, piece, from, to, dice) {
        log(`🎬 Animation: ${player} P${piece} ${from} -> ${to}`);

        UI.animatePieceMovement(player, piece, from, to, dice)
            .catch(error => {
                log(`❌ Erreur animation: ${error.message}`);
                UI.setPiecePosition(player, piece, to);
            });
    }

    // ✅ Animer une capture
    handleCaptureAnimation(player, piece, position) {
        // ✅ MODIFICATION : Gérer 4 adversaires possibles
        const adversaries = ['P1', 'P2', 'P3', 'P4'].filter(p => p !== player);

        for (const adversary of adversaries) {
            for (let i = 0; i < 4; i++) {
                if (this.currentPositions[adversary][i] === position) {
                    // Animer le retour à la base
                    const basePosition = adversary === 'P1' ? [500, 501, 502, 503] : 
                                         adversary === 'P2' ? [600, 601, 602, 603] : 
                                         adversary === 'P3' ? [700, 701, 702, 703] :
                                         [800, 801, 802, 803]; // ✅ Base P4
                    const base = basePosition[i];

                    this.currentPositions[adversary][i] = base;

                    UI.animateCaptureReturn(adversary, i, position, base)
                        .catch(error => {
                            log(`❌ Erreur animation capture: ${error.message}`);
                            UI.setPiecePosition(adversary, i, base);
                        });
                    break;
                }
            }
        }
    }

    // ✅ Recevoir le dé lancé
    handleDiceResult(data) {
        log(`🎲 Dé reçu: ${data.value} pour ${data.player}`);
        UI.setDiceValue(data.value);
    }

    // ✅ MODIFICATION CRITIQUE : Changement de tour avec gestion des noms
    handleTurnChanged(data) {
        // ✅ CORRECTION : Le serveur envoie maintenant un objet avec playerId et playerName
        let currentPlayer, playerName;
        
        if (typeof data === 'string') {
            // Format ancien (rétrocompatibilité)
            currentPlayer = data;
            playerName = this.playerNames[currentPlayer] || currentPlayer;
        } else {
            // Format nouveau avec objet
            currentPlayer = data.playerId;
            playerName = data.playerName || this.playerNames[currentPlayer] || currentPlayer;
        }
        
        log(`🔄 Tour changé: ${currentPlayer} (${playerName})`);

        if (this.gameEnded) return;

        this.currentTurn = currentPlayer;
        UI.setTurn(currentPlayer, playerName);
    }

    // ✅ Mettre à jour la liste des spectateurs
    handleSpectatorsUpdate(data) {
        log(`👁️ Spectateurs: ${data.count}`);
    }
}