import { NeuralNet } from '../../NeuralNet';
import * as tf from '@tensorflow/tfjs';

import TicTacToeNNet from './TicTacToeNNet';
import { Game, TrainExample, NNetArgs } from '../../types/interfaces';

// Define type for tf.LayersModel 
type LayersModel = any;

const args: NNetArgs = {
  lr: 0.001,
  dropout: 0.3,
  epochs: 8, // 10,
  batch_size: 64,
  cuda: false,
  num_channels: 512,
};

export class NNetWrapper extends NeuralNet {
  nnet: TicTacToeNNet;
  board_x: number;
  board_y: number;
  action_size: number;
  preTrainedModel: LayersModel | null = null;

  constructor(game: Game) {
    super();
    this.nnet = new TicTacToeNNet(game, args);
    const { a, b } = game.getBoardSize();
    this.board_x = a;
    this.board_y = b;
    this.action_size = game.getActionSize();

    console.log('NNetWrapper constructer');
  }

  async train(examples: TrainExample[]): Promise<void> {
    console.log('train -1. epoch size:', args.batch_size);
    console.log('examples:', examples);
    const total = examples.length;

    const inputData: number[][][] = [];
    const pisData: number[][] = [];
    const vsData: number[][] = [];

    for (let i = 0; i < total; i++) {
      const example = examples[i];
      const { input_boards, target_pis, target_vs } = example;
      const input_boards2 = input_boards.tolist(); // 3x3 numjs(numpy ndarray like)
      inputData.push(input_boards2);
      pisData.push(target_pis);
      vsData.push([target_vs]);
    }

    // @ts-ignore: tensor dimensions are correct but TypeScript can't verify
    let xTrain = tf.tensor3d(inputData, [total, 3, 3]);
    // @ts-ignore: tensor reshape dimensions are correct but TypeScript can't verify
    xTrain = xTrain.reshape([total, 3, 3, 1]);

    // @ts-ignore: tensor dimensions are correct but TypeScript can't verify
    const yTrain1 = tf.tensor2d(pisData); // , [total, 10]);
    const yTrain2 = tf.tensor2d(vsData, [total, 1]); // 784
    console.log('start train');

    // python version:
    // """
    // examples: list of examples, each example is of form (board, pi, v)
    // """
    // input_boards(3,3 array), target_pis(0~9, pure array[0.1, ....]), target_vs (-1<= <=1) = list(zip(*examples))
    // input_boards = np.asarray(input_boards) ->ndarray
    // target_pis = np.asarray(target_pis)
    // target_vs = np.asarray(target_vs)
    // self.nnet.model.fit(x = input_boards, y = [target_pis, target_vs],
    // batch_size = args.batch_size, epochs = args.epochs)

    const history = await this.nnet.model.fit(xTrain, [yTrain1, yTrain2], {
      shuffle: true,
      batchSize: args.batch_size,
      epochs: args.epochs, // params.epochs, //iris, default 40, use epoch as batch
      callbacks: {
        onEpochEnd: (epoch: number, logs: any) => {
          console.log('onEpochEnd');
        },
      },
    });

    console.log('training-2: after fit');
  }

  async loadPretrained(url: string): Promise<void> {
    console.log('load model start');

    // 'https://foo.bar/tfjs_artifacts/model.json'
    // @ts-ignore: TensorFlow.js API typing issue
    this.preTrainedModel = await tf.loadModel(url);
    console.log('load model ok');
  }

  predict(boardNdArray: any): { Ps: number[], v: number } {
    try {
      // # preparing input
      let input = boardNdArray.tolist();

      // TODO remove hard code [1,3,3]
      input = tf.tensor3d([input], [1, 3, 3]);

      // # run
      let prediction;
      if (this.preTrainedModel) {
        // NOTE: This is to test loading Python Keras preTrainedModel which uses
        // [1,3,3]->input->reshape->cnn
        // board = board[np.newaxis, :, :] [3,3]->[1,3,3]
        // pi, v = this.nnet.model.predict(board)
        // return pi[0], v[0]

        prediction = this.preTrainedModel.predict(input);
      } else {
        // shape: [1 set, x,y, channel(current it is dummy, only 1)]
        // use const x = tf.tensor4d([input], [1, 3, 3, 1]) or reshape
        input = input.reshape([1, 3, 3, 1]);
        prediction = this.nnet.model.predict(input);
      }

      if (!Array.isArray(prediction)) {
        throw new Error("Prediction should be an array");
      }

      const data1 = prediction[0].dataSync();
      // @ts-ignore: dataSync returns a TypedArray that we convert to standard array
      const data12: number[] = Array.from(data1);
      // @ts-ignore: dataSync returns a TypedArray that we convert to standard array
      const data2: number[] = Array.from(prediction[1].dataSync());

      const Ps = data12; // e.g. [0,1,2,3,0,1,2,3,0,1,2,3];
      const v = data2[0]; // e.g.[0.1];

      // console.log('tensorflow predicts Ps:', Ps, '. v:', v);
      prediction[0].dispose();
      prediction[1].dispose();
      input.dispose();
      return { Ps, v };
    } catch (err) {
      console.log('prediction error:', err);
      // return { Ps: [], v: 0 }; // Default return in case of error
      /** TODO: re-throw this error */
    }
  }

  save_checkpoint(folder: string = 'checkpoint', filename: string = 'checkpoint.pth.tar'): void {
    // Implementation not provided in original
  }

  load_checkpoint(folder: string = 'checkpoint', filename: string = 'checkpoint.pth.tar'): void {
    // Implementation not provided in original
  }
}