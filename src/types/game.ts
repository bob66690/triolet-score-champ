export type Player = 1 | 2;
export type CellValue = number | null;
export type GameBoard = CellValue[][];

export interface GameState {
  board: GameBoard;
  currentPlayer: Player;
  availablePions: { [key: number]: boolean };
  gameStatus: 'playing' | 'won' | 'draw';
  winner?: Player;
  winningLine?: { row: number; col: number }[];
}

export interface Position {
  row: number;
  col: number;
}