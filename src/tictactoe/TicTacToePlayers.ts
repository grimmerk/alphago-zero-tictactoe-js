interface Game {
  getActionSize(): number;
  getValidMoves(board: any, player: number): any;
}

export class RandomPlayer {
  game: Game;
  
  constructor(game: Game) {
    console.log('RandomPlayer constructor');
    this.game = game;
  }

  play = (board: any): number => {
    // Python:
    // a = np.random.randint(self.game.getActionSize()) [0, low)
    let a = Math.floor(Math.random() * this.game.getActionSize());
    let valids = this.game.getValidMoves(board, 1);
    valids = valids.tolist();

    while (valids[a] !== 1) {
      a = Math.floor(Math.random() * this.game.getActionSize());
    }
    return a;
  }
}

export class HumanTicTacToePlayer {
  game: Game;
  isHuman: boolean;
  
  constructor(game: Game) {
    console.log('HumanTicTacToePlayer constructor');
    this.game = game;
    this.isHuman = true;
  }
  
  // Adding empty play method to satisfy the interface
  play = (board: any): number => {
    // This should never be called for a human player
    console.warn("HumanTicTacToePlayer's play method was called, but this should never happen");
    return -1;
  }
}