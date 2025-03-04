import MCTS from './MCTS';
import Utils from './Utils';
import Arena from './Arena';
import * as players from './tictactoe/TicTacToePlayers';

export default class Coach {
  // """
  // This class executes the self-play + learning. It uses the functions defined
  // in Game and NeuralNet. args are specified in main.py.
  // """
  constructor(game, nnet, args) {
    console.log('Coach constructer');
    this.game = game;
    this.nnet = nnet;
    // this.pnet = null; // this.nnet.constructor(this.game);
    // self.pnet = self.nnet.__class__(self.game)??
    this.args = args;
    this.mcts = new MCTS(this.game, this.nnet, this.args);
    this.trainExamplesHistory = [];
    this.skipFirstSelfPlay = false;
  }

  // used by learn()
  executeEpisode() {
    const trainExamples = [];
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
            target_vs: r * ((-1) ** (x[1] != this.curPlayer)),
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
  async learn() {
    const max = this.args.numIters + 1;
    console.log(`start learn ${this.args.numIters} times iteration-MTCS+train`);

    // numIters (3) * numEps (25)?
    for (let i = 1; i < max; i++) {
      console.log(`------ITER ${i}------`);

      if (!this.skipFirstSelfPlay || i > 1) {
        // Python version uses deque
        let iterationTrainExamples = [];

        // eps_time = AverageMeter()
        // bar = Bar('Self Play', max=self.args.numEps)
        // end = time.time()

        console.log('start %d eposides', this.args.numEps);
        for (let j = 0; j < this.args.numEps; j++) {
          console.log('eposides-%d', j);
          this.mcts = new MCTS(this.game, this.nnet, this.args);
          const episodeResult = this.executeEpisode();
          iterationTrainExamples = iterationTrainExamples.concat(episodeResult);

          // # bookkeeping + plot progress
          // eps_time.update(time.time() - end)
          // end = time.time()
          // bar.suffix  = '({eps}/{maxeps}) Eps Time: {et:.3f}s | Total: {total:} | ETA: {eta:}'.format(eps=eps+1, maxeps=self.args.numEps, et=eps_time.avg,
          //                                                                                            total=bar.elapsed_td, eta=bar.eta_td)
          // bar.next()
        }
        // bar.finish()
        this.trainExamplesHistory.push(iterationTrainExamples);
      }

      console.log('get this time iteration MTCS data, prepare training');

      if (this.trainExamplesHistory.length > this.args.numItersForTrainExamplesHistory) {
        console.log(`len(trainExamplesHistory) =${this.trainExamplesHistory.length} => remove the oldest trainExamples`);
        this.trainExamplesHistory.shift();
      }

      // # backup history to a file
      // # NOTE: the examples were collected using the model from the previous iteration, so (i-1)
      // self.saveTrainExamples(i-1)

      // # shuffle examlpes before training
      // trainExamples = []
      // for e in self.trainExamplesHistory:
      //     trainExamples.extend(e)
      // shuffle(trainExamples)
      // NOTE: Use tensorflow.js' built-in shuffle parameter of model fit method
      // const trainExamples = this.trainExamplesHistory;

      // # training new network, keeping a copy of the old one
      // self.nnet.save_checkpoint(folder=self.args.checkpoint, filename='temp.pth.tar')
      // self.pnet.load_checkpoint(folder=self.args.checkpoint, filename='temp.pth.tar')
      // this.pnet = deepcopy(this.nnet);
      // const pmcts = new MCTS(this.game, this.pnet, this.args);

      const flattenExamples = [].concat.apply([], this.trainExamplesHistory);
      //  nnet's training epochs: 10
      await this.nnet.train(flattenExamples);
      console.log('after training 1 time');

      const nmcts = new MCTS(this.game, this.nnet, this.args);
      console.log('PITTING AGAINST Random VERSION');
      const firstPlayr = new players.RandomPlayer(this.game);
      const arena = new Arena(
        firstPlayr,
        // { play: x => Utils.argmax(pmcts.getActionProb(x, 0)) },
        { play: x => Utils.argmax(nmcts.getActionProb(x, 0)) },
        this.game,
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
  getCheckpointFile(iteration) {
    // return 'checkpoint_' + str(iteration) + '.pth.tar'
    return '';
  }

  // TODO: serialize training objects to files
  saveTrainExamples() {

  }

  // TODO:
  loadTrainExamples() {

  }
}
