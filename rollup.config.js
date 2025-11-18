import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import { terser } from 'rollup-plugin-terser';

const { UGLIFY } = process.env;

export default {
  input: 'es/index.js',
  output: {
    name: 'StandardFonts',
    format: 'umd',
  },
  plugins: [
    json(),
    nodeResolve({
      jsnext: true,
    }),
    commonjs(),
    UGLIFY === 'true' && terser(),
  ],
};
