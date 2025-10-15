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
    const totalValue = getTotalValue(ensemble, assignedJokers, board);
    
    // Validation des règles : pour 3 pions, total doit être exactement 15
    if (ensemble.length === 3 && totalValue !== 15) {
      continue; // Ignorer cet ensemble s'il ne fait pas exactement 15
    }
    
    // Validation : aucun ensemble de 3 ne peut dépasser 15
    if (ensemble.length === 3 && totalValue > 15) {
      continue; // Ne devrait pas arriver avec la règle ci-dessus, mais sécurité
    }
    
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
    }

    result.totalScore += ensembleScore.score;
  }

  // Ajouter le bonus Triolet si c'est un Triolet (3 pions placés d'un coup qui font 15)
  if (isTriolet && newPlacements.length === 3) {
    // Vérifier qu'il n'y a pas de joker dans les nouveaux placements
    const hasJoker = newPlacements.some(p => p.pion === 'X');
    if (!hasJoker) {
      result.details.specialBonuses.push({
        type: 'Bonus Triolet',
        score: 50
      });
      result.totalScore += 50;
    }
  }

  return result;
};

// Trouve tous les ensembles (lignes continues) qui incluent au moins un nouveau placement
const findEnsemblesWithNewPlacements = (
  board: (number | string | null)[][],
  newPlacements: { position: Position }[]
): Position[][] => {
  const ensembles: Position[][] = [];
  const processedLines = new Set<string>();

  // Pour chaque nouveau placement, vérifier toutes les lignes possibles qui pourraient être affectées
  for (const placement of newPlacements) {
    const { row, col } = placement.position;

    // Vérifier seulement 2 directions : horizontal et vertical (pas de diagonales)
    const directions = [
      { dr: 0, dc: 1 },  // horizontal
      { dr: 1, dc: 0 }   // vertical
    ];

    for (const { dr, dc } of directions) {
      // Vérifier plusieurs positions le long de cette direction pour trouver toutes les lignes
      for (let offset = -4; offset <= 4; offset++) {
        const startRow = row + offset * dr;
        const startCol = col + offset * dc;
        
        // Vérifier que la position de départ est valide et contient un pion
        if (startRow >= 0 && startRow < board.length && 
            startCol >= 0 && startCol < board[0].length && 
            board[startRow][startCol] !== null) {
          
          const ligne = findLineFromPosition(board, startRow, startCol, dr, dc);
          
          if (ligne.length >= 2) {
            // Créer un identifiant unique pour cette ligne
            const lineId = ligne.map(pos => `${pos.row},${pos.col}`).sort().join('|');
            
            if (!processedLines.has(lineId)) {
              // Vérifier si cette ligne contient au moins un nouveau placement
              const hasNewPlacement = ligne.some(pos => 
                newPlacements.some(p => p.position.row === pos.row && p.position.col === pos.col)
              );
              
              if (hasNewPlacement) {
                ensembles.push(ligne);
                processedLines.add(lineId);
              }
            }
          }
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
  let score = 0;

  // Pour un DUO : calculer le score des pions individuellement avec multiplicateurs
  if (ensemble.length === 2) {
    for (const pos of ensemble) {
      const boardValue = board[pos.row][pos.col];
      let pionValue = 0;
      
      if (boardValue === 'X') {
        // Les jokers valent 0 points pour le score
        pionValue = 0;
      } else if (boardValue !== null) {
        pionValue = typeof boardValue === 'number' ? boardValue : 0;
      }
      
      // Appliquer le multiplicateur de la case spéciale à ce pion
      const cell = specialCells[pos.row][pos.col];
      if (cell.multiplier && cell.multiplier > 1 && !cell.used) {
        pionValue *= cell.multiplier;
      }
      
      score += pionValue;
    }
  }
  
  // Pour un TRIO qui fait 15 points : 30 points de base (ou 60/90 avec multiplicateur)
  else if (ensemble.length === 3 && getTotalValue(ensemble, assignedJokers, board) === 15) {
    let trioScore = 30; // Score de base d'un trio : 30 points
    
    // Vérifier s'il y a une case spéciale dans le trio
    let maxMultiplier = 1;
    for (const pos of ensemble) {
      const cell = specialCells[pos.row][pos.col];
      if (cell.multiplier && cell.multiplier > 1 && !cell.used) {
        maxMultiplier = Math.max(maxMultiplier, cell.multiplier);
      }
    }
    
    // Appliquer le multiplicateur au trio complet
    trioScore *= maxMultiplier;
    score = trioScore;
  }

  return { score };
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