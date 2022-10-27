import { test, assertEq } from './test.js';
import { Instruction } from '../core/Instruction.js';

// OP
test('enc - OP - add', function () {
    let inst = new Instruction('add x5, x6, x7');
    let abiInst = new Instruction('add t0, t1, t2');
    assertEq(abiInst.bin, '00000000011100110000001010110011');
    assertEq(inst.bin, '00000000011100110000001010110011');
})

// OP-32 (RV64I)
test('enc - OP-32 (RV64I) - addw', function () {
    let inst = new Instruction('addw x5, x6, x7');
    let abiInst = new Instruction('addw t0, t1, t2');
    assertEq(abiInst.bin, '00000000011100110000001010111011');
    assertEq(inst.bin, '00000000011100110000001010111011');
})

// OP (RV32M)
test('enc - OP (RV32M) - mulhsu', function () {
    let inst = new Instruction('mulhsu x9, x23, x8');
    let abiInst = new Instruction('mulhsu s1, s7, fp');
    assertEq(abiInst.bin, '00000010100010111010010010110011');
    assertEq(inst.bin, '00000010100010111010010010110011');
})

// OP-32 (RV64M)
test('enc - OP-32 (RV64M) - remw', function () {
    let inst = new Instruction('remw x15, x7, x30');
    let abiInst = new Instruction('remw a5, t2, t5');
    assertEq(abiInst.bin, '00000011111000111110011110111011');
    assertEq(inst.bin, '00000011111000111110011110111011');
})

// JALR
test('enc - JALR - jalr', function () {
    let inst = new Instruction('jalr x16, x5, 24');
    let abiInst = new Instruction('jalr a6, t0, 24');
    assertEq(abiInst.bin, '00000001100000101000100001100111');
    assertEq(inst.bin, '00000001100000101000100001100111');
})

// LOAD
test('enc - LOAD - lw', function () {
    let inst = new Instruction('lw x10, 12(x8)');
    let abiInst = new Instruction('lw a0, 12(fp)');
    assertEq(abiInst.bin, '00000000110001000010010100000011');
    assertEq(inst.bin, '00000000110001000010010100000011');
})

// OP-IMM
test('enc - OP-IMM - addi', function () {
    let inst = new Instruction('addi x15, x1, -50');
    let abiInst = new Instruction('addi a5, ra, -50');
    assertEq(abiInst.hex, 'fce08793');
    assertEq(inst.hex, 'fce08793');
})

test('enc - OP-IMM - srai', function () {
    let inst = new Instruction('srai x7, x1, 21');
    let abiInst = new Instruction('srai t2, ra, 21');
    assertEq(inst.bin, '01000001010100001101001110010011');
    assertEq(abiInst.bin, '01000001010100001101001110010011');
})

// OP-IMM (RV64I)
test('enc - OP-IMM (RV64I) - srai (shamt=43)', function () {
    let inst = new Instruction('srai x7, x1, 43');
    assertEq(inst.bin, '01000010101100001101001110010011');
    assertEq(inst.isa, 'RV64I');
})

// OP-IMM-32 (RV64I)
test('enc - OP-IMM-32 (RV64I) - addiw', function () {
    let inst = new Instruction('addiw x15, x1, -50');
    let abiInst = new Instruction('addiw a5, ra, -50');
    assertEq(abiInst.hex, 'fce0879b');
    assertEq(inst.hex, 'fce0879b');
})

test('enc - OP-IMM-32 (RV64I) - slliw', function () {
    let inst = new Instruction('slliw x4, x8, 21');
    assertEq(inst.hex, '0154121b');
    assertEq(inst.isa, 'RV64I');
})

// MISC-MEM
test('enc - MISC-MEM - fence', function () {
    let inst = new Instruction('fence iorw, rw');
    assertEq(inst.hex, '0f30000f');
})

// MISC-MEM (Zifencei)
test('enc - MISC-MEM (Zifencei) - fence.i', function () {
    let inst = new Instruction('fence.i');
    assertEq(inst.hex, '0000100f');
})

// SYSTEM (trap)
test('enc - SYSTEM (trap) - ecall', function () {
    let inst = new Instruction('ecall');
    assertEq(inst.hex, '00000073');
})

// SYSTEM (Zicsr)
test('enc - SYSTEM (Zicsr) - csrrw', function() {
    let inst = new Instruction('csrrw x6, cycleh, x8');
    let abiInst = new Instruction('csrrw t1, cycleh, fp');
    assertEq(abiInst.bin, '11001000000001000001001101110011');
    assertEq(inst.bin, '11001000000001000001001101110011');
})

test('enc - SYSTEM (Zicsr) - csrrci', function() {
    let inst = new Instruction('csrrci x15, pmpcfg13, 0b10101');
    let abiInst = new Instruction('csrrci a5, pmpcfg13, 0x15');
    assertEq(abiInst.bin, '00111010110110101111011111110011');
    assertEq(inst.bin, '00111010110110101111011111110011');
})

// STORE
test('enc - STORE - sb', function () {
    let inst = new Instruction('sb x14, 8(x2)');
    let abiInst = new Instruction('sb a4, 8(sp)');
    assertEq(abiInst.bin, '00000000111000010000010000100011');
    assertEq(inst.bin, '00000000111000010000010000100011');
})

// BRANCH
test('enc - BRANCH - bne', function () {
    let inst = new Instruction('bne x19, x11, 16');
    let abiInst = new Instruction('bne s3, a1, 16');
    assertEq(abiInst.bin, '00000000101110011001100001100011');
    assertEq(inst.bin, '00000000101110011001100001100011');
})

// LUI
test('enc - LUI - lui', function () {
    let inst = new Instruction('lui x17, 4892');
    let abiInst = new Instruction('lui a7, 4892');
    assertEq(abiInst.hex, '0131c8b7');
    assertEq(inst.hex, '0131c8b7');
})

// AUIPC
test('enc - AUIPC - auipc', function () {
    let inst = new Instruction('auipc x3, 30');
    let abiInst = new Instruction('auipc gp, 30');
    assertEq(abiInst.bin, '00000000000000011110000110010111');
    assertEq(inst.bin, '00000000000000011110000110010111');
})

// JAL
test('enc - JAL - jal', function () {
    let inst = new Instruction('jal x5, 132');
    let abiInst = new Instruction('jal t0, 132');
    assertEq(abiInst.bin, '00001000010000000000001011101111');
    assertEq(inst.bin, '00001000010000000000001011101111');
})
