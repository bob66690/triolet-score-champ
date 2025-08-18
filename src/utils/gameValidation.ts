import { Position, AssignedJoker } from '@/types/game';

// Valide qu'on ne place pas plus d'un joker par tour
export const validateJokerPlacement = (
  newPlacements: { position: Position; pion: number | 'X' }[],
  assignedJokers: AssignedJoker[]
): boolean => {
  const jokersInTurn = newPlacements.filter(p => p.pion === 'X').length;
  return jokersInTurn <= 1;
};

// Vérifie si les jetons du chevalet forment un Triolet (somme = 15)
export const isTriolet = (hand: (number | 'X')[]): boolean => {
  if (hand.length !== 3) return false;
  
  // Si il y a un joker, on ne peut pas faire de Triolet avec bonus
  if (hand.includes('X')) return false;
  
  const sum = hand.reduce<number>((total, pion) => total + (typeof pion === 'number' ? pion : 0), 0);
  return sum === 15;
};

// Vérifie si un trio est formé (3 jetons consécutifs = 15)
export const isValidTrio = (
  positions: Position[],
  board: (number | string | null)[][],
  assignedJokers: AssignedJoker[]
): boolean => {
  if (positions.length !== 3) return false;
  
  let sum = 0;
  for (const pos of positions) {
    const joker = assignedJokers.find(j => j.position.row === pos.row && j.position.col === pos.col);
    const value = joker ? joker.assignedValue : Number(board[pos.row][pos.col]);
    sum += value;
  }
  
  return sum === 15;
};

// Valide que tous les nouveaux placements respectent les règles de somme
export const validateNewPlacements = (
  board: (number | string | null)[][],
  newPlacements: { position: Position; pion: number | 'X' }[],
  assignedJokers: AssignedJoker[]
): { isValid: boolean; invalidEnsembles: Position[][] } => {
  const invalidEnsembles: Position[][] = [];
  
  // Trouver tous les ensembles qui incluent au moins un nouveau placement
  const ensembles = findEnsemblesWithNewPlacements(board, newPlacements);
  
  for (const ensemble of ensembles) {
    if (ensemble.length === 3) {
      const totalValue = getTotalValueForEnsemble(ensemble, assignedJokers, board);
      // Pour 3 pions, la somme doit être exactement 15
      if (totalValue !== 15) {
        invalidEnsembles.push(ensemble);
      }
    }
  }
  
  return {
    isValid: invalidEnsembles.length === 0,
    invalidEnsembles
  };
};

// Trouve tous les ensembles (lignes continues) qui incluent au moins un nouveau placement
const findEnsemblesWithNewPlacements = (
  board: (number | string | null)[][],
  newPlacements: { position: Position }[]
): Position[][] => {
  const ensembles: Position[][] = [];
  const processedPositions = new Set<string>();

  for (const placement of newPlacements) {
    const { row, col } = placement.position;
    const posKey = `${row},${col}`;
    
    if (processedPositions.has(posKey)) continue;

    // Vérifier seulement 2 directions : horizontal et vertical (pas de diagonales)
    const directions = [
      { dr: 0, dc: 1 },  // horizontal
      { dr: 1, dc: 0 }   // vertical
    ];

    for (const { dr, dc } of directions) {
      const ligne = findLineFromPosition(board, row, col, dr, dc);
      
      if (ligne.length >= 2) {
        // Vérifier si cette ligne contient au moins un nouveau placement
        const hasNewPlacement = ligne.some(pos => 
          newPlacements.some(p => p.position.row === pos.row && p.position.col === pos.col)
        );
        
        if (hasNewPlacement) {
          ensembles.push(ligne);
          ligne.forEach(pos => processedPositions.add(`${pos.row},${pos.col}`));
        }
      }
    }
  }

  return ensembles;
};

// Trouve une ligne continue de jetons dans une direction donnée
const findLineFromPosition = (
  board: (number | string | null)[][],
  startRow: number,
  startCol: number,
  dr: number,
  dc: number
): Position[] => {
  const ligne: Position[] = [];
  
  // Aller vers l'arrière pour trouver le début
  let r = startRow, c = startCol;
  while (r >= 0 && r < board.length && c >= 0 && c < board[0].length && board[r][c] !== null) {
    r -= dr;
    c -= dc;
  }
  r += dr;
  c += dc;

  // Construire la ligne vers l'avant
  while (r >= 0 && r < board.length && c >= 0 && c < board[0].length && board[r][c] !== null) {
    ligne.push({ row: r, col: c });
    r += dr;
    c += dc;
  }

  return ligne;
};

// Calcule la valeur totale d'un ensemble
const getTotalValueForEnsemble = (
  ensemble: Position[],
  assignedJokers: AssignedJoker[],
  board: (number | string | null)[][]
): number => {
  let total = 0;
  for (const pos of ensemble) {
    const joker = assignedJokers.find(j => j.position.row === pos.row && j.position.col === pos.col);
    if (joker) {
      total += joker.assignedValue;
    } else {
      const boardValue = board[pos.row][pos.col];
      total += typeof boardValue === 'string' || boardValue === null ? 0 : boardValue;
    }
  }
  return total;
};

// Vérifie les conditions de fin de partie
export interface EndGameCondition {
  isGameOver: boolean;
  reason: 'normal_end' | 'no_moves' | 'empty_bag_and_player_finished';
  winner?: number;
}

export const checkEndGameConditions = (
  pionBag: { [key: string]: number },
  playerHands: { [key: number]: (number | 'X')[] },
  board: (number | string | null)[][],
  currentPlayer: number
): EndGameCondition => {
  // Vérifier si le sac est vide
  const bagEmpty = Object.values(pionBag).every(count => count === 0);
  
  // Vérifier si un joueur n'a plus de jetons
  const playersWithoutTokens = Object.entries(playerHands).filter(([_, hand]) => hand.length === 0);
  
  if (bagEmpty && playersWithoutTokens.length > 0) {
    const winnerPlayer = parseInt(playersWithoutTokens[0][0]);
    return {
      isGameOver: true,
      reason: 'empty_bag_and_player_finished',
      winner: winnerPlayer
    };
  }
  
  // Vérifier si aucun joueur ne peut jouer
  const canAnyPlayerMove = Object.entries(playerHands).some(([player, hand]) => {
    return hand.length > 0 && canPlayerPlaceAnyToken(parseInt(player), hand, board);
  });
  
  if (!canAnyPlayerMove) {
    return {
      isGameOver: true,
      reason: 'no_moves'
    };
  }
  
  return {
    isGameOver: false,
    reason: 'normal_end'
  };
};

// Vérifie si un joueur peut placer au moins un jeton
const canPlayerPlaceAnyToken = (
  player: number,
  hand: (number | 'X')[],
  board: (number | string | null)[][]
): boolean => {
  // Vérifier chaque case vide du plateau
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[0].length; col++) {
      if (board[row][col] === null) {
        // Vérifier si cette position est valide (première pose ou adjacente)
        if (isValidPlacementPosition({ row, col }, board)) {
          return true;
        }
      }
    }
  }
  return false;
};

// Vérifie si une position est valide pour un placement
const isValidPlacementPosition = (
  position: Position,
  board: (number | string | null)[][]
): boolean => {
  const { row, col } = position;
  
  // Vérifier si c'est la première pose (plateau vide)
  const hasAnyToken = board.some(r => r.some(cell => cell !== null));
  if (!hasAnyToken) return true;
  
  // Vérifier l'adjacence
  const adjacentPositions = [
    { row: row - 1, col },
    { row: row + 1, col },
    { row, col: col - 1 },
    { row, col: col + 1 }
  ];
  
  return adjacentPositions.some(adjPos => {
    return adjPos.row >= 0 && adjPos.row < board.length &&
           adjPos.col >= 0 && adjPos.col < board[0].length &&
           board[adjPos.row][adjPos.col] !== null;
  });
};