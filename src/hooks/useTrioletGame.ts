import { useState, useCallback } from 'react';
import { GameState, Player, Position, SpecialCellType, PlayerAction } from '@/types/game';
import { createSpecialCellsLayout } from '@/utils/boardLayout';

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
    };
  });

  const checkWinningLine = useCallback((board: (number | string | null)[][]) => {
    for (const combination of WINNING_COMBINATIONS) {
      const values = combination.map(([row, col]) => board[row][col]);
      if (values.every(val => val !== null) && values.length >= 3) {
        // Calculer la somme avec les multiplicateurs
        let sum = 0;
        for (let i = 0; i < combination.length; i++) {
          const [row, col] = combination[i];
          const value = values[i]!;
          // Convert value to number for calculation (handle jokers separately)
          const numValue = typeof value === 'string' ? 0 : value;
          const multiplier = gameState.specialCells[row][col].multiplier || 1;
          sum += numValue * multiplier;
        }
        
        if (sum === 15) {
          return combination.map(([row, col]) => ({ row, col }));
        }
      }
    }
    return null;
  }, [gameState.specialCells]);

  const placePions = useCallback((positions: Position[], pionValues: (number | 'X')[]): boolean => {
    if (positions.length !== pionValues.length) return false;
    
    setGameState(prevState => {
      if (prevState.gameStatus !== 'playing') return prevState;
      
      // Validate all positions are empty and pions are available in hand
      for (let i = 0; i < positions.length; i++) {
        const { row, col } = positions[i];
        if (prevState.board[row][col] !== null) return prevState;
        if (!prevState.playerHands[prevState.currentPlayer].includes(pionValues[i])) return prevState;
      }
      
      const newBoard = prevState.board.map(r => [...r]);
      let totalEffectiveValue = 0;
      
      // Place all pions and calculate total value
      for (let i = 0; i < positions.length; i++) {
        const { row, col } = positions[i];
        const pionValue = pionValues[i];
        let effectiveValue = pionValue === 'X' ? 0 : pionValue; // Joker logic to be handled separately
        
        // Apply special cell multipliers
        const specialCell = prevState.specialCells[row][col];
        if (specialCell.type === 'double') {
          effectiveValue = effectiveValue * 2;
        } else if (specialCell.type === 'triple') {
          effectiveValue = effectiveValue * 3;
        }
        
        newBoard[row][col] = effectiveValue;
        totalEffectiveValue += effectiveValue;
      }
      
      const winningLine = checkWinningLine(newBoard);
      const isWin = winningLine !== null;
      
      // Remove used pions from player hand
      const newPlayerHands = { ...prevState.playerHands };
      for (const pionValue of pionValues) {
        const index = newPlayerHands[prevState.currentPlayer].indexOf(pionValue);
        if (index > -1) {
          newPlayerHands[prevState.currentPlayer].splice(index, 1);
        }
      }
      
      // Draw new pions to refill hand to 3
      const newBag = { ...prevState.pionBag };
      const newPions = drawPionsFromBag(newBag, 3 - newPlayerHands[prevState.currentPlayer].length);
      newPlayerHands[prevState.currentPlayer].push(...newPions);
      
      // Update scores
      const newPlayerScores = { ...prevState.playerScores };
      newPlayerScores[prevState.currentPlayer] += totalEffectiveValue;
      
      return {
        ...prevState,
        board: newBoard,
        pionBag: newBag,
        playerHands: newPlayerHands,
        currentPlayer: prevState.currentPlayer === 1 ? 2 : 1,
        gameStatus: isWin ? 'won' : 'playing',
        winner: isWin ? prevState.currentPlayer : undefined,
        winningLine: winningLine,
        playerScores: newPlayerScores,
        hasReplayTurn: false,
        selectedPionsForTurn: [],
      };
    });
    
    return true;
  }, [checkWinningLine]);

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
    });
  }, []);

  return { gameState, placePions, exchangePions, passTurn, resetGame };
};