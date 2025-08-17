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

  // Setup: build tile bag, shuffle, deal racks
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

  // End turn: remove used letters, draw same count, next player
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

  // Place word
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
        alert('Invalid placement: must connect to existing tiles and you must have the required letters.');
        return;
      }

      const score = calculateScore(board, word, row, col, direction);

      const newBoard = board.map((r) => [...r]);
      const lettersPlaced = [];

      for (let i = 0; i < word.length; i++) {
        // ✅ Horizontal => advance **column**. Vertical => advance **row**.
        const r = direction === 'horizontal' ? row : row + i;
        const c = direction === 'horizontal' ? col + i : col;
        if (newBoard[r][c] === null) {
          newBoard[r][c] = word[i].toUpperCase();
          lettersPlaced.push(word[i].toUpperCase());
        }
      }

      setBoard(newBoard);
      setPlayers((prev) =>
        prev.map((p, idx) => (idx === currentPlayerIndex ? { ...p, score: p.score + score } : p))
      );
      endTurn(lettersPlaced);
      setWord('');
    } catch (err) {
      console.error('Validation/place error', err);
      alert('Could not connect to the game server. Please ensure it is running.');
    } finally {
      setIsValidating(false);
    }
  };

  // Bot currently skipped (until backend validate is used inside bot)
  useEffect(() => {
    if (!players.length) return;
    const p = players[currentPlayerIndex];
    if (p?.type === 'bot') {
      alert('Bot move skipped (needs backend validation).');
      endTurn([]);
    }
  }, [players, currentPlayerIndex, board, endTurn]);

  const currentPlayer = players[currentPlayerIndex];
  if (!currentPlayer) return <div>Setting Up Game...</div>;

  // For header labels
  const indices = Array.from({ length: BOARD_SIZE }, (_, i) => i);

  return (
    <div className="main-container">
      <h1>Scrabble Game</h1>

      <div className="content-container">
        <div className="board-and-scores">
          <div className="board-container">
            {/* === Board with row/column indices === */}
            <div className="board-grid">
              {/* Corner index (top-left) */}
              <div className="corner-cell" aria-hidden />

              {/* Column headers */}
              {indices.map((c) => (
                <div key={`col-${c}`} className="index-cell" title={`Column ${c}`}>
                  {c}
                </div>
              ))}

              {/* Grid rows */}
              {indices.map((r) => (
                <React.Fragment key={`r-${r}`}>
                  {/* Row header */}
                  <div className="index-cell" title={`Row ${r}`}>
                    {r}
                  </div>

                  {/* Cells */}
                  {indices.map((c) => (
                    <div
                      key={`cell-${r}-${c}`}
                      className={`cell premium-${PREMIUM_SQUARES[r][c]}`}
                      title={`r${r}, c${c}`}
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
            {players.map((player, index) => (
              <div
                key={player.id}
                className={`player-score ${index === currentPlayerIndex ? 'active-player' : ''}`}
              >
                Player {player.id} ({player.type}): {player.score}
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
              {currentPlayer.letters.map((letter, index) => (
                <div key={index} className="letter">
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
                placeholder="Enter a word"
              />
              <div className="coordinate-input">
                <label>
                  Row:
                  <input
                    type="number"
                    value={row}
                    onChange={(e) =>
                      setRow(Number.isNaN(parseInt(e.target.value)) ? 0 : parseInt(e.target.value))
                    }
                    min="0"
                    max={BOARD_SIZE - 1}
                  />
                </label>
                <label>
                  Col:
                  <input
                    type="number"
                    value={col}
                    onChange={(e) =>
                      setCol(Number.isNaN(parseInt(e.target.value)) ? 0 : parseInt(e.target.value))
                    }
                    min="0"
                    max={BOARD_SIZE - 1}
                  />
                </label>
              </div>
              <div className="direction-input">
                <label>
                  Direction:
                  <select value={direction} onChange={(e) => setDirection(e.target.value)}>
                    <option value="horizontal">Horizontal (→)</option>
                    <option value="vertical">Vertical (↓)</option>
                  </select>
                </label>
              </div>
              <button onClick={handlePlaceWord} disabled={isValidating}>
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
