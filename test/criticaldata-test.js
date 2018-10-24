'use strict';

const assert = require('./util/assert');
const CriticalData = require('../lib/script/criticaldata');

describe('CriticalData', () => {
  describe('getBmmRequest', () => {
    it('should detect bmm request (4 bytes)', () => {
      const hex = '00bf00010100';
      const criticalData = CriticalData.fromRaw(Buffer.from(hex, 'hex'));
      const bmmRequest = criticalData.getBmmRequest();
      assert.equal(bmmRequest.sidechainNumber, 1);
      assert.equal(bmmRequest.prevBlockRef, 1);
    });
  });
});
