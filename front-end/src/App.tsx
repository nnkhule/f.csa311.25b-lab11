// 📦 App.tsx — Бүрэн ажилладаг Undo болон тогтвортой play функцтэй хувилбар
import React from 'react';
import './App.css';
import { GameState, Cell } from './game';
import BoardCell from './Cell';

interface Props { }

interface State extends GameState {
  currentPlayer: string;
  winner: string | null;
  canUndo: boolean;
  winningCells: number[] | null;
  history: { cells: Cell[]; player: string }[];
  currentStep: number;
}

class App extends React.Component<Props, State> {
  private initialized: boolean = false;

  constructor(props: Props) {
    super(props);
    this.state = {
      cells: [],
      currentPlayer: 'X',
      winner: null,
      canUndo: false,
      winningCells: null,
      history: [],
      currentStep: 0
    };
  }

  newGame = async () => {
    const response = await fetch('/newgame');
    const json = await response.json();
    this.setState({
      cells: json.cells,
      currentPlayer: 'X',
      winner: null,
      canUndo: false,
      winningCells: null,
      history: [{ cells: json.cells, player: 'X' }],
      currentStep: 1
    });
  };

  undo = async () => {
    const response = await fetch('/undo');
    const json = await response.json();
    const winner = this.checkWinner(json.cells);
    const winningCells = winner && winner !== 'Draw' ? this.getWinningCells(json.cells) : null;
  
    const newHistory = this.state.history.slice(0, this.state.currentStep - 1);
  
    this.setState({
      cells: json.cells,
      currentPlayer: this.state.currentPlayer === 'X' ? 'O' : 'X',
      winner,
      winningCells,
      canUndo: newHistory.length > 1,
      history: newHistory,
      currentStep: newHistory.length,
    });
  };
  

  play(x: number, y: number): React.MouseEventHandler {
    return async (e) => {
      e.preventDefault();
      if (this.state.winner) return;

      const response = await fetch(`/play?x=${x}&y=${y}`);
      const json = await response.json();

      const winner = this.checkWinner(json.cells);
      const winningCells = winner && winner !== 'Draw' ? this.getWinningCells(json.cells) : null;

      const trimmedHistory = this.state.history.slice(0, this.state.currentStep);
      const newHistory = [...trimmedHistory, {
        cells: [...json.cells],
        player: this.state.currentPlayer === 'X' ? 'O' : 'X'
      }];

      this.setState({
        cells: json.cells,
        currentPlayer: this.state.currentPlayer === 'X' ? 'O' : 'X',
        winner,
        winningCells,
        canUndo: newHistory.length > 1,
        history: newHistory,
        currentStep: newHistory.length
      });
    };
  }

  checkWinner(cells: Cell[]): string | null {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (const [a, b, c] of lines) {
      if (cells[a].text && cells[a].text === cells[b].text && cells[a].text === cells[c].text) {
        return cells[a].text;
      }
    }
    return cells.every(cell => cell.text) ? 'Draw' : null;
  }

  getWinningCells(cells: Cell[]): number[] {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (const [a, b, c] of lines) {
      if (cells[a].text && cells[a].text === cells[b].text && cells[a].text === cells[c].text) {
        return [a, b, c];
      }
    }
    return [];
  }

  createCell(cell: Cell, index: number): React.ReactNode {
    const isWinning = this.state.winningCells?.includes(index);
    return (
      <div key={index}>
        {cell.playable && !this.state.winner ? (
          <a href="/" onClick={this.play(cell.x, cell.y)}>
            <BoardCell cell={cell} isWinning={isWinning} />
          </a>
        ) : (
          <BoardCell cell={cell} isWinning={isWinning} />
        )}
      </div>
    );
  }

  componentDidMount(): void {
    if (!this.initialized) {
      this.newGame();
      this.initialized = true;
    }
  }

  render(): React.ReactNode {
    const { winner, currentPlayer } = this.state;
    const status = winner
      ? (winner === 'Draw' ? 'Game Over: Draw!' : `Winner: ${winner}!`)
      : `Current Player: ${currentPlayer}`;

    return (
      <div className="game-container">
        <div id="instructions">{status}</div>
        <div id="board" className={winner ? 'game-over' : ''}>
          {this.state.cells.map((cell, i) => this.createCell(cell, i))}
        </div>
        <div id="bottombar">
          <button onClick={this.newGame}>New Game</button>
          <button onClick={this.undo} disabled={!this.state.canUndo || !!this.state.winner}>
            Undo
          </button>
        </div>
      </div>
    );
  }
}

export default App;