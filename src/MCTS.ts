import nj from '@d4c/numjs';
import { Game, MCTSArgs, NeuralNetType } from './types/interfaces';
import Utils from './Utils';

// Declare nj globally to fix TypeScript compilation issues

const EPS = 1e-8;

export default class MCTS {
  game: Game;
  nnet: NeuralNetType;
  args: MCTSArgs;
  Qsa: Record<string, number>; // stores Q values for s,a (as defined in the paper)
  Nsa: Record<string, number>; // stores #times edge s,a was visited
  Ns: Record<string, number>; // stores #times board s was visited
  Ps: Record<string, any>; // stores initial policy (returned by neural net)
  Es: Record<string, number>; // stores game.getGameEnded ended for board s
  Vs: Record<string, any>; // stores game.getValidMoves for board s

  constructor(game: Game, nnet: NeuralNetType, args: MCTSArgs) {
    console.log('MCTS constructor');
    this.game = game;
    this.nnet = nnet;
    this.args = args;
    this.Qsa = {}; 
    this.Nsa = {}; 
    this.Ns = {}; 
    this.Ps = {}; 
    this.Es = {}; 
    this.Vs = {}; 
  }

  // return a array object
  getActionProb(canonicalBoard: any, temp: number = 1): number[] {
    for (let i = 0; i < this.args.numMCTSSims; i++) {
      // console.log(`MCTS loop:${i}`);
      this.search(canonicalBoard);
    }
    // console.log('getActionProb MCTS loop ends');
    
    const s = this.game.stringRepresentation(canonicalBoard);
    const aSize = this.game.getActionSize();
    let counts: number[] = [];
    
    for (let a = 0; a < aSize; a++) {
      const saKey = `${s};${a}`;
      if (this.Nsa.hasOwnProperty(saKey)) {
        counts.push(this.Nsa[saKey]);
      } else {
        counts.push(0);
      }
    }

    let probs: number[];
    if (temp === 0) {
      const bestA = Utils.argmax(counts);
      probs = Array(counts.length).fill(0);
      probs[bestA] = 1;
      return probs;
    }

    counts = counts.map(x => x ** (1.0 / temp));
    const sum = counts.reduce((x, y) => x + y);
    probs = counts.map(x => x / sum);
    
    return probs;
  }

  /**
   * This function performs one iteration of MCTS. It is recursively called
   * till a leaf node is found. The action chosen at each node is one that
   * has the maximum upper confidence bound as in the paper.
   *
   * Once a leaf node is found, the neural network is called to return an
   * initial policy P and a value v for the state. This value is propagated
   * up the search path. In case the leaf node is a terminal state, the
   * outcome is propagated up the search path. The values of Ns, Nsa, Qsa are
   * updated.
   *
   * NOTE: the return values are the negative of the value of the current
   * state. This is done since v is in [-1,1] and if v is the value of a
   * state for the current player, then its value is -v for the other player.
   *
   * Returns:
   *     v: the negative of the value of the current canonicalBoard
   */
  search(canonicalBoard: any): number {
    const s = this.game.stringRepresentation(canonicalBoard);

    if (!this.Es.hasOwnProperty(s)) {
      this.Es[s] = this.game.getGameEnded(canonicalBoard, 1);
    }

    if (this.Es[s] != 0) {
      // terminal node
      return -this.Es[s];
    }

    if (!this.Ps.hasOwnProperty(s)) {
      // leaf node
      // NOTE: Python ver.: v is ndarray type: [0.x]. qsa, too.
      // JavaScript: v is just a number value.
      const resp = this.nnet.predict(canonicalBoard);
      this.Ps[s] = resp.Ps;
      const v = resp.v;

      const valids = this.game.getValidMoves(canonicalBoard, 1);
      // NOTE: Array multiplication is not matrix multiplication:
      // Python: self.Ps[s] = self.Ps[s]*valids
      this.Ps[s] = nj.multiply(this.Ps[s], valids); // masking invalid moves
      const sum_Ps_s = nj.sum(this.Ps[s]);
      
      if (sum_Ps_s > 0) {
        this.Ps[s] = nj.divide(this.Ps[s], sum_Ps_s); // renormalize
      } else {
        // if all valid moves were masked make all valid moves equally probable
        //
        // NB! All valid moves may be masked if either your NNet architecture is insufficient or you've get overfitting or something else.
        // If you have got dozens or hundreds of these messages you should pay attention to your NNet and/or training process.
        console.log('All valid moves were masked, do workaround.');
        this.Ps[s] = nj.add(this.Ps[s], valids);
        this.Ps[s] = nj.divide(this.Ps[s], nj.sum(this.Ps[s]));
      }

      this.Vs[s] = valids;
      this.Ns[s] = 0;
      return v;
    }

    const valids = this.Vs[s];
    let cur_best = Number.NEGATIVE_INFINITY;
    let best_act = -1;
    const aSize = this.game.getActionSize();
    
    // pick the action with the highest upper confidence bound
    for (let a = 0; a < aSize; a++) {
      // NOTE: valid is a ndarray
      if (valids.get(a) > 0) {
        const saKey = `${s};${a}`;
        let u: number;
        
        if (this.Qsa.hasOwnProperty(saKey)) {
          // case1
          // Python:
          // 1. this.Ps[s][a] is using Dictionary's[] + ndarray's[]
          // 2. this.Qsa[saKey] returns ndarray type. [value], and it can add a number,
          // so u = this.Qsa[saKey] + ... gets a [value]

          // JavaScript version here: u gets a value, this.Qsa[saKey] is value too.
          u = this.Qsa[saKey] + this.args.cpuct * this.Ps[s].get(a) * Math.sqrt(this.Ns[s]) / (1 + this.Nsa[saKey]);
        } else {
          // case2
          // Python: u gets a value. JS, too.
          // grimmer's QUESTION: # original Python's comment: "Q = 0 ?" what does it mean?
          u = this.args.cpuct * this.Ps[s].get(a) * Math.sqrt(this.Ns[s] + EPS);
        }

        // Python: sometimes u is value, sometimes it is [value]
        //         if a ndarray is [value], it can compare with value
        // JavaScript: To be more clear, use specified ways to let u get value always
        if (u > cur_best) {
          cur_best = u;
          best_act = a;
        }
      }
    }

    const a = best_act; // a: value

    const nextState = this.game.getNextState(canonicalBoard, 1, a);
    let next_s = nextState.boardNdArray;
    const next_player = nextState.curPlayer;

    next_s = this.game.getCanonicalForm(next_s, next_player);
    // v (value): number
    const v = this.search(next_s);
    const saKey = `${s};${a}`;
    
    if (this.Qsa.hasOwnProperty(saKey)) {
      this.Qsa[saKey] = (this.Nsa[saKey] * this.Qsa[saKey] + v) / (this.Nsa[saKey] + 1);
      this.Nsa[saKey] += 1;
    } else {
      this.Qsa[saKey] = v;
      this.Nsa[saKey] = 1;
    }

    this.Ns[s] += 1;
    return -v;
  }
}