import { batchTests, assertEq } from './test.js';
import { Instruction } from '../core/Instruction.js';
import { COPTS_ISA } from '../core/Config.js';

/*
 * RV32I
 */
// LUI
function dec_rv32i_lui_lui() {
    let inst = new Instruction('876541B7');
    let instAbi = new Instruction('876541B7', { ABI:true });
    assertEq(inst.asm, 'lui x3, -2023407616');
    assertEq(instAbi.asm, 'lui gp, -2023407616');
}

// AUIPC
function dec_rv32i_auipc_auipc() {
    let inst = new Instruction('00000000000000011110001010010111');
    let instAbi = new Instruction('00000000000000011110001010010111', { ABI:true });
    assertEq(inst.asm, 'auipc x5, 122880');
    assertEq(instAbi.asm, 'auipc t0, 122880');
}

// JAL
function dec_rv32i_jal_jal() {
    let inst = new Instruction('00001000010000000000000101101111');
    let instAbi = new Instruction('00001000010000000000000101101111', { ABI:true });
    assertEq(inst.asm, 'jal x2, 132');
    assertEq(instAbi.asm, 'jal sp, 132');
}

// JALR
function dec_rv32i_jalr_jalr() {
    let inst = new Instruction('01010101010100010000000011100111');
    let instAbi = new Instruction('01010101010100010000000011100111', { ABI:true });
    assertEq(inst.asm, 'jalr x1, x2, 1365');
    assertEq(instAbi.asm, 'jalr ra, sp, 1365');
}

// BRANCH
function dec_rv32i_branch_beq() {
    let inst = new Instruction('10110000101010011000101001100011');
    let instAbi = new Instruction('10110000101010011000101001100011', { ABI:true });
    assertEq(inst.asm, 'beq x19, x10, -3308');
    assertEq(instAbi.asm, 'beq s3, a0, -3308');
}

// LOAD
function dec_rv32i_load_lw() {
    let inst = new Instruction('0xff442503');
    let instAbi = new Instruction('0xff442503', { ABI:true });
    assertEq(inst.asm, 'lw x10, -12(x8)');
    assertEq(instAbi.asm, 'lw a0, -12(s0)');
}

// STORE
function dec_rv32i_store_sw() {
    let inst = new Instruction('00000000111000010010010000100011');
    let instAbi = new Instruction('00000000111000010010010000100011', { ABI:true });
    assertEq(inst.asm, 'sw x14, 8(x2)');
    assertEq(instAbi.asm, 'sw a4, 8(sp)');
}

// OP-IMM
function dec_rv32i_opimm_addi() {
    let inst = new Instruction('11111100111000001000011110010011');
    let instAbi = new Instruction('11111100111000001000011110010011', { ABI:true });
    assertEq(inst.asm, 'addi x15, x1, -50');
    assertEq(instAbi.asm, 'addi a5, ra, -50');
}

function dec_rv32i_opimm_srai() {
    let inst = new Instruction('01000001010100001101001110010011');
    let instAbi = new Instruction('01000001010100001101001110010011', { ABI:true });
    assertEq(inst.asm, 'srai x7, x1, 21');
    assertEq(instAbi.asm, 'srai t2, ra, 21');
}

// OP
function dec_rv32i_op_add() {
    let inst = new Instruction('00000000001100010000000010110011');
    let instAbi = new Instruction('00000000001100010000000010110011', { ABI:true });
    assertEq(inst.asm, 'add x1, x2, x3');
    assertEq(instAbi.asm, 'add ra, sp, gp');
}

// MISC-MEM
function dec_rv32i_miscmem_fence() {
    let inst = new Instruction('00000011001100000000000000001111');
    assertEq(inst.hex, '0330000f');
    assertEq(inst.asm, 'fence rw, rw');
}

// SYSTEM
function dec_rv32i_system_ebreak() {
    let inst = new Instruction('00100073');
    assertEq(inst.bin, '00000000000100000000000001110011');
    assertEq(inst.asm, 'ebreak');
}

/*
 * RV64I
 */
// OP-32
function dec_rv64i_op32_addw() {
    let inst = new Instruction('00000000011100110000001010111011');
    assertEq(inst.asm, 'addw x5, x6, x7');
    assertEq(inst.isa, 'RV64I');
}

// OP-IMM
function dec_rv64i_opimm_srai_shamt43() {
    let inst = new Instruction('01000010101100001101001110010011');
    assertEq(inst.asm, 'srai x7, x1, 43');
    assertEq(inst.isa, 'RV64I');
}

// OP-IMM-32
function dec_rv64i_opimm32_addiw() {
    let inst = new Instruction('fce0879b');
    assertEq(inst.asm, 'addiw x15, x1, -50');
    assertEq(inst.isa, 'RV64I');
}

function dec_rv64i_opim32_slliw() {
    let inst = new Instruction('0154121b');
    assertEq(inst.asm, 'slliw x4, x8, 21');
    assertEq(inst.isa, 'RV64I');
}

/*
 * RV128I
 */
// MISC-MEM
function dec_rv128i_miscmem_lq() {
    let inst = new Instruction('00000000110001000010010100001111');
    assertEq(inst.asm, 'lq x10, 12(x8)');
    assertEq(inst.isa, 'RV128I');
}

// OP-64
function dec_rv128i_op64_subd() {
    let inst = new Instruction('01000000011100110000001011111011');
    assertEq(inst.asm, 'subd x5, x6, x7');
    assertEq(inst.isa, 'RV128I');
}

// OP-IMM
function dec_rv128i_opimm_srli_shamt101() {
    let inst = new Instruction('00000110010100001101001110010011');
    assertEq(inst.asm, 'srli x7, x1, 101');
    assertEq(inst.isa, 'RV128I');
}

// OP-IMM-64
function dec_rv128i_opimm64_addid() {
    let inst = new Instruction('fce087db');
    assertEq(inst.asm, 'addid x15, x1, -50');
    assertEq(inst.isa, 'RV128I');
}

function dec_rv128i_opimm64_sraid() {
    let inst = new Instruction('4154525b');
    assertEq(inst.asm, 'sraid x4, x8, 21');
    assertEq(inst.isa, 'RV128I');
}

/*
 * Zifencei
 */
// MISC-MEM
function dec_zifencei_miscmem_fencei() {
    let inst = new Instruction('0000100f');
    assertEq(inst.bin, '00000000000000000001000000001111');
    assertEq(inst.asm, 'fence.i');
}

/*
 * Zicsr
 */
function dec_zicsr_system_csrrs() {
    let inst = new Instruction('01111010001001100010001001110011');
    let instAbi = new Instruction('01111010001001100010001001110011', { ABI:true });
    assertEq(inst.asm, 'csrrs x4, tdata2, x12');
    assertEq(instAbi.asm, 'csrrs tp, tdata2, a2');
}

function dec_zicsr_system_csrrwi() {
    let inst = new Instruction('11110001010010111101000011110011');
    let instAbi = new Instruction('11110001010010111101000011110011', { ABI:true });
    assertEq(inst.asm, 'csrrwi x1, mhartid, 23');
    assertEq(instAbi.asm, 'csrrwi ra, mhartid, 23');
}

/*
 * M extension
 */
// OP
function dec_rv32m_op_divu() {
    let inst = new Instruction('00000010111100111101000110110011');
    assertEq(inst.asm, 'divu x3, x7, x15');
    assertEq(inst.isa, 'RV32M');
}

// OP-32
function dec_rv64m_op32_mulw() {
    let inst = new Instruction('00000011110101101000001010111011');
    assertEq(inst.asm, 'mulw x5, x13, x29');
    assertEq(inst.isa, 'RV64M');
}

// OP-64
function dec_rv128m_op64_remd() {
    let inst = new Instruction('00000010000110011110001111111011');
    assertEq(inst.asm, 'remd x7, x19, x1');
    assertEq(inst.isa, 'RV128M');
}

/*
 * A extension
 */
function dec_rv32a_amo_amomaxuw() {
    let inst = new Instruction('11100000010101010010001100101111');
    let instAbi = new Instruction('11100000010101010010001100101111', { ABI:true });
    assertEq(inst.asm, 'amomaxu.w x6, x5, (x10)');
    assertEq(instAbi.asm, 'amomaxu.w t1, t0, (a0)');
}

function dec_rv64a_amo_lrd() {
    let inst = new Instruction('00010110000001010011001100101111');
    let instAbi = new Instruction('00010110000001010011001100101111', { ABI:true });
    assertEq(inst.asm, 'lr.d x6, (x10)');
    assertEq(instAbi.asm, 'lr.d t1, (a0)');
}

function dec_rv128a_amo_amoorq() {
    let inst = new Instruction('01000001110001010100111010101111');
    let instAbi = new Instruction('01000001110001010100111010101111', { ABI:true });
    assertEq(inst.asm, 'amoor.q x29, x28, (x10)');
    assertEq(instAbi.asm, 'amoor.q t4, t3, (a0)');
}

/*
 * F extension
 */
function dec_rv32f_loadfp_flw() {
    let inst = new Instruction('00000110010001000010001110000111');
    let instAbi = new Instruction('00000110010001000010001110000111', { ABI:true });
    assertEq(inst.asm, 'flw f7, 100(x8)');
    assertEq(instAbi.asm, 'flw ft7, 100(s0)');
}

function dec_rv32f_storefp_fsw() {
    let inst = new Instruction('00000110111001001010001000100111');
    let instAbi = new Instruction('00000110111001001010001000100111', { ABI:true });
    assertEq(inst.asm, 'fsw f14, 100(x9)');
    assertEq(instAbi.asm, 'fsw fa4, 100(s1)');
}

function dec_rv32f_madd_fmadds() {
    let inst = new Instruction('11111000111100111000000111000011');
    let instAbi = new Instruction('11111000111100111000000111000011', { ABI:true });
    assertEq(inst.asm, 'fmadd.s f3, f7, f15, f31');
    assertEq(instAbi.asm, 'fmadd.s ft3, ft7, fa5, ft11');
}

function dec_rv32f_nmsub_fnmsubs() {
    let inst = new Instruction('10000000100000100101000101001011');
    let instAbi = new Instruction('10000000100000100101000101001011', { ABI:true });
    assertEq(inst.asm, 'fnmsub.s f2, f4, f8, f16');
    assertEq(instAbi.asm, 'fnmsub.s ft2, ft4, fs0, fa6');
}

function dec_rv32f_opfp_fadds() {
    let inst = new Instruction('00000001000101001010001011010011');
    let instAbi = new Instruction('00000001000101001010001011010011', { ABI:true });
    assertEq(inst.asm, 'fadd.s f5, f9, f17');
    assertEq(instAbi.asm, 'fadd.s ft5, fs1, fa7');
}

function dec_rv32f_opfp_fsgnjxs() {
    let inst = new Instruction('00100001100001100010001101010011');
    let instAbi = new Instruction('00100001100001100010001101010011', { ABI:true });
    assertEq(inst.asm, 'fsgnjx.s f6, f12, f24');
    assertEq(instAbi.asm, 'fsgnjx.s ft6, fa2, fs8');
}

function dec_rv32f_opfp_flts() {
    let inst = new Instruction('10100000010100100001001101010011');
    let instAbi = new Instruction('10100000010100100001001101010011', { ABI:true });
    assertEq(inst.asm, 'flt.s x6, f4, f5');
    assertEq(instAbi.asm, 'flt.s t1, ft4, ft5');
}

function dec_rv32f_opfp_fmvwx() {
    let inst = new Instruction('11110000000001010000010111010011');
    let instAbi = new Instruction('11110000000001010000010111010011', { ABI:true });
    assertEq(inst.asm, 'fmv.w.x f11, x10');
    assertEq(instAbi.asm, 'fmv.w.x fa1, a0');
}

function dec_rv64f_opfp_fcvtlus() {
    let inst = new Instruction('11000000001100001110011101010011');
    assertEq(inst.asm, 'fcvt.lu.s x14, f1');
    assertEq(inst.isa, 'RV64F');
}

function dec_rv128f_opfp_fcvtst() {
    let inst = new Instruction('11010000010001111111000101010011');
    assertEq(inst.asm, 'fcvt.s.t f2, x15');
    assertEq(inst.isa, 'RV128F');
}

/*
 * D extension
 */
function dec_rv32d_loadfp_fld() {
    let inst = new Instruction('00000110010101001011001010000111');
    let instAbi = new Instruction('00000110010101001011001010000111', { ABI:true });
    assertEq(inst.asm, 'fld f5, 101(x9)');
    assertEq(instAbi.asm, 'fld ft5, 101(s1)');
}

function dec_rv32d_storefp_fsd() {
    let inst = new Instruction('00000110110101000011000110100111');
    let instAbi = new Instruction('00000110110101000011000110100111', { ABI:true });
    assertEq(inst.asm, 'fsd f13, 99(x8)');
    assertEq(instAbi.asm, 'fsd fa3, 99(s0)');
}

function dec_rv32d_msub_fmsubd() {
    let inst = new Instruction('11110010111000110111000101000111');
    let instAbi = new Instruction('11110010111000110111000101000111', { ABI:true });
    assertEq(inst.asm, 'fmsub.d f2, f6, f14, f30');
    assertEq(instAbi.asm, 'fmsub.d ft2, ft6, fa4, ft10');
}

function dec_rv32d_opfp_fsubd() {
    let inst = new Instruction('00001011000001000111001001010011');
    let instAbi = new Instruction('00001011000001000111001001010011', { ABI:true });
    assertEq(inst.asm, 'fsub.d f4, f8, f16');
    assertEq(instAbi.asm, 'fsub.d ft4, fs0, fa6');
}

function dec_rv32d_opfp_fsgnjnd() {
    let inst = new Instruction('00100011100101101001001111010011');
    let instAbi = new Instruction('00100011100101101001001111010011', { ABI:true });
    assertEq(inst.asm, 'fsgnjn.d f7, f13, f25');
    assertEq(instAbi.asm, 'fsgnjn.d ft7, fa3, fs9');
}

function dec_rv32d_opfp_feqd() {
    let inst = new Instruction('10100010010000101010001111010011');
    let instAbi = new Instruction('10100010010000101010001111010011', { ABI:true });
    assertEq(inst.asm, 'feq.d x7, f5, f4');
    assertEq(instAbi.asm, 'feq.d t2, ft5, ft4');
}

function dec_rv32d_opfp_fcvtdw() {
    let inst = new Instruction('11010010000010100111000111010011');
    let instAbi = new Instruction('11010010000010100111000111010011', { ABI:true });
    assertEq(inst.asm, 'fcvt.d.w f3, x20');
    assertEq(instAbi.asm, 'fcvt.d.w ft3, s4');
}

function dec_rv64d_opfp_fmvxd() {
    let inst = new Instruction('11100010000001001000011001010011');
    assertEq(inst.asm, 'fmv.x.d x12, f9');
    assertEq(inst.isa, 'RV64D');
}

function dec_rv128d_opfp_fcvttud() {
    let inst = new Instruction('11000010010101000111010101010011', { ABI:true });
    assertEq(inst.asm, 'fcvt.tu.d a0, fs0');
    assertEq(inst.isa, 'RV128D');
}

/*
 * Q extension
 */
function dec_rv32q_loadfp_flq() {
    let inst = new Instruction('00000110011101010100001000000111');
    let instAbi = new Instruction('00000110011101010100001000000111', { ABI:true });
    assertEq(inst.asm, 'flq f4, 103(x10)');
    assertEq(instAbi.asm, 'flq ft4, 103(a0)');
}

function dec_rv32q_storefp_fsq() {
    let inst = new Instruction('00000110110000111100000000100111');
    let instAbi = new Instruction('00000110110000111100000000100111', { ABI:true });
    assertEq(inst.asm, 'fsq f12, 96(x7)');
    assertEq(instAbi.asm, 'fsq fa2, 96(t2)');
}

function dec_rv32q_nmadd_fnmaddq() {
    let inst = new Instruction('11101110110100101111000011001111');
    let instAbi = new Instruction('11101110110100101111000011001111', { ABI:true });
    assertEq(inst.asm, 'fnmadd.q f1, f5, f13, f29');
    assertEq(instAbi.asm, 'fnmadd.q ft1, ft5, fa3, ft9');
}

function dec_rv32q_opfp_fsqrtq() {
    let inst = new Instruction('01011110000010101111010111010011');
    let instAbi = new Instruction('01011110000010101111010111010011', { ABI:true });
    assertEq(inst.asm, 'fsqrt.q f11, f21');
    assertEq(instAbi.asm, 'fsqrt.q fa1, fs5');
}

function dec_rv32q_opfp_fmaxq() {
    let inst = new Instruction('00101111111011100001011111010011');
    let instAbi = new Instruction('00101111111011100001011111010011', { ABI:true });
    assertEq(inst.asm, 'fmax.q f15, f28, f30');
    assertEq(instAbi.asm, 'fmax.q fa5, ft8, ft10');
}

function dec_rv32q_opfp_fclassq() {
    let inst = new Instruction('11100110000000000001100111010011');
    let instAbi = new Instruction('11100110000000000001100111010011', { ABI:true });
    assertEq(inst.asm, 'fclass.q x19, f0');
    assertEq(instAbi.asm, 'fclass.q s3, ft0');
}

function dec_rv32q_opfp_fcvtqd() {
    let inst = new Instruction('01000110000101000111001111010011');
    let instAbi = new Instruction('01000110000101000111001111010011', { ABI:true });
    assertEq(inst.asm, 'fcvt.q.d f7, f8');
    assertEq(instAbi.asm, 'fcvt.q.d ft7, fs0');
}

function dec_rv32q_opfp_fcvtsq() {
    let inst = new Instruction('01000000001101001111001101010011');
    let instAbi = new Instruction('01000000001101001111001101010011', { ABI:true });
    assertEq(inst.asm, 'fcvt.s.q f6, f9');
    assertEq(instAbi.asm, 'fcvt.s.q ft6, fs1');
}

function dec_rv128q_opfp_fmvxq() {
    let inst = new Instruction('11100110000010011000010011010011', { ABI:true });
    assertEq(inst.asm, 'fmv.x.q s1, fs3');
    assertEq(inst.isa, 'RV128Q');
}

/*
 * C0 quadrant
 */
function dec_rv32c_c0ciw_caddi4spn() {
    let inst = new Instruction('0001001101001000');
    let instAbi = new Instruction('0001001101001000', { ABI:true });
    assertEq(inst.asm, 'c.addi4spn x10, 420');
    assertEq(instAbi.asm, 'c.addi4spn a0, 420');
}

function dec_rv32fc_c0cl_cflw() {
    let inst = new Instruction('0110110110100000');
    let instAbi = new Instruction('0110110110100000', { ABI:true });
    assertEq(inst.asm, 'c.flw f8, 88(x11)');
    assertEq(instAbi.asm, 'c.flw fs0, 88(a1)');
}

function dec_rv128c_c0cl_clq() {
    let inst = new Instruction('0010111011010000', { ISA:COPTS_ISA.RV128I });
    let instAbi = new Instruction('0010111011010000', { ISA:COPTS_ISA.RV128I, ABI:true });
    assertEq(inst.asm, 'c.lq x12, 400(x13)');
    assertEq(instAbi.asm, 'c.lq a2, 400(a3)');
}

function dec_rv32dc_c0cs_cfsd() {
    let inst = new Instruction('1010011010111100');
    let instAbi = new Instruction('1010011010111100', { ABI:true });
    assertEq(inst.asm, 'c.fsd f15, 72(x13)');
    assertEq(instAbi.asm, 'c.fsd fa5, 72(a3)');
}

function dec_rv32c_c0cs_csw() {
    let inst = new Instruction('1100101101110100');
    let instAbi = new Instruction('1100101101110100', { ABI:true });
    assertEq(inst.asm, 'c.sw x13, 84(x14)');
    assertEq(instAbi.asm, 'c.sw a3, 84(a4)');
}

/*
 * C1 quadrant
 */
function dec_rv32c_c1ci_cnop() {
    let inst = new Instruction('0000000000000001');
    let instAbi = new Instruction('0000000000000001', { ABI:true });
    assertEq(inst.asm, 'c.nop');
}

function dec_rv32c_c1ci_caddi() {
    let inst = new Instruction('0001111111100101');
    let instAbi = new Instruction('0001111111100101', { ABI:true });
    assertEq(inst.asm, 'c.addi x31, -7');
    assertEq(instAbi.asm, 'c.addi t6, -7');
}

function dec_rv32c_c1cj_cjal() {
    let inst = new Instruction('0011110010010101');
    assertEq(inst.asm, 'c.jal -1420');
}

function dec_rv64c_c1ci_caddiw() {
    let inst = new Instruction('0010101001011001', { ISA:COPTS_ISA.RV64I });
    assertEq(inst.asm, 'c.addiw x20, 22');
    assertEq(inst.isa, 'RV64C');
}

function dec_rv32c_c1ci_caddi16sp() {
    let inst = new Instruction('0110000101101001');
    assertEq(inst.asm, 'c.addi16sp 208');
}

function dec_rv32c_c1ci_clui() {
    let inst = new Instruction('0111000010010101');
    let instAbi = new Instruction('0111000010010101', { ABI:true });
    assertEq(inst.asm, 'c.lui x1, -110592');
    assertEq(instAbi.asm, 'c.lui ra, -110592');
}

function dec_rv32c_c1cb_csrli() {
    let inst = new Instruction('1000000111101101');
    let instAbi = new Instruction('1000000111101101', { ABI:true });
    assertEq(inst.asm, 'c.srli x11, 27');
    assertEq(instAbi.asm, 'c.srli a1, 27');
}

function dec_rv128c_c1cb_csrai64() {
    let inst = new Instruction('1000010100000001');
    assertEq(inst.asm, 'c.srai64 x10');
    assertEq(inst.isa, 'RV128C');
}

function dec_rv32c_c1ca_cxor() {
    let inst = new Instruction('1000111110111101');
    let instAbi = new Instruction('1000111110111101', { ABI:true });
    assertEq(inst.asm, 'c.xor x15, x15');
    assertEq(instAbi.asm, 'c.xor a5, a5');
}

function dec_rv64c_c1ca_csubw() {
    let inst = new Instruction('1001111010011001');
    assertEq(inst.asm, 'c.subw x13, x14');
    assertEq(inst.isa, 'RV64C');
}

/*
 * C2 quadrant
 */
function dec_rv32c_c2cb_cbnez() {
    let inst = new Instruction('1111010000100101');
    let instAbi = new Instruction('1111010000100101', { ABI:true });
    assertEq(inst.asm, 'c.bnez x8, -152');
    assertEq(instAbi.asm, 'c.bnez s0, -152');
}

function dec_rv64c_c2ci_cslli() {
    let inst = new Instruction('0001001111001010');
    assertEq(inst.asm, 'c.slli x7, 50');
    assertEq(inst.isa, 'RV64C');
}

function dec_rv32fc_c2ci_cflwsp() {
    let inst = new Instruction('0110001100000010');
    let instAbi = new Instruction('0110001100000010', { ABI:true });
    assertEq(inst.asm, 'c.flwsp f6, 0');
    assertEq(instAbi.asm, 'c.flwsp ft6, 0');
}

function dec_rv64c_c2css_csdsp() {
    let inst = new Instruction('1110110011000010', { ISA:COPTS_ISA.RV64I });
    let instAbi = new Instruction('1110110011000010', { ISA:COPTS_ISA.RV64I, ABI:true });
    assertEq(inst.asm, 'c.sdsp x16, 88');
    assertEq(instAbi.asm, 'c.sdsp a6, 88');
}

function dec_rv32c_c2cr_cjr() {
    let inst = new Instruction('1000101010000010');
    let instAbi = new Instruction('1000101010000010', { ABI:true });
    assertEq(inst.asm, 'c.jr x21');
    assertEq(instAbi.asm, 'c.jr s5');
}

function dec_rv32c_c2cr_cmv() {
    let inst = new Instruction('1000001010011010');
    let instAbi = new Instruction('1000001010011010', { ABI:true });
    assertEq(inst.asm, 'c.mv x5, x6');
    assertEq(instAbi.asm, 'c.mv t0, t1');
}

function dec_rv32c_c2cr_cebreak() {
    let inst = new Instruction('1001000000000010');
    assertEq(inst.asm, 'c.ebreak');
}

function dec_rv32c_c2cr_cadd() {
    let inst = new Instruction('1001100011001010');
    let instAbi = new Instruction('1001100011001010', { ABI:true });
    assertEq(inst.asm, 'c.add x17, x18');
    assertEq(instAbi.asm, 'c.add a7, s2');
}

/*
 * Execute tests
 */
batchTests('Decoder Tests', [
    ['Dec - RV32I    - LUI       - lui', dec_rv32i_lui_lui],
    ['Dec - RV32I    - AUIPC     - auipc', dec_rv32i_auipc_auipc],
    ['Dec - RV32I    - JAL       - jal', dec_rv32i_jal_jal],
    ['Dec - RV32I    - JALR      - jalr', dec_rv32i_jalr_jalr],
    ['Dec - RV32I    - BRANCH    - beq', dec_rv32i_branch_beq],
    ['Dec - RV32I    - LOAD      - lw', dec_rv32i_load_lw],
    ['Dec - RV32I    - STORE     - sw', dec_rv32i_store_sw],
    ['Dec - RV32I    - OP-IMM    - addi', dec_rv32i_opimm_addi],
    ['Dec - RV32I    - OP-IMM    - srai', dec_rv32i_opimm_srai],
    ['Dec - RV32I    - OP        - add', dec_rv32i_op_add],
    ['Dec - RV32I    - MISC-MEM  - fence', dec_rv32i_miscmem_fence],
    ['Dec - RV32I    - SYSTEM    - ebreak', dec_rv32i_system_ebreak],
    ['Dec - RV64I    - OP-32     - addw', dec_rv64i_op32_addw],
    ['Dec - RV64I    - OP-IMM    - srai - [shamt=43]', dec_rv64i_opimm_srai_shamt43],
    ['Dec - RV64I    - OP-IMM-32 - addiw', dec_rv64i_opimm32_addiw],
    ['Dec - RV64I    - OP-IMM-32 - slliw', dec_rv64i_opim32_slliw],
    ['Dec - RV128I   - MISC-MEM  - lq', dec_rv128i_miscmem_lq],
    ['Dec - RV128I   - OP-64     - subd', dec_rv128i_op64_subd],
    ['Dec - RV128I   - OP-IMM    - srli - [shamt=101]', dec_rv128i_opimm_srli_shamt101],
    ['Dec - RV128I   - OP-IMM-64 - addid', dec_rv128i_opimm64_addid],
    ['Dec - RV128I   - OP-IMM-64 - sraid', dec_rv128i_opimm64_sraid],
    ['Dec - Zifencei - MISC-MEM  - fence.i', dec_zifencei_miscmem_fencei],
    ['Dec - Zicsr    - SYSTEM    - csrrs', dec_zicsr_system_csrrs],
    ['Dec - Zicsr    - SYSTEM    - csrrwi', dec_zicsr_system_csrrwi],
    ['Dec - RV32M    - OP        - divu', dec_rv32m_op_divu],
    ['Dec - RV64M    - OP-32     - mulw', dec_rv64m_op32_mulw],
    ['Dec - RV128M   - OP-64     - remd', dec_rv128m_op64_remd],
    ['Dec - RV32A    - AMO       - amomaxu.w', dec_rv32a_amo_amomaxuw],
    ['Dec - RV64A    - AMO       - lr.d', dec_rv64a_amo_lrd],
    ['Dec - RV128A   - AMO       - amoor.q', dec_rv128a_amo_amoorq],
    ['Dec - RV32F    - LOAD-FP   - flw', dec_rv32f_loadfp_flw],
    ['Dec - RV32F    - STORE-FP  - fsw', dec_rv32f_storefp_fsw],
    ['Dec - RV32F    - MADD      - fmadd.s', dec_rv32f_madd_fmadds],
    ['Dec - RV32F    - NMSUB     - fnmsub.s', dec_rv32f_nmsub_fnmsubs],
    ['Dec - RV32F    - OP-FP     - fadd.s', dec_rv32f_opfp_fadds],
    ['Dec - RV32F    - OP-FP     - fsgnjx.s', dec_rv32f_opfp_fsgnjxs],
    ['Dec - RV32F    - OP-FP     - flt.s', dec_rv32f_opfp_flts],
    ['Dec - RV32F    - OP-FP     - fmv.w.x', dec_rv32f_opfp_fmvwx],
    ['Dec - RV64F    - OP-FP     - fcvt.lu.s', dec_rv64f_opfp_fcvtlus],
    ['Dec - RV128F   - OP-FP     - fcvt.s.t', dec_rv128f_opfp_fcvtst],
    ['Dec - RV32D    - LOAD-FP   - fld', dec_rv32d_loadfp_fld],
    ['Dec - RV32D    - STORE-FP  - fsd', dec_rv32d_storefp_fsd],
    ['Dec - RV32D    - MSUB      - fmsub.d', dec_rv32d_msub_fmsubd],
    ['Dec - RV32D    - OP-FP     - fsub.d', dec_rv32d_opfp_fsubd],
    ['Dec - RV32D    - OP-FP     - fsgnjn.d', dec_rv32d_opfp_fsgnjnd],
    ['Dec - RV32D    - OP-FP     - feq.d', dec_rv32d_opfp_feqd],
    ['Dec - RV32D    - OP-FP     - fcvt.d.w', dec_rv32d_opfp_fcvtdw],
    ['Dec - RV64D    - OP-FP     - fmv.x.d', dec_rv64d_opfp_fmvxd],
    ['Dec - RV128D   - OP-FP     - fcvt.tu.d', dec_rv128d_opfp_fcvttud],
    ['Dec - RV32Q    - LOAD-FP   - flq', dec_rv32q_loadfp_flq],
    ['Dec - RV32Q    - STORE-FP  - fsq', dec_rv32q_storefp_fsq],
    ['Dec - RV32Q    - NMADD     - fnmadd.q', dec_rv32q_nmadd_fnmaddq],
    ['Dec - RV32Q    - OP-FP     - fsqrt.q', dec_rv32q_opfp_fsqrtq],
    ['Dec - RV32Q    - OP-FP     - fmax.q', dec_rv32q_opfp_fmaxq],
    ['Dec - RV32Q    - OP-FP     - fclass.q', dec_rv32q_opfp_fclassq],
    ['Dec - RV32Q    - OP-FP     - fcvt.q.d', dec_rv32q_opfp_fcvtqd],
    ['Dec - RV32Q    - OP-FP     - fcvt.s.q', dec_rv32q_opfp_fcvtsq],
    ['Dec - RV128Q   - OP-FP     - fmv.x.q', dec_rv128q_opfp_fmvxq],
    ['Dec - RV32C    - C0-CIW    - c.addi4spn', dec_rv32c_c0ciw_caddi4spn],
    ['Dec - RV32FC   - C0-CL     - c.flw', dec_rv32fc_c0cl_cflw],
    ['Dec - RV64C    - C0-CL     - c.lq', dec_rv128c_c0cl_clq],
    ['Dec - RV32DC   - C0-CS     - c.fsd', dec_rv32dc_c0cs_cfsd],
    ['Dec - RV32C    - C0-CS     - c.sw', dec_rv32c_c0cs_csw],
    ['Dec - RV32C    - C1-CI     - c.nop', dec_rv32c_c1ci_cnop],
    ['Dec - RV32C    - C1-CI     - c.addi', dec_rv32c_c1ci_caddi],
    ['Dec - RV32C    - C1-CJ     - c.jal', dec_rv32c_c1cj_cjal],
    ['Dec - RV64C    - C1-CI     - c.addiw', dec_rv64c_c1ci_caddiw],
    ['Dec - RV32C    - C1-CI     - c.addi16sp', dec_rv32c_c1ci_caddi16sp],
    ['Dec - RV32C    - C1-CI     - c.lui', dec_rv32c_c1ci_clui],
    ['Dec - RV32C    - C1-CB     - c.srli', dec_rv32c_c1cb_csrli],
    ['Dec - RV128C   - C1-CB     - c.srai64', dec_rv128c_c1cb_csrai64],
    ['Dec - RV32C    - C1-CA     - c.xor', dec_rv32c_c1ca_cxor],
    ['Dec - RV32C    - C1-CA     - c.subw', dec_rv64c_c1ca_csubw],
    ['Dec - RV32C    - C2-CB     - c.bnez', dec_rv32c_c2cb_cbnez],
    ['Dec - RV64C    - C2-CI     - c.slli', dec_rv64c_c2ci_cslli],
    ['Dec - RV32FC   - C2-CI     - c.flwsp', dec_rv32fc_c2ci_cflwsp],
    ['Dec - RV64C    - C2-CSS    - c.sdsp', dec_rv64c_c2css_csdsp],
    ['Dec - RV32C    - C2-CR     - c.jr', dec_rv32c_c2cr_cjr],
    ['Dec - RV32C    - C2-CR     - c.mv', dec_rv32c_c2cr_cmv],
    ['Dec - RV32C    - C2-CR     - c.ebreak', dec_rv32c_c2cr_cebreak],
    ['Dec - RV32C    - C2-CR     - c.add', dec_rv32c_c2cr_cadd],
]);

// Newline
console.log('');
