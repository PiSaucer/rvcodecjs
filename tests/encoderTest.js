import { test, assert } from './test.js';
import { Instruction } from "../core/Instruction.js";

// R-TYPE
test('encode - add', function () {
    let inst = new Instruction("add x5, x6, x7");
    assert(inst.binary == '00000000011100110000001010110011');
})

// I-TYPE
test('encode - addi', function () {
    let inst = new Instruction("addi x15, x1, -50");
    assert(inst.hex == "0xfce08793");
    assert(inst.binary == "11111100111000001000011110010011");
})

test('encode - lw', function () {
    let inst = new Instruction("lw x10, 12(x8)");
    assert(inst.binary == "00000000110001000010010100000011");
})

// S-TYPE
test('encode - sb', function () {
    let inst = new Instruction("sb x14, 8(x2)");
    assert(inst.binary == "00000000111000010000010000100011");
})

// B-TYPE
test('encode - bne', function () {
    let inst = new Instruction("bne x19, x11, 16");
    assert(inst.binary == "00000000101110011001100001100011");
})

// U-TYPE
test('encode - auipc', function () {
    let inst = new Instruction("auipc x3, 30");
    assert(inst.binary == "00000000000000011110000110010111");
})

// J-TYPE
test('encode - jal', function () {
    let inst = new Instruction("jal x3, 132");
    assert(inst.binary == "00001000010000000000000111101111");
})
