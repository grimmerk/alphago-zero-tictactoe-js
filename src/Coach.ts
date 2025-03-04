import Arena from './Arena';
import MCTS from './MCTS';
import * as players from './tictactoe/TicTacToePlayers';
import { CoachArgs, Game, NeuralNetType } from './types/interfaces';
import Utils from './Utils';

export default class Coach {
  game: Game;
  nnet: NeuralNetType;
  args: CoachArgs;
  mcts: MCTS;
  trainExamplesHistory: any[][];
  skipFirstSelfPlay: boolean;
  curPlayer: number = 1;

  constructor(game: Game, nnet: NeuralNetType, args: CoachArgs) {
    console.log('Coach constructor');
    this.game = game;
    this.nnet = nnet;
    this.args = args;
    this.mcts = new MCTS(this.game, this.nnet, this.args);
    this.trainExamplesHistory = [];
    this.skipFirstSelfPlay = false;
  }

  // used by learn()
  executeEpisode(): any[] {
    const trainExamples: any[] = [];
    let boardNdArray = this.game.getInitBoardNdArray();
    this.curPlayer = 1;
    let episodeStep = 0;

    while (true) {
      episodeStep += 1;
      const canonicalBoard = this.game.getCanonicalForm(boardNdArray, this.curPlayer);
      const temp = episodeStep < this.args.tempThreshold ? 1 : 0;
      const pi = this.mcts.getActionProb(canonicalBoard, temp);
      const sym = this.game.getSymmetries(canonicalBoard, pi);
      sym.forEach((obj) => {
        const { b, p } = obj;
        // QUESTION: null?
        trainExamples.push([b, this.curPlayer, p, null]);
      });

      const action = Utils.randomChoice(pi);
      const nextState = this.game.getNextState(boardNdArray, this.curPlayer, action);
      boardNdArray = nextState.boardNdArray;
      this.curPlayer = nextState.curPlayer;

      const r = this.game.getGameEnded(boardNdArray, this.curPlayer);

      if (r != 0) {
        const resp = [];
        for (const x of trainExamples) {
          resp.push({
            input_boards: x[0],
            target_pis: x[2],
            target_vs: r * ((-1) ** (x[1] != this.curPlayer ? 1 : 0)),
          });
        }
        return resp;
      }
    }
  }

  // """
  // Performs numIters iterations with numEps episodes of self-play in each
  // iteration. After every iteration, it retrains neural network with
  // examples in trainExamples (which has a maximium length of maxlenofQueue).
  // It then pits the new neural network against the old one and accepts it
  // only if it wins >= updateThreshold fraction of games.
  // """
  async learn(): Promise<void> {
    const max = this.args.numIters + 1;
    console.log(`start learn ${this.args.numIters} times iteration-MTCS+train`);

    // numIters (3) * numEps (25)?
    for (let i = 1; i < max; i++) {
      console.log(`------ITER ${i}------`);

      if (!this.skipFirstSelfPlay || i > 1) {
        // Python version uses deque
        let iterationTrainExamples: any[] = [];

        console.log('start %d eposides', this.args.numEps);
        for (let j = 0; j < this.args.numEps; j++) {
          console.log('eposides-%d', j);
          this.mcts = new MCTS(this.game, this.nnet, this.args);
          const episodeResult = this.executeEpisode();
          iterationTrainExamples = iterationTrainExamples.concat(episodeResult);
        }
        
        this.trainExamplesHistory.push(iterationTrainExamples);
      }

      console.log('get this time iteration MTCS data, prepare training');

      if (this.trainExamplesHistory.length > this.args.numItersForTrainExamplesHistory) {
        console.log(`len(trainExamplesHistory) =${this.trainExamplesHistory.length} => remove the oldest trainExamples`);
        this.trainExamplesHistory.shift();
      }

      // Flatten the array of arrays using a different approach for TypeScript compatibility
      const flattenExamples = this.trainExamplesHistory.reduce((acc, val) => acc.concat(val), [] as any[]);
      //  nnet's training epochs: 10
      await this.nnet.train(flattenExamples);
      console.log('after training 1 time');

      const nmcts = new MCTS(this.game, this.nnet, this.args);
      console.log('PITTING AGAINST Random VERSION');
      const firstPlayr = new players.RandomPlayer(this.game);
      const arena = new Arena(
        firstPlayr,
        { play: (x: any) => Utils.argmax(nmcts.getActionProb(x, 0)) },
        this.game,
        () => {} // Dummy display function
      );
      const { oneWon, twoWon, draws } = arena.playGames(this.args.arenaCompare);
      console.log('NEW/RANDOM WINS : %d / %d ; DRAWS : %d', twoWon, oneWon, draws);

      // NOTE: Use AlphaZero's design, not possibily rollback to previous version
      // if ((pwins + nwins) > 0 && nwins / (pwins + nwins) < this.args.updateThreshold) {
      //   console.log('REJECTING NEW MODEL');
      //   this.nnet = this.pnet;
      //   // self.nnet.load_checkpoint(folder = self.args.checkpoint, filename = 'temp.pth.tar');
      // } else {
      //   console.log('ACCEPTING NEW MODEL');
      //   // self.nnet.save_checkpoint(folder = self.args.checkpoint, filename = self.getCheckpointFile(i));
      //   // self.nnet.save_checkpoint(folder = self.args.checkpoint, filename = 'best.pth.tar');
      // }
    }

    console.log('finish learning');
  }

  // return filename
  getCheckpointFile(iteration: number): string {
    // return 'checkpoint_' + str(iteration) + '.pth.tar'
    return '';
  }

  // TODO: serialize training objects to files
  saveTrainExamples(): void {
    // Implementation not provided in original
  }

  // TODO:
  loadTrainExamples(): void {
    // Implementation not provided in original
  }
}