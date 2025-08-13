import { useState } from 'react';
import { Position } from '@/types/game';
import { cn } from '@/lib/utils';

interface GameBoardProps {
  board: (number | null)[][];
  onCellClick?: (position: Position) => void;
  winningLine?: { row: number; col: number }[];
  isInteractive?: boolean;
}

export const GameBoard = ({ 
  board, 
  onCellClick, 
  winningLine = [], 
  isInteractive = true 
}: GameBoardProps) => {
  const [hoveredCell, setHoveredCell] = useState<Position | null>(null);

  const isWinningCell = (row: number, col: number) => {
    return winningLine.some(cell => cell.row === row && cell.col === col);
  };

  const handleCellClick = (row: number, col: number) => {
    if (isInteractive && board[row][col] === null && onCellClick) {
      onCellClick({ row, col });
    }
  };

  return (
    <div className="relative">
      <div className="bg-gradient-board rounded-2xl p-6 shadow-game">
        <div className="grid grid-cols-3 gap-3">
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={cn(
                  "w-20 h-20 bg-game-cell rounded-xl border-2 border-border",
                  "flex items-center justify-center text-2xl font-bold",
                  "transition-all duration-200 cursor-pointer",
                  "hover:bg-game-cell-hover hover:shadow-hover hover:scale-105",
                  isWinningCell(rowIndex, colIndex) && "bg-game-winning-line shadow-lg ring-2 ring-game-winning-line",
                  cell !== null && "shadow-pion",
                  hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex && "bg-game-cell-hover"
                )}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                onMouseEnter={() => setHoveredCell({ row: rowIndex, col: colIndex })}
                onMouseLeave={() => setHoveredCell(null)}
              >
                {cell && (
                  <span className={cn(
                    "text-foreground font-extrabold text-2xl",
                    "drop-shadow-sm",
                    isWinningCell(rowIndex, colIndex) && "text-white animate-pulse"
                  )}>
                    {cell}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};