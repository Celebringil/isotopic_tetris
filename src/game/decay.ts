// Radioactive Decay System for Isotopic Tetris
// Handles half-life timers and decay mechanics

import { Cell, createCell, createWasteCell, isUnstable, ELEMENTS } from './elements';

export interface DecayEvent {
  position: { row: number; col: number };
  fromElement: number;
  toElement: number; // 0 means became waste
  wasUnstable: boolean;
}

// Update half-life timers on all unstable elements
// Returns decay events when elements decay
export function updateDecay(
  board: (Cell | null)[][],
  deltaTimeSeconds: number
): DecayEvent[] {
  const decayEvents: DecayEvent[] = [];
  const boardHeight = board.length;
  const boardWidth = board[0].length;

  for (let row = 0; row < boardHeight; row++) {
    for (let col = 0; col < boardWidth; col++) {
      const cell = board[row][col];
      if (!cell) continue;

      // Only process unstable elements with half-life
      if (cell.halfLife !== null && cell.halfLife > 0) {
        // Decrease half-life
        cell.halfLife -= deltaTimeSeconds;

        // Check for decay
        if (cell.halfLife <= 0) {
          const fromElement = cell.element.atomicNumber;

          // Decay: reduce atomic number by 1-3 randomly
          const decayAmount = Math.floor(Math.random() * 3) + 1;
          const newAtomicNumber = cell.element.atomicNumber - decayAmount;

          if (newAtomicNumber > 0 && ELEMENTS[newAtomicNumber]) {
            // Decay to a lower element
            board[row][col] = createCell(newAtomicNumber);
            decayEvents.push({
              position: { row, col },
              fromElement,
              toElement: newAtomicNumber,
              wasUnstable: true
            });
          } else {
            // Decay to waste
            board[row][col] = createWasteCell();
            decayEvents.push({
              position: { row, col },
              fromElement,
              toElement: 0,
              wasUnstable: true
            });
          }
        }
      }
    }
  }

  return decayEvents;
}

// Extend half-life of all unstable elements (triggered by line clear)
export function stabilizeElements(
  board: (Cell | null)[][],
  extensionSeconds: number
): number {
  let stabilizedCount = 0;
  const boardHeight = board.length;
  const boardWidth = board[0].length;

  for (let row = 0; row < boardHeight; row++) {
    for (let col = 0; col < boardWidth; col++) {
      const cell = board[row][col];
      if (!cell) continue;

      // Only extend unstable elements
      if (cell.halfLife !== null && isUnstable(cell.element.atomicNumber)) {
        cell.halfLife += extensionSeconds;
        // Cap at original half-life * 2
        const maxHalfLife = (cell.element.baseHalfLife || 10) * 2;
        cell.halfLife = Math.min(cell.halfLife, maxHalfLife);
        stabilizedCount++;
      }
    }
  }

  return stabilizedCount;
}

// Get all elements with low half-life (warning state)
export function getWarningElements(
  board: (Cell | null)[][],
  warningThreshold: number = 3
): { row: number; col: number; halfLife: number }[] {
  const warnings: { row: number; col: number; halfLife: number }[] = [];
  const boardHeight = board.length;
  const boardWidth = board[0].length;

  for (let row = 0; row < boardHeight; row++) {
    for (let col = 0; col < boardWidth; col++) {
      const cell = board[row][col];
      if (!cell) continue;

      if (cell.halfLife !== null && cell.halfLife > 0 && cell.halfLife <= warningThreshold) {
        warnings.push({ row, col, halfLife: cell.halfLife });
      }
    }
  }

  return warnings;
}

// Count unstable elements on board
export function countUnstableElements(board: (Cell | null)[][]): number {
  let count = 0;
  const boardHeight = board.length;
  const boardWidth = board[0].length;

  for (let row = 0; row < boardHeight; row++) {
    for (let col = 0; col < boardWidth; col++) {
      const cell = board[row][col];
      if (cell && isUnstable(cell.element.atomicNumber)) {
        count++;
      }
    }
  }

  return count;
}

// Count waste blocks on board
export function countWasteBlocks(board: (Cell | null)[][]): number {
  let count = 0;
  const boardHeight = board.length;
  const boardWidth = board[0].length;

  for (let row = 0; row < boardHeight; row++) {
    for (let col = 0; col < boardWidth; col++) {
      const cell = board[row][col];
      if (cell && cell.element.atomicNumber === 0) {
        count++;
      }
    }
  }

  return count;
}
