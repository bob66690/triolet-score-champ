import { GameState, Position, AssignedJoker } from '@/types/game';

export interface ScoringResult {
  totalScore: number;
  details: {
    duos: { positions: Position[]; score: number }[];
    trios: { positions: Position[]; score: number; isTriolet?: boolean }[];
    specialBonuses: { type: string; score: number }[];
  };
}

// Trouve tous les ensembles de 2 ou 3 jetons créés par les nouveaux placements
export const calculateTurnScore = (
  gameState: GameState,
  newPlacements: { position: Position; pion: number | 'X'; originalIndex: number }[],
  isTriolet: boolean = false
): ScoringResult => {
  const { board, specialCells, assignedJokers } = gameState;
  const result: ScoringResult = {
    totalScore: 0,
    details: {
      duos: [],
      trios: [],
      specialBonuses: []
    }
  };

  // Trouver tous les ensembles (lignes de 2 ou 3 jetons) qui incluent au moins un nouveau placement
  const ensembles = findEnsemblesWithNewPlacements(board, newPlacements);

  for (const ensemble of ensembles) {
    const ensembleScore = calculateEnsembleScore(ensemble, specialCells, assignedJokers, board, isTriolet);
    
    if (ensemble.length === 2) {
      result.details.duos.push({
        positions: ensemble,
        score: ensembleScore.score
      });
    } else if (ensemble.length === 3) {
      result.details.trios.push({
        positions: ensemble,
        score: ensembleScore.score,
        isTriolet: isTriolet && ensemble.length === 3
      });
      
      // Ajouter le bonus Triolet si applicable
      if (isTriolet && !hasJokerInEnsemble(ensemble, assignedJokers)) {
        result.details.specialBonuses.push({
          type: 'Bonus Triolet',
          score: 50
        });
      }
    }

    result.totalScore += ensembleScore.score;
  }

  // Ajouter les bonus spéciaux
  result.totalScore += result.details.specialBonuses.reduce((sum, bonus) => sum + bonus.score, 0);

  return result;
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

    // Vérifier les 4 directions
    const directions = [
      { dr: 0, dc: 1 },  // horizontal
      { dr: 1, dc: 0 },  // vertical
      { dr: 1, dc: 1 },  // diagonal descendante
      { dr: 1, dc: -1 }  // diagonal montante
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

// Calcule le score d'un ensemble
const calculateEnsembleScore = (
  ensemble: Position[],
  specialCells: any[][],
  assignedJokers: AssignedJoker[],
  board: (number | string | null)[][],
  isTriolet: boolean
): { score: number } => {
  let baseScore = 0;
  let hasSpecialMultiplier = false;
  let maxMultiplier = 1;

  for (const pos of ensemble) {
    const cell = specialCells[pos.row][pos.col];
    const joker = assignedJokers.find(j => j.position.row === pos.row && j.position.col === pos.col);
    
    // Les jokers n'ajoutent pas de points mais gardent leur valeur assignée pour les calculs
    let pionValue = joker ? joker.assignedValue : 0;
    if (!joker) {
      const boardValue = board[pos.row][pos.col];
      pionValue = typeof boardValue === 'string' || boardValue === null ? 0 : boardValue;
    }
    
    // Appliquer les multiplicateurs des cases spéciales (si pas encore utilisées)
    if (cell.multiplier && cell.multiplier > 1 && !cell.used) {
      pionValue *= cell.multiplier;
      hasSpecialMultiplier = true;
      maxMultiplier = Math.max(maxMultiplier, cell.multiplier);
    }
    
    // Pour les jokers, ne pas ajouter de points au score
    if (!joker) {
      baseScore += pionValue;
    }
  }

  // Si c'est un trio (3 jetons = 15 points base), ajouter le bonus de 15 points
  if (ensemble.length === 3 && getTotalValue(ensemble, assignedJokers, board) === 15) {
    baseScore = 30; // 15 + 15 bonus
    
    // Si il y a une case spéciale dans le trio, multiplier tout le trio
    if (hasSpecialMultiplier) {
      baseScore = 30 * maxMultiplier;
    }
  }

  return { score: baseScore };
};

// Calcule la valeur totale d'un ensemble (pour vérifier si c'est 15)
const getTotalValue = (
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

// Vérifie si un ensemble contient un joker
const hasJokerInEnsemble = (ensemble: Position[], assignedJokers: AssignedJoker[]): boolean => {
  return ensemble.some(pos => 
    assignedJokers.some(joker => 
      joker.position.row === pos.row && joker.position.col === pos.col
    )
  );
};

// Calcule le score final en fin de partie
export const calculateFinalScore = (
  playerScore: number,
  playerHand: (number | 'X')[],
  opponentHands: (number | 'X')[][],
  isWinner: boolean
): number => {
  let finalScore = playerScore;

  if (isWinner) {
    // Le gagnant ajoute la valeur des jetons des adversaires
    const values = opponentHands.flat().reduce<number>((sum, pion) => sum + (typeof pion === 'number' ? pion : 0), 0);
    finalScore = finalScore + values;
  } else {
    const values = playerHand.reduce<number>((sum, pion) => sum + (typeof pion === 'number' ? pion : 0), 0);
    finalScore = finalScore - values;
  }

  return finalScore;
};