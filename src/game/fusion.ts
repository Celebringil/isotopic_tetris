// Fusion mechanics for Isotopic Tetris
// Handles: Standard Fusion (X+X→2X), Alpha Process (X+He→X+2), Chain Reactions

import { Cell, createCell, createWasteCell, MAX_ATOMIC_NUMBER, isHeavyElement } from './elements';

export interface FusionResult {
  newBoard: (Cell | null)[][];
  fusionEvents: FusionEvent[];
  highestElement: number;
}

export interface FusionEvent {
  type: 'standard' | 'alpha' | 'overflow';
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
    // Priority: Standard fusion first, then Alpha process
    for (let row = 0; row < newBoard.length; row++) {
      for (let col = 0; col < newBoard[0].length; col++) {
        const cell = newBoard[row][col];
        if (!cell || cell.element.atomicNumber <= 0) continue;

        // Try standard fusion first (same elements)
        const standardResult = tryStandardFusion(newBoard, row, col);
        if (standardResult) {
          fusionEvents.push(standardResult);
          fusionOccurred = true;
          if (standardResult.toElement > highestElement) {
            highestElement = standardResult.toElement;
          }
          // Apply gravity after fusion (cells above should fall)
          applyGravity(newBoard);
          break; // Restart scan after each fusion
        }
      }
      if (fusionOccurred) break;
    }

    // If no standard fusion, try alpha process
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

// Heavy element gravity (crushing mechanic)
// Heavy elements (Fe+) crush down through lighter elements
export function applyHeavyGravity(board: (Cell | null)[][]): boolean {
  const boardHeight = board.length;
  const boardWidth = board[0].length;
  let crushed = false;

  for (let col = 0; col < boardWidth; col++) {
    for (let row = boardHeight - 2; row >= 0; row--) { // Start from second-to-last row
      const cell = board[row][col];
      if (!cell) continue;

      // Check if this is a heavy element
      if (isHeavyElement(cell.element.atomicNumber)) {
        // Check cell below
        const belowCell = board[row + 1][col];

        // If empty below, move down
        if (!belowCell) {
          board[row + 1][col] = cell;
          board[row][col] = null;
          crushed = true;
        }
        // If lighter element below, crush it (swap positions, lighter goes up)
        else if (belowCell.element.atomicNumber < cell.element.atomicNumber &&
                 belowCell.element.atomicNumber > 0) { // Not waste
          board[row + 1][col] = cell;
          board[row][col] = belowCell;
          crushed = true;
        }
      }
    }
  }

  return crushed;
}

// Full gravity pass including heavy element crushing
export function applyFullGravity(board: (Cell | null)[][]): void {
  // First, normal gravity
  applyGravity(board);

  // Then, heavy element crushing (repeat until no more crushing)
  let crushing = true;
  let iterations = 0;
  const maxIterations = board.length * 2; // Prevent infinite loops

  while (crushing && iterations < maxIterations) {
    crushing = applyHeavyGravity(board);
    if (crushing) {
      applyGravity(board); // Reapply normal gravity after crushing
    }
    iterations++;
  }
}
