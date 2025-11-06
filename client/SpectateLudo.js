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
            P2: []
        };

        // ✅ AJOUT : Stocker l'état des joueurs actifs
        this.activePlayers = {
            P1: true,
            P2: true
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
        window.handleTurnChange = this.handleTurnChange.bind(this);
        window.handlePlayerLeft = this.handlePlayerLeft.bind(this); // ✅ AJOUT
        window.handleGameWinner = this.handleGameWinner.bind(this); // ✅ AJOUT

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
            message = `${data.winnerName} a gagné par abandon ! 🏆\n\nSon adversaire a quitté la partie.`;
        } else {
            message = `${data.winnerName} a gagné la partie ! 🏆`;
        }
        
        this.gameEnded = true;
        setTimeout(() => {
            UI.showWinnerPopup(data.winnerName, false, message);
        }, 500);
    }

    // ✅ NOUVEAU: Reçoit le snapshot initial de la partie
    handleSpectateMode(data) {
        log('👁️ Mode spectateur initialisé avec snapshot');
        
        this.gameId = data.gameId;
        this.players = data.players;
        this.currentTurn = data.currentTurn;
        this.currentPositions = { ...data.positions };

        // Initialiser le plateau avec les positions reçues
        this.updateBoardFromSnapshot(data.positions);

        console.log(`👁️ Jeu d'observation démarré pour ${this.gameId}`);
    }

    // ✅ Mettre à jour le plateau à partir du snapshot
    updateBoardFromSnapshot(positions) {
        log('📊 Mise à jour du plateau depuis snapshot');
        
        ['P1', 'P2'].forEach(player => {
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
                UI.showWinnerPopup(winner, false); // false = spectateur
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
        const adversary = player === 'P1' ? 'P2' : 'P1';

        // Trouver le pion adverse capturé
        for (let i = 0; i < 4; i++) {
            if (this.currentPositions[adversary][i] === position) {
                // Animer le retour à la base
                const basePosition = adversary === 'P1' ? [500, 501, 502, 503] : [600, 601, 602, 603];
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

    // ✅ Recevoir le dé lancé
    handleDiceResult(data) {
        log(`🎲 Dé reçu: ${data.value} pour ${data.player}`);
        UI.setDiceValue(data.value);
    }

    // ✅ Changement de tour
    handleTurnChange(currentPlayer) {
        log(`🔄 Tour changé: ${currentPlayer}`);

        if (this.gameEnded) return;

        this.currentTurn = currentPlayer;
        const turnIndex = currentPlayer === 'P1' ? 0 : 1;
        UI.setTurn(turnIndex);
    }

    // ✅ Mettre à jour la liste des spectateurs
    handleSpectatorsUpdate(data) {
        log(`👁️ Spectateurs: ${data.count}`);
    }
}