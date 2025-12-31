import { useEffect, useRef, useCallback } from 'react';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;
const PREVIEW_BLOCK_SIZE = 20;

const COLORS: Record<string, string> = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000'
};

const SHAPES: Record<string, number[][][]> = {
  I: [
    [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
    [[0,0,1,0], [0,0,1,0], [0,0,1,0], [0,0,1,0]],
    [[0,0,0,0], [0,0,0,0], [1,1,1,1], [0,0,0,0]],
    [[0,1,0,0], [0,1,0,0], [0,1,0,0], [0,1,0,0]]
  ],
  O: [
    [[1,1], [1,1]],
    [[1,1], [1,1]],
    [[1,1], [1,1]],
    [[1,1], [1,1]]
  ],
  T: [
    [[0,1,0], [1,1,1], [0,0,0]],
    [[0,1,0], [0,1,1], [0,1,0]],
    [[0,0,0], [1,1,1], [0,1,0]],
    [[0,1,0], [1,1,0], [0,1,0]]
  ],
  S: [
    [[0,1,1], [1,1,0], [0,0,0]],
    [[0,1,0], [0,1,1], [0,0,1]],
    [[0,0,0], [0,1,1], [1,1,0]],
    [[1,0,0], [1,1,0], [0,1,0]]
  ],
  Z: [
    [[1,1,0], [0,1,1], [0,0,0]],
    [[0,0,1], [0,1,1], [0,1,0]],
    [[0,0,0], [1,1,0], [0,1,1]],
    [[0,1,0], [1,1,0], [1,0,0]]
  ],
  J: [
    [[1,0,0], [1,1,1], [0,0,0]],
    [[0,1,1], [0,1,0], [0,1,0]],
    [[0,0,0], [1,1,1], [0,0,1]],
    [[0,1,0], [0,1,0], [1,1,0]]
  ],
  L: [
    [[0,0,1], [1,1,1], [0,0,0]],
    [[0,1,0], [0,1,0], [0,1,1]],
    [[0,0,0], [1,1,1], [1,0,0]],
    [[1,1,0], [0,1,0], [0,1,0]]
  ]
};

const WALL_KICK_JLSTZ: Record<string, number[][]> = {
  '0->1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '1->0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '1->2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2->1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2->3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '3->2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '3->0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0->3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]
};

const WALL_KICK_I: Record<string, number[][]> = {
  '0->1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '1->0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '1->2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '2->1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '2->3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '3->2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '3->0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '0->3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]]
};

const SCORE_TABLE: Record<number, number> = {
  1: 100,
  2: 300,
  3: 500,
  4: 800
};

const LEVEL_SPEEDS: Record<number, number> = {
  1: 1000, 2: 900, 3: 800, 4: 700, 5: 600,
  6: 500, 7: 400, 8: 300, 9: 200, 10: 150,
  11: 130, 12: 110, 13: 100, 14: 90, 15: 80,
  16: 70, 17: 60, 18: 50, 19: 40, 20: 30
};

interface Piece {
  type: string;
  rotation: number;
  x: number;
  y: number;
}

interface GameState {
  board: (string | null)[][];
  currentPiece: Piece | null;
  holdPiece: string | null;
  canHold: boolean;
  nextPieces: string[];
  score: number;
  level: number;
  lines: number;
  combo: number;
  lastClearWasTetris: boolean;
  gameOver: boolean;
  paused: boolean;
  bag: string[];
  lockResets: number;
  isOnGround: boolean;
}

interface TetrisGameProps {
  onGameOver?: (score: number) => void;
}

export default function TetrisGame({ onGameOver }: TetrisGameProps) {
  const gameCanvasRef = useRef<HTMLCanvasElement>(null);
  const holdCanvasRef = useRef<HTMLCanvasElement>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const dropIntervalRef = useRef<number | null>(null);
  const lockTimerRef = useRef<number | null>(null);
  const LOCK_DELAY = 500;
  const MAX_LOCK_RESETS = 15;

  const shuffleArray = (array: string[]): string[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const getNextFromBag = useCallback((state: GameState): string => {
    if (state.bag.length === 0) {
      state.bag = shuffleArray(Object.keys(SHAPES));
    }
    return state.bag.pop()!;
  }, []);

  const getShape = (type: string, rotation: number): number[][] => {
    return SHAPES[type][rotation];
  };

  const isValidPosition = useCallback((state: GameState, x: number, y: number, rotation: number): boolean => {
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
  }, []);

  const getGhostY = useCallback((state: GameState): number => {
    if (!state.currentPiece) return 0;

    let ghostY = state.currentPiece.y;
    while (isValidPosition(state, state.currentPiece.x, ghostY + 1, state.currentPiece.rotation)) {
      ghostY++;
    }
    return ghostY;
  }, [isValidPosition]);

  const checkOnGround = useCallback((state: GameState): boolean => {
    if (!state.currentPiece) return false;
    return !isValidPosition(state, state.currentPiece.x, state.currentPiece.y + 1, state.currentPiece.rotation);
  }, [isValidPosition]);

  const drawBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size: number) => {
    const px = x * size;
    const py = y * size;

    ctx.fillStyle = color;
    ctx.fillRect(px + 1, py + 1, size - 2, size - 2);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(px + 1, py + 1, size - 2, 4);
    ctx.fillRect(px + 1, py + 1, 4, size - 2);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(px + size - 5, py + 1, 4, size - 2);
    ctx.fillRect(px + 1, py + size - 5, size - 2, 4);
  };

  const drawGhostBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size: number) => {
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

  const drawPreviewBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, PREVIEW_BLOCK_SIZE - 2, PREVIEW_BLOCK_SIZE - 2);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x + 1, y + 1, PREVIEW_BLOCK_SIZE - 2, 2);
    ctx.fillRect(x + 1, y + 1, 2, PREVIEW_BLOCK_SIZE - 2);
  };

  const draw = useCallback((state: GameState) => {
    const gameCanvas = gameCanvasRef.current;
    if (!gameCanvas) return;
    const gameCtx = gameCanvas.getContext('2d');
    if (!gameCtx) return;

    gameCtx.fillStyle = '#0a0a1a';
    gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    gameCtx.strokeStyle = '#1a1a3a';
    gameCtx.lineWidth = 0.5;
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      gameCtx.beginPath();
      gameCtx.moveTo(x * BLOCK_SIZE, 0);
      gameCtx.lineTo(x * BLOCK_SIZE, BOARD_HEIGHT * BLOCK_SIZE);
      gameCtx.stroke();
    }
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      gameCtx.beginPath();
      gameCtx.moveTo(0, y * BLOCK_SIZE);
      gameCtx.lineTo(BOARD_WIDTH * BLOCK_SIZE, y * BLOCK_SIZE);
      gameCtx.stroke();
    }

    for (let row = 0; row < BOARD_HEIGHT; row++) {
      for (let col = 0; col < BOARD_WIDTH; col++) {
        if (state.board[row][col]) {
          drawBlock(gameCtx, col, row, COLORS[state.board[row][col]!], BLOCK_SIZE);
        }
      }
    }

    if (state.currentPiece) {
      const shape = getShape(state.currentPiece.type, state.currentPiece.rotation);
      const ghostY = getGhostY(state);

      if (ghostY !== state.currentPiece.y) {
        for (let row = 0; row < shape.length; row++) {
          for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
              const x = state.currentPiece.x + col;
              const y = ghostY + row;
              if (y >= 0) {
                drawGhostBlock(gameCtx, x, y, COLORS[state.currentPiece.type], BLOCK_SIZE);
              }
            }
          }
        }
      }

      const color = COLORS[state.currentPiece.type];
      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            const x = state.currentPiece.x + col;
            const y = state.currentPiece.y + row;
            if (y >= 0) {
              drawBlock(gameCtx, x, y, color, BLOCK_SIZE);
            }
          }
        }
      }
    }
  }, [getGhostY]);

  const drawHoldPiece = useCallback((state: GameState) => {
    const holdCanvas = holdCanvasRef.current;
    if (!holdCanvas) return;
    const holdCtx = holdCanvas.getContext('2d');
    if (!holdCtx) return;

    holdCtx.fillStyle = '#0a0a1a';
    holdCtx.fillRect(0, 0, holdCanvas.width, holdCanvas.height);

    if (state.holdPiece) {
      const shape = SHAPES[state.holdPiece][0];
      const color = state.canHold ? COLORS[state.holdPiece] : '#444';
      const offsetX = (holdCanvas.width - shape[0].length * PREVIEW_BLOCK_SIZE) / 2;
      const offsetY = (holdCanvas.height - shape.length * PREVIEW_BLOCK_SIZE) / 2;

      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            drawPreviewBlock(holdCtx, offsetX + col * PREVIEW_BLOCK_SIZE, offsetY + row * PREVIEW_BLOCK_SIZE, color);
          }
        }
      }
    }
  }, []);

  const drawNextPieces = useCallback((state: GameState) => {
    const nextCanvas = nextCanvasRef.current;
    if (!nextCanvas) return;
    const nextCtx = nextCanvas.getContext('2d');
    if (!nextCtx) return;

    nextCtx.fillStyle = '#0a0a1a';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    let offsetY = 10;

    for (let i = 0; i < Math.min(state.nextPieces.length, 4); i++) {
      const type = state.nextPieces[i];
      const shape = SHAPES[type][0];
      const color = COLORS[type];
      const offsetX = (nextCanvas.width - shape[0].length * PREVIEW_BLOCK_SIZE) / 2;

      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            drawPreviewBlock(nextCtx, offsetX + col * PREVIEW_BLOCK_SIZE, offsetY + row * PREVIEW_BLOCK_SIZE, color);
          }
        }
      }

      offsetY += shape.length * PREVIEW_BLOCK_SIZE + 15;
    }
  }, []);

  const clearLockTimer = useCallback(() => {
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }
  }, []);

  const updateDisplay = useCallback((state: GameState) => {
    const scoreEl = document.getElementById('score');
    const levelEl = document.getElementById('level');
    const linesEl = document.getElementById('lines');

    if (scoreEl) scoreEl.textContent = state.score.toLocaleString();
    if (levelEl) levelEl.textContent = state.level.toString();
    if (linesEl) linesEl.textContent = state.lines.toString();
  }, []);

  const endGame = useCallback((state: GameState) => {
    state.gameOver = true;
    if (dropIntervalRef.current) clearInterval(dropIntervalRef.current);
    clearLockTimer();

    const finalScoreEl = document.getElementById('finalScore');
    if (finalScoreEl) finalScoreEl.textContent = state.score.toString();

    const overlay = document.getElementById('gameOverOverlay');
    if (overlay) overlay.classList.add('show');

    onGameOver?.(state.score);
  }, [clearLockTimer, onGameOver]);

  const clearLines = useCallback((state: GameState) => {
    let clearedLines = 0;

    for (let row = BOARD_HEIGHT - 1; row >= 0; row--) {
      if (state.board[row].every(cell => cell !== null)) {
        state.board.splice(row, 1);
        state.board.unshift(Array(BOARD_WIDTH).fill(null));
        clearedLines++;
        row++;
      }
    }

    if (clearedLines > 0) {
      let baseScore = SCORE_TABLE[clearedLines] || 0;

      if (clearedLines === 4) {
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
      state.lines += clearedLines;

      const newLevel = Math.floor(state.lines / 10) + 1;
      if (newLevel > state.level) {
        state.level = Math.min(newLevel, 20);
      }

      updateDisplay(state);
    } else {
      state.combo = 0;
    }
  }, [updateDisplay]);

  const spawnPiece = useCallback((state: GameState) => {
    const type = state.nextPieces.shift()!;
    state.nextPieces.push(getNextFromBag(state));

    state.currentPiece = {
      type: type,
      rotation: 0,
      x: Math.floor(BOARD_WIDTH / 2) - Math.ceil(SHAPES[type][0][0].length / 2),
      y: 0
    };

    state.canHold = true;
    clearLockTimer();
    state.lockResets = 0;
    state.isOnGround = false;

    if (!isValidPosition(state, state.currentPiece.x, state.currentPiece.y, state.currentPiece.rotation)) {
      endGame(state);
    }

    drawNextPieces(state);
  }, [clearLockTimer, drawNextPieces, endGame, getNextFromBag, isValidPosition]);

  const lockPiece = useCallback((state: GameState) => {
    if (!state.currentPiece) return;

    const shape = getShape(state.currentPiece.type, state.currentPiece.rotation);

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const boardY = state.currentPiece.y + row;
          const boardX = state.currentPiece.x + col;

          if (boardY >= 0) {
            state.board[boardY][boardX] = state.currentPiece.type;
          }
        }
      }
    }

    clearLines(state);
    spawnPiece(state);
    draw(state);
  }, [clearLines, draw, spawnPiece]);

  const startLockTimer = useCallback((state: GameState) => {
    clearLockTimer();
    lockTimerRef.current = window.setTimeout(() => {
      if (!state.gameOver && !state.paused && state.isOnGround) {
        lockPiece(state);
      }
    }, LOCK_DELAY);
  }, [clearLockTimer, lockPiece]);

  const resetLockDelay = useCallback((state: GameState): boolean => {
    if (state.isOnGround && state.lockResets < MAX_LOCK_RESETS) {
      state.lockResets++;
      startLockTimer(state);
      return true;
    }
    return false;
  }, [startLockTimer]);

  const movePiece = useCallback((state: GameState, dx: number, dy: number): boolean => {
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
  }, [checkOnGround, clearLockTimer, draw, isValidPosition, resetLockDelay, startLockTimer]);

  const getWallKickData = (type: string, fromRotation: number, toRotation: number): number[][] => {
    const key = `${fromRotation}->${toRotation}`;

    if (type === 'I') {
      return WALL_KICK_I[key] || [[0, 0]];
    } else if (type === 'O') {
      return [[0, 0]];
    } else {
      return WALL_KICK_JLSTZ[key] || [[0, 0]];
    }
  };

  const rotatePiece = useCallback((state: GameState, direction: number) => {
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
  }, [checkOnGround, clearLockTimer, draw, isValidPosition, resetLockDelay, startLockTimer]);

  const hardDrop = useCallback((state: GameState) => {
    if (state.gameOver || state.paused || !state.currentPiece) return;

    let dropDistance = 0;
    while (isValidPosition(state, state.currentPiece.x, state.currentPiece.y + 1, state.currentPiece.rotation)) {
      state.currentPiece.y++;
      dropDistance++;
    }

    state.score += dropDistance * 2;
    lockPiece(state);
  }, [isValidPosition, lockPiece]);

  const softDrop = useCallback((state: GameState) => {
    if (state.gameOver || state.paused) return;

    if (movePiece(state, 0, 1)) {
      state.score += 1;
      updateDisplay(state);
    }
  }, [movePiece, updateDisplay]);

  const holdCurrentPiece = useCallback((state: GameState) => {
    if (state.gameOver || state.paused || !state.canHold || !state.currentPiece) return;

    state.canHold = false;
    clearLockTimer();
    state.lockResets = 0;
    state.isOnGround = false;

    if (state.holdPiece === null) {
      state.holdPiece = state.currentPiece.type;
      spawnPiece(state);
    } else {
      const temp = state.holdPiece;
      state.holdPiece = state.currentPiece.type;

      state.currentPiece = {
        type: temp,
        rotation: 0,
        x: Math.floor(BOARD_WIDTH / 2) - Math.ceil(SHAPES[temp][0][0].length / 2),
        y: 0
      };
    }

    drawHoldPiece(state);
    draw(state);
  }, [clearLockTimer, draw, drawHoldPiece, spawnPiece]);

  const togglePause = useCallback((state: GameState) => {
    state.paused = !state.paused;
    const overlay = document.getElementById('pauseOverlay');
    if (overlay) overlay.classList.toggle('show', state.paused);
  }, []);

  const startGameLoop = useCallback((state: GameState) => {
    if (dropIntervalRef.current) clearInterval(dropIntervalRef.current);

    const speed = LEVEL_SPEEDS[state.level] || 30;

    dropIntervalRef.current = window.setInterval(() => {
      if (!state.gameOver && !state.paused) {
        if (!movePiece(state, 0, 1)) {
          if (!state.isOnGround) {
            state.isOnGround = true;
            startLockTimer(state);
          } else if (!lockTimerRef.current) {
            startLockTimer(state);
          }
        }
      }
    }, speed);
  }, [movePiece, startLockTimer]);

  const init = useCallback(() => {
    const state: GameState = {
      board: Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null)),
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
      paused: false,
      bag: [],
      lockResets: 0,
      isOnGround: false
    };

    gameStateRef.current = state;

    for (let i = 0; i < 4; i++) {
      state.nextPieces.push(getNextFromBag(state));
    }

    spawnPiece(state);
    updateDisplay(state);
    startGameLoop(state);

    const overlay = document.getElementById('gameOverOverlay');
    if (overlay) overlay.classList.remove('show');

    drawHoldPiece(state);
    draw(state);
  }, [draw, drawHoldPiece, getNextFromBag, spawnPiece, startGameLoop, updateDisplay]);

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

    const handleRestartClick = () => {
      init();
    };

    document.addEventListener('keydown', handleKeyDown);
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
      restartBtn.addEventListener('click', handleRestartClick);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (restartBtn) {
        restartBtn.removeEventListener('click', handleRestartClick);
      }
      if (dropIntervalRef.current) clearInterval(dropIntervalRef.current);
      clearLockTimer();
    };
  }, [clearLockTimer, hardDrop, holdCurrentPiece, init, movePiece, rotatePiece, softDrop, togglePause]);

  return (
    <div className="flex gap-5 p-5">
      {/* Left Panel */}
      <div className="flex flex-col gap-2.5">
        <div className="bg-black/50 border-2 border-[#4a4a6a] rounded-lg p-4 text-center">
          <h3 className="mb-2.5 text-[#888] text-sm uppercase tracking-widest">Hold [C]</h3>
          <canvas
            ref={holdCanvasRef}
            className="bg-black/30 rounded"
            id="holdCanvas"
            width={100}
            height={100}
          />
        </div>
      </div>

      {/* Main Area */}
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={gameCanvasRef}
          className="bg-black/70 border-[3px] border-[#4a4a6a] rounded-lg shadow-[0_0_30px_rgba(100,100,255,0.3)]"
          id="gameBoard"
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
            id="nextCanvas"
            width={100}
            height={300}
          />
        </div>

        <div className="bg-black/50 border-2 border-[#4a4a6a] rounded-lg p-4">
          <h3 className="text-[#888] text-xs uppercase tracking-widest mb-1">Score</h3>
          <div id="score" className="text-2xl font-bold text-[#ffd700]">0</div>
        </div>

        <div className="bg-black/50 border-2 border-[#4a4a6a] rounded-lg p-4">
          <h3 className="text-[#888] text-xs uppercase tracking-widest mb-1">Level</h3>
          <div id="level" className="text-2xl font-bold text-[#00ff88]">1</div>
        </div>

        <div className="bg-black/50 border-2 border-[#4a4a6a] rounded-lg p-4">
          <h3 className="text-[#888] text-xs uppercase tracking-widest mb-1">Lines</h3>
          <div id="lines" className="text-2xl font-bold text-[#00bfff]">0</div>
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
      </div>

      {/* Game Over Overlay */}
      <div id="gameOverOverlay" className="fixed inset-0 bg-black/80 hidden justify-center items-center z-[100] [&.show]:flex">
        <div className="bg-gradient-to-br from-[#2a2a4a] to-[#1a1a3a] border-[3px] border-[#ff4444] rounded-2xl p-10 text-center shadow-[0_0_50px_rgba(255,0,0,0.3)]">
          <h1 className="text-[#ff4444] text-4xl mb-5">Game Over</h1>
          <div className="text-2xl mb-8">
            Final Score: <span id="finalScore" className="text-[#ffd700] text-3xl">0</span>
          </div>
          <button
            id="restartBtn"
            className="bg-gradient-to-br from-[#4a4aff] to-[#3a3adf] border-none text-white py-4 px-10 text-lg rounded-lg cursor-pointer transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(100,100,255,0.5)]"
          >
            Play Again
          </button>
        </div>
      </div>

      {/* Pause Overlay */}
      <div id="pauseOverlay" className="fixed inset-0 bg-black/70 hidden justify-center items-center z-[99] [&.show]:flex">
        <div className="text-5xl text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
          PAUSED
        </div>
      </div>
    </div>
  );
}
