// Game Interface
export interface Game {
  getInitBoardNdArray: () => any;
  getCanonicalForm: (board: any, player: number) => any;
  getNextState: (board: any, player: number, action: number) => { boardNdArray: any, curPlayer: number };
  getGameEnded: (board: any, player: number) => number;
  getSymmetries: (board: any, pi: number[]) => Array<{ b: any, p: number[] }>;
  getBoardSize: () => { a: number, b: number };
  getActionSize: () => number;
  getValidMoves: (board: any, player: number) => any;
  stringRepresentation: (board: any) => string;
}

// Neural Network Interface
export interface NeuralNetType {
  train: (examples: any[]) => Promise<void>;
  predict: (board: any) => { Ps: number[], v: number };
}

// Player Interface
export interface Player {
  play: (board: any) => number;
  isHuman?: boolean;
}

// Args Interface for MCTS
export interface MCTSArgs {
  numMCTSSims: number;
  cpuct: number;
}

// Game Result Interface
export interface GameResult {
  oneWon: number;
  twoWon: number;
  draws: number;
}

// Training Example Interface
export interface TrainExample {
  input_boards: any;
  target_pis: number[];
  target_vs: number;
}

// Neural Network Args Interface
export interface NNetArgs {
  lr: number;
  dropout: number;
  epochs: number;
  batch_size: number;
  cuda: boolean;
  num_channels: number;
}

// Coach Args Interface
export interface CoachArgs {
  numIters: number;
  numEps: number;
  tempThreshold: number;
  updateThreshold: number;
  maxlenOfQueue: number;
  numMCTSSims: number;
  arenaCompare: number;
  cpuct: number;
  checkpoint: string;
  load_model: boolean;
  load_folder_file: { folder: string, fileName: string };
  numItersForTrainExamplesHistory: number;
}