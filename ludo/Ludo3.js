import { BASE_POSITIONS, HOME_ENTRANCE, HOME_POSITIONS, PLAYERS, SAFE_POSITIONS, START_POSITIONS, STATE, TURNING_POINTS } from './constants3.js';
import { UI } from './UI3.js';

export class Ludo {
    currentPositions = {
        P1: [],
        P2: [],
        P3: []
    }

    _diceValue;
    get diceValue() {
        return this._diceValue;
    }
    set diceValue(value) {
        this._diceValue = value;
        UI.setDiceValue(value);
    }

    _turn;
    get turn() {
        return this._turn;
    }
    set turn(value) {
        this._turn = value;
        UI.setTurn(value);

        // Démarrer le timer quand le tour change
        this.startTurnTimer();
    }

    _state;
    get state() {
        return this._state;
    }
    set state(value) {
        this._state = value;

        if(value === STATE.DICE_NOT_ROLLED) {
            UI.enableDice();
            UI.unhighlightPieces();
            // Le timer continue pendant l'attente du lancer de dé
        } else {
            UI.disableDice();
            // Le timer continue pendant la sélection des pions
        }
    }

    // Timer properties
    turnTimer = null;
    timeLeft = 15;
    hasRolledSix = false;

    constructor() {
        console.log('Hello World! Lets play Ludo!');

        this.listenDiceClick();
        this.listenResetClick();
        this.listenPieceClick();

        this.resetGame();
    }

    listenDiceClick() {
        UI.listenDiceClick(this.onDiceClick.bind(this))
    }

    onDiceClick() {
        console.log('dice clicked!');
        this.diceValue = 1 + Math.floor(Math.random() * 6);
        this.state = STATE.DICE_ROLLED;

        // Vérifier si c'est un 6
        this.hasRolledSix = (this.diceValue === 6);

        this.checkForEligiblePieces();
    }

    checkForEligiblePieces() {
        const player = PLAYERS[this.turn];
        const eligiblePieces = this.getEligiblePieces(player);

        if(eligiblePieces.length) {
            UI.highlightPieces(player, eligiblePieces);
        } else {
            console.log(`Aucun pion éligible pour ${player}, passage au tour suivant`);
            this.passTurn();
        }
    }

    incrementTurn() {
        // Arrêter le timer actuel
        this.stopTurnTimer();
        this.hasRolledSix = false;

        // Passage au joueur suivant (0->1->2->0)
        this.turn = (this.turn + 1) % 3;
        this.state = STATE.DICE_NOT_ROLLED;
        
        // Redémarrer le timer pour le nouveau tour
        this.startTurnTimer();
    }

    passTurn() {
        if (this.hasRolledSix) {
            console.log(`${PLAYERS[this.turn]} a fait un 6 et rejoue !`);
            this.hasRolledSix = false;
            this.state = STATE.DICE_NOT_ROLLED;
            this.startTurnTimer(); // IMPORTANT: Redémarrer le timer
        } else {
            this.incrementTurn();
        }
    }

    getEligiblePieces(player) {
        return [0, 1, 2, 3].filter(piece => {
            const currentPosition = this.currentPositions[player][piece];

            if(currentPosition === HOME_POSITIONS[player]) {
                return false;
            }

            if(
                BASE_POSITIONS[player].includes(currentPosition)
                && this.diceValue !== 6
            ){
                return false;
            }

            if(
                HOME_ENTRANCE[player].includes(currentPosition)
                && this.diceValue > HOME_POSITIONS[player] - currentPosition
                ) {
                return false;
            }

            return true;
        });
    }

    listenResetClick() {
        UI.listenResetClick(this.resetGame.bind(this))
    }

    resetGame() {
        console.log('reset game');

        this.stopTurnTimer();
        this.hasRolledSix = false;

        this.currentPositions = structuredClone(BASE_POSITIONS);

        PLAYERS.forEach(player => {
            [0, 1, 2, 3].forEach(piece => {
                this.setPiecePosition(player, piece, this.currentPositions[player][piece])
            })
        });

        UI.resetPositionMap();

        this.turn = 0;
        this.state = STATE.DICE_NOT_ROLLED;
        this.timeLeft = 15;

        // IMPORTANT: Redémarrer le timer après le reset
        this.startTurnTimer();
    }

    listenPieceClick() {
        UI.listenPieceClick(this.onPieceClick.bind(this));
    }

    onPieceClick(event) {
        const target = event.target;

        if(!target.classList.contains('player-piece') || !target.classList.contains('highlight')) {
            return;
        }

        const player = target.getAttribute('player-id');
        const piece = target.getAttribute('piece');

        // Arrêter le timer pendant le traitement du coup
        this.stopTurnTimer();
        this.handlePieceClick(player, piece);
    }

    handlePieceClick(player, piece) {
        const currentPosition = this.currentPositions[player][piece];

        if(BASE_POSITIONS[player].includes(currentPosition)) {
            this.setPiecePosition(player, piece, START_POSITIONS[player]);
            
            if (this.hasRolledSix) {
                this.state = STATE.DICE_NOT_ROLLED;
                this.startTurnTimer(); // Redémarrer le timer
            } else {
                this.state = STATE.DICE_NOT_ROLLED;
                this.incrementTurn();
            }
            return;
        }

        UI.unhighlightPieces();
        this.movePiece(player, piece, this.diceValue);
    }

    setPiecePosition(player, piece, newPosition) {
        this.currentPositions[player][piece] = newPosition;
        UI.setPiecePosition(player, piece, newPosition)
    }

    movePiece(player, piece, moveBy) {
        const interval = setInterval(() => {
            this.incrementPiecePosition(player, piece);
            moveBy--;

            if(moveBy === 0) {
                clearInterval(interval);

                // Vérifier si le joueur a gagné
                if (this.hasPlayerWon(player)) {
                    return; // Le popup est géré dans hasPlayerWon
                }

                const isKill = this.checkForKill(player, piece);

                if(isKill || this.diceValue === 6) {
                    if (this.diceValue === 6) {
                        this.hasRolledSix = true;
                    }
                    this.state = STATE.DICE_NOT_ROLLED;
                    this.startTurnTimer(); // IMPORTANT: Redémarrer le timer
                    return;
                }

                // Passer au tour suivant
                this.passTurn();
            }
        }, 200);
    }

    checkForKill(player, piece) {
        const currentPosition = this.currentPositions[player][piece];
        let kill = false;

        // Vérifier tous les joueurs adverses
        PLAYERS.forEach(opponent => {
            if (opponent !== player) {
                [0, 1, 2, 3].forEach(opponentPiece => {
                    const opponentPosition = this.currentPositions[opponent][opponentPiece];

                    if(currentPosition === opponentPosition && !SAFE_POSITIONS.includes(currentPosition)) {
                        this.setPiecePosition(opponent, opponentPiece, BASE_POSITIONS[opponent][opponentPiece]);
                        kill = true;
                    }
                });
            }
        });

        return kill;
    }

    hasPlayerWon(player) {
        const hasWon = [0, 1, 2, 3].every(piece => this.currentPositions[player][piece] === HOME_POSITIONS[player]);

        if (hasWon) {
            UI.showWinnerPopup(player, true, `FÉLICITATIONS ! Le joueur ${player} a gagné la partie ! 🏆`);
            this.stopTurnTimer(); // Arrêter le timer définitivement
            return true;
        }
        return false;
    }

    incrementPiecePosition(player, piece) {
        this.setPiecePosition(player, piece, this.getIncrementedPosition(player, piece));
    }
    
    getIncrementedPosition(player, piece) {
        const currentPosition = this.currentPositions[player][piece];

        if(currentPosition === TURNING_POINTS[player]) {
            return HOME_ENTRANCE[player][0];
        }
        else if(currentPosition === 51) {
            return 0;
        }
        return currentPosition + 1;
    }

    // Méthodes pour gérer le timer - CORRIGÉES
    startTurnTimer() {
        // S'assurer qu'aucun timer n'est déjà en cours
        this.stopTurnTimer();
        
        // Réinitialiser le temps
        this.timeLeft = 15;
        UI.updateTimer(this.timeLeft);

        // Démarrer le nouveau timer
        this.turnTimer = setInterval(() => {
            this.timeLeft--;
            UI.updateTimer(this.timeLeft);

            if (this.timeLeft <= 0) {
                console.log(`Temps écoulé pour ${PLAYERS[this.turn]}`);

                // Si on attendait la sélection d'un pion, enlever les highlights
                if (this.state === STATE.DICE_ROLLED) {
                    UI.unhighlightPieces();
                }

                // Passer au tour suivant
                this.passTurn();
            }
        }, 1000);
    }
    
    stopTurnTimer() {
        if (this.turnTimer) {
            clearInterval(this.turnTimer);
            this.turnTimer = null;
        }
    }
}