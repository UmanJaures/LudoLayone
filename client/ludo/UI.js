import { COORDINATES_MAP, PLAYERS, STEP_LENGTH, HOME_ENTRANCE, HOME_POSITIONS, TURNING_POINTS, BASE_POSITIONS, START_POSITIONS } from './constants.js';

const diceButtonElement = document.querySelector('#dice-btn');
const playerPiecesElements = {
    P1: document.querySelectorAll('[player-id="P1"].player-piece'),
    P2: document.querySelectorAll('[player-id="P2"].player-piece'),
};

const positionMap = new Map();

export class UI {
    static listenDiceClick(callback) {
        diceButtonElement.addEventListener('click', callback);
    }

    static listenResetClick(callback) {
        document.querySelector('button#reset-btn').addEventListener('click', callback);
    }

    static listenPieceClick(callback) {
        document.querySelector('.player-pieces').addEventListener('click', callback);
    }

    static setPiecePosition(player, piece, newPosition) {
        if (!playerPiecesElements[player] || !playerPiecesElements[player][piece]) {
            console.error(`Player element not found: ${player} piece ${piece}`);
            return;
        }

        const [x, y] = COORDINATES_MAP[newPosition];
        const pieceElement = playerPiecesElements[player][piece];

        pieceElement.style.transition = 'all 0.5s ease-in-out';
        pieceElement.style.top = y * STEP_LENGTH + '%';
        pieceElement.style.left = x * STEP_LENGTH + '%';

        this.updatePieceZIndex(player, piece, newPosition);
    }

    static calculatePath(player, startPosition, diceValue) {
        const path = [];
        let current = startPosition;

        if (BASE_POSITIONS[player].includes(startPosition)) {
            return path;
        }

        for (let step = 0; step < diceValue; step++) {
            if (current === HOME_POSITIONS[player]) {
                path.push(current);
                continue;
            }

            if (HOME_ENTRANCE[player].includes(current)) {
                const entranceIndex = HOME_ENTRANCE[player].indexOf(current);
                const newIndex = entranceIndex + 1;

                if (newIndex < HOME_ENTRANCE[player].length) {
                    current = HOME_ENTRANCE[player][newIndex];
                } else if (newIndex === HOME_ENTRANCE[player].length) {
                    current = HOME_POSITIONS[player];
                } else {
                    break;
                }
                path.push(current);
                continue;
            }

            if (current === TURNING_POINTS[player]) {
                current = HOME_ENTRANCE[player][0];
            } else if (current === 51) {
                current = 0;
            } else if (current >= 0 && current < 51) {
                current += 1;
            } else {
                console.warn(`Position invalide: ${current}`);
                break;
            }

            path.push(current);
        }

        return path;
    }

    static async animatePieceMovement(player, piece, startPosition, endPosition, diceValue) {
        if (!playerPiecesElements[player] || !playerPiecesElements[player][piece]) {
            console.error(`Player element not found: ${player} piece ${piece}`);
            return;
        }

        const pieceElement = playerPiecesElements[player][piece];

        pieceElement.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        pieceElement.classList.add('piece-moving');

        const path = this.calculatePath(player, startPosition, diceValue);

        if (path.length > 0 && path[path.length - 1] !== endPosition) {
            console.error(`Incohérence chemin/destination: ${path[path.length - 1]} vs ${endPosition}`);
        }

        if (path.length === 0) {
            if (COORDINATES_MAP[endPosition]) {
                const [x, y] = COORDINATES_MAP[endPosition];
                pieceElement.style.top = y * STEP_LENGTH + '%';
                pieceElement.style.left = x * STEP_LENGTH + '%';
            }
            pieceElement.classList.remove('piece-moving');
            this.updatePieceZIndex(player, piece, endPosition);
            return;
        }

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

                const delay = i === path.length - 1 ? 400 : 250;
                setTimeout(resolve, delay);
            });
        }

        pieceElement.classList.remove('piece-moving');
    }

    static async animateBaseExit(player, piece, fromPosition, toPosition) {
        if (!playerPiecesElements[player] || !playerPiecesElements[player][piece]) {
            console.error(`Player element not found: ${player} piece ${piece}`);
            return;
        }

        const pieceElement = playerPiecesElements[player][piece];

        pieceElement.style.transition = 'all 0.5s ease-in-out';
        pieceElement.classList.add('base-exit');

        await new Promise(resolve => {
            pieceElement.style.transform = 'translate(50%, 50%) scale(1.3)';
            setTimeout(resolve, 200);
        });

        const [x, y] = COORDINATES_MAP[toPosition];
        pieceElement.style.top = y * STEP_LENGTH + '%';
        pieceElement.style.left = x * STEP_LENGTH + '%';

        await new Promise(resolve => {
            setTimeout(() => {
                pieceElement.style.transform = 'translate(50%, 50%) scale(1)';
                pieceElement.classList.remove('base-exit');
                resolve();
            }, 300);
        });

        this.updatePieceZIndex(player, piece, toPosition);
    }

    static async animateHomeEntrance(player, piece, fromPosition, toPosition) {
        if (!playerPiecesElements[player] || !playerPiecesElements[player][piece]) {
            console.error(`Player element not found: ${player} piece ${piece}`);
            return;
        }

        const pieceElement = playerPiecesElements[player][piece];
        pieceElement.style.transition = 'all 0.4s ease-in-out';
        pieceElement.classList.add('home-entrance');

        await new Promise(resolve => {
            pieceElement.style.transform = 'translate(50%, 50%) scale(0.1)';
            pieceElement.style.opacity = '0';
            pieceElement.style.filter = 'blur(5px)';
            setTimeout(resolve, 400);
        });

        const [x, y] = COORDINATES_MAP[toPosition];
        pieceElement.style.top = y * STEP_LENGTH + '%';
        pieceElement.style.left = x * STEP_LENGTH + '%';

        await new Promise(resolve => {
            setTimeout(() => {
                pieceElement.style.transform = 'translate(50%, 50%) scale(1.2)';
                pieceElement.style.opacity = '1';
                pieceElement.style.filter = 'blur(0)';
                setTimeout(resolve, 200);
            }, 50);
        });

        await new Promise(resolve => {
            pieceElement.style.transform = 'translate(50%, 50%) scale(1)';
            setTimeout(() => {
                pieceElement.classList.remove('home-entrance');
                resolve();
            }, 300);
        });

        this.updatePieceZIndex(player, piece, toPosition);
    }

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
            pieceElement.style.background = 'rgba(255, 0, 0, 0.5)';
            setTimeout(resolve, 300);
        });

        const [x, y] = COORDINATES_MAP[toPosition];
        pieceElement.style.top = y * STEP_LENGTH + '%';
        pieceElement.style.left = x * STEP_LENGTH + '%';

        await new Promise(resolve => {
            setTimeout(() => {
                pieceElement.style.transform = 'translate(50%, 50%) scale(1)';
                pieceElement.style.opacity = '1';
                pieceElement.style.background = '';
                pieceElement.classList.remove('captured');
                resolve();
            }, 500);
        });

        this.updatePieceZIndex(player, piece, toPosition);
    }

    static updatePieceZIndex(player, piece, position) {
        const pieceElement = playerPiecesElements[player][piece];

        if (!positionMap.has(position)) {
            positionMap.set(position, []);
        }

        const piecesAtPosition = positionMap.get(position);

        positionMap.forEach((pieces, pos) => {
            const index = pieces.findIndex(p => p.player === player && p.piece === piece);
            if (index > -1) {
                pieces.splice(index, 1);
            }
        });

        piecesAtPosition.push({ player, piece, element: pieceElement });

        // ✅ CORRECTION : Récupérer l'ID du joueur actif depuis la base highlightée
        const activePlayerBase = document.querySelector('.player-base.highlight');
        const currentPlayer = activePlayerBase ? activePlayerBase.getAttribute('player-id') : null;

        piecesAtPosition.sort((a, b) => {
            if ((a.player === currentPlayer && b.player === currentPlayer) ||
                (a.player !== currentPlayer && b.player !== currentPlayer)) {
                return 0;
            }
            if (a.player === currentPlayer) return 1;
            if (b.player === currentPlayer) return -1;
            return 0;
        });

        piecesAtPosition.forEach((p, index) => {
            const baseZIndex = p.player === currentPlayer ? 50 : 10;
            p.element.style.zIndex = baseZIndex + index;
        });
    }

    // ✅ MODIFICATION CRITIQUE : MÉTHODE setTurn MISE À JOUR
    static setTurn(playerId, playerName) {
        if (!PLAYERS.includes(playerId)) {
            console.error('Player ID not found!');
            return;
        }

        console.log('🔄 UI.setTurn called with:', { playerId, playerName });

        // ✅ Afficher le nom du joueur au lieu de l'ID
        const activePlayerSpan = document.querySelector('.active-player span');
        if (activePlayerSpan) {
            activePlayerSpan.innerText = playerName;
            console.log('✅ Active player span updated to:', playerName);
        }

        const activePlayerBase = document.querySelector('.player-base.highlight');
        if (activePlayerBase) {
            activePlayerBase.classList.remove('highlight');
        }

        document.querySelector(`[player-id="${playerId}"].player-base`).classList.add('highlight');
        this.bringCurrentPlayerPiecesToFront(playerId);
    }

    static bringCurrentPlayerPiecesToFront(currentPlayerId) {
        positionMap.forEach(piecesAtPosition => {
            piecesAtPosition.sort((a, b) => {
                if (a.player === currentPlayerId && b.player !== currentPlayerId) return 1;
                if (a.player !== currentPlayerId && b.player === currentPlayerId) return -1;
                return 0;
            });

            piecesAtPosition.forEach((p, index) => {
                const baseZIndex = p.player === currentPlayerId ? 50 : 10;
                p.element.style.zIndex = baseZIndex + index;
            });
        });
    }

    static enableDice() {
        diceButtonElement.removeAttribute('disabled');
    }

    static disableDice() {
        diceButtonElement.setAttribute('disabled', '');
    }

    static highlightPieces(player, pieces) {
        // ✅ CORRECTION CRITIQUE : Utiliser l'ID du joueur depuis la base highlightée
        const activePlayerBase = document.querySelector('.player-base.highlight');
        const currentPlayerId = activePlayerBase ? activePlayerBase.getAttribute('player-id') : player;
        
        this.bringCurrentPlayerPiecesToFront(currentPlayerId);

        pieces.forEach(piece => {
            const pieceElement = playerPiecesElements[player][piece];
            pieceElement.classList.add('highlight');
            pieceElement.style.zIndex = 100;
        });
    }

    static unhighlightPieces() {
        document.querySelectorAll('.player-piece.highlight').forEach(ele => {
            ele.classList.remove('highlight');
        });

        // ✅ CORRECTION CRITIQUE : Utiliser l'ID du joueur depuis la base highlightée
        const activePlayerBase = document.querySelector('.player-base.highlight');
        const currentPlayerId = activePlayerBase ? activePlayerBase.getAttribute('player-id') : null;
        if (currentPlayerId) {
            this.bringCurrentPlayerPiecesToFront(currentPlayerId);
        }
    }

    static setDiceValue(value) {
        const diceElement = document.querySelector('.dice');
        diceElement.classList.add('rolling');
        setTimeout(() => {
            diceElement.classList.remove('rolling');
            diceElement.setAttribute('data-value', value);
        }, 1000);
    }

    static resetPositionMap() {
        positionMap.clear();
    }

    static updateTimer(timeLeft) {
        let timerElement = document.querySelector('.turn-timer');

        if (!timerElement) {
            timerElement = document.createElement('div');
            timerElement.className = 'turn-timer';
            const footer = document.querySelector('.footer');
            footer.insertBefore(timerElement, footer.firstChild);
        }

        timerElement.innerHTML = `
            <div class="timer-display">
                <span class="timer-label">Time Left:</span>
                <span class="timer-value ${timeLeft <= 5 ? 'warning' : ''}">${timeLeft}s</span>
            </div>
            <div class="timer-bar">
                <div class="timer-progress" style="width: ${(timeLeft / 15) * 100}%"></div>
            </div>
        `;

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

    static showWinnerPopup(winnerName, isCurrentPlayer, customMessage = null) {
        const overlay = document.createElement('div');
        overlay.className = 'winner-popup';

        const popup = document.createElement('div');

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

        if (customMessage && customMessage.includes('abandon')) {
            const abandonBadge = document.createElement('div');
            abandonBadge.textContent = '🏃‍♂️ Victoire par Abandon';
            abandonBadge.className = 'abandon-badge';
            popup.appendChild(abandonBadge);
        }

        const menuButton = document.createElement('button');
        menuButton.textContent = 'Retour au Menu Principal';

        menuButton.onmouseover = () => {
            menuButton.style.transform = 'translateY(-3px)';
        };

        menuButton.onmouseout = () => {
            menuButton.style.transform = 'translateY(0)';
        };

        menuButton.onclick = () => {
            window.location.href = 'index.html';
        };

        const crownIcon = document.createElement('div');
        crownIcon.textContent = '👑';
        crownIcon.style.fontSize = '3rem';
        crownIcon.style.marginBottom = '1rem';
        crownIcon.style.animation = 'bounce 2s infinite';

        popup.appendChild(crownIcon);
        popup.appendChild(title);
        popup.appendChild(message);
        popup.appendChild(menuButton);
        overlay.appendChild(popup);

        document.body.appendChild(overlay);

        const style = document.createElement('style');
        style.textContent = `
        .abandon-badge {
            background-color: #ff6b6b;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: bold;
            margin-bottom: 1rem;
            display: inline-block;
        }
        
        @keyframes popupAppear {
            0% {
                opacity: 0;
                transform: scale(0.5) translateY(-50px);
            }
            70% {
                transform: scale(1.05) translateY(10px);
            }
            100% {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
        
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
                transform: translateY(0);
            }
            40% {
                transform: translateY(-10px);
            }
            60% {
                transform: translateY(-5px);
            }
        }
    `;
        document.head.appendChild(style);

        this.createConfettiEffect();
    }

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