import { useState, useCallback } from 'react';
import { GameState, Player, Position, SpecialCellType, PlayerAction, AssignedJoker } from '@/types/game';
import { createSpecialCellsLayout } from '@/utils/boardLayout';
import { calculateTurnScore } from '@/utils/scoring';
import { validateJokerPlacement, isTriolet, checkEndGameConditions } from '@/utils/gameValidation';

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
    if (!hasPionsOnBoard && temporaryPositions.length === 0) {
      return true; // First pion can be placed anywhere
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
    // Calculate scores
    let totalScore = 0;
    for (const placement of temporaryPlacements) {
      const specialCell = gameState.specialCells[placement.position.row][placement.position.col];
      let pionValue = placement.pion === 'X' ? 0 : Number(placement.pion);
      if (specialCell.multiplier) {
        pionValue *= specialCell.multiplier;
      }
      totalScore += pionValue;
    }

    // Check for winning condition
    const winningLineResult = checkWinningLine(gameState.board);
    const hasWon = winningLineResult !== null;
    
    // Draw new pions to refill hand to 3
    const newPionBag = { ...gameState.pionBag };
    const currentHand = gameState.playerHands[gameState.currentPlayer];
    const pionsNeeded = 3 - currentHand.length;
    const drawnPions = drawPionsFromBag(newPionBag, pionsNeeded);
    const finalHand = [...currentHand, ...drawnPions];

    // Check for replay turn
    let hasReplayTurn = false;
    if (temporaryPlacements.some(p => gameState.specialCells[p.position.row][p.position.col].type === 'replay')) {
      hasReplayTurn = true;
    }

    setGameState(prev => ({
      ...prev,
      playerHands: {
        ...prev.playerHands,
        [gameState.currentPlayer]: finalHand
      },
      pionBag: newPionBag,
      playerScores: {
        ...prev.playerScores,
        [gameState.currentPlayer]: prev.playerScores[gameState.currentPlayer] + totalScore
      },
      currentPlayer: hasWon || hasReplayTurn ? gameState.currentPlayer : (gameState.currentPlayer === 1 ? 2 : 1),
      gameStatus: hasWon ? 'won' : 'playing',
      winner: hasWon ? gameState.currentPlayer : undefined,
      winningLine: winningLineResult,
      hasReplayTurn
    }));
  }, [gameState, checkWinningLine]);

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