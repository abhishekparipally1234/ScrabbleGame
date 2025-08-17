import { isValidPlacement, calculateScore, BOARD_SIZE } from './gameUtils';

export const botLogic = {
  findBestMove: (board, letters, trie) => {
    let bestMove = null;
    let bestScore = -1;

    const getPermutations = (arr) => {
      const out = new Set();
      const rec = (cur, rem) => {
        if (cur.length > 1) out.add(cur.join(''));
        if (!rem.length) return;
        for (let i = 0; i < rem.length; i++) {
          const next = [...rem.slice(0, i), ...rem.slice(i + 1)];
          rec([...cur, rem[i]], next);
        }
      };
      rec([], arr);
      return [...out];
    };

    const words = getPermutations(letters).filter((w) => trie.search(w));

    for (const w of words) {
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          for (const dir of ['horizontal', 'vertical']) {
            if (isValidPlacement(board, w, r, c, dir, letters)) {
              const score = calculateScore(board, w, r, c, dir);
              if (score > bestScore) {
                bestScore = score;
                bestMove = { word: w, row: r, col: c, direction: dir, score };
              }
            }
          }
        }
      }
    }
    return bestMove;
  },
};
