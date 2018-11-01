'use strict';

const assert = require('bsert');

class CriticalData {
  constructor() {
    this.bytes = null;
    this.hashCritical = null;
  }

  static fromReader(br) {
    return new this().fromReader(br);
  }

  fromReader(br) {
    const length = br.readU8();
    this.bytes = br.readBytes(length);
    this.hashCritical = br.readBytes(32);
    return this;
  }

  getSize() {
    return 1 + this.bytes.length + 32;
  }

  static fromRaw(bytes, hashCritical) {
    assert.equal(hashCritical.length, 32);
    assert(bytes.length >= 4);

    return Object.assign(new CriticalData(), { bytes, hashCritical });
  }

  getBmmRequest() {
    const { bytes } = this;

    if (!bytes) {
      return null;
    }

    if (bytes.length < 4) {
      return null;
    }

    if (bytes[0] !== 0x00 || bytes[1] !== 0xbf || bytes[2] !== 0x00) {
      return null;
    }

    if (bytes.length === 4) {
      return {
        sidechainNumber: 0,
        prevBlockRef: bytes[3]
      };
    }

    return {
      sidechainNumber: bytes[3],
      prevBlockRef: bytes[4]
    };
  }

  toWriter(bw) {
    bw.writeU8(this.bytes.length);
    bw.writeBytes(this.bytes);
    bw.writeBytes(this.hashCritical);
    return bw;
  }
}

module.exports = CriticalData;
