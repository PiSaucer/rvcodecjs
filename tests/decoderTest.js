import { test, assertEq } from './test.js';
import { Instruction } from '../core/Instruction.js';

// OP
test('dec - OP - add', function () {
    let inst = new Instruction('00000000001100010000000010110011');
    assertEq(inst.hex, '003100b3');
    assertEq(inst.asm, 'add x1, x2, x3');
})

// OP (RV64i)
test('decs - OP (RV64I) - addw', function () {
    let inst = new Instruction('00000000011100110000001010111011');
    assertEq(inst.asm, 'addw x5, x6, x7');
    assertEq(inst.isa, 'RV64I');
})

// JALR
test('dec - JALR - jalr', function () {
    let inst = new Instruction('01010101010100010000000011100111');
    assertEq(inst.hex, '555100e7');
    assertEq(inst.asm, 'jalr x1, x2, 1365');
})

// LOAD
test('dec - LOAD - lw', function () {
    let inst = new Instruction('0xff442503');
    assertEq(inst.bin, '11111111010001000010010100000011');
    assertEq(inst.asm, 'lw x10, -12(x8)');
})

// OP-IMM
test('dec - OP-IMM - addi', function () {
    let inst = new Instruction('11111100111000001000011110010011');
    assertEq(inst.hex, 'fce08793');
    assertEq(inst.asm, 'addi x15, x1, -50');
})

test('dec - OP-IMM - srai', function () {
    let inst = new Instruction('01000001010100001101001110010011');
    assertEq(inst.hex, '4150d393');
    assertEq(inst.asm, 'srai x7, x1, 21');
})

// OP-IMM (RV64I)
test('dec - OP-IMM (RV64I) - addiw', function () {
    let inst = new Instruction('fce0879b');
    assertEq(inst.asm, 'addiw x15, x1, -50');
    assertEq(inst.isa, 'RV64I');
})

test('dec - OP-IMM (RV64I) - slliw', function () {
    let inst = new Instruction('0154121b');
    assertEq(inst.asm, 'slliw x4, x8, 21');
    assertEq(inst.isa, 'RV64I');
})

test('dec - OP-IMM (RV64I) - srai (shamt=43)', function () {
    let inst = new Instruction('01000010101100001101001110010011');
    assertEq(inst.asm, 'srai x7, x1, 43');
    assertEq(inst.isa, 'RV64I');
})

// MISC-MEM
test('dec - MISC-MEM - fence', function () {
    let inst = new Instruction('00000011001100000000000000001111');
    assertEq(inst.hex, '0330000f');
    assertEq(inst.asm, 'fence rw, rw');
})

// MISC-MEM (Zifencei)
test('dec - MISC-MEM (Zifencei) - fence.i', function () {
    let inst = new Instruction('00000000000000000001000000001111');
    assertEq(inst.hex, '0000100f');
    assertEq(inst.asm, 'fence.i');
})

// SYSTEM (trap)
test('dec - SYSTEM (trap) - ebreak', function () {
    let inst = new Instruction('0000000000100000000000001110011');
    assertEq(inst.hex, '00100073');
    assertEq(inst.asm, 'ebreak');
})

// SYSTEM (Zicsr)
test('dec - SYSTEM (Zicsr) - csrrs', function () {
    let inst = new Instruction('01111010001001100010001001110011');
    assertEq(inst.hex, '7a262273');
    assertEq(inst.asm, 'csrrs x4, tdata2, x12');
})

test('dec - SYSTEM (Zicsr) - csrrwi', function () {
    let inst = new Instruction('11110001010010111101000011110011');
    assertEq(inst.hex, 'f14bd0f3');
    assertEq(inst.asm, 'csrrwi x1, mhartid, 23');
})

// STORE
test('dec - STORE - sw', function () {
    let inst = new Instruction('00000000111000010010010000100011');
    assertEq(inst.hex, '00e12423');
    assertEq(inst.asm, 'sw x14, 8(x2)');
})

// BRANCH
test('dec - BRANCH - beq', function () {
    let inst = new Instruction('00000000101010011000100001100011');
    assertEq(inst.hex, '00a98863');
    assertEq(inst.asm, 'beq x19, x10, 16');
})

// LUI
test('dec - LUI - lui', function () {
    let inst = new Instruction('0001e1B7');
    assertEq(inst.bin, '00000000000000011110000110110111');
    assertEq(inst.asm, 'lui x3, 30');
})

// AUIPC
test('dec - AUIPC - auipc', function () {
    let inst = new Instruction('00000000000000011110001010010111');
    assertEq(inst.hex, '0001e297');
    assertEq(inst.asm, 'auipc x5, 30');
})

// JAL
test('dec - JAL - jal', function () {
    let inst = new Instruction('00001000010000000000000101101111');
    assertEq(inst.hex, '0840016f');
    assertEq(inst.asm, 'jal x2, 132');
})

// ABI
test('dec - ABI', function () {
    let inst = new Instruction('add x8, x29, x16', { ABI: true });
    assertEq(inst.asm, 'add s0, t4, a6');
})
