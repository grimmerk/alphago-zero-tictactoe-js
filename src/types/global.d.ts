// Global declaration for numjs
interface NdArray {
  shape: number[];
  tolist(): any[];
  get(index: number): number;
}

interface NumJSStatic {
  array(arr: any[]): NdArray;
  multiply(a: NdArray, b: number | NdArray): NdArray;
  add(a: NdArray, b: NdArray): NdArray;
  divide(a: NdArray, b: number | NdArray): NdArray;
  sum(arr: NdArray): number;
  reshape(arr: any[] | NdArray, shape: number[]): NdArray;
  flatten(arr: NdArray): NdArray;
  rot90(arr: NdArray, k?: number): NdArray;
  flip(arr: NdArray, axis?: number): NdArray;
}

declare global {
  var nj: NumJSStatic;
}

export {}; // Ensure this file is treated as a module