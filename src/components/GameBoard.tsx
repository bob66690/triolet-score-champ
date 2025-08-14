import { useState } from 'react';
import { Position, SpecialCell } from '@/types/game';
import { cn } from '@/lib/utils';
import { getSpecialCellColor, getSpecialCellLabel } from '@/utils/boardLayout';

interface GameBoardProps {
  board: (number | string | null)[][];
  specialCells: SpecialCell[][];
  onCellClick?: (position: Position) => void;
  winningLine?: { row: number; col: number }[];
  isInteractive?: boolean;
}

export const GameBoard = ({ 
  board, 
  specialCells,
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

  const getCellClassName = (row: number, col: number) => {
    const baseClasses = "w-8 h-8 border flex items-center justify-center text-xs font-bold transition-all duration-200 cursor-pointer relative";
    const specialColor = getSpecialCellColor(specialCells[row][col].type);
    
    return cn(
      baseClasses,
      specialColor,
      "hover:scale-110 hover:shadow-hover hover:z-10",
      isWinningCell(row, col) && "bg-game-winning-line shadow-lg ring-2 ring-game-winning-line scale-110 z-20",
      board[row][col] !== null && "shadow-pion",
      hoveredCell?.row === row && hoveredCell?.col === col && "scale-105 z-10"
    );
  };

  return (
    <div className="relative">
      <div className="bg-gradient-board rounded-2xl p-4 shadow-game overflow-auto max-h-[600px]">
        <div className="grid grid-cols-15 gap-0.5 min-w-max">
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={getCellClassName(rowIndex, colIndex)}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                onMouseEnter={() => setHoveredCell({ row: rowIndex, col: colIndex })}
                onMouseLeave={() => setHoveredCell(null)}
                title={`Case ${rowIndex + 1},${colIndex + 1} - ${specialCells[rowIndex][colIndex].type}`}
              >
                {/* Pion placé */}
                {cell && (
                  <span className={cn(
                    "text-foreground font-extrabold text-sm z-10 relative",
                    "drop-shadow-sm",
                    isWinningCell(rowIndex, colIndex) && "text-white animate-pulse"
                  )}>
                    {cell}
                  </span>
                )}
                
                {/* Label de la case spéciale (seulement si pas de pion) */}
                {!cell && specialCells[rowIndex][colIndex].type !== 'normal' && (
                  <span className="text-xs font-semibold opacity-60 absolute inset-0 flex items-center justify-center">
                    {getSpecialCellLabel(specialCells[rowIndex][colIndex].type)}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Légende des cases spéciales */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded flex items-center justify-center text-xs font-bold">2x</div>
          <span>Case Double</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border border-red-300 rounded flex items-center justify-center text-xs font-bold">3x</div>
          <span>Case Triple</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded flex items-center justify-center text-xs font-bold">↻</div>
          <span>Case Rejouer</span>
        </div>
      </div>
    </div>
  );
};