import { Game } from '../Game';
import Board from './TicTacToeLogic';
import nj from '@d4c/numjs';

// Grimmer: This class needs a lot of numpy operations
export class TicTacToeGame extends Game {
  constructor(n = 3) {
    super();
    console.log('TicTacToeGame constructer');
    // board size, 3x3 for TicTacToeGame
    this.n = n;
  }

  getInitBoardNdArray() {
    const b = new Board(this.n);
    // return np.array(b.pieces), Python
    return nj.array(b.pieces);
  }

  // used by *NNet classes
  getBoardSize() {
    return { a: this.n, b: this.n };
  }

  // return number of actions
  // grimmer's QUESTION: why +1, ? neural network's bias?
  getActionSize() {
    return (this.n * this.n) + 1;
  }

  getNextState(boardNdArray, player, action) {
    // # if player takes action on board, return next (board,player)
    // # action must be a valid move
    if (action === this.n * this.n) {
      // return (board, -player)
      console.log('invalid action');
      return { boardNdArray, player: -player };
    }

    const b = new Board(this.n);
    // b.pieces = np.copy(board), Python
    b.pieces = boardNdArray.tolist();

    const move = { x: Math.floor(action / this.n), y: (action % this.n) };
    b.execute_move(move, player);
    return { boardNdArray: nj.array(b.pieces), curPlayer: -player };
  }

  // return a list, 會受getCanonicalForm影響嗎? 不會.
  getValidMoves(boardNdArray, player) {
    // Python:
    // # return a fixed size binary vector
    // valids = [0]*this.getActionSize()
    // b.pieces = np.copy(board)
    const valids = Array(this.getActionSize()).fill(0);
    const b = new Board(this.n);
    b.pieces = boardNdArray.tolist();

    const legalMoves = b.get_legal_moves(player);
    if (legalMoves.length === 0) {
      valids[valids.length - 1] = 1;
      return nj.array(valids);
    }

    legalMoves.forEach((element) => {
      const { x, y } = element;
      valids[(this.n * x) + y] = 1; // flattern to vector
    });

    // Note: using ndarray type is for MTCS' search: self.Ps[s]*valids
    return nj.array(valids);
  }

  getGameEnded(boardNdArray, player) {
    // Python:
    // # return 0 if not ended, 1 if player 1 won, -1 if player 1 lost
    // # player = 1
    const b = new Board(this.n);
    b.pieces = boardNdArray.tolist();

    if (b.is_win(player)) {
      return 1;
    }
    if (b.is_win(-player)) {
      return -1;
    }
    if (b.has_legal_moves()) {
      return 0;
    }
    // # draw has a very little value
    return 1e-4;
  }

  // grimmer's QUESTION: at least not useful for playing. Useful for training (executeEpisode)?
  getCanonicalForm(boardNdArray, player) {
    // Python:
    // # return state if player==1, else return -state if player==-1
    // return player*board
    return nj.multiply(boardNdArray, player);
  }

  // boardNdArray: 3x3 ndarray
  // e.g. pi:[0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1]
  getSymmetries(boardNdArray, pi) {
    if (pi.length !== this.n ** 2 + 1) {
      throw 'not valid pi for Symmetries';
    }

    // Python: pi[:-1]. Remove the last one
    const pi_copy = pi.slice();
    pi_copy.pop();
    const pi_board = nj.reshape(pi_copy, [this.n, this.n]);
    const l = [];

    for (let i = 1; i < 5; i++) {
      for (const j of [true, false]) {
        let newB = nj.rot90(boardNdArray, i);
        let newPi = nj.rot90(pi_board, i);
        if (j) {
          // Python:newB = np.fliplr(newB)
          newB = nj.flip(newB, 1);
          newPi = nj.flip(newPi, 1);
        }
        // Python:
        // p: ordinary 1d array. after reshape
        //         >>> y2
        // array([[3, 2, 1],
        //        [6, 5, 4],
        //        [9, 8, 7]])
        // >>> y2.ravel() ~ numjy's flatten
        // array([3, 2, 1, 6, 5, 4, 9, 8, 7]). ndarray type
        // after list
        // [3, 2, 1, 6, 5, 4, 9, 8, 7] !!. list type
        // + [pi[-1] (e.g. [33])
        // [3, 2, 1, 6, 5, 4, 9, 8, 7, 33]
        const p = nj.flatten(newPi).tolist();
        p.push(pi[pi.length - 1]);
        const element = { b: newB, p };
        // l += [(newB, )], Python
        l.push(element);
      }
    }

    return l;

    // np.reshape(pi[:-1], (self.n, self.n))
  }

  // used by MCTS
  stringRepresentation(boardNdArray) {
    // # 3x3 numpy array (canonical board)
    return JSON.stringify(boardNdArray);
  }
}

let log = '';
function print(newLog, end) {
  log += newLog;
  if (typeof end !== 'undefined' && end !== null) {
    log += end;
  } else {
    log += '\n';
  }
}
function flush() {
  console.log(log);
}

export function display(boardNdArray) {
  log = '';
  const n = boardNdArray.shape[0];
  const list = boardNdArray.tolist();
  print('  ', '');
  // Pyton:
  // for y in range(n):
  //     print (y,"", end="")
  for (let y = 0; y < n; y++) {
    print(`${y}`, ' ');
  }

  print('');
  print(' ', '');

  for (let _ = 0; _ < n; _++) {
    print('-', '-');
  }

  print('--');
  for (let y = 0; y < n; y++) {
    print(`${y}|`, ''); // # print the row #
    for (let x = 0; x < n; x++) {
      const piece = list[y][x]; // # get the piece to print
      if (piece === -1) {
        print('X ', '');
      } else if (piece === 1) {
        print('O ', '');
      } else if (x == n) {
        print('-', '');
      } else {
        print('- ', '');
      }
    }
    print('|');
  }

  print(' ', '');
  for (let _ = 0; _ < n; _++) {
    print('-', '-');
  }

  print('--');
  flush();
  console.log('flush');
}
