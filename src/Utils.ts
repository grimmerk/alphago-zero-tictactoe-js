/**
 * Returns the index of the maximum value in the list
 * @param  {number[]} list - Array of numbers
 * @return {number} Index of the maximum value
 */
function argmax(list: number[]): number {
  const len = list.length;
  let maxIndex = -1;
  let maxValue: number | null = null;
  
  for (let i = 0; i < len; i++) {
    const value = list[i];
    if (i === 0) {
      maxIndex = 0;
      maxValue = value;
    } else if (value > maxValue!) {
      maxValue = value;
      maxIndex = i;
    }
  }
  
  if (maxIndex === -1) {
    throw new Error('bad prop-list to search max');
  }
  
  return maxIndex;
}

/**
 * Implementation similar to numpy.random.choice
 * @param {number[]} p - The probability vector
 * @param {number[] | null} values - (optional) value array
 * @return {number} Chosen value
 */
function randomChoice(p: number[], values: number[] | null = null): number {
  const a = p.length;
  let results: number[];
  
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