/**
 * Classe Game de base
 */

export class Game {
    constructor(gameId, gameMode) {
        this.id = gameId;
        this.gameMode = gameMode;
        this.players = [];
        this.spectators = [];
        this.state = 'waiting';
        this.currentTurn = 'P1';
        this.lastDiceValue = 0;
        this.positions = gameMode.initializePositions();
        this.createdAt = Date.now();
        this.winner = null; // ✅ AJOUT : Stocker le gagnant
        this.winType = null; // ✅ AJOUT : Type de victoire ('normal' ou 'abandon')
    }

    /**
     * Ajouter un joueur
     */
    addPlayer(playerId, playerName) {
        if (!this.gameMode.canPlayerJoin(this)) {
            throw new Error('Game is full');
        }

        const role = this.gameMode.assignPlayerRole(this);
        const player = { id: playerId, name: playerName, role };
        this.players.push(player);

        // Si le jeu est complet, démarrer
        if (this.players.length === this.gameMode.TOTAL_PLAYERS) {
            this.state = 'playing';
        }

        return player;
    }

    /**
     * Ajouter un spectateur
     */
    addSpectator(spectatorId, spectatorName) {
        const spectator = { id: spectatorId, name: spectatorName };
        this.spectators.push(spectator);
        return spectator;
    }

    /**
     * Retirer un joueur/spectateur
     */
    removeUser(userId) {
        this.players = this.players.filter(p => p.id !== userId);
        this.spectators = this.spectators.filter(s => s.id !== userId);
    }

    /**
     * Déclarer un gagnant par abandon
     */
    declareWinnerByAbandon(winnerRole) {
        const winnerPlayer = this.players.find(p => p.role === winnerRole);
        if (winnerPlayer) {
            this.winner = winnerRole;
            this.winType = 'abandon';
            this.state = 'finished';
            console.log('Winner declared by abandon:', winnerRole);
        }
    }

    /**
     * Obtenir les données pour les clients
     */
    getClientData() {
        return {
            gameId: this.id,
            players: this.players,
            currentTurn: this.currentTurn,
            positions: this.positions,
            state: this.state,
            winner: this.winner, // ✅ AJOUT
            winType: this.winType // ✅ AJOUT
        };
    }

    /**
     * Obtenir le nom d'un joueur par son rôle
     */
    getPlayerNameByRole(role) {
        const player = this.players.find(p => p.role === role);
        return player ? player.name : role;
    }
}