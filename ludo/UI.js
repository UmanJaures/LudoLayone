import { COORDINATES_MAP, PLAYERS, STEP_LENGTH } from './constants.js';

const diceButtonElement = document.querySelector('#dice-btn');
const playerPiecesElements = {
    P1: document.querySelectorAll('[player-id="P1"].player-piece'),
    P2: document.querySelectorAll('[player-id="P2"].player-piece'),
}

// Garder une trace des positions pour gérer les superpositions
const positionMap = new Map();

export class UI {
    static listenDiceClick(callback) {
        diceButtonElement.addEventListener('click', callback);
    }

    static listenResetClick(callback) {
        document.querySelector('button#reset-btn').addEventListener('click', callback)
    }

    static listenPieceClick(callback) {
        document.querySelector('.player-pieces').addEventListener('click', callback)
    }

    /**
     * Déplace une pièce avec animation fluide
     */
    static setPiecePosition(player, piece, newPosition) {
        if(!playerPiecesElements[player] || !playerPiecesElements[player][piece]) {
            console.error(`Player element of given player: ${player} and piece: ${piece} not found`)
            return;
        }

        const [x, y] = COORDINATES_MAP[newPosition];
        const pieceElement = playerPiecesElements[player][piece];
        
        // Animation de déplacement fluide
        pieceElement.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        pieceElement.classList.add('piece-moving');
        
        pieceElement.style.top = y * STEP_LENGTH + '%';
        pieceElement.style.left = x * STEP_LENGTH + '%';
        
        // Retirer la classe d'animation après le déplacement
        setTimeout(() => {
            pieceElement.classList.remove('piece-moving');
        }, 500);
        
        // Mettre à jour le z-index pour gérer les superpositions
        this.updatePieceZIndex(player, piece, newPosition);
    }

    /**
     * Anime le déplacement case par case (comme version en ligne)
     */
    static async animatePieceMovement(player, piece, path) {
        if(!playerPiecesElements[player] || !playerPiecesElements[player][piece]) {
            console.error(`Player element not found: ${player} piece ${piece}`);
            return;
        }

        const pieceElement = playerPiecesElements[player][piece];
        pieceElement.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        pieceElement.classList.add('piece-moving');

        for (let i = 0; i < path.length; i++) {
            const position = path[i];
            if (!COORDINATES_MAP[position]) {
                console.error(`Coordonnées manquantes: ${position}`);
                continue;
            }

            const [x, y] = COORDINATES_MAP[position];
            
            await new Promise(resolve => {
                pieceElement.style.top = y * STEP_LENGTH + '%';
                pieceElement.style.left = x * STEP_LENGTH + '%';
                this.updatePieceZIndex(player, piece, position);

                const delay = i === path.length - 1 ? 400 : 200;
                setTimeout(resolve, delay);
            });
        }

        pieceElement.classList.remove('piece-moving');
    }

    /**
     * Animation de capture (comme version en ligne)
     */
    static animateCapture(player, piece) {
        const pieceElement = playerPiecesElements[player][piece];
        pieceElement.classList.add('captured');
        
        setTimeout(() => {
            pieceElement.classList.remove('captured');
        }, 800);
    }

    /**
     * Animation de retour à la base après capture
     */
    static async animateCaptureReturn(player, piece, fromPosition, toPosition) {
        if (!playerPiecesElements[player] || !playerPiecesElements[player][piece]) {
            console.error(`Player element not found: ${player} piece ${piece}`);
            return;
        }

        const pieceElement = playerPiecesElements[player][piece];
        pieceElement.style.transition = 'all 0.5s ease-in-out';
        pieceElement.classList.add('captured');

        await new Promise(resolve => {
            pieceElement.style.transform = 'translate(50%, 50%) scale(1.5)';
            pieceElement.style.opacity = '0.7';
            setTimeout(resolve, 300);
        });

        const [x, y] = COORDINATES_MAP[toPosition];
        pieceElement.style.top = y * STEP_LENGTH + '%';
        pieceElement.style.left = x * STEP_LENGTH + '%';

        await new Promise(resolve => {
            setTimeout(() => {
                pieceElement.style.transform = 'translate(50%, 50%) scale(1)';
                pieceElement.style.opacity = '1';
                pieceElement.classList.remove('captured');
                resolve();
            }, 500);
        });

        this.updatePieceZIndex(player, piece, toPosition);
    }

    static updatePieceZIndex(player, piece, position) {
        const pieceElement = playerPiecesElements[player][piece];
        
        // Réinitialiser la position pour cette case
        if (!positionMap.has(position)) {
            positionMap.set(position, []);
        }
        
        const piecesAtPosition = positionMap.get(position);
        
        // Retirer cette pièce de son ancienne position si elle y était
        positionMap.forEach((pieces, pos) => {
            const index = pieces.findIndex(p => p.player === player && p.piece === piece);
            if (index > -1) {
                pieces.splice(index, 1);
            }
        });
        
        // Ajouter cette pièce à la nouvelle position
        piecesAtPosition.push({ player, piece, element: pieceElement });
        
        // Mettre à jour les z-index pour que la dernière pièce ajoutée soit au dessus
        piecesAtPosition.forEach((p, index) => {
            p.element.style.zIndex = 10 + index;
        });
    }

    static setTurn(index) {
        if(index < 0 || index >= PLAYERS.length) {
            console.error('index out of bound!');
            return;
        }
        
        const player = PLAYERS[index];

        // Display player ID
        document.querySelector('.active-player span').innerText = player;

        const activePlayerBase = document.querySelector('.player-base.highlight');
        if(activePlayerBase) {
            activePlayerBase.classList.remove('highlight');
        }
        // highlight
        document.querySelector(`[player-id="${player}"].player-base`).classList.add('highlight');
        
        // Mettre les pièces du joueur actuel au premier plan
        this.bringPlayerPiecesToFront(player);
    }

    static bringPlayerPiecesToFront(currentPlayer) {
        // Pour toutes les positions, mettre les pièces du joueur actuel au-dessus
        positionMap.forEach((piecesAtPosition) => {
            // Trier: pièces du joueur actuel en dernier (donc au-dessus)
            piecesAtPosition.sort((a, b) => {
                if (a.player === currentPlayer && b.player !== currentPlayer) return 1;
                if (a.player !== currentPlayer && b.player === currentPlayer) return -1;
                return 0;
            });
            
            // Appliquer les nouveaux z-index
            piecesAtPosition.forEach((p, index) => {
                p.element.style.zIndex = 10 + index;
            });
        });
    }

    static enableDice() {
        diceButtonElement.removeAttribute('disabled');
    }

    static disableDice() {
        diceButtonElement.setAttribute('disabled', '');
    }

    /**
     * 
     * @param {string} player 
     * @param {Number[]} pieces 
     */
    static highlightPieces(player, pieces) {
        // Mettre les pièces du joueur actuel au premier plan avant de les highlight
        this.bringPlayerPiecesToFront(player);
        
        pieces.forEach(piece => {
            const pieceElement = playerPiecesElements[player][piece];
            pieceElement.classList.add('highlight');
            // S'assurer que les pièces highlightées sont visibles
            pieceElement.style.zIndex = 100;
        });
    }

    static unhighlightPieces() {
        document.querySelectorAll('.player-piece.highlight').forEach(ele => {
            ele.classList.remove('highlight');
        });
        
        // Restaurer les z-index normaux après avoir enlevé le highlight
        const currentPlayer = document.querySelector('.active-player span').innerText;
        this.bringPlayerPiecesToFront(currentPlayer);
    }

    static setDiceValue(value) {
        const diceElement = document.querySelector('.dice');
        
        // Ajouter l'animation de lancer
        diceElement.classList.add('rolling');
        
        // Après l'animation, afficher la bonne face
        setTimeout(() => {
            diceElement.classList.remove('rolling');
            diceElement.setAttribute('data-value', value);
        }, 1000);
    }

    // Nouvelle méthode pour réinitialiser la positionMap
    static resetPositionMap() {
        positionMap.clear();
    }

    // Méthodes pour le timer
    static updateTimer(timeLeft) {
        // Créer ou mettre à jour l'affichage du timer
        let timerElement = document.querySelector('.turn-timer');
        
        if (!timerElement) {
            timerElement = document.createElement('div');
            timerElement.className = 'turn-timer';
            // Insérer le timer en haut du footer
            const footer = document.querySelector('.footer');
            footer.insertBefore(timerElement, footer.firstChild);
        }
        
        timerElement.innerHTML = `
            <div class="timer-display">
                <span class="timer-label">Time Left:</span>
                <span class="timer-value ${timeLeft <= 5 ? 'warning' : ''}">${timeLeft}s</span>
            </div>
            <div class="timer-bar">
                <div class="timer-progress" style="width: ${(timeLeft / 10) * 100}%"></div>
            </div>
        `;
        
        // Ajouter une animation de pulse si le temps est critique
        if (timeLeft <= 3) {
            timerElement.classList.add('critical');
        } else {
            timerElement.classList.remove('critical');
        }
    }

    static hideTimer() {
        const timerElement = document.querySelector('.turn-timer');
        if (timerElement) {
            timerElement.remove();
        }
    }

    /**
     * NOUVEAU : Affiche le popup de victoire (comme version en ligne)
     */
    static showWinnerPopup(winnerName, isCurrentPlayer = false, customMessage = null) {
        // Désactiver le jeu pendant l'affichage du popup
        document.querySelector('.ludo-container').classList.add('game-disabled');

        const overlay = document.createElement('div');
        overlay.className = 'winner-popup';

        const popup = document.createElement('div');
        
        const crownIcon = document.createElement('div');
        crownIcon.textContent = '👑';
        crownIcon.style.fontSize = '3rem';
        crownIcon.style.marginBottom = '1rem';
        crownIcon.style.animation = 'bounce 2s infinite';

        const title = document.createElement('h2');
        title.textContent = '🎉 Partie Terminée !';

        const message = document.createElement('p');
        if (customMessage) {
            message.innerHTML = customMessage.replace(/\n/g, '<br>');
        } else if (isCurrentPlayer) {
            message.textContent = 'FÉLICITATIONS ! Vous avez gagné la partie ! 🏆';
        } else {
            message.textContent = `${winnerName} a gagné la partie ! 🏆`;
        }

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';

        const menuButton = document.createElement('button');
        menuButton.textContent = 'Rejouer';
        menuButton.onclick = () => {
            document.querySelector('.ludo-container').classList.remove('game-disabled');
            overlay.remove();
            // Redémarrer le jeu
            if (typeof window.resetGame === 'function') {
                window.resetGame();
            }
        };

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Fermer';
        closeButton.style.background = 'linear-gradient(135deg, #ff006e, #7b2ff7)';
        closeButton.onclick = () => {
            document.querySelector('.ludo-container').classList.remove('game-disabled');
            overlay.remove();
        };

        buttonContainer.appendChild(menuButton);
        buttonContainer.appendChild(closeButton);

        popup.appendChild(crownIcon);
        popup.appendChild(title);
        popup.appendChild(message);
        popup.appendChild(buttonContainer);
        overlay.appendChild(popup);

        document.body.appendChild(overlay);

        // Effets de confetti
        this.createConfettiEffect();
    }

    /**
     * NOUVEAU : Crée l'effet confetti (comme version en ligne)
     */
    static createConfettiEffect() {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500'];
        const confettiCount = 50;

        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.width = Math.random() * 10 + 5 + 'px';
                confetti.style.height = Math.random() * 10 + 5 + 'px';
                confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';

                document.body.appendChild(confetti);

                setTimeout(() => {
                    if (confetti.parentNode) {
                        confetti.parentNode.removeChild(confetti);
                    }
                }, 3000);
            }, i * 100);
        }
    }
}