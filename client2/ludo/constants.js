export const COORDINATES_MAP = {
    0: [6, 13],
    1: [6, 12],
    2: [6, 11],
    3: [6, 10],
    4: [6, 9],
    5: [5, 8],
    6: [4, 8],
    7: [3, 8],
    8: [2, 8],
    9: [1, 8],
    10: [0, 8],
    11: [0, 7],
    12: [0, 6],
    13: [1, 6],
    14: [2, 6],
    15: [3, 6],
    16: [4, 6],
    17: [5, 6],
    18: [6, 5],
    19: [6, 4],
    20: [6, 3],
    21: [6, 2],
    22: [6, 1],
    23: [6, 0],
    24: [7, 0],
    25: [8, 0],
    26: [8, 1],
    27: [8, 2],
    28: [8, 3],
    29: [8, 4],
    30: [8, 5],
    31: [9, 6],
    32: [10, 6],
    33: [11, 6],
    34: [12, 6],
    35: [13, 6],
    36: [14, 6],
    37: [14, 7],
    38: [14, 8],
    39: [13, 8],
    40: [12, 8],
    41: [11, 8],
    42: [10, 8],
    43: [9, 8],
    44: [8, 9],
    45: [8, 10],
    46: [8, 11],
    47: [8, 12],
    48: [8, 13],
    49: [8, 14],
    50: [7, 14],
    51: [6, 14],

    // HOME ENTRANCE

    // P1 (Bleu) - Bas gauche
    100: [7, 13],
    101: [7, 12],
    102: [7, 11],
    103: [7, 10],
    104: [7, 9],
    105: [7, 8],

    // P2 (Vert) - Haut droit
    200: [7, 1],
    201: [7, 2],
    202: [7, 3],
    203: [7, 4],
    204: [7, 5],
    205: [7, 6],

    // P3 (Rouge) - Bas droit
    300: [13, 7],
    301: [12, 7],
    302: [11, 7],
    303: [10, 7],
    304: [9, 7],
    305: [8, 7],

    // P4 (Jaune) - Haut gauche - NOUVEAU
    400: [1, 7],
    401: [2, 7],
    402: [3, 7],
    403: [4, 7],
    404: [5, 7],
    405: [6, 7],

    // BASE POSITIONS

    // P1 (Bleu) - Bas gauche
    500: [2.0, 10.58],
    501: [3.50, 10.58],
    502: [2.0, 12.15],
    503: [3.50, 12.15],

    // P2 (Vert) - Haut droit
    600: [10.6, 2.0],
    601: [12.15, 2.0],
    602: [10.6, 3.5],
    603: [12.15, 3.5],

    // P3 (Rouge) - Bas droit
    700: [12.15, 10.58],
    701: [12.15, 12.15],
    702: [10.6, 12.15],
    703: [10.6, 10.58],

    // P4 (Jaune) - Haut gauche - NOUVEAU
    800: [2.0, 2.0],
    801: [3.5, 2.0],
    802: [2.0, 3.5],
    803: [3.5, 3.5],
};

export const STEP_LENGTH = 6.66;

// ✅ MIS À JOUR : Ordre des joueurs pour 4 joueurs
export const PLAYERS = ['P1', 'P2', 'P3', 'P4'];

export const BASE_POSITIONS = {
    P1: [500, 501, 502, 503],
    P2: [600, 601, 602, 603],
    P3: [700, 701, 702, 703],
    P4: [800, 801, 802, 803] // ✅ NOUVEAU : Base en haut à gauche
}

export const START_POSITIONS = {
    P1: 0,
    P2: 26,
    P3: 39,
    P4: 13 // ✅ NOUVEAU : Position de départ pour P4 (haut gauche)
}

export const HOME_ENTRANCE = {
    P1: [100, 101, 102, 103, 104],
    P2: [200, 201, 202, 203, 204],
    P3: [300, 301, 302, 303, 304],
    P4: [400, 401, 402, 403, 404] // ✅ NOUVEAU : Entrée maison haut gauche
}

export const HOME_POSITIONS = {
    P1: 105,
    P2: 205,
    P3: 305,
    P4: 405 // ✅ NOUVEAU : Maison haut gauche
}

export const TURNING_POINTS = {
    P1: 50,
    P2: 24,
    P3: 37,
    P4: 11 // ✅ NOUVEAU : Point de virage pour P4 (haut gauche)
}

export const SAFE_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47];

export const STATE = {
    DICE_NOT_ROLLED: 'DICE_NOT_ROLLED',
    DICE_ROLLED: 'DICE_ROLLED',
}