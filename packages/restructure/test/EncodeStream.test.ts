import { expect } from 'chai';
import { EncodeStream } from '../src';
import { expectStream } from './helpers';

describe('EncodeStream', () => {
  it('should write a buffer', (done) => {
    const stream = new EncodeStream();
    expectStream(stream, done, (buf) => {
      expect(buf).to.deep.equal(Buffer.from([1, 2, 3]));
    });

    stream.writeBuffer(Buffer.from([1, 2, 3]));
    stream.end();
  });

  it('should writeUInt16BE', (done) => {
    const stream = new EncodeStream();
    expectStream(stream, done, (buf) => {
      expect(buf).to.deep.equal(Buffer.from([0xab, 0xcd]));
    });

    stream.writeUInt16BE(0xabcd);
    stream.end();
  });

  it('should writeUInt16LE', (done) => {
    const stream = new EncodeStream();
    expectStream(stream, done, (buf) => {
      expect(buf).to.deep.equal(Buffer.from([0xab, 0xcd]));
    });

    stream.writeUInt16LE(0xcdab);
    stream.end();
  });

  it('should writeUInt24BE', (done) => {
    const stream = new EncodeStream();
    expectStream(stream, done, (buf) => {
      expect(buf).to.deep.equal(Buffer.from([0xab, 0xcd, 0xef]));
    });

    stream.writeUInt24BE(0xabcdef);
    stream.end();
  });

  it('should writeUInt24LE', (done) => {
    const stream = new EncodeStream();
    expectStream(stream, done, (buf) => {
      expect(buf).to.deep.equal(Buffer.from([0xef, 0xcd, 0xab]));
    });

    stream.writeUInt24LE(0xabcdef);
    stream.end();
  });

  it('should writeInt24BE', (done) => {
    const stream = new EncodeStream();
    expectStream(stream, done, (buf) => {
      expect(buf).to.deep.equal(Buffer.from([0xff, 0xab, 0x24, 0xab, 0xcd, 0xef]));
    });

    stream.writeInt24BE(-21724);
    stream.writeInt24BE(0xabcdef);
    stream.end();
  });

  it('should writeInt24LE', (done) => {
    const stream = new EncodeStream();
    expectStream(stream, done, (buf) => {
      expect(buf).to.deep.equal(Buffer.from([0x24, 0xab, 0xff, 0xef, 0xcd, 0xab]));
    });

    stream.writeInt24LE(-21724);
    stream.writeInt24LE(0xabcdef);
    stream.end();
  });

  it('should fill', (done) => {
    const stream = new EncodeStream();
    expectStream(stream, done, (buf) => {
      expect(buf).to.deep.equal(Buffer.from([10, 10, 10, 10, 10]));
    });

    stream.fill(10, 5);
    stream.end();
  });

  describe('writeString', () => {
    it('should encode ascii by default', (done) => {
      const stream = new EncodeStream();
      const expected = Buffer.from('some text', 'ascii');
      expectStream(stream, done, (buf) => {
        expect(buf).to.deep.equal(expected);
      });

      stream.writeString('some text');
      stream.end();
    });

    it('should encode ascii', (done) => {
      const stream = new EncodeStream();
      const expected = Buffer.from('some text', 'ascii');
      expectStream(stream, done, (buf) => {
        expect(buf).to.deep.equal(expected);
      });

      stream.writeString('some text', 'ascii');
      stream.end();
    });

    it('should encode utf8', (done) => {
      const stream = new EncodeStream();
      const expected = Buffer.from('unicode! 👍', 'utf8');
      expectStream(stream, done, (buf) => {
        expect(buf).to.deep.equal(expected);
      });

      stream.writeString('unicode! 👍', 'utf8');
      stream.end();
    });

    it('should encode utf16le', (done) => {
      const stream = new EncodeStream();
      const expected = Buffer.from('unicode! 👍', 'utf16le');
      expectStream(stream, done, (buf) => {
        expect(buf).to.deep.equal(expected);
      });

      stream.writeString('unicode! 👍', 'utf16le');
      stream.end();
    });

    it('should encode ucs2', (done) => {
      const stream = new EncodeStream();
      const expected = Buffer.from('unicode! 👍', 'ucs2');
      expectStream(stream, done, (buf) => {
        expect(buf).to.deep.equal(expected);
      });

      stream.writeString('unicode! 👍', 'ucs2');
      stream.end();
    });

    it('should encode utf16be', (done) => {
      const stream = new EncodeStream();
      const expected = Buffer.from('unicode! 👍', 'utf16le');
      for (let i = 0; i < expected.length - 1; i += 2) {
        const byte = expected[i];
        expected[i] = expected[i + 1];
        expected[i + 1] = byte;
      }
      expectStream(stream, done, (buf) => {
        expect(buf).to.deep.equal(expected);
      });

      stream.writeString('unicode! 👍', 'utf16be');
      stream.end();
    });

    it('should encode macroman', (done) => {
      const stream = new EncodeStream();
      const expected = Buffer.from([0x8a, 0x63, 0x63, 0x65, 0x6e, 0x74, 0x65, 0x64, 0x20, 0x63, 0x68, 0x87, 0x72, 0x61, 0x63, 0x74, 0x65, 0x72, 0x73]);
      expectStream(stream, done, (buf) => {
        expect(buf).to.deep.equal(expected);
      });

      stream.writeString('äccented cháracters', 'mac');
      stream.end();
    });
  });
});
