import React from 'react';
import './Styles.css';

function GameMenu({ onSelectMode }) {
    return (
        <div className="game-menu-container">
            <h1>Scrabble Game</h1>
            <h2>Select a Game Mode</h2>
            <div className="menu-buttons">
                <button onClick={() => onSelectMode('single_player')}>Single Player</button>
                <button onClick={() => onSelectMode('single_bot')}>Bot Simulation</button>
                <button onClick={() => onSelectMode('pvp')}>Player vs. Player</button>
                <button onClick={() => onSelectMode('pvb')}>Player vs. Bot</button>
                <button onClick={() => onSelectMode('bvb')}>Bot vs. Bot</button>
            </div>
        </div>
    );
}

export default GameMenu;