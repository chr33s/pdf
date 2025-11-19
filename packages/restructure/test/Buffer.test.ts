import { expect } from 'chai';
import { Buffer as BufferT, DecodeStream, EncodeStream, uint8 } from '../src';
import { expectStream } from './helpers';

describe('Buffer', () => {
  describe('decode', () => {
    it('should decode', () => {
      const stream = new DecodeStream(Buffer.from([0xab, 0xff, 0x1f, 0xb6]));
      const buf = new BufferT(2);
      expect(buf.decode(stream)).to.deep.equal(Buffer.from([0xab, 0xff]));
      expect(buf.decode(stream)).to.deep.equal(Buffer.from([0x1f, 0xb6]));
    });

    it('should decode with parent key length', () => {
      const stream = new DecodeStream(Buffer.from([0xab, 0xff, 0x1f, 0xb6]));
      const buf = new BufferT('len');
      expect(buf.decode(stream, { len: 3 })).to.deep.equal(Buffer.from([0xab, 0xff, 0x1f]));
      expect(buf.decode(stream, { len: 1 })).to.deep.equal(Buffer.from([0xb6]));
    });
  });

  describe('size', () => {
    it('should return size', () => {
      const buf = new BufferT(2);
      expect(buf.size(Buffer.from([0xab, 0xff]))).to.equal(2);
    });

    it('should use defined length if no value given', () => {
      const array = new BufferT(10);
      expect(array.size()).to.equal(10);
    });
  });

  describe('encode', () => {
    it('should encode', (done) => {
      const stream = new EncodeStream();
      expectStream(stream, done, (buf) => {
        expect(buf).to.deep.equal(Buffer.from([0xab, 0xff, 0x1f, 0xb6]));
      });

      const buf = new BufferT(2);
      buf.encode(stream, Buffer.from([0xab, 0xff]));
      buf.encode(stream, Buffer.from([0x1f, 0xb6]));
      stream.end();
    });

    it('should encode length before buffer', (done) => {
      const stream = new EncodeStream();
      expectStream(stream, done, (buf) => {
        expect(buf).to.deep.equal(Buffer.from([2, 0xab, 0xff]));
      });

      const buf = new BufferT(uint8);
      buf.encode(stream, Buffer.from([0xab, 0xff]));
      stream.end();
    });
  });
});
