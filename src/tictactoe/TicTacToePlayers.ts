import { NdArray } from "@d4c/numjs";
import { TicTacToeGame } from "./TicTacToeGame";

export class RandomPlayer {
  game: TicTacToeGame;
  
  constructor(game: TicTacToeGame) {
    console.log('RandomPlayer constructor');
    this.game = game;
  }

  play = (board: NdArray): number => {
    // Python:
    // a = np.random.randint(self.game.getActionSize()) [0, low)
    let a = Math.floor(Math.random() * this.game.getActionSize());
    let valids: NdArray | any[] = this.game.getValidMoves(board, 1);
    valids = valids.tolist();

    while (valids[a] !== 1) {
      a = Math.floor(Math.random() * this.game.getActionSize());
    }
    return a;
  }
}

export class HumanTicTacToePlayer {
  game: TicTacToeGame;
  isHuman: boolean;
  
  constructor(game: TicTacToeGame) {
    console.log('HumanTicTacToePlayer constructor');
    this.game = game;
    this.isHuman = true;
  }
  
  // Adding empty play method to satisfy the interface
  play = (board: NdArray): number => {
    // This should never be called for a human player
    console.warn("HumanTicTacToePlayer's play method was called, but this should never happen");
    return -1;
  }
}