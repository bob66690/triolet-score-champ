import { SpecialCell, SpecialCellType } from '@/types/game';

const BOARD_SIZE = 15;

// Définition des positions des cases spéciales (inspiré du Scrabble)
const SPECIAL_POSITIONS: { [key: string]: SpecialCellType } = {
  // Cases Triple (aux coins et quelques positions stratégiques)
  '0,0': 'triple', '0,7': 'triple', '0,14': 'triple',
  '7,0': 'triple', '7,14': 'triple',
  '14,0': 'triple', '14,7': 'triple', '14,14': 'triple',
  
  // Cases Double (positions stratégiques)
  '1,1': 'double', '2,2': 'double', '3,3': 'double', '4,4': 'double',
  '1,13': 'double', '2,12': 'double', '3,11': 'double', '4,10': 'double',
  '13,1': 'double', '12,2': 'double', '11,3': 'double', '10,4': 'double',
  '13,13': 'double', '12,12': 'double', '11,11': 'double', '10,10': 'double',
  
  // Cases Rejouer (quelques positions centrales)
  '7,7': 'replay', // Centre du plateau
  '6,6': 'replay', '6,8': 'replay', '8,6': 'replay', '8,8': 'replay',
  '5,7': 'replay', '9,7': 'replay', '7,5': 'replay', '7,9': 'replay',
  
  // Autres cases doubles
  '5,1': 'double', '9,1': 'double', '1,5': 'double', '1,9': 'double',
  '5,13': 'double', '9,13': 'double', '13,5': 'double', '13,9': 'double',
};

export const createSpecialCellsLayout = (): SpecialCell[][] => {
  const layout: SpecialCell[][] = [];
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    layout[row] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      const key = `${row},${col}`;
      const specialType = SPECIAL_POSITIONS[key] || 'normal';
      
      layout[row][col] = {
        type: specialType,
        multiplier: specialType === 'double' ? 2 : specialType === 'triple' ? 3 : 1,
      };
    }
  }
  
  return layout;
};

export const getSpecialCellColor = (type: SpecialCellType): string => {
  switch (type) {
    case 'double':
      return 'bg-blue-100 border-blue-300';
    case 'triple':
      return 'bg-red-100 border-red-300';
    case 'replay':
      return 'bg-green-100 border-green-300';
    default:
      return 'bg-game-cell border-border';
  }
};

export const getSpecialCellLabel = (type: SpecialCellType): string => {
  switch (type) {
    case 'double':
      return '2x';
    case 'triple':
      return '3x';
    case 'replay':
      return '↻';
    default:
      return '';
  }
};