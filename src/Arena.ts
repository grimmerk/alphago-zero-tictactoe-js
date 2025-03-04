interface Player {
  play: (board: any) => number;
  isHuman?: boolean;
}

interface Game {
  getInitBoardNdArray: () => any;
  getCanonicalForm: (board: any, player: number) => any;
  getValidMoves: (board: any, player: number) => any;
  getNextState: (board: any, player: number, action: number) => { boardNdArray: any, curPlayer: number };
  getGameEnded: (board: any, player: number) => number;
}

interface GameResult {
  oneWon: number;
  twoWon: number;
  draws: number;
}

export default class Arena {
  // """
  // An Arena class where any 2 agents can be pit against each other.
  // """
  
  private player1: Player;
  private player2: Player;
  private game: Game;
  private display: (board: any) => void;
  
  // NOTE: used for pretrained-ai vs human
  private players: (Player | null)[] | null = null;
  private curPlayer: number = 0; // 0:dummy. real values: 1 or -1
  private boardNdArray: any = null;

  constructor(player1: Player, player2: Player, game: Game, display: (board: any) => void) {
    console.log('Arena constructor');
    this.player1 = player1;
    this.player2 = player2;
    this.game = game;
    this.display = display;
  }

  gameMoveByAction(action: number): void {
    let valids = this.game.getValidMoves(this.game.getCanonicalForm(this.boardNdArray, this.curPlayer), 1);
    valids = valids.tolist();
    if (valids[action] == 0) {
      console.log(action);
      // assert valids[action] >0
      throw new Error('can not find out valid action, something wrong');
    }
    const nextState = this.game.getNextState(this.boardNdArray, this.curPlayer, action);
    this.boardNdArray = nextState.boardNdArray;
    this.curPlayer = nextState.curPlayer;
  }

  // a: board index from 0 to 8
  humanStep(action: number): number {
    console.log('humanStep');
    console.log(`current Player: ${this.curPlayer}`);

    let aiAction = -1;
    if (!this.players?.[this.curPlayer + 1]?.isHuman) {
      console.log('current player is ai, ignore');
      return aiAction;
    }

    // Was the previous AI caused ended?
    if (this.game.getGameEnded(this.boardNdArray, this.curPlayer) !== 0) {
      // game is ended
      console.log('should not happen, game is ended already');
    }

    // if (verbose) {
    this.display(this.boardNdArray);
    // }

    // Even if it’s the last move, it still needs to be called. The state needs to change properly.

    // 1. human's step.
    this.gameMoveByAction(action);

    // 2. auto ai
    aiAction = this.tryToPlayAIStep();

    if (this.game.getGameEnded(this.boardNdArray, this.curPlayer) !== 0) {
      // game is ended
      // if (verbose) {
      // console.log(`Game is ended: Turn ${it}. Result ${this.game.getGameEnded(this.boardNdArray, 1)}`);
      // assert(self.display)
      this.display(this.boardNdArray);
      // }

      // means it is ended
      // return this.game.getGameEnded(this.boardNdArray, this.curPlayer);
    }

    return aiAction;

    // return this.game.getGameEnded(boardNdArray, 1);
  }

  // it will affect who is the first player of a new game
  swapTwoPlayers(): void {
    console.log('swap');
    const tmpPlayer1 = this.player1;
    this.player1 = this.player2;
    this.player2 = tmpPlayer1;
  }

  tryToPlayAIStep(): number {
    let action = -1;
    console.log('tryToPlayAIStep');
    if (this.players && !this.players[this.curPlayer + 1]?.isHuman) {
      // it is an AI

      // let it = 0;
      if (this.game.getGameEnded(this.boardNdArray, this.curPlayer) === 0) {
        // curPlayer: 1 (this.player1) or -1 (this.player2)
        // it += 1;
        // if (verbose) {
        this.display(this.boardNdArray);
        console.log(`Player ${this.curPlayer}`);
        // }

        if (this.players[this.curPlayer + 1]) {
          action = this.players[this.curPlayer + 1]!.play(this.game.getCanonicalForm(this.boardNdArray, this.curPlayer));
          this.gameMoveByAction(action);
        }
      } else {
        console.log('game is already ended');
      }
    } else {
      console.log('current player is human, ignore');
    }

    return action;
  }

  // TODO:
  // 1. [done] let ui responsbile for the logic about restarts a game
  // 2. [done] let ui responsbile for calling swap function
  // 3. handle the case to give up+restart game. this.game needs reset
  playNewGameWithHuman(): number {
    this.players = [this.player2, null, this.player1];
    this.curPlayer = 1;
    this.boardNdArray = this.game.getInitBoardNdArray(); // !!!

    // first player (player1) may be human or AI
    return this.tryToPlayAIStep();
  }

  playGame(verbose: boolean = false): number {
    const players = [this.player2, null, this.player1];
    let curPlayer = 1;
    let boardNdArray = this.game.getInitBoardNdArray();
    let it = 0;
    while (this.game.getGameEnded(boardNdArray, curPlayer) === 0) {
      // curPlayer: 1 or -1
      it += 1;
      if (verbose) {
        this.display(boardNdArray);
        console.log(`Turn ${it}. Player ${curPlayer}`);
      }
      
      const player = players[curPlayer + 1];
      if (!player) continue;
      
      const action = player.play(this.game.getCanonicalForm(boardNdArray, curPlayer));
      let valids = this.game.getValidMoves(this.game.getCanonicalForm(boardNdArray, curPlayer), 1);
      valids = valids.tolist();

      if (valids[action] == 0) {
        console.log(action);
        // assert valids[action] >0
        throw new Error('can not find out valid action, something wrong');
      }
      const nextState = this.game.getNextState(boardNdArray, curPlayer, action);
      boardNdArray = nextState.boardNdArray;
      curPlayer = nextState.curPlayer;
    }

    if (verbose) {
      console.log(`Game over: Turn ${it}. Result ${this.game.getGameEnded(boardNdArray, 1)}`);
      // assert(self.display)
      this.display(boardNdArray);
    }

    return this.game.getGameEnded(boardNdArray, 1);
  }


  playGames(num: number, verbose: boolean = false): GameResult {
    // eps_time = AverageMeter()
    // bar = Bar('Arena.playGames', max=num)
    // end = time.time()
    // const esp = 0;
    // const maxeps = Math.floor(num); // int(num)

    num = Math.floor(num / 2);
    let oneWon = 0;
    let twoWon = 0;
    let draws = 0;
    for (let i = 0; i < num; i++) {
      const gameResult = this.playGame(verbose);
      if (gameResult == 1) {
        oneWon += 1;
      } else if (gameResult == -1) {
        twoWon += 1;
      } else {
        draws += 1;
      }
    }

    this.swapTwoPlayers();

    for (let i = 0; i < num; i++) {
      const gameResult = this.playGame(verbose);
      if (gameResult == -1) {
        oneWon += 1;
      } else if (gameResult == 1) {
        twoWon += 1;
      } else {
        draws += 1;
      }
    }

    return { oneWon, twoWon, draws };
  }
}