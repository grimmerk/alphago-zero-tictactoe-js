import * as tf from '@tensorflow/tfjs';
import { Game, NNetArgs } from '../../types/interfaces';

// Define type for tf.LayersModel 
type LayersModel = any;

export default class TicTacToeNNet {
  board_x: number;
  board_y: number;
  args: NNetArgs;
  action_size: number;
  model: LayersModel;
  dropout: number;

  // tf.setBackend('cpu');
  // console.log('tf.getBackend:', tf.getBackend());
  constructor(game: Game, args: NNetArgs) {
    console.log('TicTacToeNNet constructor');

    const { a, b } = game.getBoardSize();
    this.board_x = a;
    this.board_y = b;
    this.args = args;
    this.action_size = game.getActionSize();
    this.dropout = args.dropout;

    // BatchNormalization:
    // keras: https://keras-cn.readthedocs.io/en/latest/layers/normalization_layer/
    // tensorflow.js: https://js.tensorflow.org/api/0.9.0/#layers.batchNormalization

    const normalize1 = () => tf.layers.batchNormalization({ axis: 3 });
    const normalize2 = () => tf.layers.batchNormalization({ axis: 1 });
    const relu = () => tf.layers.activation({ activation: 'relu' });
    const conv2d_padding = () => tf.layers.conv2d({
      // inputShape: [this.board_x, this.board_y, 1],
      kernelSize: 3, // 3x3 filter
      filters: args.num_channels, // 512??
      padding: 'same',
      // strides: 1, // ?
      // activation: 'relu',
      // kernelInitializer: 'varianceScaling', // ?
    });
    const conv2d_valid = () => tf.layers.conv2d({
      kernelSize: 3,
      filters: args.num_channels,
      padding: 'valid',
    });
    const dropout = () => tf.layers.dropout({ rate: this.dropout });

    const input = tf.input({ shape: [this.board_x, this.board_y, 1] });
    // @ts-ignore: TensorFlow.js complex operation with types that TypeScript can't easily verify
    const h_conv1 = normalize1().apply(normalize1().apply(conv2d_padding().apply(input)));
    // @ts-ignore: TensorFlow.js complex operation with types that TypeScript can't easily verify
    const h_conv2 = normalize1().apply(normalize1().apply(conv2d_padding().apply(h_conv1)));
    // @ts-ignore: TensorFlow.js complex operation with types that TypeScript can't easily verify
    const h_conv3 = normalize1().apply(normalize1().apply(conv2d_padding().apply(h_conv2)));
    // @ts-ignore: TensorFlow.js complex operation with types that TypeScript can't easily verify
    const h_conv4 = normalize1().apply(normalize1().apply(conv2d_valid().apply(h_conv3)));

    const flattenLayer = tf.layers.flatten();
    // @ts-ignore: TensorFlow.js complex operation with types that TypeScript can't easily verify
    const middle1 = flattenLayer.apply(h_conv4);

    // if (!middle1) {
    //   throw new Error("Model construction failed at flatten layer");
    // }

    // @ts-ignore: TensorFlow.js complex operation with types that TypeScript can't easily verify
    const denseLayer1 = tf.layers.dense({ units: 1024 }).apply(middle1);
    // if (!denseLayer1) {
    //   throw new Error("Model construction failed at dense layer 1");
    // }
    
    // @ts-ignore: TensorFlow.js complex operation with types that TypeScript can't easily verify
    const middle2 = dropout().apply(relu().apply(normalize2().apply(denseLayer1)));
    // if (!middle2) {
    //   throw new Error("Model construction failed at middle2");
    // }
    
    // @ts-ignore: TensorFlow.js complex operation with types that TypeScript can't easily verify
    const denseLayer2 = tf.layers.dense({ units: 512 }).apply(middle2);
    // if (!denseLayer2) {
    //   throw new Error("Model construction failed at dense layer 2");
    // }
    
    // @ts-ignore: TensorFlow.js complex operation with types that TypeScript can't easily verify
    const middle3 = dropout().apply(relu().apply(normalize2().apply(denseLayer2)));
    // if (!middle3) {
    //   throw new Error("Model construction failed at middle3");
    // }

    const piLayer = tf.layers.dense({ units: this.action_size, activation: 'softmax' });
    // @ts-ignore: TensorFlow.js complex operation with types that TypeScript can't easily verify
    const output1 = piLayer.apply(middle3);
    // if (!output1) {
    //   throw new Error("Model construction failed at output1");
    // }
    
    const vLayer = tf.layers.dense({ units: 1, activation: 'tanh' });
    // @ts-ignore: TensorFlow.js complex operation with types that TypeScript can't easily verify
    const output2 = vLayer.apply(middle3);
    // if (!output2) {
    //   throw new Error("Model construction failed at output2");
    // }

    // Create the model based on the inputs.
    // @ts-ignore: TensorFlow.js model construction with types that TypeScript can't easily verify
    this.model = tf.model({ inputs: input, outputs: [output1, output2] });
    const optimizer = tf.train.adam(args.lr); // irir default//params.learningRate);
    this.model.compile({
      optimizer,
      loss: ['categoricalCrossentropy', 'meanSquaredError'],
      // metrics: ['accuracy'], // <- optional
    });
    console.log('model:', this.model);
    console.log(JSON.stringify(this.model));
  }
}

export function test(): void {
  console.log('t1');
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 1, inputShape: [1] }));

  // Prepare the model for training: Specify the loss and the optimizer.
  model.compile({ loss: 'meanSquaredError', optimizer: 'sgd' });

  // Generate some synthetic data for training.
  // @ts-ignore: typescript doesn't understand tensor dimensions properly
  const xs = tf.tensor2d([1, 2, 3, 4], [4, 1]);
  // @ts-ignore: typescript doesn't understand tensor dimensions properly
  const ys = tf.tensor2d([1, 3, 5, 7], [4, 1]);

  // Train the model using the data.
  model.fit(xs, ys).then(() => {
    // Use the model to do inference on a data point the model hasn't seen before:
    // Open the browser devtools to see the output
    // @ts-ignore: typescript doesn't understand tensor methods properly
    model.predict(tf.tensor2d([5], [1, 1])).print();
    console.log('t3');
  });
  console.log('t2');
}