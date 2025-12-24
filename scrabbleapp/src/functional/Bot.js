import { isValidPlacement, calculateScore, BOARD_SIZE } from './gameUtils';

export const botLogic = {
  findBestMove: async (board, letters) => {
    let bestMove = null;
    let bestScore = -1;

    // 1. Ask backend for dictionary-valid words from rack letters
    const resp = await fetch(
      `http://localhost:5000/api/bot-words?letters=${letters.join('')}`
    );
    const validWords = await resp.json();

    if (!validWords.length) return null;

    // 2. Try every valid word on the board
    for (const w of validWords) {
      const word = w.toUpperCase();

      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          for (const dir of ["horizontal", "vertical"]) {

            if (isValidPlacement(board, word, r, c, dir, letters)) {
              const score = calculateScore(board, word, r, c, dir);

              if (score > bestScore) {
                bestScore = score;
                bestMove = { word, row: r, col: c, direction: dir, score };
              }
            }
          }
        }
      }
    }

    return bestMove;
  },
};
