import { useState, useCallback } from 'react';
import { GameState, Player, Position } from '@/types/game';

const WINNING_COMBINATIONS = [
  // Lignes
  [[0, 0], [0, 1], [0, 2]],
  [[1, 0], [1, 1], [1, 2]],
  [[2, 0], [2, 1], [2, 2]],
  // Colonnes
  [[0, 0], [1, 0], [2, 0]],
  [[0, 1], [1, 1], [2, 1]],
  [[0, 2], [1, 2], [2, 2]],
  // Diagonales
  [[0, 0], [1, 1], [2, 2]],
  [[0, 2], [1, 1], [2, 0]],
];

export const useTrioletGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    board: Array(3).fill(null).map(() => Array(3).fill(null)),
    currentPlayer: 1,
    availablePions: Object.fromEntries(Array.from({ length: 9 }, (_, i) => [i + 1, true])),
    gameStatus: 'playing',
  });

  const checkWinningLine = useCallback((board: number[][]) => {
    for (const combination of WINNING_COMBINATIONS) {
      const values = combination.map(([row, col]) => board[row][col]);
      if (values.every(val => val !== null)) {
        const sum = values.reduce((a, b) => a! + b!, 0);
        if (sum === 15) {
          return {
            winner: true,
            line: combination.map(([row, col]) => ({ row, col }))
          };
        }
      }
    }
    return { winner: false };
  }, []);

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

      const isGameFull = Object.values(newAvailablePions).every(available => !available);

      return {
        ...prev,
        board: newBoard,
        currentPlayer: prev.currentPlayer === 1 ? 2 : 1,
        availablePions: newAvailablePions,
        gameStatus: winCheck.winner ? 'won' : isGameFull ? 'draw' : 'playing',
        winner: winCheck.winner ? prev.currentPlayer : undefined,
        winningLine: winCheck.line || undefined,
      };
    });

    return true;
  }, [gameState, checkWinningLine]);

  const resetGame = useCallback(() => {
    setGameState({
      board: Array(3).fill(null).map(() => Array(3).fill(null)),
      currentPlayer: 1,
      availablePions: Object.fromEntries(Array.from({ length: 9 }, (_, i) => [i + 1, true])),
      gameStatus: 'playing',
    });
  }, []);

  return {
    gameState,
    placePion,
    resetGame,
  };
};