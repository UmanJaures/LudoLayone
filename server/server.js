/**
 * Serveur Ludo en Ligne - Version modulaire multi-versions
 * ADAPTÉ POUR LA VERSION 4 JOUEURS
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

import { PORT, HOSTNAME } from './config.js';
import { GameMode2 } from './modes/game-mode-2.js';
import { GameMode3 } from './modes/game-mode-3.js';
import { GameMode4 } from './modes/game-mode-4.js'; // ✅ AJOUT : Import du GameMode4
import { Game } from './games/Game.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// ===== ROUTES POUR LES DIFFÉRENTES VERSIONS =====

// ✅ CORRECTION : Servir les fichiers statiques depuis la racine du projet
app.use(express.static(path.join(__dirname, '..')));

app.use('/v2', express.static(path.join(__dirname, '../client')));
app.use('/v3', express.static(path.join(__dirname, '../client1')));
app.use('/v4', express.static(path.join(__dirname, '../client2')));

// ✅ CORRECTION : Rediriger vers la page d'accueil page.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../page.html'));
});

// ===== GESTION DES JEUX =====

const games = new Map();
const players = new Map();
const spectators = new Map();

// ===== SOCKET.IO EVENTS =====

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // ===== CREATE GAME =====
    socket.on('create-game', (data) => {
        const { playerName, gameMode = 2 } = data;

        // VALIDATION DU NOM - CORRECTION AJOUTÉE
        if (!playerName || playerName.trim().length < 2) {
            socket.emit('error', 'Le nom doit contenir au moins 2 caractères');
            return;
        }

        let mode;
        switch (gameMode) {
            case 3:
                mode = GameMode3;
                break;
            case 4: // ✅ AJOUT : Cas pour 4 joueurs
                mode = GameMode4;
                break;
            case 2:
            default:
                mode = GameMode2;
        }

        const gameId = Math.random().toString(36).substring(2, 6).toUpperCase();
        const game = new Game(gameId, mode);

        try {
            const player = game.addPlayer(socket.id, playerName);
            games.set(gameId, game);
            players.set(socket.id, { gameId, role: player.role });

            socket.join(gameId + '_players');
            socket.emit('game-created', { gameId, player: player.role, gameMode });

            console.log('Game created:', { gameId, gameMode, player: playerName });
        } catch (error) {
            socket.emit('error', error.message);
        }
    });

    // ===== JOIN GAME =====
    socket.on('join-game', (data) => {
        const { gameId, playerName } = data;

        const game = games.get(gameId);
        if (!game) {
            socket.emit('error', 'Game not found');
            return;
        }

        try {
            const player = game.addPlayer(socket.id, playerName);
            players.set(socket.id, { gameId, role: player.role });
            socket.join(gameId + '_players');

            // Notifier tous les joueurs
            io.to(gameId + '_players').emit('player-joined', player);
            
            // Si la partie est complète, envoyer l'événement 'game-ready'
            if (game.players.length === game.gameMode.TOTAL_PLAYERS) {
                io.to(gameId + '_players').emit('game-ready', game.getClientData());
            }

            console.log('Player joined:', { gameId, player: playerName });
        } catch (error) {
            socket.emit('error', error.message);
        }
    });

    // ===== WATCH GAME =====
    socket.on('watch-game', (data) => {
        const { gameId, spectatorName } = data;

        const game = games.get(gameId);
        if (!game) {
            socket.emit('error', 'Game not found');
            return;
        }

        const spectator = game.addSpectator(socket.id, spectatorName);
        spectators.set(socket.id, { gameId, name: spectatorName });
        socket.join(gameId + '_spectators');

        socket.emit('spectate-mode', game.getClientData());

        console.log('Spectator joined:', { gameId, spectator: spectatorName });
    });

    // ===== ROLL DICE =====
    socket.on('roll-dice', (gameId) => {
        const game = games.get(gameId);
        if (!game) {
            socket.emit('error', 'Game not found');
            return;
        }

        const playerData = players.get(socket.id);
        if (!playerData || playerData.role !== game.currentTurn) {
            return;
        }

        const diceValue = 1 + Math.floor(Math.random() * 6);
        game.lastDiceValue = diceValue;

        io.to(gameId + '_players').emit('dice-rolled', {
            value: diceValue,
            player: game.currentTurn
        });

        io.to(gameId + '_spectators').emit('dice-rolled', {
            value: diceValue,
            player: game.currentTurn
        });

        console.log('Dice rolled:', { gameId, player: game.currentTurn, value: diceValue });
    });

    // ===== MOVE PIECE =====
    socket.on('move-piece', (data) => {
        const { gameId, player, piece, newPosition, oldPosition } = data;

        const game = games.get(gameId);
        if (!game) {
            socket.emit('error', 'Game not found');
            return;
        }

        const playerData = players.get(socket.id);
        if (!playerData || playerData.role !== player) {
            socket.emit('error', 'Invalid player');
            return;
        }

        if (player !== game.currentTurn) {
            socket.emit('error', 'Not your turn');
            return;
        }

        // Cas spécial: passe ton tour
        if (newPosition === -1 || newPosition === -2) {
            // ✅ CORRECTION : Utiliser la liste des joueurs actifs pour le passage de tour
            const activePlayerRoles = game.players.map(p => p.role);
            game.currentTurn = game.gameMode.getNextPlayer(player, game.lastDiceValue, false, activePlayerRoles);
            io.to(gameId + '_players').emit('turn-changed', game.currentTurn);
            io.to(gameId + '_spectators').emit('turn-changed', game.currentTurn);
            return;
        }

        // Vérifier la position actuelle
        if (game.positions[player][piece] !== oldPosition) {
            socket.emit('position_mismatch', {
                expected: game.positions[player][piece],
                piece: piece,
                player: player
            });
            return;
        }

        // Gérer les captures
        const capturedPiece = game.gameMode.checkAndHandleCapture(game, player, newPosition);

        // Mettre à jour la position
        game.positions[player][piece] = newPosition;

        // Vérifier la victoire
        const winner = game.gameMode.checkWinner(game, player);

        // Émettre l'événement de mouvement
        const moveData = {
            player,
            piece,
            newPosition,
            captured: capturedPiece
        };

        io.to(gameId + '_players').emit('piece-moved', moveData);

        // Événement pour spectateurs
        io.to(gameId + '_spectators').emit('spectator-move', {
            player,
            piece,
            from: oldPosition,
            to: newPosition,
            dice: game.lastDiceValue,
            captured: !!capturedPiece,
            winner: winner
        });

        // Gérer la victoire
        if (winner) {
            const winnerName = game.getPlayerNameByRole(winner);
            io.to(gameId + '_players').emit('game-winner', {
                winner,
                winnerName,
                winType: 'normal'
            });
            
            io.to(gameId + '_spectators').emit('game-winner', {
                winner,
                winnerName,
                winType: 'normal'
            });
        } else {
            // ✅ CORRECTION : Utiliser la liste des joueurs actifs pour le passage de tour
            const activePlayerRoles = game.players.map(p => p.role);
            
            // Changer de tour
            game.currentTurn = game.gameMode.getNextPlayer(player, game.lastDiceValue, true, activePlayerRoles);
            io.to(gameId + '_players').emit('turn-changed', game.currentTurn);
            io.to(gameId + '_spectators').emit('turn-changed', game.currentTurn);
        }

        console.log('Piece moved:', { gameId, player, piece, from: oldPosition, to: newPosition });
    });

    // ===== DISCONNECT =====
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        const playerData = players.get(socket.id);
        if (playerData) {
            const game = games.get(playerData.gameId);
            if (game) {
                const playerRole = playerData.role;
                const playerName = game.getPlayerNameByRole(playerRole);
                
                // ✅ CORRECTION : Sauvegarder si c'était le tour du joueur AVANT de le retirer
                const wasCurrentTurn = (game.currentTurn === playerRole);
                
                // Retirer le joueur
                game.removeUser(socket.id);
                
                // ✅ CORRECTION UNIFIÉE : LOGIQUE SIMPLIFIÉE POUR TOUS LES MODES
                // Si il ne reste qu'un seul joueur, il gagne par abandon
                const abandonWinner = (game.players.length === 1) ? game.players[0].role : null;

                // Notifier tous les joueurs qu'un joueur a quitté
                io.to(playerData.gameId + '_players').emit('player-left', {
                    playerRole: playerRole,
                    playerName: playerName,
                    remainingPlayers: game.players.length,
                    wasCurrentTurn: wasCurrentTurn
                });
                
                io.to(playerData.gameId + '_spectators').emit('player-left', {
                    playerRole: playerRole, 
                    playerName: playerName,
                    remainingPlayers: game.players.length,
                    wasCurrentTurn: wasCurrentTurn
                });

                console.log('Player left game:', { 
                    gameId: playerData.gameId, 
                    player: playerRole,
                    playerName: playerName,
                    remainingPlayers: game.players.length,
                    wasCurrentTurn: wasCurrentTurn
                });

                // ✅ CORRECTION UNIFIÉE : Gestion de la victoire par abandon POUR TOUS LES MODES
                if (abandonWinner) {
                    const winnerName = game.getPlayerNameByRole(abandonWinner);
                    
                    console.log('🎉 Auto-winning by abandon:', { 
                        gameId: playerData.gameId, 
                        winner: abandonWinner,
                        winnerName: winnerName,
                        remainingPlayers: game.players.length 
                    });

                    // Émettre l'événement de victoire
                    io.to(playerData.gameId + '_players').emit('game-winner', {
                        winner: abandonWinner,
                        winnerName: winnerName,
                        winType: 'abandon'
                    });

                    io.to(playerData.gameId + '_spectators').emit('game-winner', {
                        winner: abandonWinner,
                        winnerName: winnerName,
                        winType: 'abandon'
                    });

                    // Marquer la partie comme terminée
                    game.state = 'finished';
                    game.winner = abandonWinner;
                    game.winType = 'abandon';

                    // Supprimer la partie après un délai
                    setTimeout(() => {
                        if (games.has(playerData.gameId)) {
                            games.delete(playerData.gameId);
                            console.log('Game deleted after automatic win:', playerData.gameId);
                        }
                    }, 30000); // 30 secondes après la victoire
                }
                // ✅ CORRECTION : Ne supprimer la partie QUE si AUCUN joueur ne reste
                else if (game.players.length === 0) {
                    games.delete(playerData.gameId);
                    console.log('Game deleted (no players left):', playerData.gameId);
                } else {
                    // ✅ CORRECTION AMÉLIORÉE : Si c'était le tour du joueur qui a quitté, passer automatiquement au joueur suivant
                    if (wasCurrentTurn) {
                        console.log('Auto-passing turn after player left:', {
                            gameId: playerData.gameId,
                            previousPlayer: playerRole,
                            remainingPlayers: game.players.map(p => p.role)
                        });
                        
                        // ✅ CORRECTION CRITIQUE : Passer la liste des joueurs actifs (ceux qui sont encore dans la partie)
                        const activePlayerRoles = game.players.map(p => p.role);
                        
                        game.currentTurn = game.gameMode.getNextPlayer(
                            playerRole, 
                            game.lastDiceValue, 
                            false, 
                            activePlayerRoles
                        );
                        
                        // Notifier du changement de tour
                        io.to(playerData.gameId + '_players').emit('turn-changed', game.currentTurn);
                        io.to(playerData.gameId + '_spectators').emit('turn-changed', game.currentTurn);
                        
                        console.log('Turn automatically passed after disconnect:', {
                            gameId: playerData.gameId,
                            previousPlayer: playerRole,
                            newPlayer: game.currentTurn,
                            activePlayers: activePlayerRoles
                        });
                    }
                }
            }
            players.delete(socket.id);
        }

        const spectatorData = spectators.get(socket.id);
        if (spectatorData) {
            const game = games.get(spectatorData.gameId);
            if (game) {
                game.removeUser(socket.id);
            }
            spectators.delete(socket.id);
        }
    });
});

// ===== START SERVER =====

server.listen(PORT, HOSTNAME, () => {
    console.log(`🎮 Serveur Ludo multi-versions démarré sur http://${HOSTNAME}:${PORT}`);
    console.log(`🏠 Page d'accueil: http://${HOSTNAME}:${PORT}/`);
    console.log(`📊 Versions supportées: 2, 3 et 4 joueurs`);
    console.log(`🎯 Accès direct aux versions:`);
    console.log(`   - Version 2 joueurs: http://${HOSTNAME}:${PORT}/v2`);
    console.log(`   - Version 3 joueurs: http://${HOSTNAME}:${PORT}/v3`);
    console.log(`   - Version 4 joueurs: http://${HOSTNAME}:${PORT}/v4`);
});