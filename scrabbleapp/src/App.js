import React, { useState } from 'react';
import Game from './functional/Game';
import GameMenu from './functional/GameMenu';
import './functional/Styles.css';

function App() {
    const [gameMode, setGameMode] = useState(null);

    return (
        <div className="app-container">
            {gameMode ? (
                <Game gameMode={gameMode} />
            ) : (
                <GameMenu onSelectMode={setGameMode} />
            )}
        </div>
    );
}

export default App;