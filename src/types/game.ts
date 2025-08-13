export type Player = 1 | 2;
export type CellValue = number | null;
export type GameBoard = CellValue[][];

export type SpecialCellType = 'normal' | 'double' | 'triple' | 'replay';

export interface SpecialCell {
  type: SpecialCellType;
  multiplier?: number;
}

export interface GameState {
  board: GameBoard;
  currentPlayer: Player;
  availablePions: { [key: number]: boolean };
  gameStatus: 'playing' | 'won' | 'draw';
  winner?: Player;
  winningLine?: { row: number; col: number }[];
  specialCells: SpecialCell[][];
  playerScores: { [key in Player]: number };
  hasReplayTurn: boolean;
}

export interface Position {
  row: number;
  col: number;
}