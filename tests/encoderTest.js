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
    assertEq(inst.bin, '00000010100010111010010010110011');
    assertEq(abiInst.bin, inst.bin);
}

// OP-32
function enc_rv64m_op32_remw() {
    let inst = new Instruction('remw x15, x7, x30');
    let abiInst = new Instruction('remw a5, t2, t5');
    assertEq(inst.bin, '00000011111000111110011110111011');
    assertEq(abiInst.bin, inst.bin);
}

/*
 * A extension
 */
function enc_rv32a_amo_lrw() {
    let inst = new Instruction('lr.w x6, (x10)');
    let abiInst = new Instruction('lr.w t1, (a0)');
    assertEq(inst.bin, '00010000000001010010001100101111');
    assertEq(abiInst.bin, inst.bin);
}

function enc_rv64a_amo_amoswapd() {
    let inst = new Instruction('amoswap.d x31, x30, (x12)');
    let abiInst = new Instruction('amoswap.d t6, t5, (a2)');
    assertEq(inst.bin, '00001001111001100011111110101111');
    assertEq(abiInst.bin, inst.bin);
}

/*
 * F extension
 */
function enc_rv32f_loadfp_flw() {
    let inst = new Instruction('flw f7, 100(x8)');
    let instAbi = new Instruction('flw f7, 100(s0)');
    assertEq(inst.bin, '00000110010001000010001110000111');
    assertEq(instAbi.bin, inst.bin);
}

function enc_rv32f_storefp_fsw() {
    let inst = new Instruction('fsw f14, 100(x9)');
    let instAbi = new Instruction('fsw f14, 100(s1)');
    assertEq(inst.bin, '00000110111001001010001000100111');
    assertEq(instAbi.bin, inst.bin);
}

function enc_rv32f_madd_fmadds() {
    let inst = new Instruction('fmadd.s f3, f7, f15, f31');
    assertEq(inst.bin, '11111000111100111111000111000011');
}

function enc_rv32f_nmsub_fnmsubs() {
    let inst = new Instruction('fnmsub.s f2, f4, f8, f16');
    assertEq(inst.bin, '10000000100000100111000101001011');
}

function enc_rv32f_opfp_fadds() {
    let inst = new Instruction('fadd.s f5, f9, f17');
    assertEq(inst.bin, '00000001000101001111001011010011');
}

function enc_rv32f_opfp_fsgnjxs() {
    let inst = new Instruction('fsgnjx.s f6, f12, f24');
    assertEq(inst.bin, '00100001100001100010001101010011');
}

function enc_rv32f_opfp_flts() {
    let inst = new Instruction('flt.s x6, f4, f5');
    let instAbi = new Instruction('flt.s t1, f4, f5');
    assertEq(inst.bin, '10100000010100100001001101010011');
    assertEq(instAbi.bin, inst.bin);
}

function enc_rv32f_opfp_fmvwx() {
    let inst = new Instruction('fmv.w.x f11, x10');
    let instAbi = new Instruction('fmv.w.x f11, a0');
    assertEq(inst.bin, '11110000000001010000010111010011');
    assertEq(instAbi.bin, inst.bin);
}

function enc_rv64f_opfp_fcvtlus() {
    let inst = new Instruction('fcvt.lu.s x14, f1');
    let instAbi = new Instruction('fcvt.lu.s a4, f1');
    assertEq(inst.bin, '11000000001100001111011101010011');
    assertEq(instAbi.bin, inst.bin);
}

/*
 * D extension
 */
function enc_rv32d_loadfp_fld() {
    let inst = new Instruction('fld f5, 101(x9)');
    let instAbi = new Instruction('fld f5, 101(s1)');
    assertEq(inst.bin, '00000110010101001011001010000111');
    assertEq(instAbi.bin, inst.bin);
}

function enc_rv32d_storefp_fsd() {
    let inst = new Instruction('fsd f13, 99(x8)');
    let instAbi = new Instruction('fsd f13, 99(s0)');
    assertEq(inst.bin, '00000110110101000011000110100111');
    assertEq(instAbi.bin, inst.bin);
}

function enc_rv32d_msub_fmsubd() {
    let inst = new Instruction('fmsub.d f2, f6, f14, f30');
    assertEq(inst.bin, '11110010111000110111000101000111');
}

function enc_rv32d_opfp_fsubd() {
    let inst = new Instruction('fsub.d f4, f8, f16');
    assertEq(inst.bin, '00001011000001000111001001010011');
}

function enc_rv32d_opfp_fsgnjnd() {
    let inst = new Instruction('fsgnjn.d f7, f13, f25');
    assertEq(inst.bin, '00100011100101101001001111010011');
}

function enc_rv32d_opfp_feqd() {
    let inst = new Instruction('feq.d x7, f5, f4');
    let instAbi = new Instruction('feq.d t2, f5, f4');
    assertEq(inst.bin, '10100010010000101010001111010011');
    assertEq(instAbi.bin, inst.bin);
}

function enc_rv32d_opfp_fcvtdw() {
    let inst = new Instruction('fcvt.d.w f3, x20');
    let instAbi = new Instruction('fcvt.d.w f3, s4');
    assertEq(inst.bin, '11010010000010100111000111010011');
    assertEq(instAbi.bin, inst.bin);
}

function enc_rv64d_opfp_fmvxd() {
    let inst = new Instruction('fmv.x.d x12, f9');
    let instAbi = new Instruction('fmv.x.d a2, f9');
    assertEq(inst.bin, '11100010000001001000011001010011');
    assertEq(instAbi.bin, inst.bin);
}

/*
 * Q extension
 */
function enc_rv32q_loadfp_flq() {
    let inst = new Instruction('flq f4, 103(x10)');
    let instAbi = new Instruction('flq f4, 103(a0)');
    assertEq(inst.bin, '00000110011101010100001000000111');
    assertEq(instAbi.bin, inst.bin);
}

function enc_rv32q_storefp_fsq() {
    let inst = new Instruction('fsq f12, 96(x7)');
    let instAbi = new Instruction('fsq f12, 96(t2)');
    assertEq(inst.bin, '00000110110000111100000000100111');
    assertEq(instAbi.bin, inst.bin);
}

function enc_rv32q_nmadd_fnmaddq() {
    let inst = new Instruction('fnmadd.q f1, f5, f13, f29');
    assertEq(inst.bin, '11101110110100101111000011001111');
}

function enc_rv32q_opfp_fsqrtq() {
    let inst = new Instruction('fsqrt.q f11, f21');
    assertEq(inst.bin, '01011110000010101111010111010011');
}

function enc_rv32q_opfp_fmaxq() {
    let inst = new Instruction('fmax.q f15, f28, f30');
    assertEq(inst.bin, '00101111111011100001011111010011');
}

function enc_rv32q_opfp_fclassq() {
    let inst = new Instruction('fclass.q x19, f0');
    let instAbi = new Instruction('fclass.q s3, f0');
    assertEq(inst.bin, '11100110000000000001100111010011');
    assertEq(instAbi.bin, inst.bin);
}

function enc_rv32q_opfp_fcvtqd() {
    let inst = new Instruction('fcvt.q.d f7, f8');
    assertEq(inst.bin, '01000110000101000111001111010011');
}

function enc_rv32q_opfp_fcvtsq() {
    let inst = new Instruction('fcvt.s.q f6, f9');
    assertEq(inst.bin, '01000000001101001111001101010011');
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
test('Enc - RV32A    - AMO       - lr.w', enc_rv32a_amo_lrw);
test('Enc - RV64A    - AMO       - amoswap.d', enc_rv64a_amo_amoswapd);
test('Enc - RV32F    - LOAD-FP   - flw', enc_rv32f_loadfp_flw);
test('Enc - RV32F    - STORE-FP  - fsw', enc_rv32f_storefp_fsw);
test('Enc - RV32F    - MADD      - fmadd.s', enc_rv32f_madd_fmadds);
test('Enc - RV32F    - NMSUB     - fnmsub.s', enc_rv32f_nmsub_fnmsubs);
test('Enc - RV32F    - OP-FP     - fadd.s', enc_rv32f_opfp_fadds);
test('Enc - RV32F    - OP-FP     - fsgnjx.s', enc_rv32f_opfp_fsgnjxs);
test('Enc - RV32F    - OP-FP     - flt.s', enc_rv32f_opfp_flts);
test('Enc - RV32F    - OP-FP     - fmv.w.x', enc_rv32f_opfp_fmvwx);
test('Enc - RV64F    - OP-FP     - fcvt.lu.s', enc_rv64f_opfp_fcvtlus);
test('Enc - RV32D    - LOAD-FP   - fld', enc_rv32d_loadfp_fld);
test('Enc - RV32D    - STORE-FP  - fsd', enc_rv32d_storefp_fsd);
test('Enc - RV32D    - MSUB      - fmsub.d', enc_rv32d_msub_fmsubd);
test('Enc - RV32D    - OP-FP     - fsub.d', enc_rv32d_opfp_fsubd);
test('Enc - RV32D    - OP-FP     - fsgnjn.d', enc_rv32d_opfp_fsgnjnd);
test('Enc - RV32D    - OP-FP     - feq.d', enc_rv32d_opfp_feqd);
test('Enc - RV64D    - OP-FP     - fcvt.d.w', enc_rv32d_opfp_fcvtdw);
test('Enc - RV32D    - OP-FP     - fmv.x.d', enc_rv64d_opfp_fmvxd);
test('Enc - RV32Q    - LOAD-FP   - flq', enc_rv32q_loadfp_flq);
test('Enc - RV32Q    - STORE-FP  - fsq', enc_rv32q_storefp_fsq);
test('Enc - RV32Q    - NMADD     - fnmadd.q', enc_rv32q_nmadd_fnmaddq);
test('Enc - RV32Q    - OP-FP     - fsqrt.q', enc_rv32q_opfp_fsqrtq);
test('Enc - RV32Q    - OP-FP     - fmax.q', enc_rv32q_opfp_fmaxq);
test('Enc - RV32Q    - OP-FP     - fclass.q', enc_rv32q_opfp_fclassq);
test('Enc - RV32Q    - OP-FP     - fcvt.q.d', enc_rv32q_opfp_fcvtqd);
test('Enc - RV32Q    - OP-FP     - fcvt.s.q', enc_rv32q_opfp_fcvtsq);

// Newline
console.log('');
