export type Player = 1 | 2;
export type CellValue = number | string | null; // Allow 'X' for jokers
export type GameBoard = CellValue[][];

export type SpecialCellType = 'normal' | 'double' | 'triple' | 'replay' | 'doubledebut';

export interface SpecialCell {
  type: SpecialCellType;
  multiplier?: number;
}

export interface PionType {
  value: number | 'X';
  count: number;
}

export interface PlayerHand {
  pions: (number | 'X')[];
}

export interface GameState {
  board: GameBoard;
  currentPlayer: Player;
  pionBag: { [key: string]: number }; // remaining pions in bag
  playerHands: { [key in Player]: (number | 'X')[] }; // 3 pions per player
  gameStatus: 'playing' | 'won' | 'draw';
  winner?: Player;
  winningLine?: { row: number; col: number }[];
  specialCells: SpecialCell[][];
  playerScores: { [key in Player]: number };
  hasReplayTurn: boolean;
  selectedPionsForTurn: (number | 'X')[]; // pions selected for current placement
}

export type PlayerAction = 'place' | 'pass' | 'exchange';

export interface Position {
  row: number;
  col: number;
}