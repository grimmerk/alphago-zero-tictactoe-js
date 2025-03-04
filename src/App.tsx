import React, { Component } from 'react';
import './App.css';
// @ts-ignore - Allow semantic-ui-react imports without type errors
import { Checkbox, Button } from 'semantic-ui-react';

import play, { downloadPretrained, humanMove } from './pit';
import train from './main';

interface AppState {
  enabledAI: boolean;
  aiIsDownloaded: boolean;
  aiFirst: boolean;
  selfTrained: boolean;
}

class App extends Component<{}, AppState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      enabledAI: false,
      aiIsDownloaded: false,
      aiFirst: true,
      selfTrained: false,
    };
  }

  twoRandowmPlay = (): void => {
    play();
  }

  startTrain = async (): Promise<void> => {
    console.log('start-train');
    await train();
    console.log('end-train');
    this.setState({ selfTrained: true });
  }

  selfTrainVSRandom = (): void => {
    console.log('selfTrainVSRandom');
    play(1);
  }

  twoRandowmPlayWithPretrained = async (): Promise<void> => {
    play(2);
  }

  downloadPretrained = async (): Promise<void> => {
    if (this.state.aiIsDownloaded === false) {
      console.log('ui start to download');
      await downloadPretrained();
      console.log('ui start to download2');
      this.setState({ aiIsDownloaded: true });
    }
  }

  toggleAI = (): void => {
    this.setState({ enabledAI: !this.state.enabledAI });
  }

  handleClick = (action: number): number => humanMove(action);

  startNewGame = (): number => {
    console.log('start new game');
    if (this.state.enabledAI) {
      if (this.state.selfTrained === false && this.state.aiIsDownloaded === false) {
        alert('ai is not download yet');
      }
      let action: number | undefined;
      if (this.state.selfTrained) {
        action = play(4, this.state.aiFirst);
      } else {
        action = play(3, this.state.aiFirst);
      }
      this.setState((prevState) => ({ aiFirst: !prevState.aiFirst }));

      if (action !== undefined && action >= 0) {
        console.log('ai starts at:', action);
        return action;
      }
    }
    return -1;
  }

  render() {
    return (
      <div className="App" style={{ display: 'flex', justifyContent: 'center' }}>
        <div>
          <div>
            <h1>AlphaGo Zero TicTacToe Game, using TensorFlow.js
            </h1>
          </div>
          <div>
            <h3>
              {'Development only part:'}
            </h3>
          </div>
          <div style={{ margin: 10 }}>
            <Button onClick={this.twoRandowmPlay}>
              Start two random players games (console result)
            </Button>
          </div>
          <div style={{ margin: 10 }}>
            <Button onClick={this.startTrain} disabled={this.state.selfTrained}>
              {'Start self-Train (console result), about 18 mins'}
            </Button>
          </div>
          <div>
            {'Monte-carlo simulation has big cpu loading'}
          </div>
          <div>
            {'Neural network has big gpu loading. They will slow down/hang your browser/computer'}
          </div>
          <div>
            {'After finishing, it will replace download model'}
          </div>
          <div style={{ margin: 10 }}>
            <Button onClick={this.selfTrainVSRandom}>
              Self-trained vs Random
            </Button>
          </div>

          <div style={{ margin: 10 }}>
            <Button onClick={this.twoRandowmPlayWithPretrained}>
              Start Pretrained vs Random games (console result)
            </Button>
          </div>
          <hr />
          <div>
            <h3>
            Users part: 1. download 2. enable AI 3. click start (AI may take a while to think)
            </h3>
          </div>
          <div>
            {'Player vs Player '}
            <Checkbox
              label="Enable downloaded/trained AI for one Player"
              onChange={this.toggleAI}
              checked={this.state.enabledAI}
            />
          </div>
          <div>
            {!this.state.selfTrained && !this.state.aiIsDownloaded ?
              <Button onClick={this.downloadPretrained}>
                {'Download 32MB Pretrained Model (from Python+Keras), needs a while'}
              </Button> : null}
          </div>

          <div>
            <TicTacToeApp
              handleClick={this.handleClick}
              startNewGame={this.startNewGame}
            />
          </div>
        </div>
      </div>
    );
  }
}

interface SquareProps {
  value: string | null;
  onClick: () => void;
}

function Square(props: SquareProps) {
  return (
    <button className="square" onClick={props.onClick}>
      {props.value}
    </button>
  );
}

interface TicTacToeBoardProps {
  squares: (string | null)[];
  onClick: (i: number) => void;
}

/**
 * from https://codepen.io/gaearon/pen/gWWZgR
 * @extends React
 */
class TicTacToeBoard extends React.Component<TicTacToeBoardProps> {
  renderSquare(i: number) {
    return (
      <Square
        value={this.props.squares[i]}
        onClick={() => this.props.onClick(i)}
      />
    );
  }

  render() {
    return (
      <div>
        <div className="board-row">
          {this.renderSquare(0)}
          {this.renderSquare(1)}
          {this.renderSquare(2)}
        </div>
        <div className="board-row">
          {this.renderSquare(3)}
          {this.renderSquare(4)}
          {this.renderSquare(5)}
        </div>
        <div className="board-row">
          {this.renderSquare(6)}
          {this.renderSquare(7)}
          {this.renderSquare(8)}
        </div>
      </div>
    );
  }
}

interface TicTacToeAppProps {
  handleClick?: (i: number) => number;
  startNewGame?: () => number;
}

interface TicTacToeAppState {
  history: { squares: (string | null)[] }[];
  stepNumber: number;
  xIsNext: boolean;
}

class TicTacToeApp extends React.Component<TicTacToeAppProps, TicTacToeAppState> {
  constructor(props: TicTacToeAppProps) {
    super(props);
    this.state = {
      history: [
        {
          squares: Array(9).fill(null),
        },
      ],
      stepNumber: 0,
      xIsNext: true,
    };
  }

  handleClick(i: number, human?: number): void {
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    const squares = current.squares.slice();
    if (calculateWinner(squares) || squares[i]) {
      return;
    }
    squares[i] = this.state.xIsNext ? 'X' : 'O';
    this.setState({
      history: history.concat([
        {
          squares,
        },
      ]),
      stepNumber: history.length,
      xIsNext: !this.state.xIsNext,
    });

    if (human && this.props.handleClick) {
      setTimeout(() => {
        const action = this.props.handleClick!(i);
        if (action >= 0) {
          console.log('ai move:', action);
          this.handleClick(action);
        }
      }, 50);
    }
  }

  jumpTo(step: number): void {
    this.setState({
      stepNumber: step,
      xIsNext: (step % 2) === 0,
    });

    if (this.props.startNewGame) {
      setTimeout(() => {
        const action = this.props.startNewGame!();
        if (action >= 0) {
          console.log('ai moves !!!!');
          this.handleClick(action);
        }
      }, 50);
    }
  }

  render() {
    const history = this.state.history;
    const current = history[this.state.stepNumber];
    const winner = calculateWinner(current.squares);

    const moves = history.map((step, move) => {
      if (move !== 0) {
        return null;
      }
      const desc = move ?
        `Go to move #${move}` :
        'Start new game';
      return (
        <li key={move}>
          <Button onClick={() => this.jumpTo(move)}>{desc}</Button>
        </li>
      );
    });

    let status;
    if (winner) {
      status = `Winner: ${winner}`;
    } else {
      status = `Next player: ${this.state.xIsNext ? 'X' : 'O'}`;
    }

    return (
      <div>
        <div className="game-info">
          <div>
            <ol>{moves}</ol>
          </div>
          <div className="game-status">{status}</div>
        </div>
        <div className="game-board">
          <TicTacToeBoard
            squares={current.squares}
            onClick={i => this.handleClick(i, 1)}
          />
        </div>
      </div>
    );
  }
}

function calculateWinner(squares: (string | null)[]): string | null {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

export default App;