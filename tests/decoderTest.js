import { test, assert } from './test.js';
import { Instruction } from "../core/Instruction.js";

// R-TYPE
test('decode - add', function () {
    let inst = new Instruction("00000000001100010000000010110011");
    assert(inst.hex == "0x003100b3");
    assert(inst.assembly == 'add x1, x2, x3');
})

// I-TYPE
test('decode - addi', function () {
    let inst = new Instruction("11111100111000001000011110010011");
    assert(inst.hex == "0xfce08793");
    assert(inst.assembly == "addi x15, x1, -50");
})

test('decode - lw', function () {
    let inst = new Instruction("0xff442503");
    assert(inst.binary == "11111111010001000010010100000011");
    assert(inst.assembly == "lw x10, -12(x8)");
})

// S-TYPE
test('decode - sw', function () {
    let inst = new Instruction("00000000111000010010010000100011");
    assert(inst.hex == "0x00e12423");
    assert(inst.assembly == "sw x14, 8(x2)");
})

// B-TYPE
test('decode - beq', function () {
    let inst = new Instruction("00000000101010011000100001100011");
    assert(inst.hex == "0x00a98863");
    assert(inst.assembly == "beq x19, x10, 16");
})

// U-TYPE
test('decode - lui', function () {
    let inst = new Instruction("0001e1B7");
    assert(inst.binary == "00000000000000011110000110110111");
    assert(inst.assembly == "lui x3, 30");
})

// J-TYPE
test('decode - jal', function () {
    let inst = new Instruction("00001000010000000000000101101111");
    assert(inst.hex == "0x0840016f");
    assert(inst.assembly == "jal x2, 132");
})

// FENCE
test('decode - fence', function () {
    let inst = new Instruction("00000011001100000000000000001111");
    assert(inst.hex == "0x0330000f");
    assert(inst.assembly == "fence rw, rw");
})
