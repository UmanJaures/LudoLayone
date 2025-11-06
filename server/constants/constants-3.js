/**
 * Constantes pour la version 3 joueurs
 * CORRIGÉ : Base P3 (rouge) en bas à droite
 */

export const BASE_POSITIONS = {
    P1: [500, 501, 502, 503], // Bas gauche (bleu)
    P2: [600, 601, 602, 603], // Haut droit (vert)
    P3: [700, 701, 702, 703]  // Bas droit (rouge) - CORRIGÉ
};

export const START_POSITIONS = {
    P1: 0,  // Côté gauche
    P2: 26, // Côté haut  
    P3: 39  // Côté droit - CORRIGÉ
};

export const HOME_ENTRANCE = {
    P1: [100, 101, 102, 103, 104], // Bas gauche
    P2: [200, 201, 202, 203, 204], // Haut droit
    P3: [300, 301, 302, 303, 304]  // Bas droit - CORRIGÉ
};

export const HOME_POSITIONS = {
    P1: 105, // Bas gauche
    P2: 205, // Haut droit
    P3: 305  // Bas droit - CORRIGÉ
};

export const TURNING_POINTS = {
    P1: 50, // Bas gauche
    P2: 24, // Haut droit
    P3: 37  // Bas droit - CORRIGÉ
};

export const SAFE_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47];