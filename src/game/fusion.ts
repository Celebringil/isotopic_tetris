// Fusion mechanics for Isotopic Tetris
// Handles: Standard Fusion (X+X→2X), Alpha Process (X+He→X+2), Beta Decay (X+H→X+1), Triple-Alpha (He+He+He→C)

import { Cell, createCell, createWasteCell, MAX_ATOMIC_NUMBER } from './elements';

export interface FusionResult {
  newBoard: (Cell | null)[][];
  fusionEvents: FusionEvent[];
  highestElement: number;
}

export interface FusionEvent {
  type: 'standard' | 'alpha' | 'beta' | 'triple-alpha' | 'overflow';
  fromElements: number[];
  toElement: number;
  positions: { row: number; col: number }[];
}

// Direction offsets for adjacency check (horizontal and vertical only)
const DIRECTIONS = [
  { dr: -1, dc: 0 }, // up
  { dr: 1, dc: 0 },  // down
  { dr: 0, dc: -1 }, // left
  { dr: 0, dc: 1 },  // right
];

// Check if position is within board bounds
function isValidPosition(row: number, col: number, boardHeight: number, boardWidth: number): boolean {
  return row >= 0 && row < boardHeight && col >= 0 && col < boardWidth;
}

// Get adjacent cells
function getAdjacentCells(
  board: (Cell | null)[][],
  row: number,
  col: number
): { cell: Cell; row: number; col: number }[] {
  const adjacent: { cell: Cell; row: number; col: number }[] = [];
  const boardHeight = board.length;
  const boardWidth = board[0].length;

  for (const { dr, dc } of DIRECTIONS) {
    const newRow = row + dr;
    const newCol = col + dc;
    if (isValidPosition(newRow, newCol, boardHeight, boardWidth)) {
      const cell = board[newRow][newCol];
      if (cell && cell.element.atomicNumber > 0) { // Not null and not waste
        adjacent.push({ cell, row: newRow, col: newCol });
      }
    }
  }

  return adjacent;
}

// Standard Fusion: X + X → 2X
// Returns the position of the fusion result (keeps one cell, clears the other)
function tryStandardFusion(
  board: (Cell | null)[][],
  row: number,
  col: number
): FusionEvent | null {
  const cell = board[row][col];
  if (!cell || cell.element.atomicNumber <= 0) return null;

  const atomicNumber = cell.element.atomicNumber;
  const adjacent = getAdjacentCells(board, row, col);

  // Find an adjacent cell with the same atomic number
  for (const adj of adjacent) {
    if (adj.cell.element.atomicNumber === atomicNumber) {
      const newAtomicNumber = atomicNumber * 2;

      // Check for overflow (beyond Uranium)
      if (newAtomicNumber > MAX_ATOMIC_NUMBER) {
        // Create waste blocks instead
        board[row][col] = createWasteCell();
        board[adj.row][adj.col] = createWasteCell();
        return {
          type: 'overflow',
          fromElements: [atomicNumber, atomicNumber],
          toElement: 0,
          positions: [
            { row, col },
            { row: adj.row, col: adj.col }
          ]
        };
      }

      // Keep at the first cell and clear the adjacent
      board[row][col] = createCell(newAtomicNumber);
      board[adj.row][adj.col] = null;

      return {
        type: 'standard',
        fromElements: [atomicNumber, atomicNumber],
        toElement: newAtomicNumber,
        positions: [
          { row, col },
          { row: adj.row, col: adj.col }
        ]
      };
    }
  }

  return null;
}

// Alpha Process Fusion: X + He → X+2
function tryAlphaFusion(
  board: (Cell | null)[][],
  row: number,
  col: number
): FusionEvent | null {
  const cell = board[row][col];
  if (!cell || cell.element.atomicNumber <= 0) return null;

  const atomicNumber = cell.element.atomicNumber;

  // Skip if this is Helium (would just become Be via standard fusion)
  if (atomicNumber === 2) return null;

  const adjacent = getAdjacentCells(board, row, col);

  // Find adjacent Helium (atomic number 2)
  for (const adj of adjacent) {
    if (adj.cell.element.atomicNumber === 2) {
      const newAtomicNumber = atomicNumber + 2;

      // Check for overflow
      if (newAtomicNumber > MAX_ATOMIC_NUMBER) {
        board[row][col] = createWasteCell();
        board[adj.row][adj.col] = createWasteCell();
        return {
          type: 'overflow',
          fromElements: [atomicNumber, 2],
          toElement: 0,
          positions: [
            { row, col },
            { row: adj.row, col: adj.col }
          ]
        };
      }

      // Keep the non-He element, consume the He
      board[row][col] = createCell(newAtomicNumber);
      board[adj.row][adj.col] = null;

      return {
        type: 'alpha',
        fromElements: [atomicNumber, 2],
        toElement: newAtomicNumber,
        positions: [
          { row, col },
          { row: adj.row, col: adj.col }
        ]
      };
    }
  }

  return null;
}

// Beta Decay Fusion (Proton Capture): X + H → X+1
// Allows incrementing elements by 1 when combined with Hydrogen
function tryBetaFusion(
  board: (Cell | null)[][],
  row: number,
  col: number
): FusionEvent | null {
  const cell = board[row][col];
  if (!cell || cell.element.atomicNumber <= 0) return null;

  const atomicNumber = cell.element.atomicNumber;

  // Skip if this is Hydrogen (would just become He via standard fusion)
  if (atomicNumber === 1) return null;

  const adjacent = getAdjacentCells(board, row, col);

  // Find adjacent Hydrogen (atomic number 1)
  for (const adj of adjacent) {
    if (adj.cell.element.atomicNumber === 1) {
      const newAtomicNumber = atomicNumber + 1;

      // Check for overflow
      if (newAtomicNumber > MAX_ATOMIC_NUMBER) {
        board[row][col] = createWasteCell();
        board[adj.row][adj.col] = createWasteCell();
        return {
          type: 'overflow',
          fromElements: [atomicNumber, 1],
          toElement: 0,
          positions: [
            { row, col },
            { row: adj.row, col: adj.col }
          ]
        };
      }

      // Keep the non-H element, consume the H
      board[row][col] = createCell(newAtomicNumber);
      board[adj.row][adj.col] = null;

      return {
        type: 'beta',
        fromElements: [atomicNumber, 1],
        toElement: newAtomicNumber,
        positions: [
          { row, col },
          { row: adj.row, col: adj.col }
        ]
      };
    }
  }

  return null;
}

// Triple-Alpha Fusion: He + He + He → C
// Checks for three adjacent Helium atoms and fuses them into Carbon
function tryTripleAlphaFusion(
  board: (Cell | null)[][],
  row: number,
  col: number
): FusionEvent | null {
  const cell = board[row][col];
  if (!cell || cell.element.atomicNumber !== 2) return null; // Must be Helium

  const adjacent = getAdjacentCells(board, row, col);

  // Find all adjacent Helium atoms
  const adjacentHelium: { row: number; col: number }[] = [];
  for (const adj of adjacent) {
    if (adj.cell.element.atomicNumber === 2) {
      adjacentHelium.push({ row: adj.row, col: adj.col });
    }
  }

  // Need at least 2 adjacent Helium (3 total including current)
  if (adjacentHelium.length < 2) return null;

  // Use the first two adjacent Helium atoms found
  const hel1 = adjacentHelium[0];
  const hel2 = adjacentHelium[1];

  // Clear all three Helium atoms and create Carbon at current position
  board[row][col] = createCell(6); // Carbon
  board[hel1.row][hel1.col] = null;
  board[hel2.row][hel2.col] = null;

  return {
    type: 'triple-alpha',
    fromElements: [2, 2, 2],
    toElement: 6,
    positions: [
      { row, col },
      { row: hel1.row, col: hel1.col },
      { row: hel2.row, col: hel2.col }
    ]
  };
}

// Main fusion check - performs recursive fusion until no more fusions possible
export function performFusion(board: (Cell | null)[][]): FusionResult {
  const fusionEvents: FusionEvent[] = [];
  let highestElement = 0;
  let fusionOccurred = true;

  // Deep copy the board for modification
  const newBoard = board.map(row => row.map(cell => cell ? { ...cell } : null));

  // Track highest element on board
  for (let row = 0; row < newBoard.length; row++) {
    for (let col = 0; col < newBoard[0].length; col++) {
      const cell = newBoard[row][col];
      if (cell && cell.element.atomicNumber > highestElement) {
        highestElement = cell.element.atomicNumber;
      }
    }
  }

  // Keep fusing until no more fusions occur (chain reactions)
  while (fusionOccurred) {
    fusionOccurred = false;

    // Scan entire board for fusion opportunities
    // Priority: Triple-alpha > Standard > Alpha > Beta
    for (let row = 0; row < newBoard.length; row++) {
      for (let col = 0; col < newBoard[0].length; col++) {
        const cell = newBoard[row][col];
        if (!cell || cell.element.atomicNumber <= 0) continue;

        // Try triple-alpha fusion first (highest priority - 3 He → C)
        const tripleAlphaResult = tryTripleAlphaFusion(newBoard, row, col);
        if (tripleAlphaResult) {
          fusionEvents.push(tripleAlphaResult);
          fusionOccurred = true;
          if (tripleAlphaResult.toElement > highestElement) {
            highestElement = tripleAlphaResult.toElement;
          }
          applyGravity(newBoard);
          break; // Restart scan after each fusion
        }
      }
      if (fusionOccurred) break;
    }

    // Try standard fusion (same elements)
    if (!fusionOccurred) {
      for (let row = 0; row < newBoard.length; row++) {
        for (let col = 0; col < newBoard[0].length; col++) {
          const cell = newBoard[row][col];
          if (!cell || cell.element.atomicNumber <= 0) continue;

          const standardResult = tryStandardFusion(newBoard, row, col);
          if (standardResult) {
            fusionEvents.push(standardResult);
            fusionOccurred = true;
            if (standardResult.toElement > highestElement) {
              highestElement = standardResult.toElement;
            }
            applyGravity(newBoard);
            break;
          }
        }
        if (fusionOccurred) break;
      }
    }

    // Try alpha process (X + He → X+2)
    if (!fusionOccurred) {
      for (let row = 0; row < newBoard.length; row++) {
        for (let col = 0; col < newBoard[0].length; col++) {
          const cell = newBoard[row][col];
          if (!cell || cell.element.atomicNumber <= 0) continue;

          const alphaResult = tryAlphaFusion(newBoard, row, col);
          if (alphaResult) {
            fusionEvents.push(alphaResult);
            fusionOccurred = true;
            if (alphaResult.toElement > highestElement) {
              highestElement = alphaResult.toElement;
            }
            applyGravity(newBoard);
            break;
          }
        }
        if (fusionOccurred) break;
      }
    }

    // Try beta fusion (X + H → X+1) - lowest priority
    if (!fusionOccurred) {
      for (let row = 0; row < newBoard.length; row++) {
        for (let col = 0; col < newBoard[0].length; col++) {
          const cell = newBoard[row][col];
          if (!cell || cell.element.atomicNumber <= 0) continue;

          const betaResult = tryBetaFusion(newBoard, row, col);
          if (betaResult) {
            fusionEvents.push(betaResult);
            fusionOccurred = true;
            if (betaResult.toElement > highestElement) {
              highestElement = betaResult.toElement;
            }
            applyGravity(newBoard);
            break;
          }
        }
        if (fusionOccurred) break;
      }
    }
  }

  return { newBoard, fusionEvents, highestElement };
}

// Apply gravity - cells fall down to fill empty spaces
function applyGravity(board: (Cell | null)[][]): void {
  const boardHeight = board.length;
  const boardWidth = board[0].length;

  for (let col = 0; col < boardWidth; col++) {
    // Collect non-null cells in this column
    const cells: Cell[] = [];
    for (let row = 0; row < boardHeight; row++) {
      if (board[row][col]) {
        cells.push(board[row][col]!);
      }
    }

    // Clear the column and refill from bottom
    for (let row = 0; row < boardHeight; row++) {
      board[row][col] = null;
    }

    // Place cells from bottom up
    let targetRow = boardHeight - 1;
    for (let i = cells.length - 1; i >= 0; i--) {
      board[targetRow][col] = cells[i];
      targetRow--;
    }
  }
}

// Full gravity pass - just normal gravity
export function applyFullGravity(board: (Cell | null)[][]): void {
  applyGravity(board);
}
