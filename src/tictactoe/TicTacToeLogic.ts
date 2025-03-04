// Define types for moves
interface Move {
  x: number;
  y: number;
}

export default class Board {
  n: number;
  pieces: number[][];

  constructor(n: number = 3) {
    this.n = n;

    // Create the empty board array
    // this.pieces = Array(this.n).fill(Array(this.n).fill(0));
    /** the above would create an 2d array with same 1d array reference, 
     * e.g. arr1[0][0] = 1 would result in [1][0], [2][0] = 1.
     * apply this fix later */
    // Note: Need to create a new array for each row to avoid reference issues
    this.pieces = Array(this.n).fill(0).map(() => Array(this.n).fill(0));
  }

  get_legal_moves(player?: number): Move[] {
    // Returns all the legal moves
    // (1 for white, -1 for black)
    // player parameter is not used and came from previous version
    const moves: Move[] = [];
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        if (this.pieces[j][i] === 0) {
          moves.push({ x: j, y: i });
        }
      }
    }
    return moves;
  }

  has_legal_moves(): boolean {
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        if (this.pieces[j][i] === 0) {
          return true;
        }
      }
    }
    return false; // Added return false which was missing in the original
  }

  is_win(color: number): boolean {
    // Check whether the given player has collected a triplet in any direction
    // color (1=white, -1=black)
    const win = this.n;
    let count = 0;
    
    // check y-strips
    for (let y = 0; y < this.n; y++) {
      count = 0;
      for (let x = 0; x < this.n; x++) {
        if (this.pieces[x][y] === color) {
          count += 1;
        }
      }
      if (count === win) {
        return true;
      }
    }
    
    // check x-strips
    for (let x = 0; x < this.n; x++) {
      count = 0;
      for (let y = 0; y < this.n; y++) {
        if (this.pieces[x][y] === color) {
          count += 1;
        }
      }
      if (count === win) {
        return true;
      }
    }
    
    // check two diagonal-strips
    count = 0;
    for (let d = 0; d < this.n; d++) {
      if (this.pieces[d][d] === color) {
        count += 1;
      }
    }
    if (count === win) {
      return true;
    }
    
    count = 0;
    for (let d = 0; d < this.n; d++) {
      if (this.pieces[d][this.n - d - 1] === color) {
        count += 1;
      }
    }
    if (count === win) {
      return true;
    }

    return false;
  }

  execute_move(move: Move, color: number): void {
    // Perform the given move on the board
    // color gives the color of the piece to play (1=white, -1=black)
    let { x, y } = move;
    
    if (x < 0) {
      if (x < -1) {
        throw new Error('x position is wrong!!');
      } else {
        x = this.pieces.length - 1;
      }
    }

    if (y < 0) {
      if (y < -1) {
        throw new Error('y position is wrong!!');
      } else {
        y = this.pieces[0].length - 1;
      }
    }

    // Add the piece to the empty square
    if (this.pieces[x][y] === 0) {
      this.pieces[x][y] = color;
    } else {
      throw new Error('already colored, wrong');
    }
  }
}