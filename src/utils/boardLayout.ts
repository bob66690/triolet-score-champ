import { SpecialCell, SpecialCellType } from '@/types/game';

const BOARD_SIZE = 15;

// Définition des positions des cases spéciales selon les règles du Triolet
const SPECIAL_POSITIONS: { [key: string]: SpecialCellType } = {
  // Cases Rejouer: a8, b2, b14, h1, h15, n2, n14, o8
  '7,0': 'replay',   // a8
  '1,1': 'replay',   // b2
  '13,1': 'replay',  // b14
  '0,7': 'replay',   // h1
  '14,7': 'replay',  // h15
  '1,13': 'replay',  // n2
  '13,13': 'replay', // n14
  '7,14': 'replay',  // o8
  
  // Cases Doubles: d8, e5, e11, h4, h8, h12, k5, k11, l8
  '7,3': 'double',   // d8
  '4,4': 'double',   // e5
  '10,4': 'double',  // e11
  '3,7': 'double',   // h4
  '7,7': 'double',   // h8
  '11,7': 'double',  // h12
  '4,10': 'double',  // k5
  '10,10': 'double', // k11
  '7,11': 'double',  // l8
  
  // Cases Triples: b5, b11, e2, e14, k2, k14, n5, n11
  '4,1': 'triple',   // b5
  '10,1': 'triple',  // b11
  '1,4': 'triple',   // e2
  '13,4': 'triple',  // e14
  '1,10': 'triple',  // k2
  '13,10': 'triple', // k14
  '4,13': 'triple',  // n5
  '10,13': 'triple', // n11
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