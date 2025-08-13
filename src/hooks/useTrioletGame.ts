import { useState, useCallback } from 'react';
import { GameState, Player, Position } from '@/types/game';
import { createSpecialCellsLayout } from '@/utils/boardLayout';

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
  const [gameState, setGameState] = useState<GameState>({
    board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)),
    currentPlayer: 1,
    availablePions: Object.fromEntries(Array.from({ length: 9 }, (_, i) => [i + 1, true])),
    gameStatus: 'playing',
    specialCells: createSpecialCellsLayout(),
    playerScores: { 1: 0, 2: 0 },
    hasReplayTurn: false,
  });

  const checkWinningLine = useCallback((board: (number | null)[][]) => {
    for (const combination of WINNING_COMBINATIONS) {
      const values = combination.map(([row, col]) => board[row][col]);
      if (values.every(val => val !== null) && values.length >= 3) {
        // Calculer la somme avec les multiplicateurs
        let sum = 0;
        for (let i = 0; i < combination.length; i++) {
          const [row, col] = combination[i];
          const value = values[i]!;
          const multiplier = gameState.specialCells[row][col].multiplier || 1;
          sum += value * multiplier;
        }
        
        if (sum === 15) {
          return {
            winner: true,
            line: combination.map(([row, col]) => ({ row, col })),
            score: sum
          };
        }
      }
    }
    return { winner: false };
  }, [gameState.specialCells]);

  const placePion = useCallback((position: Position, pionValue: number) => {
    if (
      gameState.gameStatus !== 'playing' ||
      gameState.board[position.row][position.col] !== null ||
      !gameState.availablePions[pionValue]
    ) {
      return false;
    }

    setGameState(prev => {
      const newBoard = prev.board.map(row => [...row]);
      newBoard[position.row][position.col] = pionValue;

      const winCheck = checkWinningLine(newBoard);
      const newAvailablePions = { ...prev.availablePions };
      newAvailablePions[pionValue] = false;

      // Vérifier si c'est une case "rejouer"
      const isReplayCell = prev.specialCells[position.row][position.col].type === 'replay';
      
      // Calculer le score pour ce coup
      const cellMultiplier = prev.specialCells[position.row][position.col].multiplier || 1;
      const moveScore = pionValue * cellMultiplier;
      const newScores = { ...prev.playerScores };
      newScores[prev.currentPlayer] += moveScore;

      const isGameFull = Object.values(newAvailablePions).every(available => !available);
      let newCurrentPlayer = prev.currentPlayer;
      
      // Si pas de case rejouer et pas de victoire, changer de joueur
      if (!isReplayCell && !winCheck.winner) {
        newCurrentPlayer = prev.currentPlayer === 1 ? 2 : 1;
      }

      return {
        ...prev,
        board: newBoard,
        currentPlayer: newCurrentPlayer,
        availablePions: newAvailablePions,
        gameStatus: winCheck.winner ? 'won' : isGameFull ? 'draw' : 'playing',
        winner: winCheck.winner ? prev.currentPlayer : undefined,
        winningLine: winCheck.line || undefined,
        playerScores: newScores,
        hasReplayTurn: isReplayCell && !winCheck.winner,
      };
    });

    return true;
  }, [gameState, checkWinningLine]);

  const resetGame = useCallback(() => {
    setGameState({
      board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)),
      currentPlayer: 1,
      availablePions: Object.fromEntries(Array.from({ length: 9 }, (_, i) => [i + 1, true])),
      gameStatus: 'playing',
      specialCells: createSpecialCellsLayout(),
      playerScores: { 1: 0, 2: 0 },
      hasReplayTurn: false,
    });
  }, []);

  return {
    gameState,
    placePion,
    resetGame,
  };
};