// Isotopic Tetris - Main Game Component
// Combines standard Tetris with element fusion mechanics

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  Cell,
  createCell,
  ELEMENTS,
  STAGES,
  getCurrentStage,
  getSpawnElement,
  isHeavyElement,
  isUnstable,
  MAX_ATOMIC_NUMBER,
  StageConfig,
} from '../game/elements';
import { performFusion, applyFullGravity } from '../game/fusion';
import { updateDecay, stabilizeElements } from '../game/decay';
import { saveGameScore } from '../lib/insforge';

// Board dimensions
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;
const PREVIEW_BLOCK_SIZE = 20;

// Tetromino shapes (same as original)
const SHAPES: Record<string, number[][][]> = {
  I: [
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
    [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]],
  ],
  O: [
    [[1, 1], [1, 1]],
    [[1, 1], [1, 1]],
    [[1, 1], [1, 1]],
    [[1, 1], [1, 1]],
  ],
  T: [
    [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
    [[0, 1, 0], [1, 1, 0], [0, 1, 0]],
  ],
  S: [
    [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
    [[0, 0, 0], [0, 1, 1], [1, 1, 0]],
    [[1, 0, 0], [1, 1, 0], [0, 1, 0]],
  ],
  Z: [
    [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 0], [0, 1, 1]],
    [[0, 1, 0], [1, 1, 0], [1, 0, 0]],
  ],
  J: [
    [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
    [[0, 1, 0], [0, 1, 0], [1, 1, 0]],
  ],
  L: [
    [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
    [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
    [[1, 1, 0], [0, 1, 0], [0, 1, 0]],
  ],
};

// Wall kick data (SRS)
const WALL_KICK_JLSTZ: Record<string, number[][]> = {
  '0->1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '1->0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '1->2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2->1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2->3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '3->2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '3->0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0->3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

const WALL_KICK_I: Record<string, number[][]> = {
  '0->1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '1->0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '1->2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '2->1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '2->3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '3->2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '3->0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '0->3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

// Scoring
const SCORE_TABLE: Record<number, number> = { 1: 100, 2: 300, 3: 500, 4: 800 };
const FUSION_SCORE_BASE = 150; // Base score per fusion
const CHAIN_MULTIPLIER = 1.5; // Multiplier for chain reactions

// Level speeds
const LEVEL_SPEEDS: Record<number, number> = {
  1: 1000, 2: 900, 3: 800, 4: 700, 5: 600,
  6: 500, 7: 400, 8: 300, 9: 200, 10: 150,
  11: 130, 12: 110, 13: 100, 14: 90, 15: 80,
  16: 70, 17: 60, 18: 50, 19: 40, 20: 30,
};

// Stage speed multipliers - later stages are faster!
// Stage 1 (Hydrogen Age): 1.0x (normal)
// Stage 2 (Stellar Age): 0.85x (15% faster)
// Stage 3 (Supernova): 0.7x (30% faster)
// Stage 4 (Radioactive): 0.55x (45% faster)
const STAGE_SPEED_MULTIPLIERS: Record<string, number> = {
  'Hydrogen Age': 1.0,
  'Stellar Age': 0.85,
  'Supernova': 0.7,
  'Radioactive': 0.55,
};

// Speed boost when synthesizing heavy elements (atomic number > 60)
const HEAVY_ELEMENT_THRESHOLD = 60;
const HEAVY_ELEMENT_SPEED_MULTIPLIER = 0.8; // 1/1.25 = 0.8 (25% faster)

interface Piece {
  type: string;
  element: number; // Atomic number for this piece's blocks
  rotation: number;
  x: number;
  y: number;
}

interface GameState {
  board: (Cell | null)[][];
  currentPiece: Piece | null;
  holdPiece: { type: string; element: number } | null;
  canHold: boolean;
  nextPieces: { type: string; element: number }[];
  score: number;
  level: number;
  lines: number;
  combo: number;
  lastClearWasTetris: boolean;
  gameOver: boolean;
  victory: boolean;
  paused: boolean;
  bag: string[];
  lockResets: number;
  isOnGround: boolean;
  highestElement: number;
  currentStage: StageConfig;
  fusionChain: number;
  lastDecayTime: number;
}

interface IsotopicTetrisProps {
  userId?: string;
  onGameOver?: (score: number, victory: boolean) => void;
  onScoreSaved?: () => void; // Callback when score is saved to refresh leaderboard
}

export default function IsotopicTetris({ userId, onGameOver, onScoreSaved }: IsotopicTetrisProps) {
  const gameCanvasRef = useRef<HTMLCanvasElement>(null);
  const holdCanvasRef = useRef<HTMLCanvasElement>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const dropIntervalRef = useRef<number | null>(null);
  const lockTimerRef = useRef<number | null>(null);
  const decayIntervalRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentStageRef = useRef<string>('Hydrogen Age'); // Track stage for speed changes
  const heavyElementReachedRef = useRef<boolean>(false); // Track if heavy element (>60) was reached

  // UI state
  const [displayState, setDisplayState] = useState({
    score: 0,
    level: 1,
    lines: 0,
    highestElement: 1,
    stageName: 'Hydrogen Age',
    gameOver: false,
    victory: false,
    paused: false,
  });

  const LOCK_DELAY = 500;
  const MAX_LOCK_RESETS = 15;
  const DECAY_INTERVAL = 100; // Check decay every 100ms
  const LINE_CLEAR_STABILIZATION = 7; // Seconds added to half-life on line clear

  // Shuffle array (Fisher-Yates)
  const shuffleArray = (array: string[]): string[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Get next piece from bag
  const getNextFromBag = useCallback((state: GameState): { type: string; element: number } => {
    if (state.bag.length === 0) {
      state.bag = shuffleArray(Object.keys(SHAPES));
    }
    const type = state.bag.pop()!;
    const element = getSpawnElement(state.currentStage);
    return { type, element };
  }, []);

  // Get shape for piece type and rotation
  const getShape = (type: string, rotation: number): number[][] => {
    return SHAPES[type][rotation];
  };

  // Check if position is valid
  const isValidPosition = useCallback(
    (state: GameState, x: number, y: number, rotation: number): boolean => {
      if (!state.currentPiece) return false;
      const shape = getShape(state.currentPiece.type, rotation);

      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            const newX = x + col;
            const newY = y + row;

            if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
              return false;
            }

            if (newY >= 0 && state.board[newY][newX]) {
              return false;
            }
          }
        }
      }
      return true;
    },
    []
  );

  // Get ghost piece Y position
  const getGhostY = useCallback(
    (state: GameState): number => {
      if (!state.currentPiece) return 0;
      let ghostY = state.currentPiece.y;
      while (isValidPosition(state, state.currentPiece.x, ghostY + 1, state.currentPiece.rotation)) {
        ghostY++;
      }
      return ghostY;
    },
    [isValidPosition]
  );

  // Check if piece is on ground
  const checkOnGround = useCallback(
    (state: GameState): boolean => {
      if (!state.currentPiece) return false;
      return !isValidPosition(state, state.currentPiece.x, state.currentPiece.y + 1, state.currentPiece.rotation);
    },
    [isValidPosition]
  );

  // Draw a single block with element info
  const drawElementBlock = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    cell: Cell,
    size: number,
    showTimer: boolean = true
  ) => {
    const px = x * size;
    const py = y * size;
    const element = cell.element;

    // Base color
    ctx.fillStyle = element.color;
    ctx.fillRect(px + 1, py + 1, size - 2, size - 2);

    // Highlight (top-left)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(px + 1, py + 1, size - 2, 4);
    ctx.fillRect(px + 1, py + 1, 4, size - 2);

    // Shadow (bottom-right)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(px + size - 5, py + 1, 4, size - 2);
    ctx.fillRect(px + 1, py + size - 5, size - 2, 4);

    // Draw element symbol
    ctx.fillStyle = element.atomicNumber > 0 ? '#000' : '#fff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(element.symbol, px + size / 2, py + size / 2);

    // Draw atomic number (small, top-left)
    if (element.atomicNumber > 0) {
      ctx.font = '7px monospace';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(element.atomicNumber.toString(), px + 3, py + 2);
    }

    // Draw half-life timer for unstable elements
    if (showTimer && cell.halfLife !== null && cell.halfLife > 0) {
      const timerWidth = (cell.halfLife / (element.baseHalfLife || 10)) * (size - 4);
      ctx.fillStyle = cell.halfLife < 3 ? '#ff0000' : '#ffff00';
      ctx.fillRect(px + 2, py + size - 5, Math.max(0, timerWidth), 3);
    }

    // Radioactive glow for unstable elements
    if (isUnstable(element.atomicNumber) && element.atomicNumber > 0) {
      ctx.strokeStyle = `rgba(255, 23, 68, ${0.3 + Math.sin(Date.now() / 200) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(px, py, size, size);
    }

    // Heavy element indicator (Fe+)
    if (isHeavyElement(element.atomicNumber)) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.beginPath();
      ctx.moveTo(px + size - 8, py + 2);
      ctx.lineTo(px + size - 2, py + 2);
      ctx.lineTo(px + size - 2, py + 8);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Draw ghost block
  const drawGhostBlock = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    size: number
  ) => {
    const px = x * size;
    const py = y * size;

    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.15;
    ctx.fillRect(px + 2, py + 2, size - 4, size - 4);

    ctx.globalAlpha = 1.0;
  };

  // Draw preview block
  const drawPreviewElementBlock = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    element: number
  ) => {
    const elemData = ELEMENTS[element];
    if (!elemData) return;

    ctx.fillStyle = elemData.color;
    ctx.fillRect(x + 1, y + 1, PREVIEW_BLOCK_SIZE - 2, PREVIEW_BLOCK_SIZE - 2);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x + 1, y + 1, PREVIEW_BLOCK_SIZE - 2, 2);
    ctx.fillRect(x + 1, y + 1, 2, PREVIEW_BLOCK_SIZE - 2);

    // Element symbol
    ctx.fillStyle = '#000';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(elemData.symbol, x + PREVIEW_BLOCK_SIZE / 2, y + PREVIEW_BLOCK_SIZE / 2);
  };

  // Main draw function
  const draw = useCallback(
    (state: GameState) => {
      const gameCanvas = gameCanvasRef.current;
      if (!gameCanvas) return;
      const ctx = gameCanvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

      // Draw grid
      ctx.strokeStyle = '#1a1a3a';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= BOARD_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK_SIZE, 0);
        ctx.lineTo(x * BLOCK_SIZE, BOARD_HEIGHT * BLOCK_SIZE);
        ctx.stroke();
      }
      for (let y = 0; y <= BOARD_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK_SIZE);
        ctx.lineTo(BOARD_WIDTH * BLOCK_SIZE, y * BLOCK_SIZE);
        ctx.stroke();
      }

      // Draw placed blocks
      for (let row = 0; row < BOARD_HEIGHT; row++) {
        for (let col = 0; col < BOARD_WIDTH; col++) {
          const cell = state.board[row][col];
          if (cell) {
            drawElementBlock(ctx, col, row, cell, BLOCK_SIZE);
          }
        }
      }

      // Draw current piece
      if (state.currentPiece) {
        const shape = getShape(state.currentPiece.type, state.currentPiece.rotation);
        const ghostY = getGhostY(state);
        const elemData = ELEMENTS[state.currentPiece.element];

        // Draw ghost piece
        if (ghostY !== state.currentPiece.y && elemData) {
          for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
              if (shape[row][col]) {
                const x = state.currentPiece.x + col;
                const y = ghostY + row;
                if (y >= 0) {
                  drawGhostBlock(ctx, x, y, elemData.color, BLOCK_SIZE);
                }
              }
            }
          }
        }

        // Draw active piece
        if (elemData) {
          for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
              if (shape[row][col]) {
                const x = state.currentPiece.x + col;
                const y = state.currentPiece.y + row;
                if (y >= 0) {
                  const tempCell = createCell(state.currentPiece.element);
                  drawElementBlock(ctx, x, y, tempCell, BLOCK_SIZE, false);
                }
              }
            }
          }
        }
      }
    },
    [getGhostY]
  );

  // Draw hold piece
  const drawHoldPiece = useCallback((state: GameState) => {
    const holdCanvas = holdCanvasRef.current;
    if (!holdCanvas) return;
    const ctx = holdCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, holdCanvas.width, holdCanvas.height);

    if (state.holdPiece) {
      const shape = SHAPES[state.holdPiece.type][0];
      const offsetX = (holdCanvas.width - shape[0].length * PREVIEW_BLOCK_SIZE) / 2;
      const offsetY = (holdCanvas.height - shape.length * PREVIEW_BLOCK_SIZE) / 2;

      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            if (state.canHold) {
              drawPreviewElementBlock(ctx, offsetX + col * PREVIEW_BLOCK_SIZE, offsetY + row * PREVIEW_BLOCK_SIZE, state.holdPiece.element);
            } else {
              ctx.fillStyle = '#444';
              ctx.fillRect(offsetX + col * PREVIEW_BLOCK_SIZE + 1, offsetY + row * PREVIEW_BLOCK_SIZE + 1, PREVIEW_BLOCK_SIZE - 2, PREVIEW_BLOCK_SIZE - 2);
            }
          }
        }
      }
    }
  }, []);

  // Draw next pieces
  const drawNextPieces = useCallback((state: GameState) => {
    const nextCanvas = nextCanvasRef.current;
    if (!nextCanvas) return;
    const ctx = nextCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    let offsetY = 10;

    for (let i = 0; i < Math.min(state.nextPieces.length, 4); i++) {
      const piece = state.nextPieces[i];
      const shape = SHAPES[piece.type][0];
      const offsetX = (nextCanvas.width - shape[0].length * PREVIEW_BLOCK_SIZE) / 2;

      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            drawPreviewElementBlock(ctx, offsetX + col * PREVIEW_BLOCK_SIZE, offsetY + row * PREVIEW_BLOCK_SIZE, piece.element);
          }
        }
      }

      offsetY += shape.length * PREVIEW_BLOCK_SIZE + 15;
    }
  }, []);

  // Clear lock timer
  const clearLockTimer = useCallback(() => {
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }
  }, []);

  // Update display state
  const updateDisplayState = useCallback((state: GameState) => {
    setDisplayState({
      score: state.score,
      level: state.level,
      lines: state.lines,
      highestElement: state.highestElement,
      stageName: state.currentStage.name,
      gameOver: state.gameOver,
      victory: state.victory,
      paused: state.paused,
    });
  }, []);

  // End game
  const endGame = useCallback(
    async (state: GameState, victory: boolean = false) => {
      state.gameOver = true;
      state.victory = victory;
      if (dropIntervalRef.current) clearInterval(dropIntervalRef.current);
      if (decayIntervalRef.current) clearInterval(decayIntervalRef.current);
      clearLockTimer();
      updateDisplayState(state);
      onGameOver?.(state.score, victory);

      // Save score to database if user is logged in
      if (userId) {
        const { error } = await saveGameScore(
          userId,
          state.score,
          state.highestElement,
          state.lines,
          victory
        );
        if (error) {
          console.error('Failed to save score:', error);
        } else {
          onScoreSaved?.();
        }
      }
    },
    [clearLockTimer, updateDisplayState, onGameOver, userId, onScoreSaved]
  );

  // Helper function to clear full lines and return count
  const clearFullLines = useCallback((board: (Cell | null)[][]): number => {
    let clearedLines = 0;
    for (let row = BOARD_HEIGHT - 1; row >= 0; row--) {
      if (board[row].every(cell => cell !== null)) {
        board.splice(row, 1);
        board.unshift(Array(BOARD_WIDTH).fill(null));
        clearedLines++;
        row++; // Re-check this row since we shifted
      }
    }
    return clearedLines;
  }, []);

  // Clear lines and handle fusion - loops until board is stable
  const clearLinesAndFuse = useCallback(
    (state: GameState) => {
      let totalClearedLines = 0;
      let totalFusionEvents = 0;
      let highestElementThisRound = state.highestElement;
      let boardChanged = true;
      let iterations = 0;
      const maxIterations = 50; // Prevent infinite loops

      // Keep processing until board is stable (no more changes)
      while (boardChanged && iterations < maxIterations) {
        boardChanged = false;
        iterations++;

        // Step 1: Apply gravity first (cells fall down)
        applyFullGravity(state.board);

        // Step 2: Clear any full lines
        const clearedLines = clearFullLines(state.board);
        if (clearedLines > 0) {
          totalClearedLines += clearedLines;
          boardChanged = true;

          // Stabilize unstable elements on line clear
          stabilizeElements(state.board, LINE_CLEAR_STABILIZATION);
        }

        // Step 3: Perform fusion on entire board
        const fusionResult = performFusion(state.board);
        state.board = fusionResult.newBoard;

        if (fusionResult.fusionEvents.length > 0) {
          totalFusionEvents += fusionResult.fusionEvents.length;
          boardChanged = true;

          // Track highest element
          if (fusionResult.highestElement > highestElementThisRound) {
            highestElementThisRound = fusionResult.highestElement;
          }
        }
      }

      // Calculate line clear scoring
      if (totalClearedLines > 0) {
        // Score based on total lines cleared (cap at 4 for scoring table)
        const scoringLines = Math.min(totalClearedLines, 4);
        let baseScore = SCORE_TABLE[scoringLines] || 0;

        // Bonus for clearing more than 4 lines in chain reactions
        if (totalClearedLines > 4) {
          baseScore += (totalClearedLines - 4) * 200;
        }

        if (totalClearedLines >= 4) {
          if (state.lastClearWasTetris) {
            baseScore = Math.floor(baseScore * 1.5);
          }
          state.lastClearWasTetris = true;
        } else {
          state.lastClearWasTetris = false;
        }

        state.combo++;
        if (state.combo > 1) {
          baseScore += 50 * state.combo * state.level;
        }

        state.score += baseScore * state.level;
        state.lines += totalClearedLines;

        // Level up
        const newLevel = Math.floor(state.lines / 10) + 1;
        if (newLevel > state.level) {
          state.level = Math.min(newLevel, 20);
        }
      } else {
        state.combo = 0;
      }

      // Score fusion events
      if (totalFusionEvents > 0) {
        let chainMultiplier = 1;
        for (let i = 0; i < totalFusionEvents; i++) {
          const fusionScore = Math.floor(FUSION_SCORE_BASE * chainMultiplier * state.level);
          state.score += fusionScore;
          chainMultiplier *= CHAIN_MULTIPLIER;
        }
        state.fusionChain = totalFusionEvents;
      }

      // Update highest element
      if (highestElementThisRound > state.highestElement) {
        state.highestElement = highestElementThisRound;

        // Update stage
        const newStage = getCurrentStage(state.highestElement);
        if (newStage.name !== state.currentStage.name) {
          state.currentStage = newStage;
        }

        // Check for victory (Uranium synthesized)
        if (state.highestElement >= MAX_ATOMIC_NUMBER) {
          endGame(state, true);
          return;
        }
      }

      updateDisplayState(state);
    },
    [clearFullLines, endGame, updateDisplayState]
  );

  // Spawn new piece
  const spawnPiece = useCallback(
    (state: GameState) => {
      const pieceData = state.nextPieces.shift()!;
      state.nextPieces.push(getNextFromBag(state));

      state.currentPiece = {
        type: pieceData.type,
        element: pieceData.element,
        rotation: 0,
        x: Math.floor(BOARD_WIDTH / 2) - Math.ceil(SHAPES[pieceData.type][0][0].length / 2),
        y: 0,
      };

      state.canHold = true;
      clearLockTimer();
      state.lockResets = 0;
      state.isOnGround = false;

      if (!isValidPosition(state, state.currentPiece.x, state.currentPiece.y, state.currentPiece.rotation)) {
        endGame(state, false);
      }

      drawNextPieces(state);
    },
    [clearLockTimer, drawNextPieces, endGame, getNextFromBag, isValidPosition]
  );

  // Lock piece in place
  const lockPiece = useCallback(
    (state: GameState) => {
      if (!state.currentPiece) return;

      const shape = getShape(state.currentPiece.type, state.currentPiece.rotation);

      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            const boardY = state.currentPiece.y + row;
            const boardX = state.currentPiece.x + col;

            if (boardY >= 0) {
              state.board[boardY][boardX] = createCell(state.currentPiece.element);
            }
          }
        }
      }

      clearLinesAndFuse(state);
      spawnPiece(state);
      draw(state);
    },
    [clearLinesAndFuse, draw, spawnPiece]
  );

  // Start lock timer
  const startLockTimer = useCallback(
    (state: GameState) => {
      clearLockTimer();
      lockTimerRef.current = window.setTimeout(() => {
        if (!state.gameOver && !state.paused && state.isOnGround) {
          lockPiece(state);
        }
      }, LOCK_DELAY);
    },
    [clearLockTimer, lockPiece]
  );

  // Reset lock delay
  const resetLockDelay = useCallback(
    (state: GameState): boolean => {
      if (state.isOnGround && state.lockResets < MAX_LOCK_RESETS) {
        state.lockResets++;
        startLockTimer(state);
        return true;
      }
      return false;
    },
    [startLockTimer]
  );

  // Move piece
  const movePiece = useCallback(
    (state: GameState, dx: number, dy: number): boolean => {
      if (state.gameOver || state.paused || !state.currentPiece) return false;

      const newX = state.currentPiece.x + dx;
      const newY = state.currentPiece.y + dy;

      if (isValidPosition(state, newX, newY, state.currentPiece.rotation)) {
        if (dx !== 0 && state.isOnGround) {
          resetLockDelay(state);
        }

        state.currentPiece.x = newX;
        state.currentPiece.y = newY;

        const wasOnGround = state.isOnGround;
        state.isOnGround = checkOnGround(state);

        if (!wasOnGround && state.isOnGround) {
          startLockTimer(state);
        } else if (wasOnGround && !state.isOnGround) {
          clearLockTimer();
        }

        draw(state);
        return true;
      }
      return false;
    },
    [checkOnGround, clearLockTimer, draw, isValidPosition, resetLockDelay, startLockTimer]
  );

  // Get wall kick data
  const getWallKickData = (type: string, fromRotation: number, toRotation: number): number[][] => {
    const key = `${fromRotation}->${toRotation}`;
    if (type === 'I') return WALL_KICK_I[key] || [[0, 0]];
    if (type === 'O') return [[0, 0]];
    return WALL_KICK_JLSTZ[key] || [[0, 0]];
  };

  // Rotate piece
  const rotatePiece = useCallback(
    (state: GameState, direction: number) => {
      if (state.gameOver || state.paused || !state.currentPiece) return;

      const fromRotation = state.currentPiece.rotation;
      const toRotation = (state.currentPiece.rotation + direction + 4) % 4;
      const kicks = getWallKickData(state.currentPiece.type, fromRotation, toRotation);

      for (const [dx, dy] of kicks) {
        const newX = state.currentPiece.x + dx;
        const newY = state.currentPiece.y - dy;

        if (isValidPosition(state, newX, newY, toRotation)) {
          if (state.isOnGround) {
            resetLockDelay(state);
          }

          state.currentPiece.x = newX;
          state.currentPiece.y = newY;
          state.currentPiece.rotation = toRotation;

          const wasOnGround = state.isOnGround;
          state.isOnGround = checkOnGround(state);

          if (!wasOnGround && state.isOnGround) {
            startLockTimer(state);
          } else if (wasOnGround && !state.isOnGround) {
            clearLockTimer();
          }

          draw(state);
          return;
        }
      }
    },
    [checkOnGround, clearLockTimer, draw, isValidPosition, resetLockDelay, startLockTimer]
  );

  // Hard drop
  const hardDrop = useCallback(
    (state: GameState) => {
      if (state.gameOver || state.paused || !state.currentPiece) return;

      let dropDistance = 0;
      while (isValidPosition(state, state.currentPiece.x, state.currentPiece.y + 1, state.currentPiece.rotation)) {
        state.currentPiece.y++;
        dropDistance++;
      }

      state.score += dropDistance * 2;
      lockPiece(state);
    },
    [isValidPosition, lockPiece]
  );

  // Soft drop
  const softDrop = useCallback(
    (state: GameState) => {
      if (state.gameOver || state.paused) return;

      if (movePiece(state, 0, 1)) {
        state.score += 1;
        updateDisplayState(state);
      }
    },
    [movePiece, updateDisplayState]
  );

  // Hold piece
  const holdCurrentPiece = useCallback(
    (state: GameState) => {
      if (state.gameOver || state.paused || !state.canHold || !state.currentPiece) return;

      state.canHold = false;
      clearLockTimer();
      state.lockResets = 0;
      state.isOnGround = false;

      if (state.holdPiece === null) {
        state.holdPiece = { type: state.currentPiece.type, element: state.currentPiece.element };
        spawnPiece(state);
      } else {
        const temp = state.holdPiece;
        state.holdPiece = { type: state.currentPiece.type, element: state.currentPiece.element };

        state.currentPiece = {
          type: temp.type,
          element: temp.element,
          rotation: 0,
          x: Math.floor(BOARD_WIDTH / 2) - Math.ceil(SHAPES[temp.type][0][0].length / 2),
          y: 0,
        };
      }

      drawHoldPiece(state);
      draw(state);
    },
    [clearLockTimer, draw, drawHoldPiece, spawnPiece]
  );

  // Toggle pause
  const togglePause = useCallback(
    (state: GameState) => {
      state.paused = !state.paused;
      updateDisplayState(state);
    },
    [updateDisplayState]
  );

  // Calculate speed based on level, stage, and highest element
  const getGameSpeed = useCallback((state: GameState): number => {
    const baseSpeed = LEVEL_SPEEDS[state.level] || 30;
    const stageMultiplier = STAGE_SPEED_MULTIPLIERS[state.currentStage.name] || 1.0;

    // Apply stage multiplier (lower = faster)
    let adjustedSpeed = baseSpeed * stageMultiplier;

    // Apply heavy element speed boost (25% faster when atomic number > 60)
    if (state.highestElement > HEAVY_ELEMENT_THRESHOLD) {
      adjustedSpeed *= HEAVY_ELEMENT_SPEED_MULTIPLIER;
    }

    return Math.max(20, Math.floor(adjustedSpeed));
  }, []);

  // Check if speed needs to be updated (stage change or heavy element reached)
  const needsSpeedUpdate = useCallback((state: GameState): boolean => {
    // Check stage change
    if (state.currentStage.name !== currentStageRef.current) {
      return true;
    }
    // Check if heavy element threshold was just crossed
    const isHeavyNow = state.highestElement > HEAVY_ELEMENT_THRESHOLD;
    if (isHeavyNow && !heavyElementReachedRef.current) {
      return true;
    }
    return false;
  }, []);

  // Start game loop
  const startGameLoop = useCallback(
    (state: GameState) => {
      if (dropIntervalRef.current) clearInterval(dropIntervalRef.current);

      const speed = getGameSpeed(state);
      currentStageRef.current = state.currentStage.name;
      heavyElementReachedRef.current = state.highestElement > HEAVY_ELEMENT_THRESHOLD;

      const gameLoopCallback = () => {
        if (!state.gameOver && !state.paused) {
          // Check if speed needs update (stage change or heavy element reached)
          if (needsSpeedUpdate(state)) {
            currentStageRef.current = state.currentStage.name;
            heavyElementReachedRef.current = state.highestElement > HEAVY_ELEMENT_THRESHOLD;
            // Restart the loop with new speed
            if (dropIntervalRef.current) clearInterval(dropIntervalRef.current);
            const newSpeed = getGameSpeed(state);
            dropIntervalRef.current = window.setInterval(gameLoopCallback, newSpeed);
            return;
          }

          if (!movePiece(state, 0, 1)) {
            if (!state.isOnGround) {
              state.isOnGround = true;
              startLockTimer(state);
            } else if (!lockTimerRef.current) {
              startLockTimer(state);
            }
          }
        }
      };

      dropIntervalRef.current = window.setInterval(gameLoopCallback, speed);
    },
    [getGameSpeed, movePiece, needsSpeedUpdate, startLockTimer]
  );

  // Start decay loop
  const startDecayLoop = useCallback(
    (state: GameState) => {
      if (decayIntervalRef.current) clearInterval(decayIntervalRef.current);

      decayIntervalRef.current = window.setInterval(() => {
        if (!state.gameOver && !state.paused) {
          const now = Date.now();
          const deltaTime = (now - state.lastDecayTime) / 1000;
          state.lastDecayTime = now;

          const decayEvents = updateDecay(state.board, deltaTime);

          if (decayEvents.length > 0) {
            // Apply gravity after decay
            applyFullGravity(state.board);
            draw(state);
          }
        }
      }, DECAY_INTERVAL);
    },
    [draw]
  );

  // Animation loop for smooth rendering
  const startAnimationLoop = useCallback(
    (state: GameState) => {
      const animate = () => {
        if (!state.gameOver) {
          draw(state);
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    },
    [draw]
  );

  // Initialize game
  const init = useCallback(() => {
    const initialStage = STAGES[0];

    const state: GameState = {
      board: Array(BOARD_HEIGHT)
        .fill(null)
        .map(() => Array(BOARD_WIDTH).fill(null)),
      currentPiece: null,
      holdPiece: null,
      canHold: true,
      nextPieces: [],
      score: 0,
      level: 1,
      lines: 0,
      combo: 0,
      lastClearWasTetris: false,
      gameOver: false,
      victory: false,
      paused: false,
      bag: [],
      lockResets: 0,
      isOnGround: false,
      highestElement: 1,
      currentStage: initialStage,
      fusionChain: 0,
      lastDecayTime: Date.now(),
    };

    gameStateRef.current = state;

    // Initialize next pieces
    for (let i = 0; i < 4; i++) {
      state.nextPieces.push(getNextFromBag(state));
    }

    spawnPiece(state);
    updateDisplayState(state);
    startGameLoop(state);
    startDecayLoop(state);
    startAnimationLoop(state);

    drawHoldPiece(state);
    draw(state);
  }, [draw, drawHoldPiece, getNextFromBag, spawnPiece, startGameLoop, startDecayLoop, startAnimationLoop, updateDisplayState]);

  // Setup keyboard controls
  useEffect(() => {
    init();

    const handleKeyDown = (e: KeyboardEvent) => {
      const state = gameStateRef.current;
      if (!state) return;

      if (state.gameOver && e.key !== 'Enter') return;

      switch (e.key) {
        case 'ArrowLeft':
          movePiece(state, -1, 0);
          e.preventDefault();
          break;
        case 'ArrowRight':
          movePiece(state, 1, 0);
          e.preventDefault();
          break;
        case 'ArrowDown':
          softDrop(state);
          e.preventDefault();
          break;
        case 'ArrowUp':
        case 'x':
        case 'X':
          rotatePiece(state, 1);
          e.preventDefault();
          break;
        case 'z':
        case 'Z':
          rotatePiece(state, -1);
          e.preventDefault();
          break;
        case ' ':
          hardDrop(state);
          e.preventDefault();
          break;
        case 'c':
        case 'C':
          holdCurrentPiece(state);
          e.preventDefault();
          break;
        case 'p':
        case 'P':
          togglePause(state);
          e.preventDefault();
          break;
        case 'Enter':
          if (state.gameOver) {
            init();
          }
          e.preventDefault();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (dropIntervalRef.current) clearInterval(dropIntervalRef.current);
      if (decayIntervalRef.current) clearInterval(decayIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      clearLockTimer();
    };
  }, [clearLockTimer, hardDrop, holdCurrentPiece, init, movePiece, rotatePiece, softDrop, togglePause]);

  // Get element info for display
  const highestElemData = ELEMENTS[displayState.highestElement];

  return (
    <div className="flex gap-5 p-5">
      {/* Left Panel */}
      <div className="flex flex-col gap-2.5">
        <div className="bg-black/50 border-2 border-[#4a4a6a] rounded-lg p-4 text-center">
          <h3 className="mb-2.5 text-[#888] text-sm uppercase tracking-widest">Hold [C]</h3>
          <canvas
            ref={holdCanvasRef}
            className="bg-black/30 rounded"
            width={100}
            height={100}
          />
        </div>

        {/* Stage Info */}
        <div className="bg-black/50 border-2 border-[#4a4a6a] rounded-lg p-4">
          <h3 className="text-[#888] text-xs uppercase tracking-widest mb-1">Stage</h3>
          <div className="text-lg font-bold text-[#ff9800]">{displayState.stageName}</div>
        </div>

        {/* Highest Element */}
        <div className="bg-black/50 border-2 border-[#4a4a6a] rounded-lg p-4">
          <h3 className="text-[#888] text-xs uppercase tracking-widest mb-1">Highest</h3>
          <div
            className="text-2xl font-bold"
            style={{ color: highestElemData?.color || '#fff' }}
          >
            {highestElemData?.symbol || 'H'} ({displayState.highestElement})
          </div>
          <div className="text-xs text-[#666]">{highestElemData?.name || 'Hydrogen'}</div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={gameCanvasRef}
          className="bg-black/70 border-[3px] border-[#4a4a6a] rounded-lg shadow-[0_0_30px_rgba(100,100,255,0.3)]"
          width={300}
          height={600}
        />
      </div>

      {/* Right Panel */}
      <div className="flex flex-col gap-4 min-w-[150px]">
        <div className="bg-black/50 border-2 border-[#4a4a6a] rounded-lg p-4 text-center">
          <h3 className="text-[#888] text-xs uppercase tracking-widest mb-2.5">Next</h3>
          <canvas
            ref={nextCanvasRef}
            className="bg-black/30 rounded"
            width={100}
            height={300}
          />
        </div>

        <div className="bg-black/50 border-2 border-[#4a4a6a] rounded-lg p-4">
          <h3 className="text-[#888] text-xs uppercase tracking-widest mb-1">Score</h3>
          <div className="text-2xl font-bold text-[#ffd700]">{displayState.score.toLocaleString()}</div>
        </div>

        <div className="bg-black/50 border-2 border-[#4a4a6a] rounded-lg p-4">
          <h3 className="text-[#888] text-xs uppercase tracking-widest mb-1">Level</h3>
          <div className="text-2xl font-bold text-[#00ff88]">{displayState.level}</div>
        </div>

        <div className="bg-black/50 border-2 border-[#4a4a6a] rounded-lg p-4">
          <h3 className="text-[#888] text-xs uppercase tracking-widest mb-1">Lines</h3>
          <div className="text-2xl font-bold text-[#00bfff]">{displayState.lines}</div>
        </div>

        <div className="bg-black/50 border-2 border-[#4a4a6a] rounded-lg p-4 text-xs">
          <h3 className="text-[#888] text-xs uppercase tracking-widest mb-2.5">Controls</h3>
          <div className="flex justify-between my-1 text-[#aaa]">
            <span>Move</span>
            <span className="bg-[#333] px-1.5 py-0.5 rounded font-mono">← →</span>
          </div>
          <div className="flex justify-between my-1 text-[#aaa]">
            <span>Soft Drop</span>
            <span className="bg-[#333] px-1.5 py-0.5 rounded font-mono">↓</span>
          </div>
          <div className="flex justify-between my-1 text-[#aaa]">
            <span>Hard Drop</span>
            <span className="bg-[#333] px-1.5 py-0.5 rounded font-mono">Space</span>
          </div>
          <div className="flex justify-between my-1 text-[#aaa]">
            <span>Rotate</span>
            <span className="bg-[#333] px-1.5 py-0.5 rounded font-mono">↑ / X</span>
          </div>
          <div className="flex justify-between my-1 text-[#aaa]">
            <span>Rotate CCW</span>
            <span className="bg-[#333] px-1.5 py-0.5 rounded font-mono">Z</span>
          </div>
          <div className="flex justify-between my-1 text-[#aaa]">
            <span>Hold</span>
            <span className="bg-[#333] px-1.5 py-0.5 rounded font-mono">C</span>
          </div>
          <div className="flex justify-between my-1 text-[#aaa]">
            <span>Pause</span>
            <span className="bg-[#333] px-1.5 py-0.5 rounded font-mono">P</span>
          </div>
        </div>

        {/* Goal */}
        <div className="bg-black/50 border-2 border-[#76ff03] rounded-lg p-4 text-xs">
          <h3 className="text-[#76ff03] text-xs uppercase tracking-widest mb-1">Goal</h3>
          <div className="text-[#aaa]">Synthesize Uranium (U-92) to win!</div>
        </div>
      </div>

      {/* Game Over Overlay */}
      {displayState.gameOver && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[100]">
          <div
            className={`bg-gradient-to-br from-[#2a2a4a] to-[#1a1a3a] border-[3px] rounded-2xl p-10 text-center shadow-[0_0_50px] ${
              displayState.victory
                ? 'border-[#76ff03] shadow-[rgba(118,255,3,0.3)]'
                : 'border-[#ff4444] shadow-[rgba(255,0,0,0.3)]'
            }`}
          >
            <h1
              className={`text-4xl mb-5 ${
                displayState.victory ? 'text-[#76ff03]' : 'text-[#ff4444]'
              }`}
            >
              {displayState.victory ? 'VICTORY!' : 'Game Over'}
            </h1>
            {displayState.victory && (
              <div className="text-xl text-[#ffd700] mb-5">
                You synthesized Uranium!
              </div>
            )}
            <div className="text-2xl mb-4">
              Final Score: <span className="text-[#ffd700] text-3xl">{displayState.score.toLocaleString()}</span>
            </div>
            <div className="text-lg mb-8">
              Highest Element: <span style={{ color: highestElemData?.color }}>{highestElemData?.symbol}</span> ({displayState.highestElement})
            </div>
            <button
              onClick={init}
              className="bg-gradient-to-br from-[#4a4aff] to-[#3a3adf] border-none text-white py-4 px-10 text-lg rounded-lg cursor-pointer transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(100,100,255,0.5)]"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Pause Overlay */}
      {displayState.paused && !displayState.gameOver && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[99]">
          <div className="text-5xl text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
            PAUSED
          </div>
        </div>
      )}
    </div>
  );
}
