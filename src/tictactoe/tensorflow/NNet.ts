import { NeuralNet } from '../../NeuralNet';
import * as tf from '@tensorflow/tfjs';

import TicTacToeNNet from './TicTacToeNNet';

const args = {
  lr: 0.001,
  dropout: 0.3,
  epochs: 8, // 10,
  batch_size: 64,
  cuda: false,
  num_channels: 512,
};

export class NNetWrapper extends NeuralNet {
  constructor(game) {
    super();
    this.nnet = new TicTacToeNNet(game, args);
    const { a, b } = game.getBoardSize();
    this.board_x = a;
    this.board_y = b;
    // return { a: this.n, b: this.n };
    this.action_size = game.getActionSize();

    console.log('NNetWrapper constructer');
  }

  async train(examples) {
    console.log('train -1. epoch size:', args.batch_size);
    console.log('examples:', examples);
    const total = examples.length;

    const inputData = [];
    const pisData = [];
    const vsData = [];

    for (let i = 0; i < total; i++) {
      const example = examples[i];
      const { input_boards, target_pis, target_vs } = example;
      const input_boards2 = input_boards.tolist(); // 3x3 numjs(numpy ndarray like)
      inputData.push(input_boards2);
      pisData.push(target_pis);
      vsData.push(target_vs);
      // console.log('pisData item size:', target_pis.length);
    }

    let xTrain = tf.tensor3d(inputData, [total, 3, 3]);
    xTrain = xTrain.reshape([total, 3, 3, 1]);

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

    // try {
    const history = await this.nnet.model.fit(xTrain, [yTrain1, yTrain2], {
      shuffle: true,
      batchSize: args.batch_size,
      epochs: args.epochs, // params.epochs, //iris, default 40, use epoch as batch
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log('onEpochEnd');
        },
      },
    });
    // } catch (err) {
    //   console.log('train error:', err);
    // }


    console.log('training-2: after fit');
  }

  async loadPretrained(url) {
    console.log('load model start');

    // 'https://foo.bar/tfjs_artifacts/model.json'
    this.preTrainedModel = await tf.loadModel(url);
    console.log('load model ok');
  }

  predict(boardNdArray) {
    // console.log('prediction');

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

        // console.log('use pretrained model to predict');
        prediction = this.preTrainedModel.predict(input);
      } else {
        // shape: [1 set, x,y, channel(current it is dummy, only 1)]
        // use const x = tf.tensor4d([input], [1, 3, 3, 1]) or reshape
        input = input.reshape([1, 3, 3, 1]);
        prediction = this.nnet.model.predict(input);
      }

      const data1 = prediction[0].dataSync();
      // console.log('getPrediction data1-typed array:', data1);

      const data12 = Array.from(data1);
      // console.log('getPrediction data1-array:', data12);

      const data2 = Array.from(prediction[1].dataSync());

      const Ps = data12; // e.g. [0,1,2,3,0,1,2,3,0,1,2,3];
      const v = data2[0]; // e.g.[0.1];

      // console.log('tensorflow predicts Ps:', Ps, '. v:', v);
      prediction[0].dispose();
      prediction[1].dispose();
      input.dispose();
      return { Ps, v };
    } catch (err) {
      console.log('prediction error:', err);
    }
  }

  save_checkpoint(folder = 'checkpoint', filename = 'checkpoint.pth.tar') {
  }

  load_checkpoint(folder = 'checkpoint', filename = 'checkpoint.pth.tar') {
  }
}
