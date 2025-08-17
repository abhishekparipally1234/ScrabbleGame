// --- Constants ---
export const BOARD_SIZE = 15;
export const LETTER_COUNT = 7;

export const LETTER_SCORES = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1,
  J: 8, K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1,
  S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10, _: 0,
};

export const TILE_DISTRIBUTION = {
  A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2, I: 9,
  J: 1, K: 1, L: 4, M: 2, N: 6, O: 8, P: 2, Q: 1, R: 6,
  S: 4, T: 6, U: 4, V: 2, W: 2, X: 1, Y: 2, Z: 1, _: 2,
};

// 0 = normal, 2 = DL, 3 = TL, 4 = DW, 5 = TW
export const PREMIUM_SQUARES = [
  [5,0,0,2,0,0,0,5,0,0,0,2,0,0,5],
  [0,4,0,0,0,3,0,0,0,3,0,0,0,4,0],
  [0,0,4,0,0,0,2,0,2,0,0,0,4,0,0],
  [2,0,0,4,0,0,0,2,0,0,0,4,0,0,2],
  [0,0,0,0,4,0,0,0,0,0,4,0,0,0,0],
  [0,3,0,0,0,3,0,0,0,3,0,0,0,3,0],
  [0,0,2,0,0,0,2,0,2,0,0,0,2,0,0],
  [5,0,0,2,0,0,0,4,0,0,0,2,0,0,5],
  [0,0,2,0,0,0,2,0,2,0,0,0,2,0,0],
  [0,3,0,0,0,3,0,0,0,3,0,0,0,3,0],
  [0,0,0,0,4,0,0,0,0,0,4,0,0,0,0],
  [2,0,0,4,0,0,0,2,0,0,0,4,0,0,2],
  [0,0,4,0,0,0,2,0,2,0,0,0,4,0,0],
  [0,4,0,0,0,3,0,0,0,3,0,0,0,4,0],
  [5,0,0,2,0,0,0,5,0,0,0,2,0,0,5],
];

// --- Helpers ---
export const createEmptyBoard = () =>
  Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));

export const calculateScore = (board, word, row, col, direction) => {
  let total = 0;
  let wordMult = 1;
  let newTiles = 0;

  for (let i = 0; i < word.length; i++) {
    const ch = word[i].toUpperCase();
    let ls = LETTER_SCORES[ch] || 0;
    const r = direction === 'horizontal' ? row : row + i;
    const c = direction === 'horizontal' ? col + i : col;

    if (board[r][c] === null) {
      newTiles++;
      const premium = PREMIUM_SQUARES[r][c];
      if (premium === 2) ls *= 2;        // DL
      else if (premium === 3) ls *= 3;   // TL
      else if (premium === 4) wordMult *= 2; // DW
      else if (premium === 5) wordMult *= 3; // TW
    }
    total += ls;
  }

  total *= wordMult;
  if (newTiles === LETTER_COUNT) total += 50; // bingo
  return total;
};

export const isValidPlacement = (board, word, row, col, direction, rack) => {
  if (!word || word.length < 2) return false;

  const isBoardEmpty = board.every((r) => r.every((cell) => cell === null));
  let touchesExisting = false;
  const tempRack = [...rack];

  // Bounds
  if (
    (direction === 'horizontal' && col + word.length > BOARD_SIZE) ||
    (direction === 'vertical' && row + word.length > BOARD_SIZE)
  ) {
    return false;
  }

  for (let i = 0; i < word.length; i++) {
    const r = direction === 'horizontal' ? row : row + i;
    const c = direction === 'horizontal' ? col + i : col;
    const boardTile = board[r][c];
    const letter = word[i].toUpperCase();

    if (boardTile) {
      if (boardTile !== letter) return false; // conflict
      touchesExisting = true;
    } else {
      // Try exact letter, else blank tile
      let idx = tempRack.indexOf(letter);
      if (idx === -1) idx = tempRack.indexOf('_');
      if (idx === -1) return false;
      tempRack.splice(idx, 1);

      // Adjacency (touches)
      if (
        (r > 0 && board[r - 1][c]) ||
        (r < BOARD_SIZE - 1 && board[r + 1][c]) ||
        (c > 0 && board[r][c - 1]) ||
        (c < BOARD_SIZE - 1 && board[r][c + 1])
      ) {
        touchesExisting = true;
      }
    }
  }

  if (isBoardEmpty) {
    const center = Math.floor(BOARD_SIZE / 2);
    // Must pass through center
    return (
      (direction === 'horizontal' && row === center && col <= center && col + word.length > center) ||
      (direction === 'vertical' && col === center && row <= center && row + word.length > center)
    );
  }
  return touchesExisting;
};
