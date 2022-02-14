import { test, assert } from './test.js';
import { Instruction } from "../core/Instruction.js";

// R-TYPE
test('decode - add', function () {
    let inst = new Instruction("add x5, x6, x7");
    assert(inst.binary == '00000000011100110000001010110011');
})
