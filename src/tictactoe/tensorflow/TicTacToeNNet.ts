import * as tf from '@tensorflow/tfjs';

export default class TicTacToeNNet {
  constructor(game, args) {
    console.log('TicTacToeNNet constructer');

    // tf.setBackend('cpu');
    // console.log('tf.getBackend:', tf.getBackend());

    const { a, b } = game.getBoardSize();
    this.board_x = a;
    this.board_y = b;
    this.args = args;
    this.action_size = game.getActionSize();

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
    const h_conv1 = normalize1().apply(normalize1().apply(conv2d_padding().apply(input)));
    const h_conv2 = normalize1().apply(normalize1().apply(conv2d_padding().apply(h_conv1)));
    const h_conv3 = normalize1().apply(normalize1().apply(conv2d_padding().apply(h_conv2)));
    const h_conv4 = normalize1().apply(normalize1().apply(conv2d_valid().apply(h_conv3)));

    const flattenLayer = tf.layers.flatten();
    const middle1 = flattenLayer.apply(h_conv4);

    const denseLayer1 = tf.layers.dense({ units: 1024 }).apply(middle1);
    const middle2 = dropout().apply(relu().apply(normalize2().apply(denseLayer1)));
    const denseLayer2 = tf.layers.dense({ units: 512 }).apply(middle2);
    const middle3 = dropout().apply(relu().apply(normalize2().apply(denseLayer2)));

    const piLayer = tf.layers.dense({ units: this.action_size, activation: 'softmax' });
    const output1 = piLayer.apply(middle3);
    const vLayer = tf.layers.dense({ units: 1, activation: 'tanh' });
    const output2 = vLayer.apply(middle3);

    // Create the model based on the inputs.
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

export function test() {
  console.log('t1');
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 1, inputShape: [1] }));

  // Prepare the model for training: Specify the loss and the optimizer.
  model.compile({ loss: 'meanSquaredError', optimizer: 'sgd' });

  // Generate some synthetic data for training.
  const xs = tf.tensor2d([1, 2, 3, 4], [4, 1]);
  const ys = tf.tensor2d([1, 3, 5, 7], [4, 1]);

  // Train the model using the data.
  model.fit(xs, ys).then(() => {
    // Use the model to do inference on a data point the model hasn't seen before:
    // Open the browser devtools to see the output
    model.predict(tf.tensor2d([5], [1, 1])).print();
    console.log('t3');
  });
  console.log('t2');
}
