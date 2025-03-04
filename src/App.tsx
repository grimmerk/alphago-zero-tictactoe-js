import React, { Component } from 'react';
// import logo from './logo.svg';
import './App.css';
import { Checkbox, Button } from 'semantic-ui-react';

import play, { downloadPretrained, humanMove } from './pit';
import train from './main';
// import train from './tictactoe/tensorflow/TicTacToeNNet';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      enabledAI: false,
      aiIsDownloaded: false,
      aiFirst: true,
      selfTrained: false,
    };
  }

  twoRandowmPlay =() => {
    play();
  }

  startTrain = async () => {
    console.log('start-train');
    await train();
    console.log('end-train');
    this.setState({ selfTrained: true });
  }

  selfTrainVSRandom = () => {
    console.log('selfTrainVSRandom');
    play(1);
  }

  // userVSuser = () => {
  // }

  twoRandowmPlayWithPretrained = async () => {
    play(2);
  }

  downloadPretrained = async () => {
    if (this.state.aiIsDownloaded === false) {
      console.log('ui start to download');
      await downloadPretrained();
      console.log('ui start to download2');
      this.setState({ aiIsDownloaded: true });
    }
  }

  toggleAI = () => {
    this.setState({ enabledAI: !this.state.enabledAI });
  }

  handleClick = action => humanMove(action)

  startNewGame = () => {
    console.log('start new game');
    if (this.state.enabledAI) {
      if (this.state.selfTrained === false && this.state.aiIsDownloaded === false) {
        alert('ai is not download yet');
      }
      let action;
      if (this.state.selfTrained) {
        action = play(4, this.state.aiFirst);
      } else {
        action = play(3, this.state.aiFirst);
      }
      this.setState((prevState, props) => ({ aiFirst: !prevState.aiFirst }));

      if (action >= 0) {
        console.log('ai starts at:', action);
        return action;
      }
    }
    return -1;
  }

  render() {
    return (
      <div className="App" style={{ display: 'flex', justifyContent: 'center' }}>
        {/* <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header> */}
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
          {/* <p className="App-intro">
            <code>No UI</code> refers to use Console to debug or see the results.
          </p> */}
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
          {/* <div>
            <button onClick={this.userVSSelfTrain}>
              user VS SelfTrained
            </button>
          </div> */}

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
          {/* <div>
            <button onClick={this.userVSPretrained}>
              User VS Pretrained AlphaGo AI, show TicTacToe UI to play
            </button>
          </div> */}
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

          {/* <div>
            <button onClick={this.userVSuser}>
              userVSuser
            </button>
          </div> */}
        </div>

      </div>
    );
  }
}

function Square(props) {
  return (
    <button className="square" onClick={props.onClick}>
      {props.value}
    </button>
  );
}

/**
 * from https://codepen.io/gaearon/pen/gWWZgR
 * @extends React
 */
class TicTacToeBoard extends React.Component {
  renderSquare(i) {
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

class TicTacToeApp extends React.Component {
  constructor(props) {
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

  handleClick(i, human) {
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
      // const action = this.props.handleClick(i);
      // if (action >= 0) {
      setTimeout(() => {
        const action = this.props.handleClick(i);
        if (action >= 0) {
          console.log('ai move:', action);
          this.handleClick(action);
        }
      }, 50);


      // this.handleClick(action);
    }
  }

  jumpTo(step) {
    this.setState({
      stepNumber: step,
      xIsNext: (step % 2) === 0,
    });

    if (this.props.startNewGame) {
      // TODO: this is anti-parttern (directly get the result)
      // const action = this.props.startNewGame();
      // if (action >= 0) {
      //   console.log('ai moves !!!!');
      //   // AI move
      setTimeout(() => {
        const action = this.props.startNewGame();
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

// ========================================

// ReactDOM.render(<Game />, document.getElementById('root'));

function calculateWinner(squares) {
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
