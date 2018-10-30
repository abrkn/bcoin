/* eslint-env mocha */
/* eslint prefer-arrow-callback: "off" */

'use strict';

const assert = require('./util/assert');
const Script = require('../lib/script/script');
const Witness = require('../lib/script/witness');
const Stack = require('../lib/script/stack');
const Opcode = require('../lib/script/opcode');
const TX = require('../lib/primitives/tx');
const consensus = require('../lib/protocol/consensus');
const {fromFloat} = require('../lib/utils/fixed');

const scripts = require('./data/script-tests.json');

function isSuccess(stack) {
  if (stack.length === 0)
    return false;

  if (!stack.getBool(-1))
    return false;

  return true;
}

function parseScriptTest(data) {
  const witArr = Array.isArray(data[0]) ? data.shift() : [];
  const inpHex = data[0];
  const outHex = data[1];
  const names = data[2] || 'NONE';
  const expected = data[3];
  let comments = data[4];

  if (!comments)
    comments = outHex.slice(0, 60);

  comments += ` (${expected})`;

  let value = 0;
  if (witArr.length > 0)
    value = fromFloat(witArr.pop(), 8);

  const witness = Witness.fromString(witArr);
  const input = Script.fromString(inpHex);
  const output = Script.fromString(outHex);

  let flags = 0;
  for (const name of names.split(',')) {
    const flag = Script.flags[`VERIFY_${name}`];

    if (flag == null)
      throw new Error(`Unknown flag: ${name}.`);

    flags |= flag;
  }

  return {
    witness: witness,
    input: input,
    output: output,
    value: value,
    flags: flags,
    expected: expected,
    comments: comments
  };
}

describe('Script', function() {
  it('isCriticalHashCommit', () => {
    const hex = '6a24d16173684273f4fda0dee0a38edd067d5c7deea527e627e8b59f98595cee1545fcc3824300bf00010100';
    const decoded = Script.fromRaw(hex, 'hex');
    assert(decoded.isCriticalHashCommit());
  });

  it('getCriticalData', () => {
    const hex = '6a24d16173684273f4fda0dee0a38edd067d5c7deea527e627e8b59f98595cee1545fcc3824300bf00010100';
    const decoded = Script.fromRaw(hex, 'hex');
    const criticalData = decoded.getCriticalData();
    // console.log(criticalData);
    // assert();
  });

  it('Critical no its not', () => {
    return;
    const hex = '030000003f000102ba6b3d80d2b445ca39fd3bc86e91bae2c1aa6541de4abc0a7b53237cc36c44c200000000171600141e893c049ed1be8f77ce11571dd0b94d26dabf5cfeffffffba6b3d80d2b445ca39fd3bc86e91bae2c1aa6541de4abc0a7b53237cc36c44c2020000006b483045022100bfdfc132e7584201c4c568850fd1bf0bf950baf9c520a78969155da2d12b393c0220766f462e2abc08ea05068cc8952a751acdce992bf8548e15fc4a727aa9364de10121028c43630c9bd8072758e6cfaab61e6605eac4408754a053975555fb6c86ed6160feffffff030000000000000000176a00147a3c9408d5902b5da1b0e0dc6adaf89a3f5a4482707d94230000000017a914624a69b27a0d33f5693b7819fab4b6250412f5a58770f87f02e90100001976a914d9c0818d6e69fdb64ccd1968788ad73c4cb490f788ac02483045022100c94da96abcc3c074027eb59b798ec3b895c07c59b9ab8b67554a01e98a53af4702203474e70c55336e79a0e741393a9946b43cd2b48ad4fdd9f5f1b30a94d8e83de4012102e8f8d521f2ebe7ec6d6293f209521c7769acf4aa5e63ecc71bfcc5ebed8bae65000c1a0000';

    // const tx = TX.fromJSON(hex);

    const decoded = Script.fromRaw(hex, 'hex');
    // const criticalData = decoded.getCriticalData();
    console.log(decoded);
    assert();
  });

  it('should recognize a P2SH output', () => {
    const hex = 'a91419a7d869032368fd1f1e26e5e73a4ad0e474960e87';
    const decoded = Script.fromRaw(hex, 'hex');
    assert(decoded.isScripthash());
  });

  it('should recognize a Null Data output', () => {
    const hex = '6a28590c080112220a1b353930632e6f7267282a5f'
      + '5e294f7665726c6179404f7261636c65103b1a010c';
    const decoded = Script.fromRaw(hex, 'hex');
    assert(decoded.isNulldata());
  });

  it('should handle if statements correctly', () => {
    {
      const input = new Script([
        Opcode.fromInt(1),
        Opcode.fromInt(2)
      ]);

      const output = new Script([
        Opcode.fromInt(2),
        Opcode.fromSymbol('equal'),
        Opcode.fromSymbol('if'),
        Opcode.fromInt(3),
        Opcode.fromSymbol('else'),
        Opcode.fromInt(4),
        Opcode.fromSymbol('endif'),
        Opcode.fromInt(5)
      ]);

      const stack = new Stack();

      input.execute(stack);
      output.execute(stack);

      assert.deepEqual(stack.items, [[1], [3], [5]]);
    }

    {
      const input = new Script([
        Opcode.fromInt(1),
        Opcode.fromInt(2)
      ]);

      const output = new Script([
        Opcode.fromInt(9),
        Opcode.fromSymbol('equal'),
        Opcode.fromSymbol('if'),
        Opcode.fromInt(3),
        Opcode.fromSymbol('else'),
        Opcode.fromInt(4),
        Opcode.fromSymbol('endif'),
        Opcode.fromInt(5)
      ]);

      const stack = new Stack();

      input.execute(stack);
      output.execute(stack);

      assert.deepEqual(stack.items, [[1], [4], [5]]);
    }

    {
      const input = new Script([
        Opcode.fromInt(1),
        Opcode.fromInt(2)
      ]);

      const output = new Script([
        Opcode.fromInt(2),
        Opcode.fromSymbol('equal'),
        Opcode.fromSymbol('if'),
        Opcode.fromInt(3),
        Opcode.fromSymbol('endif'),
        Opcode.fromInt(5)
      ]);

      const stack = new Stack();

      input.execute(stack);
      output.execute(stack);

      assert.deepEqual(stack.items, [[1], [3], [5]]);
    }

    {
      const input = new Script([
        Opcode.fromInt(1),
        Opcode.fromInt(2)
      ]);

      const output = new Script([
        Opcode.fromInt(9),
        Opcode.fromSymbol('equal'),
        Opcode.fromSymbol('if'),
        Opcode.fromInt(3),
        Opcode.fromSymbol('endif'),
        Opcode.fromInt(5)
      ]);

      const stack = new Stack();

      input.execute(stack);
      output.execute(stack);

      assert.deepEqual(stack.items, [[1], [5]]);
    }

    {
      const input = new Script([
        Opcode.fromInt(1),
        Opcode.fromInt(2)
      ]);

      const output = new Script([
        Opcode.fromInt(9),
        Opcode.fromSymbol('equal'),
        Opcode.fromSymbol('notif'),
        Opcode.fromInt(3),
        Opcode.fromSymbol('endif'),
        Opcode.fromInt(5)
      ]);

      const stack = new Stack();

      input.execute(stack);
      output.execute(stack);

      assert.deepEqual(stack.items, [[1], [3], [5]]);
    }
  });

  it('should handle CScriptNums correctly', () => {
    const input = new Script([
      Opcode.fromString('ffffff7f', 'hex'),
      Opcode.fromSymbol('negate'),
      Opcode.fromSymbol('dup'),
      Opcode.fromSymbol('add')
    ]);

    const output = new Script([
      Opcode.fromString('feffffff80', 'hex'),
      Opcode.fromSymbol('equal')
    ]);

    const stack = new Stack();

    input.execute(stack);
    output.execute(stack);

    assert(isSuccess(stack));
  });

  it('should handle CScriptNums correctly', () => {
    const input = new Script([
      Opcode.fromInt(11),
      Opcode.fromInt(10),
      Opcode.fromInt(1),
      Opcode.fromSymbol('add')
    ]);

    const output = new Script([
      Opcode.fromSymbol('numnotequal'),
      Opcode.fromSymbol('not')
    ]);

    const stack = new Stack();

    input.execute(stack);
    output.execute(stack);

    assert(isSuccess(stack));
  });

  it('should handle OP_ROLL correctly', () => {
    const input = new Script([
      Opcode.fromInt(0x16),
      Opcode.fromInt(0x15),
      Opcode.fromInt(0x14)
    ]);

    const output = new Script([
      Opcode.fromInt(0),
      Opcode.fromSymbol('roll'),
      Opcode.fromInt(0x14),
      Opcode.fromSymbol('equalverify'),
      Opcode.fromSymbol('depth'),
      Opcode.fromInt(2),
      Opcode.fromSymbol('equal')
    ]);

    const stack = new Stack();

    input.execute(stack);
    output.execute(stack);

    assert(isSuccess(stack));
  });

  for (const data of scripts) {
    if (data.length === 1)
      continue;

    const test = parseScriptTest(data);
    const {witness, input, output} = test;
    const {value, flags} = test;
    const {expected, comments} = test;

    for (const noCache of [false, true]) {
      const suffix = noCache ? 'without cache' : 'with cache';

      it(`should handle script test ${suffix}:${comments}`, () => {
        // Funding transaction.
        const prev = new TX({
          version: 1,
          inputs: [{
            prevout: {
              hash: consensus.ZERO_HASH,
              index: 0xffffffff
            },
            script: [
              Opcode.fromInt(0),
              Opcode.fromInt(0)
            ],
            witness: [],
            sequence: 0xffffffff
          }],
          outputs: [{
            script: output,
            value: value
          }],
          locktime: 0
        });

        // Spending transaction.
        const tx = new TX({
          version: 1,
          inputs: [{
            prevout: {
              hash: prev.hash(),
              index: 0
            },
            script: input,
            witness: witness,
            sequence: 0xffffffff
          }],
          outputs: [{
            script: [],
            value: value
          }],
          locktime: 0
        });

        if (noCache) {
          prev.refresh();
          tx.refresh();
        }

        let err;
        try {
          Script.verify(input, witness, output, tx, 0, value, flags);
        } catch (e) {
          err = e;
        }

        if (expected !== 'OK') {
          assert.typeOf(err, 'error');
          assert.strictEqual(err.code, expected);
          return;
        }

        assert.ifError(err);
      });
    }
  }
});
