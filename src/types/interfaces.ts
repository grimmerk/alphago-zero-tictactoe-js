import { NdArray } from "@d4c/numjs";

// Game Interface, implemented by TicTacToeGame
// TODO: move to class Game and make it abstract?
// export interface Game {
//   getInitBoardNdArray: () => NdArray;
//   getCanonicalForm: (board: NdArray, player: number) => NdArray;
//   getNextState: (board: NdArray, player: number, action: number) => { boardNdArray: NdArray, curPlayer: number };
//   getGameEnded: (board: NdArray, player: number) => number;
//   getSymmetries: (board: NdArray, pi: number[]) => Array<{ b: any, p: number[] }>;
//   getBoardSize: () => { a: number, b: number };
//   getActionSize: () => number;
//   getValidMoves: (board: NdArray, player: number) => NdArray;
//   stringRepresentation: (board: NdArray) => string;
// }

export type LayersModel = any;

// Neural Network Interface
export interface NeuralNetType {
  train: (examples: Array<{input_boards: NdArray, target_pis: number[], target_vs:number}>) => Promise<void>;
  predict: (board: NdArray) => { Ps: number[], v: number };
}

// Player Interface
export interface Player {
  play: (board: NdArray) => number; 
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
  input_boards: NdArray;
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