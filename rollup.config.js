import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import { terser } from 'rollup-plugin-terser';

const { UGLIFY } = process.env;

export default {
  input: 'src/index.js',
  output: {
    name: 'UnicodeProperties',
    format: 'umd',
    exports: 'named',
  },
  plugins: [
    nodeResolve({
      jsnext: true,
    }),
    commonjs({
      namedExports: {
        'node_modules/unicode-trie/index.js': ['default'],
      },
    }),
    json(),
    babel({
      babelrc: false,
      presets: ['@babel/preset-env'],
      runtimeHelpers: true
    }),
    UGLIFY === 'true' && terser(),
  ],
};
