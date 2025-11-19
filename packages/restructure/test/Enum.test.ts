import { expect } from 'chai';
import { Enum, uint8, DecodeStream, EncodeStream } from '../src';
import { expectStream } from './helpers';

describe('Enum', () => {
  const e = new Enum(uint8, ['foo', 'bar', 'baz']);

  it('should have the right size', () => {
    expect(e.size()).to.equal(1);
  });

  it('should decode', () => {
    const stream = new DecodeStream(Buffer.from([1, 2, 0]));
    expect(e.decode(stream)).to.equal('bar');
    expect(e.decode(stream)).to.equal('baz');
    expect(e.decode(stream)).to.equal('foo');
  });

  it('should encode', (done) => {
    const stream = new EncodeStream();
    expectStream(stream, done, (buf) => {
      expect(buf).to.deep.equal(Buffer.from([1, 2, 0]));
    });

    e.encode(stream, 'bar');
    e.encode(stream, 'baz');
    e.encode(stream, 'foo');
    stream.end();
  });

  it('should throw on unknown option', () => {
    const stream = new EncodeStream();
    expect(() => e.encode(stream, 'unknown')).to.throw(/unknown option/i);
  });
});
