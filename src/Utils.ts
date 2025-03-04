/**
 * [argmax description]
 * @param  {[type]} list [description]
 * @return {[type]}      [description]
 */
function argmax(list) {
  // const list = mcts1.getActionProb(x, 0);
  //

  const len = list.length;
  let maxIndex = -1;
  let maxValue = null;
  for (let i = 0; i < len; i++) {
    const value = list[i];
    if (i === 0) {
      maxIndex = 0;
      maxValue = value;
    } else if (value > maxValue) {
      maxValue = value;
      maxIndex = i;
    }
  }
  if (maxIndex === -1) {
    throw 'bad prop-list to search max';
  }
  return maxIndex;
}

// from https://stackoverflow.com/a/28933315
/** @description numpy.random.choice fork
 * @param {number} p The probability vector
 * @param {number} values (optional) value array
 * @return {number} Chosen value
 */
function randomChoice(p, values = null) {
  const a = p.length;
  let results = null;
  if (!values || values.length !== p.length) {
    results = [];
    for (let i = 0; i < a; i++) {
      results.push(i);
    }
  } else {
    results = values;
  }

  const num = Math.random();
  let s = 0;
  const lastIndex = p.length - 1;

  for (let i = 0; i < lastIndex; ++i) {
    s += p[i];
    if (num < s) {
      return results[i];
    }
  }

  return results[lastIndex];
}

const Utils = {
  argmax,
  randomChoice,
};
export default Utils;
