import { test, assertEq } from './test.js';
import { Instruction } from '../core/Instruction.js';

/*
 * RV32I
 */
// LUI
function enc_rv32i_lui_lui() {
    let inst = new Instruction('lui x17, 4892');
    let abiInst = new Instruction('lui a7, 4892');
    assertEq(inst.hex, '0131c8b7');
    assertEq(abiInst.hex, inst.hex);
}

// AUIPC
function enc_rv32i_auipc_auipc() {
    let inst = new Instruction('auipc x3, 30');
    let abiInst = new Instruction('auipc gp, 30');
    assertEq(inst.bin, '00000000000000011110000110010111');
    assertEq(abiInst.bin, inst.bin);
}

// JAL
function enc_rv32i_jal_jal() {
    let inst = new Instruction('jal x5, 132');
    let abiInst = new Instruction('jal t0, 132');
    assertEq(inst.bin, '00001000010000000000001011101111');
    assertEq(abiInst.bin, inst.bin);
}

// JALR
function enc_rv32i_jalr_jalr() {
    let inst = new Instruction('jalr x16, x5, 24');
    let abiInst = new Instruction('jalr a6, t0, 24');
    assertEq(inst.bin, '00000001100000101000100001100111');
    assertEq(abiInst.bin, inst.bin);
}

// BRANCH
function enc_rv32i_branch_bne() {
    let inst = new Instruction('bne x19, x11, 16');
    let abiInst = new Instruction('bne s3, a1, 16');
    assertEq(inst.bin, '00000000101110011001100001100011');
    assertEq(abiInst.bin, inst.bin);
}

// LOAD
function enc_rv32i_load_lw() {
    let inst = new Instruction('lw x10, 12(x8)');
    let abiInst = new Instruction('lw a0, 12(fp)');
    assertEq(inst.bin, '00000000110001000010010100000011');
    assertEq(abiInst.bin, inst.bin);
}

// STORE
function enc_rv32i_store_sb() {
    let inst = new Instruction('sb x14, 8(x2)');
    let abiInst = new Instruction('sb a4, 8(sp)');
    assertEq(inst.bin, '00000000111000010000010000100011');
    assertEq(abiInst.bin, inst.bin);
}

// OP-IMM
function enc_rv23i_opimm_addi() {
    let inst = new Instruction('addi x15, x1, -50');
    let abiInst = new Instruction('addi a5, ra, -50');
    assertEq(inst.hex, 'fce08793');
    assertEq(abiInst.hex, inst.hex);
}

function enc_rv32i_opimm_srai () {
    let inst = new Instruction('srai x7, x1, 21');
    let abiInst = new Instruction('srai t2, ra, 21');
    assertEq(inst.bin, '01000001010100001101001110010011');
    assertEq(abiInst.bin, inst.bin);
}

// OP
function enc_rv32i_op_add() {
    let inst = new Instruction('add x5, x6, x7');
    let abiInst = new Instruction('add t0, t1, t2');
    assertEq(inst.bin, '00000000011100110000001010110011');
    assertEq(abiInst.bin, inst.bin);
}

// MISC-MEM
function enc_rv32i_miscmem_fence() {
    let inst = new Instruction('fence iorw, rw');
    assertEq(inst.hex, '0f30000f');
}

// SYSTEM
function enc_rv32i_system_ecall() {
    let inst = new Instruction('ecall');
    assertEq(inst.hex, '00000073');
}

/*
 * RV64I
 */
// OP-32
function enc_rv64i_op32_addw() {
    let inst = new Instruction('addw x5, x6, x7');
    let abiInst = new Instruction('addw t0, t1, t2');
    assertEq(inst.bin, '00000000011100110000001010111011');
    assertEq(abiInst.bin, inst.bin);
}

// OP-IMM
function enc_rv64i_oppimm_srai_shamt43() {
    let inst = new Instruction('srai x7, x1, 43');
    assertEq(inst.bin, '01000010101100001101001110010011');
    assertEq(inst.isa, 'RV64I');
}

// OP-IMM-32
function enc_rv64i_opimm32_addiw() {
    let inst = new Instruction('addiw x15, x1, -50');
    let abiInst = new Instruction('addiw a5, ra, -50');
    assertEq(inst.hex, 'fce0879b');
    assertEq(abiInst.hex, inst.hex);
}

function enc_rv64i_opimm32_slliw() {
    let inst = new Instruction('slliw x4, x8, 21');
    assertEq(inst.hex, '0154121b');
    assertEq(inst.isa, 'RV64I');
}

/*
 * Zifencei
 */
function enc_zifencei_miscmem_fencei() {
    let inst = new Instruction('fence.i');
    assertEq(inst.hex, '0000100f');
}

/*
 * Zicsr
 */
function enc_zicsr_system_csrrw() {
    let inst = new Instruction('csrrw x6, cycleh, x8');
    let abiInst = new Instruction('csrrw t1, cycleh, fp');
    assertEq(inst.bin, '11001000000001000001001101110011');
    assertEq(abiInst.bin, inst.bin);
}

function enc_zicsr_system_csrrci() {
    let inst = new Instruction('csrrci x15, pmpcfg13, 0b10101');
    let abiInst = new Instruction('csrrci a5, pmpcfg13, 0x15');
    assertEq(inst.bin, '00111010110110101111011111110011');
    assertEq(abiInst.bin, inst.bin);
}

/*
 * M extension
 */
// OP
function enc_rv32m_op_mulhsu() {
    let inst = new Instruction('mulhsu x9, x23, x8');
    let abiInst = new Instruction('mulhsu s1, s7, fp');
    assertEq(abiInst.bin, '00000010100010111010010010110011');
    assertEq(inst.bin, '00000010100010111010010010110011');
}

// OP-32
function enc_rv64m_op32_remw() {
    let inst = new Instruction('remw x15, x7, x30');
    let abiInst = new Instruction('remw a5, t2, t5');
    assertEq(abiInst.bin, '00000011111000111110011110111011');
    assertEq(inst.bin, '00000011111000111110011110111011');
}

test('Enc - RV32I    - LUI       - lui', enc_rv32i_lui_lui);
test('Enc - RV32I    - AUIPC     - auipc', enc_rv32i_auipc_auipc);
test('Enc - RV32I    - JAL       - jal', enc_rv32i_jal_jal);
test('Enc - RV32I    - JALR      - jalr', enc_rv32i_jalr_jalr);
test('Enc - RV32I    - BRANCH    - bne', enc_rv32i_branch_bne);
test('Enc - RV32I    - LOAD      - lw', enc_rv32i_load_lw);
test('Enc - RV32I    - STORE     - sb', enc_rv32i_store_sb);
test('Enc - RV32I    - OP-IMM    - addi', enc_rv23i_opimm_addi);
test('Enc - RV32I    - OP-IMM    - srai', enc_rv32i_opimm_srai);
test('Enc - RV32I    - OP        - add', enc_rv32i_op_add);
test('Enc - RV32I    - MISC-MEM  - fence', enc_rv32i_miscmem_fence);
test('Enc - RV32I    - SYSTEM    - ecall', enc_rv32i_system_ecall);
test('Enc - RV64I    - OP-32     - addw', enc_rv64i_op32_addw);
test('Enc - RV64I    - OP-IMM    - srai - [shamt=43]', enc_rv64i_oppimm_srai_shamt43);
test('Enc - RV64I    - OP-IMM-32 - addiw', enc_rv64i_opimm32_addiw);
test('Enc - RV64I    - OP-IMM-32 - slliw', enc_rv64i_opimm32_slliw);
test('Enc - Zifencei - MISC-MEM  - fence.i', enc_zifencei_miscmem_fencei);
test('Enc - Zicsr    - SYSTEM    - csrrw', enc_zicsr_system_csrrw);
test('Enc - Zicsr    - SYSTEM    - csrrci', enc_zicsr_system_csrrci);
test('Enc - RV32M    - OP        - mulhsu', enc_rv32m_op_mulhsu);
test('Enc - RV64M    - OP-32     - remw', enc_rv64m_op32_remw);

// Newline
console.log('');
