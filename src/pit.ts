import Arena from './Arena';
import MCTS from './MCTS';
import Utils from './Utils';
import { getTrainedNN } from './main';

import { TicTacToeGame, display } from './tictactoe/TicTacToeGame';

import { NNetWrapper as NNet } from './tictactoe/tensorflow/NNet';
// from tictactoe.keras.NNet import NNetWrapper

import * as players from './tictactoe/TicTacToePlayers';
// from tictactoe.TicTacToePlayers import *

// TicTacToeGame reference
// seems that it does not need to be reused
// const humanGame = null;

let preTrainedModel = null;
let humanArena = null;

export async function downloadPretrained() {
  if (!preTrainedModel) {
    // if (!humanGame) {
    const humanGame = new TicTacToeGame();
    // }
    preTrainedModel = new NNet(humanGame);
    // firstPlayr = new players.RandomPlayer(g);
    await preTrainedModel.loadPretrained('https://grimmer.io/alphago-tictactoe-keras-trained/model.json');
  }
}

export function humanMove(action) {
  if (humanArena) {
    return humanArena.humanStep(action);
  }

  return -1;
}

/**
 * play a game or games
 * mode:
 *  0: two rp
 *  1: self-trained vs rp
 *  2: 1 pretrained vs rp
 *  3: 1 pretrained vs human
 *  4: self-treained vs human
 */
export default function play(mode, aiFirst) {
  const g = new TicTacToeGame();
  const args1 = { numMCTSSims: 50, cpuct: 1.0 };
  let n1;
  let mcts1 = null;
  let firstPlayr = null;

  if (mode === 1 || mode === 4) {
    n1 = getTrainedNN();
    if (!n1) {
      console.log('no trainedModel, return');
      return;
    }
  } else if (mode === 2 || mode === 3) {
    n1 = preTrainedModel;
    if (!n1) {
      console.log('no preTrainedModel, return');
      return;
    }
    console.log('load pretraind to play');
  } else {
    console.log('invalid mode, return');
    return;
  }

  if (mode) {
    mcts1 = new MCTS(g, n1, args1);

    const n1p = (x) => {
      const list = mcts1.getActionProb(x, 0);
      return Utils.argmax(list);
    };
    firstPlayr = { play: n1p };
  } else {
    firstPlayr = new players.RandomPlayer(g);
  }

  if (mode === 3 || mode === 4) {
    const hp = new players.HumanTicTacToePlayer(g);// .play
    if (aiFirst) {
      humanArena = new Arena(firstPlayr, hp, g, display);
    } else {
      humanArena = new Arena(hp, firstPlayr, g, display);
    }
    const action = humanArena.playNewGameWithHuman();

    return action;
  }


  // const rp = new players.RandomPlayer(g);// .play;
  const rp2 = new players.RandomPlayer(g);// .play;

  const arena = new Arena(firstPlayr, rp2, g, display);
  console.log(arena.playGames(25, false));
  console.log('finish');
}
