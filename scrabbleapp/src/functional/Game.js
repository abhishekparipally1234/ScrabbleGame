import React, { useState, useEffect, useCallback } from 'react';
import { botLogic } from './Bot';
import {
  createEmptyBoard,
  isValidPlacement,
  calculateScore,
  BOARD_SIZE,
  LETTER_COUNT,
  PREMIUM_SQUARES,
  TILE_DISTRIBUTION,
  LETTER_SCORES,
} from './gameUtils';
import './Styles.css';

function Game({ gameMode }) {
  const [board, setBoard] = useState(createEmptyBoard());
  const [players, setPlayers] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [tileBag, setTileBag] = useState([]);

  const [word, setWord] = useState('');
  const [row, setRow] = useState(7);
  const [col, setCol] = useState(7);
  const [direction, setDirection] = useState('horizontal');
  const [isValidating, setIsValidating] = useState(false);

  // Load tile bag + players
  useEffect(() => {
    const bag = [];
    for (const letter in TILE_DISTRIBUTION) {
      for (let i = 0; i < TILE_DISTRIBUTION[letter]; i++) bag.push(letter);
    }
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }

    const deal = (n, b) => b.splice(0, n);
    let tempBag = [...bag];

    const modes = {
      single_player: [{ id: 1, type: 'human' }],
      single_bot: [{ id: 1, type: 'bot' }],
      pvp: [
        { id: 1, type: 'human' },
        { id: 2, type: 'human' },
      ],
      pvb: [
        { id: 1, type: 'human' },
        { id: 2, type: 'bot' },
      ],
      bvb: [
        { id: 1, type: 'bot' },
        { id: 2, type: 'bot' },
      ],
    };

    const newPlayers =
      (modes[gameMode] ?? []).map((p) => ({
        ...p,
        score: 0,
        letters: deal(LETTER_COUNT, tempBag),
      })) || [];

    setPlayers(newPlayers);
    setTileBag(tempBag);
  }, [gameMode]);

  // End player turn + draw tiles
  const endTurn = useCallback(
    (lettersPlaced) => {
      const drawCount = lettersPlaced.length;
      const drawTiles = tileBag.slice(0, drawCount);
      const nextBag = tileBag.slice(drawCount);

      setPlayers((prev) =>
        prev.map((pl, idx) => {
          if (idx !== currentPlayerIndex) return pl;
          const rack = [...pl.letters];
          for (const L of lettersPlaced) {
            const i = rack.indexOf(L);
            if (i !== -1) rack.splice(i, 1);
          }
          rack.push(...drawTiles);
          return { ...pl, letters: rack };
        })
      );

      setTileBag(nextBag);
      setCurrentPlayerIndex((i) => (i + 1) % players.length);
    },
    [currentPlayerIndex, players.length, tileBag]
  );

  // === HUMAN MOVE ===
  const handlePlaceWord = async () => {
    if (!word) return;
    setIsValidating(true);
    try {
      const response = await fetch(`http://localhost:5000/api/validate-word/${word}`);
      if (!response.ok) throw new Error('Server connection failed');
      const data = await response.json();

      if (!data.isValid) {
        alert(`'${word.toUpperCase()}' is not a valid word.`);
        return;
      }

      const cur = players[currentPlayerIndex];
      if (!isValidPlacement(board, word, row, col, direction, cur.letters)) {
        alert('Invalid placement: touching rules or rack constraints failed.');
        return;
      }

      const score = calculateScore(board, word, row, col, direction);

      const newBoard = board.map((r) => [...r]);
      const lettersPlaced = [];

      for (let i = 0; i < word.length; i++) {
        const r = direction === 'horizontal' ? row : row + i;
        const c = direction === 'horizontal' ? col + i : col;

        if (newBoard[r][c] === null) {
          newBoard[r][c] = word[i].toUpperCase();
          lettersPlaced.push(word[i].toUpperCase());
        }
      }

      setBoard(newBoard);
      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === currentPlayerIndex ? { ...p, score: p.score + score } : p
        )
      );
      endTurn(lettersPlaced);
      setWord('');
    } catch (err) {
      alert('Could not contact dictionary server.');
    } finally {
      setIsValidating(false);
    }
  };

  // === BOT TURN HANDLER ===
  useEffect(() => {
    const playBotMove = async () => {
      const p = players[currentPlayerIndex];
      if (!p || p.type !== 'bot') return;

      // 1. Find best move
      const best = await botLogic.findBestMove(board, p.letters);

      if (!best) {
        alert(`Bot ${p.id} passes (no valid moves).`);
        endTurn([]);
        return;
      }

      // 2. Validate word with backend
      const resp = await fetch(`http://localhost:5000/api/validate-word/${best.word}`);
      const data = await resp.json();

      if (!data.isValid) {
        alert(`Bot tried invalid word '${best.word}'`);
        endTurn([]);
        return;
      }

      // 3. Validate placement with local logic
      if (!isValidPlacement(board, best.word, best.row, best.col, best.direction, p.letters)) {
        alert(`Bot placed word illegally.`);
        endTurn([]);
        return;
      }

      // 4. Apply board update
      const newBoard = board.map((r) => [...r]);
      const lettersPlaced = [];

      for (let i = 0; i < best.word.length; i++) {
        const r = best.direction === 'horizontal' ? best.row : best.row + i;
        const c = best.direction === 'horizontal' ? best.col + i : best.col;

        if (newBoard[r][c] === null) {
          newBoard[r][c] = best.word[i].toUpperCase();
          lettersPlaced.push(best.word[i].toUpperCase());
        }
      }

      setBoard(newBoard);

      setPlayers((prev) =>
        prev.map((pl, idx) =>
          idx === currentPlayerIndex ? { ...pl, score: pl.score + best.score } : pl
        )
      );

      endTurn(lettersPlaced);
    };

    const p = players[currentPlayerIndex];
    if (p?.type === 'bot') {
      setTimeout(playBotMove, 800); // small delay
    }
  }, [players, currentPlayerIndex, board, endTurn]);

  const currentPlayer = players[currentPlayerIndex];
  if (!currentPlayer) return <div>Loading game...</div>;

  const indices = Array.from({ length: BOARD_SIZE }, (_, i) => i);

  return (
    <div className="main-container">
      <h1>Scrabble Game</h1>

      <div className="content-container">
        <div className="board-and-scores">
          <div className="board-container">
            <div className="board-grid">
              <div className="corner-cell" />

              {indices.map((c) => (
                <div key={c} className="index-cell">{c}</div>
              ))}

              {indices.map((r) => (
                <React.Fragment key={r}>
                  <div className="index-cell">{r}</div>

                  {indices.map((c) => (
                    <div
                      key={`${r}-${c}`}
                      className={`cell premium-${PREMIUM_SQUARES[r][c]}`}
                    >
                      {board[r][c]}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="scores-container">
            <h2>Scores</h2>
            {players.map((p, i) => (
              <div key={p.id} className={i === currentPlayerIndex ? 'active-player' : ''}>
                Player {p.id} ({p.type}) — {p.score}
              </div>
            ))}
          </div>
        </div>

        <div className="controls-container">
          <div className="player-letters">
            <h3>
              Player {currentPlayer.id}'s Turn ({currentPlayer.type})
            </h3>
            <div className="letters-list">
              {currentPlayer.letters.map((letter, i) => (
                <div key={i} className="letter">
                  {letter}
                  <span className="letter-score">{LETTER_SCORES[letter]}</span>
                </div>
              ))}
            </div>
          </div>

          {currentPlayer.type === 'human' && (
            <div className="word-input">
              <h3>Place a Word</h3>
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value.toLowerCase())}
              />

              <label>
                Row:
                <input
                  type="number"
                  value={row}
                  min="0"
                  max={BOARD_SIZE - 1}
                  onChange={(e) => setRow(parseInt(e.target.value))}
                />
              </label>

              <label>
                Col:
                <input
                  type="number"
                  value={col}
                  min="0"
                  max={BOARD_SIZE - 1}
                  onChange={(e) => setCol(parseInt(e.target.value))}
                />
              </label>

              <label>
                Direction:
                <select value={direction} onChange={(e) => setDirection(e.target.value)}>
                  <option value="horizontal">Horizontal</option>
                  <option value="vertical">Vertical</option>
                </select>
              </label>

              <button onClick={handlePlaceWord} disabled={isValidating} className='place'>
                {isValidating ? 'Checking...' : 'Place Word'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Game;
