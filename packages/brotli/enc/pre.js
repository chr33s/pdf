var Module = {};
import decode from '../decompress';
import base64 from 'base64-js';
Module['readBinary'] = function() {
  var src = base64['toByteArray'](require('../build/mem.js'));
  return decode(src);
};
