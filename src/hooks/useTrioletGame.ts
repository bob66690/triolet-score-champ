import { useState, useCallback } from 'react';
import { GameState, Player, Position, SpecialCellType, PlayerAction, AssignedJoker } from '@/types/game';
import { createSpecialCellsLayout } from '@/utils/boardLayout';
import { calculateTurnScore, calculateFinalScore } from '@/utils/scoring';
import { validateJokerPlacement, isTriolet, checkEndGameConditions, validateNewPlacements } from '@/utils/gameValidation';

// Initial pion bag configuration
const INITIAL_PION_BAG = {
  '0': 9, '1': 9, '2': 8, '3': 8, '4': 7, '5': 8, '6': 6, '7': 6,
  '8': 4, '9': 4, '10': 3, '11': 3, '12': 2, '13': 2, '14': 1, '15': 1, 'X': 2
};

// Helper function to draw pions from bag
const drawPionsFromBag = (bag: { [key: string]: number }, count: number): (number | 'X')[] => {
  const availablePions = Object.entries(bag).filter(([_, count]) => count > 0);
  const drawnPions: (number | 'X')[] = [];
  
  for (let i = 0; i < count && availablePions.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * availablePions.reduce((sum, [_, count]) => sum + count, 0));
    let currentSum = 0;
    
    for (const [value, pionCount] of availablePions) {
      currentSum += pionCount;
      if (randomIndex < currentSum) {
        const pionValue = value === 'X' ? 'X' : parseInt(value);
        drawnPions.push(pionValue);
        bag[value]--;
        break;
      }
    }
  }
  
  return drawnPions;
};

const BOARD_SIZE = 15;

// Génération de toutes les lignes possibles pour un plateau 15x15
const generateWinningCombinations = () => {
  const combinations: number[][][] = [];
  
  // Lignes horizontales (3 cases consécutives minimum pour faire 15)
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col <= BOARD_SIZE - 3; col++) {
      for (let length = 3; length <= Math.min(5, BOARD_SIZE - col); length++) {
        const line = [];
        for (let i = 0; i < length; i++) {
          line.push([row, col + i]);
        }
        combinations.push(line);
      }
    }
  }
  
  // Lignes verticales
  for (let col = 0; col < BOARD_SIZE; col++) {
    for (let row = 0; row <= BOARD_SIZE - 3; row++) {
      for (let length = 3; length <= Math.min(5, BOARD_SIZE - row); length++) {
        const line = [];
        for (let i = 0; i < length; i++) {
          line.push([row + i, col]);
        }
        combinations.push(line);
      }
    }
  }
  
  // Diagonales descendantes
  for (let row = 0; row <= BOARD_SIZE - 3; row++) {
    for (let col = 0; col <= BOARD_SIZE - 3; col++) {
      for (let length = 3; length <= Math.min(5, BOARD_SIZE - Math.max(row, col)); length++) {
        const line = [];
        for (let i = 0; i < length; i++) {
          line.push([row + i, col + i]);
        }
        combinations.push(line);
      }
    }
  }
  
  // Diagonales montantes
  for (let row = 2; row < BOARD_SIZE; row++) {
    for (let col = 0; col <= BOARD_SIZE - 3; col++) {
      for (let length = 3; length <= Math.min(5, Math.min(row + 1, BOARD_SIZE - col)); length++) {
        const line = [];
        for (let i = 0; i < length; i++) {
          line.push([row - i, col + i]);
        }
        combinations.push(line);
      }
    }
  }
  
  return combinations;
};

const WINNING_COMBINATIONS = generateWinningCombinations();

export const useTrioletGame = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const initialBag = { ...INITIAL_PION_BAG };
    return {
      board: Array(15).fill(null).map(() => Array(15).fill(null)),
      currentPlayer: 1,
      pionBag: initialBag,
      playerHands: {
        1: drawPionsFromBag(initialBag, 3),
        2: drawPionsFromBag(initialBag, 3),
      },
      gameStatus: 'playing',
      specialCells: createSpecialCellsLayout(),
      playerScores: { 1: 0, 2: 0 },
      hasReplayTurn: false,
      selectedPionsForTurn: [],
      assignedJokers: [],
      jokersPlayedThisTurn: 0,
    };
  });

  // Plus de vérification de ligne gagnante - la victoire se détermine uniquement par les conditions de fin de partie

  const placePionTemporarily = useCallback((position: Position, pion: number | 'X', originalIndex: number) => {
    setGameState(prev => ({
      ...prev,
      board: prev.board.map((row, rowIndex) =>
        row.map((cell, colIndex) =>
          rowIndex === position.row && colIndex === position.col ? pion : cell
        )
      ),
      playerHands: {
        ...prev.playerHands,
        [prev.currentPlayer]: prev.playerHands[prev.currentPlayer].filter((_, index) => index !== originalIndex)
      }
    }));
  }, []);

  const removePionTemporarily = useCallback((position: Position) => {
    const pion = gameState.board[position.row][position.col];
    if (pion) {
      setGameState(prev => ({
        ...prev,
        board: prev.board.map((row, rowIndex) =>
          row.map((cell, colIndex) =>
            rowIndex === position.row && colIndex === position.col ? null : cell
          )
        ),
        playerHands: {
          ...prev.playerHands,
          [prev.currentPlayer]: [...prev.playerHands[prev.currentPlayer], pion]
        }
      }));
    }
  }, [gameState.board]);

  const isValidPlacement = useCallback((position: Position, temporaryPositions: Position[] = []) => {
    // Check if cell is empty
    if (gameState.board[position.row][position.col] !== null) {
      return false;
    }

    // Check if this is the first turn (no pions on board and no temporary placements)
    const hasPionsOnBoard = gameState.board.some(row => row.some(cell => cell !== null));
    const centerPos = Math.floor(BOARD_SIZE / 2); // Position centrale = 7 pour un plateau 15x15
    
    if (!hasPionsOnBoard && temporaryPositions.length === 0) {
      // Premier pion: doit être placé sur la case centrale
      return position.row === centerPos && position.col === centerPos;
    }
    
    // Si c'est le premier tour mais pas le premier pion, vérifier qu'au moins un pion temporaire est au centre
    if (!hasPionsOnBoard && temporaryPositions.length > 0) {
      const hasCenterPion = temporaryPositions.some(p => p.row === centerPos && p.col === centerPos) ||
                           (position.row === centerPos && position.col === centerPos);
      if (!hasCenterPion) {
        return false; // Premier tour: au moins un pion doit être au centre
      }
    }

    // Check adjacency to existing pions or temporary placements
    const adjacentPositions = [
      { row: position.row - 1, col: position.col },
      { row: position.row + 1, col: position.col },
      { row: position.row, col: position.col - 1 },
      { row: position.row, col: position.col + 1 }
    ];

    return adjacentPositions.some(adjPos => {
      if (adjPos.row < 0 || adjPos.row >= BOARD_SIZE || adjPos.col < 0 || adjPos.col >= BOARD_SIZE) {
        return false;
      }
      // Check if adjacent to existing pion
      if (gameState.board[adjPos.row][adjPos.col] !== null) {
        return true;
      }
      // Check if adjacent to temporary placement
      return temporaryPositions.some(tempPos => 
        tempPos.row === adjPos.row && tempPos.col === adjPos.col
      );
    });
  }, [gameState.board]);

  const validateTurn = useCallback((temporaryPlacements: {position: Position, pion: number | 'X', originalIndex: number}[]) => {
    if (temporaryPlacements.length === 0) return false;

    let isValid = false;
    setGameState(prevState => {
      const newState = { ...prevState };
      const newBoard = [...newState.board];

      // Vérifier les jokers
      if (!validateJokerPlacement(temporaryPlacements, newState.assignedJokers)) {
        return prevState; // Invalid joker placement
      }

      // Placer temporairement les nouveaux pions pour la validation
      temporaryPlacements.forEach(placement => {
        newBoard[placement.position.row] = [...newBoard[placement.position.row]];
        newBoard[placement.position.row][placement.position.col] = placement.pion;
      });

      // Valider que tous les ensembles de 3 pions font exactement 15
      const validation = validateNewPlacements(newBoard, temporaryPlacements, newState.assignedJokers);
      if (!validation.isValid) {
        isValid = false;
        return prevState; // Invalide, ne pas changer l'état
      }

      // Vérifier si c'est un Triolet (les 3 jetons posés forment 15)
      const placedPions = temporaryPlacements.map(p => p.pion);
      const isTrioletTurn = temporaryPlacements.length === 3 && isTriolet(placedPions);

      // Calculer le score du tour
      const scoringResult = calculateTurnScore(newState, temporaryPlacements, isTrioletTurn);
      newState.playerScores[newState.currentPlayer] += scoringResult.totalScore;

      // Marquer les cases spéciales comme utilisées
      temporaryPlacements.forEach(placement => {
        const specialCell = newState.specialCells[placement.position.row][placement.position.col];
        if (specialCell.multiplier && specialCell.multiplier > 1) {
          specialCell.used = true;
        }
      });

      // Vérifier les cases rejoueur
      const hasReplayCell = temporaryPlacements.some(placement => 
        newState.specialCells[placement.position.row][placement.position.col].type === 'replay'
      );

      // Piocher de nouveaux jetons pour compléter la main
      const currentHand = newState.playerHands[newState.currentPlayer];
      const pionsNeeded = 3 - currentHand.length;
      const drawnPions = drawPionsFromBag(newState.pionBag, pionsNeeded);
      newState.playerHands[newState.currentPlayer] = [...currentHand, ...drawnPions];

      // Vérifier les conditions de fin de partie
      const endCondition = checkEndGameConditions(
        newState.pionBag,
        newState.playerHands,
        newBoard,
        gameState.currentPlayer
      );
      
      if (endCondition.isGameOver) {
        newState.gameStatus = endCondition.winner ? 'won' : 'draw';
        if (endCondition.winner) {
          newState.winner = endCondition.winner as Player;
          // Calculer le score final pour le gagnant
          const opponentHands = Object.entries(newState.playerHands)
            .filter(([player]) => parseInt(player) !== endCondition.winner)
            .map(([_, hand]) => hand);
          newState.playerScores[endCondition.winner] = calculateFinalScore(
            newState.playerScores[endCondition.winner],
            newState.playerHands[endCondition.winner],
            opponentHands,
            true
          );
          // Calculer le score final pour les perdants
          Object.keys(newState.playerHands).forEach(playerKey => {
            const player = parseInt(playerKey) as Player;
            if (player !== endCondition.winner) {
              newState.playerScores[player] = calculateFinalScore(
                newState.playerScores[player],
                newState.playerHands[player],
                [],
                false
              );
            }
          });
        }
      } else {
        // Changer de joueur sauf si rejoueur ou fin de partie
        if (!hasReplayCell) {
          newState.currentPlayer = newState.currentPlayer === 1 ? 2 : 1;
        }
        newState.hasReplayTurn = hasReplayCell;
      }

      // Réinitialiser les jokers joués ce tour
      newState.jokersPlayedThisTurn = 0;

      isValid = true;
      return newState;
    });
    
    return isValid;
  }, [gameState]);

  const exchangePions = useCallback((pionIndices: number[]): boolean => {
    setGameState(prevState => {
      const newBag = { ...prevState.pionBag };
      const newPlayerHands = { ...prevState.playerHands };
      const currentHand = [...newPlayerHands[prevState.currentPlayer]];
      
      // Return selected pions to bag
      for (const index of pionIndices.sort().reverse()) {
        const pion = currentHand[index];
        const pionKey = pion.toString();
        newBag[pionKey] = (newBag[pionKey] || 0) + 1;
        currentHand.splice(index, 1);
      }
      
      // Draw new pions
      const newPions = drawPionsFromBag(newBag, 3 - currentHand.length);
      currentHand.push(...newPions);
      
      newPlayerHands[prevState.currentPlayer] = currentHand;
      
      return {
        ...prevState,
        pionBag: newBag,
        playerHands: newPlayerHands,
        currentPlayer: prevState.currentPlayer === 1 ? 2 : 1,
      };
    });
    
    return true;
  }, []);

  const passTurn = useCallback((): void => {
    setGameState(prevState => ({
      ...prevState,
      currentPlayer: prevState.currentPlayer === 1 ? 2 : 1,
    }));
  }, []);

  const resetGame = useCallback(() => {
    const initialBag = { ...INITIAL_PION_BAG };
    setGameState({
      board: Array(15).fill(null).map(() => Array(15).fill(null)),
      currentPlayer: 1,
      pionBag: initialBag,
      playerHands: {
        1: drawPionsFromBag(initialBag, 3),
        2: drawPionsFromBag(initialBag, 3),
      },
      gameStatus: 'playing',
      specialCells: createSpecialCellsLayout(),
      playerScores: { 1: 0, 2: 0 },
      hasReplayTurn: false,
      selectedPionsForTurn: [],
      assignedJokers: [],
      jokersPlayedThisTurn: 0,
    });
  }, []);

  const assignJokerValue = useCallback((position: Position, value: number) => {
    setGameState(prev => ({
      ...prev,
      assignedJokers: [...prev.assignedJokers, { position, assignedValue: value }]
    }));
  }, []);

  return { 
    gameState, 
    placePionTemporarily, 
    removePionTemporarily, 
    validateTurn, 
    isValidPlacement,
    exchangePions, 
    passTurn, 
    resetGame,
    assignJokerValue
  };
};