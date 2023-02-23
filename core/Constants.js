// SPDX-License-Identifier: AGPL-3.0-or-later

/*
 * RISC-V Instruction Encoder/Decoder
 *
 * Copyright (c) 2021-2022 LupLab @ UC Davis
 */

// Bases for parsing
export const BASE = {
  bin: 2,
  dec: 10,
  hex: 16
}

// Width of an integer register
export const XLEN = {
  rv32:  32,
  rv64:  64,
  rv128: 128,
}

export const XLEN_MASK = {
  rv32:  0b001,
  rv64:  0b010,
  rv128: 0b100,
  all:   0b111,
}

// Width of a floating-point register
// export const FLEN = {
//   F: 32,
//   D: 64
// }

// Encoding for floating-point register width
export const FP_WIDTH = {
  S: '010',
  D: '011',
  Q: '100',
}

// Encoding for value width of floatint-point operations
export const FP_FMT = {
  S: '00',  //  32-bit
  D: '01',  //  64-bit
/*H: '10',  //  16-bit */ // Unused in G extension
  Q: '11',  // 128-bit
}

/*
 * Instruction fields
 */

// Definition of fields shared by most instruction types
export const FIELDS = {
  // Fields common to multiple instruction types
  opcode: { pos: [6, 7],  name: 'opcode' },
  rd:     { pos: [11, 5], name: 'rd' },
  funct3: { pos: [14, 3], name: 'funct3' },
  rs1:    { pos: [19, 5], name: 'rs1' },
  rs2:    { pos: [24, 5], name: 'rs2' },

  // R-type
  r_funct5: { pos: [31, 5], name: 'funct5' },
  r_funct7: { pos: [31, 7], name: 'funct7' },

  // R-type: AMO acquire/release bits
  r_aq: { pos: [26, 1], name: 'aq' },
  r_rl: { pos: [25, 1], name: 'rl' },

  // R-type: FP specific fields
  r_fp_fmt: { pos: [26, 2], name: 'fmt' },

  // I-type
  i_imm_11_0: { pos: [31, 12], name: 'imm[11:0]' },

  // I-type: shift instructions
  i_shtyp_11_7: { pos: [31, 5], name: 'shtyp[11:7]'},
  i_shtyp_11_6: { pos: [31, 6], name: 'shtyp[11:6]'},
  i_shtyp_11_5: { pos: [31, 7], name: 'shtyp[11:5]'},
  i_shtyp:      { pos: [30, 1], name: 'shtyp' },
  i_shamt_6:    { pos: [26, 1], name: 'shamt[6]' },
  i_shamt_6_0:  { pos: [26, 7], name: 'shamt[6:0]' },
  i_shamt_5:    { pos: [25, 1], name: 'shamt[5]' },
  i_shamt_5_0:  { pos: [25, 6], name: 'shamt[5:0]' },
  i_shamt:      { pos: [24, 5], name: 'shamt[4:0]' },

  // I-type: trap instructions
  i_funct12: { pos: [31, 12], name: 'funct12' },

  // I-type: CSR instructions
  i_csr:     { pos: [31, 12], name: 'csr' },
  i_imm_4_0: { pos: [19, 5],  name: 'imm[4:0]' },

  // I-type: fence instructions
  i_fm:   { pos: [31, 4], name: 'fm' },
  i_pred: { pos: [27, 4], name: 'pred' },
  i_succ: { pos: [23, 4], name: 'succ' },

  // S-type
  s_imm_4_0:  { pos: [11, 5], name: 'imm[4:0]' },
  s_imm_11_5: { pos: [31, 7], name: 'imm[11:5]' },

  // B-type
  b_imm_4_1:  { pos: [11, 4], name: 'imm[4:1]' },
  b_imm_11:   { pos: [7, 1],  name: 'imm[11]' },
  b_imm_10_5: { pos: [30, 6], name: 'imm[10:5]' },
  b_imm_12:   { pos: [31, 1], name: 'imm[12]' },

  // U-type
  u_imm_31_12 : { pos: [31, 20], name: 'imm[31:12]' },

  // J-type
  j_imm_20:     { pos: [31, 1],  name: 'imm[20]' },
  j_imm_10_1:   { pos: [30, 10], name: 'imm[10:1]' },
  j_imm_11:     { pos: [20, 1],  name: 'imm[11]' },
  j_imm_19_12:  { pos: [19, 8],  name: 'imm[19:12]' },

  // ISA_C: general
  c_opcode:     { pos: [1, 2],   name: 'opcode' },
  c_funct6:     { pos: [15, 6],  name: 'funct6' },
  c_funct4:     { pos: [15, 4],  name: 'funct4' },
  c_funct3:     { pos: [15, 3],  name: 'funct3' },
  c_funct2:     { pos: [6, 2],   name: 'funct2' },
  c_funct2_cb:  { pos: [11, 2],  name: 'funct2' },

  // ISA_C: registers
  c_rd:             { pos: [11, 5],  name: 'rd' },
  c_rs1:            { pos: [11, 5],  name: 'rs1' },
  c_rd_rs1:         { pos: [11, 5],  name: 'rd/rs1' },
  c_rs2:            { pos: [6, 5],   name: 'rs2' },
  c_rd_prime:       { pos: [4, 3],   name: 'rd\'' },
  c_rs2_prime:      { pos: [4, 3],   name: 'rs2\'' },
  c_rs1_prime:      { pos: [9, 3],   name: 'rs1\'' },
  c_rd_rs1_prime:   { pos: [9, 3],   name: 'rd\'/rs1\'' },

  // ISA_C: immediates
  // - referenced by inst format type and index starting from MSB
  c_imm_ci_0:   { pos: [12, 1],  name: 'imm' },
  c_imm_ci_1:   { pos: [6, 5],   name: 'imm' },
  c_imm_css:    { pos: [12, 6],  name: 'imm' },
  c_imm_ciw:    { pos: [12, 8],  name: 'imm' },
  c_imm_cl_0:   { pos: [12, 3],  name: 'imm' },
  c_imm_cl_1:   { pos: [6, 2],   name: 'imm' },
  c_imm_cs_0:   { pos: [12, 3],  name: 'imm' },
  c_imm_cs_1:   { pos: [6, 2],   name: 'imm' },
  c_imm_cb_0:   { pos: [12, 3],  name: 'imm' },
  c_imm_cb_1:   { pos: [6, 5],   name: 'imm' },
  c_imm_cj:     { pos: [12, 11], name: 'imm' },
  c_shamt_0:    { pos: [12, 1],  name: 'shamt' },
  c_shamt_1:    { pos: [6, 5],   name: 'shamt' },
}


/*
 * Instruction opcodes
 */

// RVG base opcode map (assuming inst[1:0] = '11')
export const OPCODE = {
  LOAD:     '0000011',
  LOAD_FP:  '0000111',
  MISC_MEM: '0001111',
  OP_IMM:   '0010011',
  AUIPC:    '0010111',
  OP_IMM_32:'0011011',
  STORE:    '0100011',
  STORE_FP: '0100111',
  AMO:      '0101111',
  OP:       '0110011',
  OP_32:    '0111011',
  LUI:      '0110111',
  MADD:     '1000011',
  MSUB:     '1000111',
  NMSUB:    '1001011',
  NMADD:    '1001111',
  OP_FP:    '1010011',
  OP_IMM_64:'1011011',
  BRANCH:   '1100011',
  JALR:     '1100111',
  JAL:      '1101111',
  SYSTEM:   '1110011',
  OP_64:    '1111011',
}

// RVC base opcode map (assuming inst[1:0] =/= '11')
export const C_OPCODE = {
  C0:   '00',
  C1:   '01',
  C2:   '10',
}


/*
 * ISA
 */

// RV32I instruction set
export const ISA_RV32I = {
  lui:    { isa: 'RV32I', fmt: 'U-type', opcode: OPCODE.LUI },
  auipc:  { isa: 'RV32I', fmt: 'U-type', opcode: OPCODE.AUIPC },

  jal:    { isa: 'RV32I', fmt: 'J-type', opcode: OPCODE.JAL },

  jalr:   { isa: 'RV32I', fmt: 'I-type', funct3: '000', opcode: OPCODE.JALR },

  beq:    { isa: 'RV32I', fmt: 'B-type', funct3: '000', opcode: OPCODE.BRANCH },
  bne:    { isa: 'RV32I', fmt: 'B-type', funct3: '001', opcode: OPCODE.BRANCH },
  blt:    { isa: 'RV32I', fmt: 'B-type', funct3: '100', opcode: OPCODE.BRANCH },
  bge:    { isa: 'RV32I', fmt: 'B-type', funct3: '101', opcode: OPCODE.BRANCH },
  bltu:   { isa: 'RV32I', fmt: 'B-type', funct3: '110', opcode: OPCODE.BRANCH },
  bgeu:   { isa: 'RV32I', fmt: 'B-type', funct3: '111', opcode: OPCODE.BRANCH },

  lb:     { isa: 'RV32I', fmt: 'I-type', funct3: '000', opcode: OPCODE.LOAD },
  lh:     { isa: 'RV32I', fmt: 'I-type', funct3: '001', opcode: OPCODE.LOAD },
  lw:     { isa: 'RV32I', fmt: 'I-type', funct3: '010', opcode: OPCODE.LOAD },
  lbu:    { isa: 'RV32I', fmt: 'I-type', funct3: '100', opcode: OPCODE.LOAD },
  lhu:    { isa: 'RV32I', fmt: 'I-type', funct3: '101', opcode: OPCODE.LOAD },

  sb:     { isa: 'RV32I', fmt: 'S-type', funct3: '000', opcode: OPCODE.STORE },
  sh:     { isa: 'RV32I', fmt: 'S-type', funct3: '001', opcode: OPCODE.STORE },
  sw:     { isa: 'RV32I', fmt: 'S-type', funct3: '010', opcode: OPCODE.STORE },

  addi:   { isa: 'RV32I', fmt: 'I-type', funct3: '000', opcode: OPCODE.OP_IMM },
  slti:   { isa: 'RV32I', fmt: 'I-type', funct3: '010', opcode: OPCODE.OP_IMM },
  sltiu:  { isa: 'RV32I', fmt: 'I-type', funct3: '011', opcode: OPCODE.OP_IMM },
  xori:   { isa: 'RV32I', fmt: 'I-type', funct3: '100', opcode: OPCODE.OP_IMM },
  ori:    { isa: 'RV32I', fmt: 'I-type', funct3: '110', opcode: OPCODE.OP_IMM },
  andi:   { isa: 'RV32I', fmt: 'I-type', funct3: '111', opcode: OPCODE.OP_IMM },

  slli:   { isa: 'RV32I', fmt: 'I-type', shtyp: '0', funct3: '001', opcode: OPCODE.OP_IMM },
  srli:   { isa: 'RV32I', fmt: 'I-type', shtyp: '0', funct3: '101', opcode: OPCODE.OP_IMM },
  srai:   { isa: 'RV32I', fmt: 'I-type', shtyp: '1', funct3: '101', opcode: OPCODE.OP_IMM },

  add:    { isa: 'RV32I', fmt: 'R-type', funct7: '0000000', funct3: '000', opcode: OPCODE.OP },
  sub:    { isa: 'RV32I', fmt: 'R-type', funct7: '0100000', funct3: '000', opcode: OPCODE.OP },
  sll:    { isa: 'RV32I', fmt: 'R-type', funct7: '0000000', funct3: '001', opcode: OPCODE.OP },
  slt:    { isa: 'RV32I', fmt: 'R-type', funct7: '0000000', funct3: '010', opcode: OPCODE.OP },
  sltu:   { isa: 'RV32I', fmt: 'R-type', funct7: '0000000', funct3: '011', opcode: OPCODE.OP },
  xor:    { isa: 'RV32I', fmt: 'R-type', funct7: '0000000', funct3: '100', opcode: OPCODE.OP },
  srl:    { isa: 'RV32I', fmt: 'R-type', funct7: '0000000', funct3: '101', opcode: OPCODE.OP },
  sra:    { isa: 'RV32I', fmt: 'R-type', funct7: '0100000', funct3: '101', opcode: OPCODE.OP },
  or:     { isa: 'RV32I', fmt: 'R-type', funct7: '0000000', funct3: '110', opcode: OPCODE.OP },
  and:    { isa: 'RV32I', fmt: 'R-type', funct7: '0000000', funct3: '111', opcode: OPCODE.OP },

  fence:  { isa: 'RV32I', fmt: 'I-type', funct3: '000', opcode: OPCODE.MISC_MEM },

  ecall:  { isa: 'RV32I', fmt: 'I-type', funct12: '000000000000', funct3: '000', opcode: OPCODE.SYSTEM },
  ebreak: { isa: 'RV32I', fmt: 'I-type', funct12: '000000000001', funct3: '000', opcode: OPCODE.SYSTEM },
}

// RV64I instruction set
export const ISA_RV64I = {
  addiw:  { isa: 'RV64I', fmt: 'I-type', funct3: '000', opcode: OPCODE.OP_IMM_32 },

  slliw:  { isa: 'RV64I', fmt: 'I-type', shtyp: '0', funct3: '001', opcode: OPCODE.OP_IMM_32 },
  srliw:  { isa: 'RV64I', fmt: 'I-type', shtyp: '0', funct3: '101', opcode: OPCODE.OP_IMM_32 },
  sraiw:  { isa: 'RV64I', fmt: 'I-type', shtyp: '1', funct3: '101', opcode: OPCODE.OP_IMM_32 },

  addw:   { isa: 'RV64I', fmt: 'R-type', funct7: '0000000', funct3: '000', opcode: OPCODE.OP_32 },
  subw:   { isa: 'RV64I', fmt: 'R-type', funct7: '0100000', funct3: '000', opcode: OPCODE.OP_32 },
  sllw:   { isa: 'RV64I', fmt: 'R-type', funct7: '0000000', funct3: '001', opcode: OPCODE.OP_32 },
  srlw:   { isa: 'RV64I', fmt: 'R-type', funct7: '0000000', funct3: '101', opcode: OPCODE.OP_32 },
  sraw:   { isa: 'RV64I', fmt: 'R-type', funct7: '0100000', funct3: '101', opcode: OPCODE.OP_32 },

  ld:     { isa: 'RV64I', fmt: 'I-type', funct3: '011', opcode: OPCODE.LOAD },
  lwu:    { isa: 'RV64I', fmt: 'I-type', funct3: '110', opcode: OPCODE.LOAD },

  sd:     { isa: 'RV64I', fmt: 'S-type', funct3: '011', opcode: OPCODE.STORE },
}

// RV6128I instruction set
export const ISA_RV128I = {
  addid:  { isa: 'RV128I', fmt: 'I-type', funct3: '000', opcode: OPCODE.OP_IMM_64 },

  sllid:  { isa: 'RV128I', fmt: 'I-type', shtyp: '0', funct3: '001', opcode: OPCODE.OP_IMM_64 },
  srlid:  { isa: 'RV128I', fmt: 'I-type', shtyp: '0', funct3: '101', opcode: OPCODE.OP_IMM_64 },
  sraid:  { isa: 'RV128I', fmt: 'I-type', shtyp: '1', funct3: '101', opcode: OPCODE.OP_IMM_64 },

  addd:   { isa: 'RV128I', fmt: 'R-type', funct7: '0000000', funct3: '000', opcode: OPCODE.OP_64 },
  subd:   { isa: 'RV128I', fmt: 'R-type', funct7: '0100000', funct3: '000', opcode: OPCODE.OP_64 },
  slld:   { isa: 'RV128I', fmt: 'R-type', funct7: '0000000', funct3: '001', opcode: OPCODE.OP_64 },
  srld:   { isa: 'RV128I', fmt: 'R-type', funct7: '0000000', funct3: '101', opcode: OPCODE.OP_64 },
  srad:   { isa: 'RV128I', fmt: 'R-type', funct7: '0100000', funct3: '101', opcode: OPCODE.OP_64 },

  lq:     { isa: 'RV128I', fmt: 'I-type', funct3: '010', opcode: OPCODE.MISC_MEM },
  ldu:    { isa: 'RV128I', fmt: 'I-type', funct3: '111', opcode: OPCODE.LOAD },

  sq:     { isa: 'RV128I', fmt: 'S-type', funct3: '100', opcode: OPCODE.STORE },
}

// Zifencei instruction set
export const ISA_Zifencei = {
  'fence.i':  { isa: 'Zifencei', fmt: 'I-type', funct3: '001', opcode: OPCODE.MISC_MEM },
}

// Zicsr instruction set
export const ISA_Zicsr = {
  csrrw:  { isa: 'Zicsr', fmt: 'I-type', funct3: '001', opcode: OPCODE.SYSTEM },
  csrrs:  { isa: 'Zicsr', fmt: 'I-type', funct3: '010', opcode: OPCODE.SYSTEM },
  csrrc:  { isa: 'Zicsr', fmt: 'I-type', funct3: '011', opcode: OPCODE.SYSTEM },
  csrrwi: { isa: 'Zicsr', fmt: 'I-type', funct3: '101', opcode: OPCODE.SYSTEM },
  csrrsi: { isa: 'Zicsr', fmt: 'I-type', funct3: '110', opcode: OPCODE.SYSTEM },
  csrrci: { isa: 'Zicsr', fmt: 'I-type', funct3: '111', opcode: OPCODE.SYSTEM },
}

// M instruction set
export const ISA_M = {
  mul:    { isa: 'RV32M', fmt: 'R-type', funct7: '0000001', funct3: '000', opcode: OPCODE.OP },
  mulh:   { isa: 'RV32M', fmt: 'R-type', funct7: '0000001', funct3: '001', opcode: OPCODE.OP },
  mulhsu: { isa: 'RV32M', fmt: 'R-type', funct7: '0000001', funct3: '010', opcode: OPCODE.OP },
  mulhu:  { isa: 'RV32M', fmt: 'R-type', funct7: '0000001', funct3: '011', opcode: OPCODE.OP },
  div:    { isa: 'RV32M', fmt: 'R-type', funct7: '0000001', funct3: '100', opcode: OPCODE.OP },
  divu:   { isa: 'RV32M', fmt: 'R-type', funct7: '0000001', funct3: '101', opcode: OPCODE.OP },
  rem:    { isa: 'RV32M', fmt: 'R-type', funct7: '0000001', funct3: '110', opcode: OPCODE.OP },
  remu:   { isa: 'RV32M', fmt: 'R-type', funct7: '0000001', funct3: '111', opcode: OPCODE.OP },

  mulw:   { isa: 'RV64M', fmt: 'R-type', funct7: '0000001', funct3: '000', opcode: OPCODE.OP_32 },
  divw:   { isa: 'RV64M', fmt: 'R-type', funct7: '0000001', funct3: '100', opcode: OPCODE.OP_32 },
  divuw:  { isa: 'RV64M', fmt: 'R-type', funct7: '0000001', funct3: '101', opcode: OPCODE.OP_32 },
  remw:   { isa: 'RV64M', fmt: 'R-type', funct7: '0000001', funct3: '110', opcode: OPCODE.OP_32 },
  remuw:  { isa: 'RV64M', fmt: 'R-type', funct7: '0000001', funct3: '111', opcode: OPCODE.OP_32 },

  muld:   { isa: 'RV128M', fmt: 'R-type', funct7: '0000001', funct3: '000', opcode: OPCODE.OP_64 },
  divd:   { isa: 'RV128M', fmt: 'R-type', funct7: '0000001', funct3: '100', opcode: OPCODE.OP_64 },
  divud:  { isa: 'RV128M', fmt: 'R-type', funct7: '0000001', funct3: '101', opcode: OPCODE.OP_64 },
  remd:   { isa: 'RV128M', fmt: 'R-type', funct7: '0000001', funct3: '110', opcode: OPCODE.OP_64 },
  remud:  { isa: 'RV128M', fmt: 'R-type', funct7: '0000001', funct3: '111', opcode: OPCODE.OP_64 },
}

// A instruction set
export const ISA_A = {
  'lr.w':      { isa: 'RV32A', fmt: 'R-type', funct5: '00010', funct3: '010', opcode: OPCODE.AMO },
  'sc.w':      { isa: 'RV32A', fmt: 'R-type', funct5: '00011', funct3: '010', opcode: OPCODE.AMO },
  'amoswap.w': { isa: 'RV32A', fmt: 'R-type', funct5: '00001', funct3: '010', opcode: OPCODE.AMO },
  'amoadd.w':  { isa: 'RV32A', fmt: 'R-type', funct5: '00000', funct3: '010', opcode: OPCODE.AMO },
  'amoxor.w':  { isa: 'RV32A', fmt: 'R-type', funct5: '00100', funct3: '010', opcode: OPCODE.AMO },
  'amoand.w':  { isa: 'RV32A', fmt: 'R-type', funct5: '01100', funct3: '010', opcode: OPCODE.AMO },
  'amoor.w':   { isa: 'RV32A', fmt: 'R-type', funct5: '01000', funct3: '010', opcode: OPCODE.AMO },
  'amomin.w':  { isa: 'RV32A', fmt: 'R-type', funct5: '10000', funct3: '010', opcode: OPCODE.AMO },
  'amomax.w':  { isa: 'RV32A', fmt: 'R-type', funct5: '10100', funct3: '010', opcode: OPCODE.AMO },
  'amominu.w': { isa: 'RV32A', fmt: 'R-type', funct5: '11000', funct3: '010', opcode: OPCODE.AMO },
  'amomaxu.w': { isa: 'RV32A', fmt: 'R-type', funct5: '11100', funct3: '010', opcode: OPCODE.AMO },

  'lr.d':      { isa: 'RV64A', fmt: 'R-type', funct5: '00010', funct3: '011', opcode: OPCODE.AMO },
  'sc.d':      { isa: 'RV64A', fmt: 'R-type', funct5: '00011', funct3: '011', opcode: OPCODE.AMO },
  'amoswap.d': { isa: 'RV64A', fmt: 'R-type', funct5: '00001', funct3: '011', opcode: OPCODE.AMO },
  'amoadd.d':  { isa: 'RV64A', fmt: 'R-type', funct5: '00000', funct3: '011', opcode: OPCODE.AMO },
  'amoxor.d':  { isa: 'RV64A', fmt: 'R-type', funct5: '00100', funct3: '011', opcode: OPCODE.AMO },
  'amoand.d':  { isa: 'RV64A', fmt: 'R-type', funct5: '01100', funct3: '011', opcode: OPCODE.AMO },
  'amoor.d':   { isa: 'RV64A', fmt: 'R-type', funct5: '01000', funct3: '011', opcode: OPCODE.AMO },
  'amomin.d':  { isa: 'RV64A', fmt: 'R-type', funct5: '10000', funct3: '011', opcode: OPCODE.AMO },
  'amomax.d':  { isa: 'RV64A', fmt: 'R-type', funct5: '10100', funct3: '011', opcode: OPCODE.AMO },
  'amominu.d': { isa: 'RV64A', fmt: 'R-type', funct5: '11000', funct3: '011', opcode: OPCODE.AMO },
  'amomaxu.d': { isa: 'RV64A', fmt: 'R-type', funct5: '11100', funct3: '011', opcode: OPCODE.AMO },

  'lr.q':      { isa: 'RV128A', fmt: 'R-type', funct5: '00010', funct3: '100', opcode: OPCODE.AMO },
  'sc.q':      { isa: 'RV128A', fmt: 'R-type', funct5: '00011', funct3: '100', opcode: OPCODE.AMO },
  'amoswap.q': { isa: 'RV128A', fmt: 'R-type', funct5: '00001', funct3: '100', opcode: OPCODE.AMO },
  'amoadd.q':  { isa: 'RV128A', fmt: 'R-type', funct5: '00000', funct3: '100', opcode: OPCODE.AMO },
  'amoxor.q':  { isa: 'RV128A', fmt: 'R-type', funct5: '00100', funct3: '100', opcode: OPCODE.AMO },
  'amoand.q':  { isa: 'RV128A', fmt: 'R-type', funct5: '01100', funct3: '100', opcode: OPCODE.AMO },
  'amoor.q':   { isa: 'RV128A', fmt: 'R-type', funct5: '01000', funct3: '100', opcode: OPCODE.AMO },
  'amomin.q':  { isa: 'RV128A', fmt: 'R-type', funct5: '10000', funct3: '100', opcode: OPCODE.AMO },
  'amomax.q':  { isa: 'RV128A', fmt: 'R-type', funct5: '10100', funct3: '100', opcode: OPCODE.AMO },
  'amominu.q': { isa: 'RV128A', fmt: 'R-type', funct5: '11000', funct3: '100', opcode: OPCODE.AMO },
  'amomaxu.q': { isa: 'RV128A', fmt: 'R-type', funct5: '11100', funct3: '100', opcode: OPCODE.AMO },
}

// F instruction set
export const ISA_F = {
  'flw':       { isa: 'RV32F', fmt: 'I-type', funct3: FP_WIDTH.S, opcode: OPCODE.LOAD_FP },
  'fsw':       { isa: 'RV32F', fmt: 'S-type', funct3: FP_WIDTH.S, opcode: OPCODE.STORE_FP },

  'fmadd.s':   { isa: 'RV32F', fmt: 'R4-type', fp_fmt: FP_FMT.S, opcode: OPCODE.MADD },
  'fmsub.s':   { isa: 'RV32F', fmt: 'R4-type', fp_fmt: FP_FMT.S, opcode: OPCODE.MSUB },
  'fnmadd.s':  { isa: 'RV32F', fmt: 'R4-type', fp_fmt: FP_FMT.S, opcode: OPCODE.NMADD },
  'fnmsub.s':  { isa: 'RV32F', fmt: 'R4-type', fp_fmt: FP_FMT.S, opcode: OPCODE.NMSUB },

  'fadd.s':    { isa: 'RV32F', fmt: 'R-type', funct5: '00000', fp_fmt: FP_FMT.S, opcode: OPCODE.OP_FP },
  'fsub.s':    { isa: 'RV32F', fmt: 'R-type', funct5: '00001', fp_fmt: FP_FMT.S, opcode: OPCODE.OP_FP },
  'fmul.s':    { isa: 'RV32F', fmt: 'R-type', funct5: '00010', fp_fmt: FP_FMT.S, opcode: OPCODE.OP_FP },
  'fdiv.s':    { isa: 'RV32F', fmt: 'R-type', funct5: '00011', fp_fmt: FP_FMT.S, opcode: OPCODE.OP_FP },

  'fsqrt.s':   { isa: 'RV32F', fmt: 'R-type', funct5: '01011', fp_fmt: FP_FMT.S, rs2: '00000', opcode: OPCODE.OP_FP },

  'fsgnj.s':   { isa: 'RV32F', fmt: 'R-type', funct5: '00100', fp_fmt: FP_FMT.S, funct3: '000', opcode: OPCODE.OP_FP },
  'fsgnjn.s':  { isa: 'RV32F', fmt: 'R-type', funct5: '00100', fp_fmt: FP_FMT.S, funct3: '001', opcode: OPCODE.OP_FP },
  'fsgnjx.s':  { isa: 'RV32F', fmt: 'R-type', funct5: '00100', fp_fmt: FP_FMT.S, funct3: '010', opcode: OPCODE.OP_FP },
  'fmin.s':    { isa: 'RV32F', fmt: 'R-type', funct5: '00101', fp_fmt: FP_FMT.S, funct3: '000', opcode: OPCODE.OP_FP },
  'fmax.s':    { isa: 'RV32F', fmt: 'R-type', funct5: '00101', fp_fmt: FP_FMT.S, funct3: '001', opcode: OPCODE.OP_FP },

  'feq.s':     { isa: 'RV32F', fmt: 'R-type', funct5: '10100', fp_fmt: FP_FMT.S, funct3: '010', opcode: OPCODE.OP_FP },
  'flt.s':     { isa: 'RV32F', fmt: 'R-type', funct5: '10100', fp_fmt: FP_FMT.S, funct3: '001', opcode: OPCODE.OP_FP },
  'fle.s':     { isa: 'RV32F', fmt: 'R-type', funct5: '10100', fp_fmt: FP_FMT.S, funct3: '000', opcode: OPCODE.OP_FP },

  'fcvt.w.s':  { isa: 'RV32F', fmt: 'R-type', funct5: '11000', fp_fmt: FP_FMT.S, rs2: '00000', opcode: OPCODE.OP_FP },
  'fcvt.wu.s': { isa: 'RV32F', fmt: 'R-type', funct5: '11000', fp_fmt: FP_FMT.S, rs2: '00001', opcode: OPCODE.OP_FP },
  'fcvt.s.w':  { isa: 'RV32F', fmt: 'R-type', funct5: '11010', fp_fmt: FP_FMT.S, rs2: '00000', opcode: OPCODE.OP_FP },
  'fcvt.s.wu': { isa: 'RV32F', fmt: 'R-type', funct5: '11010', fp_fmt: FP_FMT.S, rs2: '00001', opcode: OPCODE.OP_FP },

  'fclass.s':  { isa: 'RV32F', fmt: 'R-type', funct5: '11100', fp_fmt: FP_FMT.S, rs2: '00000', funct3: '001', opcode: OPCODE.OP_FP },

  'fmv.x.w':   { isa: 'RV32F', fmt: 'R-type', funct5: '11100', fp_fmt: FP_FMT.S, rs2: '00000', funct3: '000', opcode: OPCODE.OP_FP },
  'fmv.w.x':   { isa: 'RV32F', fmt: 'R-type', funct5: '11110', fp_fmt: FP_FMT.S, rs2: '00000', funct3: '000', opcode: OPCODE.OP_FP },

  'fcvt.l.s':  { isa: 'RV64F', fmt: 'R-type', funct5: '11000', fp_fmt: FP_FMT.S, rs2: '00010', opcode: OPCODE.OP_FP },
  'fcvt.lu.s': { isa: 'RV64F', fmt: 'R-type', funct5: '11000', fp_fmt: FP_FMT.S, rs2: '00011', opcode: OPCODE.OP_FP },
  'fcvt.s.l':  { isa: 'RV64F', fmt: 'R-type', funct5: '11010', fp_fmt: FP_FMT.S, rs2: '00010', opcode: OPCODE.OP_FP },
  'fcvt.s.lu': { isa: 'RV64F', fmt: 'R-type', funct5: '11010', fp_fmt: FP_FMT.S, rs2: '00011', opcode: OPCODE.OP_FP },

  'fcvt.t.s':  { isa: 'RV128F', fmt: 'R-type', funct5: '11000', fp_fmt: FP_FMT.S, rs2: '00100', opcode: OPCODE.OP_FP },
  'fcvt.tu.s': { isa: 'RV128F', fmt: 'R-type', funct5: '11000', fp_fmt: FP_FMT.S, rs2: '00101', opcode: OPCODE.OP_FP },
  'fcvt.s.t':  { isa: 'RV128F', fmt: 'R-type', funct5: '11010', fp_fmt: FP_FMT.S, rs2: '00100', opcode: OPCODE.OP_FP },
  'fcvt.s.tu': { isa: 'RV128F', fmt: 'R-type', funct5: '11010', fp_fmt: FP_FMT.S, rs2: '00101', opcode: OPCODE.OP_FP },
}

// D instruction set
export const ISA_D = {
  'fld':       { isa: 'RV32D', fmt: 'I-type', funct3: FP_WIDTH.D, opcode: OPCODE.LOAD_FP },
  'fsd':       { isa: 'RV32D', fmt: 'S-type', funct3: FP_WIDTH.D, opcode: OPCODE.STORE_FP },

  'fmadd.d':   { isa: 'RV32D', fmt: 'R4-type', fp_fmt: FP_FMT.D, opcode: OPCODE.MADD },
  'fmsub.d':   { isa: 'RV32D', fmt: 'R4-type', fp_fmt: FP_FMT.D, opcode: OPCODE.MSUB },
  'fnmadd.d':  { isa: 'RV32D', fmt: 'R4-type', fp_fmt: FP_FMT.D, opcode: OPCODE.NMADD },
  'fnmsub.d':  { isa: 'RV32D', fmt: 'R4-type', fp_fmt: FP_FMT.D, opcode: OPCODE.NMSUB },

  'fadd.d':    { isa: 'RV32D', fmt: 'R-type', funct5: '00000', fp_fmt: FP_FMT.D, opcode: OPCODE.OP_FP },
  'fsub.d':    { isa: 'RV32D', fmt: 'R-type', funct5: '00001', fp_fmt: FP_FMT.D, opcode: OPCODE.OP_FP },
  'fmul.d':    { isa: 'RV32D', fmt: 'R-type', funct5: '00010', fp_fmt: FP_FMT.D, opcode: OPCODE.OP_FP },
  'fdiv.d':    { isa: 'RV32D', fmt: 'R-type', funct5: '00011', fp_fmt: FP_FMT.D, opcode: OPCODE.OP_FP },

  'fsqrt.d':   { isa: 'RV32D', fmt: 'R-type', funct5: '01011', fp_fmt: FP_FMT.D, rs2: '00000', opcode: OPCODE.OP_FP },

  'fsgnj.d':   { isa: 'RV32D', fmt: 'R-type', funct5: '00100', fp_fmt: FP_FMT.D, funct3: '000', opcode: OPCODE.OP_FP },
  'fsgnjn.d':  { isa: 'RV32D', fmt: 'R-type', funct5: '00100', fp_fmt: FP_FMT.D, funct3: '001', opcode: OPCODE.OP_FP },
  'fsgnjx.d':  { isa: 'RV32D', fmt: 'R-type', funct5: '00100', fp_fmt: FP_FMT.D, funct3: '010', opcode: OPCODE.OP_FP },
  'fmin.d':    { isa: 'RV32D', fmt: 'R-type', funct5: '00101', fp_fmt: FP_FMT.D, funct3: '000', opcode: OPCODE.OP_FP },
  'fmax.d':    { isa: 'RV32D', fmt: 'R-type', funct5: '00101', fp_fmt: FP_FMT.D, funct3: '001', opcode: OPCODE.OP_FP },

  'feq.d':     { isa: 'RV32D', fmt: 'R-type', funct5: '10100', fp_fmt: FP_FMT.D, funct3: '010', opcode: OPCODE.OP_FP },
  'flt.d':     { isa: 'RV32D', fmt: 'R-type', funct5: '10100', fp_fmt: FP_FMT.D, funct3: '001', opcode: OPCODE.OP_FP },
  'fle.d':     { isa: 'RV32D', fmt: 'R-type', funct5: '10100', fp_fmt: FP_FMT.D, funct3: '000', opcode: OPCODE.OP_FP },

  'fcvt.w.d':  { isa: 'RV32D', fmt: 'R-type', funct5: '11000', fp_fmt: FP_FMT.D, rs2: '00000', opcode: OPCODE.OP_FP },
  'fcvt.wu.d': { isa: 'RV32D', fmt: 'R-type', funct5: '11000', fp_fmt: FP_FMT.D, rs2: '00001', opcode: OPCODE.OP_FP },
  'fcvt.d.w':  { isa: 'RV32D', fmt: 'R-type', funct5: '11010', fp_fmt: FP_FMT.D, rs2: '00000', opcode: OPCODE.OP_FP },
  'fcvt.d.wu': { isa: 'RV32D', fmt: 'R-type', funct5: '11010', fp_fmt: FP_FMT.D, rs2: '00001', opcode: OPCODE.OP_FP },

  'fcvt.s.d':  { isa: 'RV32D', fmt: 'R-type', funct5: '01000', fp_fmt: FP_FMT.S, rs2: '000'+FP_FMT.D, opcode: OPCODE.OP_FP },
  'fcvt.d.s':  { isa: 'RV32D', fmt: 'R-type', funct5: '01000', fp_fmt: FP_FMT.D, rs2: '000'+FP_FMT.S, opcode: OPCODE.OP_FP },

  'fclass.d':  { isa: 'RV32D', fmt: 'R-type', funct5: '11100', fp_fmt: FP_FMT.D, rs2: '00000', funct3: '001', opcode: OPCODE.OP_FP },

  'fmv.x.d':   { isa: 'RV64D', fmt: 'R-type', funct5: '11100', fp_fmt: FP_FMT.D, rs2: '00000', funct3: '000', opcode: OPCODE.OP_FP },
  'fmv.d.x':   { isa: 'RV64D', fmt: 'R-type', funct5: '11110', fp_fmt: FP_FMT.D, rs2: '00000', funct3: '000', opcode: OPCODE.OP_FP },

  'fcvt.l.d':  { isa: 'RV64D', fmt: 'R-type', funct5: '11000', fp_fmt: FP_FMT.D, rs2: '00010', opcode: OPCODE.OP_FP },
  'fcvt.lu.d': { isa: 'RV64D', fmt: 'R-type', funct5: '11000', fp_fmt: FP_FMT.D, rs2: '00011', opcode: OPCODE.OP_FP },
  'fcvt.d.l':  { isa: 'RV64D', fmt: 'R-type', funct5: '11010', fp_fmt: FP_FMT.D, rs2: '00010', opcode: OPCODE.OP_FP },
  'fcvt.d.lu': { isa: 'RV64D', fmt: 'R-type', funct5: '11010', fp_fmt: FP_FMT.D, rs2: '00011', opcode: OPCODE.OP_FP },

  'fcvt.t.d':  { isa: 'RV128D', fmt: 'R-type', funct5: '11000', fp_fmt: FP_FMT.D, rs2: '00100', opcode: OPCODE.OP_FP },
  'fcvt.tu.d': { isa: 'RV128D', fmt: 'R-type', funct5: '11000', fp_fmt: FP_FMT.D, rs2: '00101', opcode: OPCODE.OP_FP },
  'fcvt.d.t':  { isa: 'RV128D', fmt: 'R-type', funct5: '11010', fp_fmt: FP_FMT.D, rs2: '00100', opcode: OPCODE.OP_FP },
  'fcvt.d.tu': { isa: 'RV128D', fmt: 'R-type', funct5: '11010', fp_fmt: FP_FMT.D, rs2: '00101', opcode: OPCODE.OP_FP },
}

// Q instruction set
export const ISA_Q = {
  'flq':       { isa: 'RV32Q', fmt: 'I-type', funct3: FP_WIDTH.Q, opcode: OPCODE.LOAD_FP },
  'fsq':       { isa: 'RV32Q', fmt: 'S-type', funct3: FP_WIDTH.Q, opcode: OPCODE.STORE_FP },

  'fmadd.q':   { isa: 'RV32Q', fmt: 'R4-type', fp_fmt: FP_FMT.Q, opcode: OPCODE.MADD },
  'fmsub.q':   { isa: 'RV32Q', fmt: 'R4-type', fp_fmt: FP_FMT.Q, opcode: OPCODE.MSUB },
  'fnmadd.q':  { isa: 'RV32Q', fmt: 'R4-type', fp_fmt: FP_FMT.Q, opcode: OPCODE.NMADD },
  'fnmsub.q':  { isa: 'RV32Q', fmt: 'R4-type', fp_fmt: FP_FMT.Q, opcode: OPCODE.NMSUB },

  'fadd.q':    { isa: 'RV32Q', fmt: 'R-type', funct5: '00000', fp_fmt: FP_FMT.Q, opcode: OPCODE.OP_FP },
  'fsub.q':    { isa: 'RV32Q', fmt: 'R-type', funct5: '00001', fp_fmt: FP_FMT.Q, opcode: OPCODE.OP_FP },
  'fmul.q':    { isa: 'RV32Q', fmt: 'R-type', funct5: '00010', fp_fmt: FP_FMT.Q, opcode: OPCODE.OP_FP },
  'fdiv.q':    { isa: 'RV32Q', fmt: 'R-type', funct5: '00011', fp_fmt: FP_FMT.Q, opcode: OPCODE.OP_FP },

  'fsqrt.q':   { isa: 'RV32Q', fmt: 'R-type', funct5: '01011', fp_fmt: FP_FMT.Q, rs2: '00000', opcode: OPCODE.OP_FP },

  'fsgnj.q':   { isa: 'RV32Q', fmt: 'R-type', funct5: '00100', fp_fmt: FP_FMT.Q, funct3: '000', opcode: OPCODE.OP_FP },
  'fsgnjn.q':  { isa: 'RV32Q', fmt: 'R-type', funct5: '00100', fp_fmt: FP_FMT.Q, funct3: '001', opcode: OPCODE.OP_FP },
  'fsgnjx.q':  { isa: 'RV32Q', fmt: 'R-type', funct5: '00100', fp_fmt: FP_FMT.Q, funct3: '010', opcode: OPCODE.OP_FP },
  'fmin.q':    { isa: 'RV32Q', fmt: 'R-type', funct5: '00101', fp_fmt: FP_FMT.Q, funct3: '000', opcode: OPCODE.OP_FP },
  'fmax.q':    { isa: 'RV32Q', fmt: 'R-type', funct5: '00101', fp_fmt: FP_FMT.Q, funct3: '001', opcode: OPCODE.OP_FP },

  'feq.q':     { isa: 'RV32Q', fmt: 'R-type', funct5: '10100', fp_fmt: FP_FMT.Q, funct3: '010', opcode: OPCODE.OP_FP },
  'flt.q':     { isa: 'RV32Q', fmt: 'R-type', funct5: '10100', fp_fmt: FP_FMT.Q, funct3: '001', opcode: OPCODE.OP_FP },
  'fle.q':     { isa: 'RV32Q', fmt: 'R-type', funct5: '10100', fp_fmt: FP_FMT.Q, funct3: '000', opcode: OPCODE.OP_FP },

  'fcvt.w.q':  { isa: 'RV32Q', fmt: 'R-type', funct5: '11000', fp_fmt: FP_FMT.Q, rs2: '00000', opcode: OPCODE.OP_FP },
  'fcvt.wu.q': { isa: 'RV32Q', fmt: 'R-type', funct5: '11000', fp_fmt: FP_FMT.Q, rs2: '00001', opcode: OPCODE.OP_FP },
  'fcvt.q.w':  { isa: 'RV32Q', fmt: 'R-type', funct5: '11010', fp_fmt: FP_FMT.Q, rs2: '00000', opcode: OPCODE.OP_FP },
  'fcvt.q.wu': { isa: 'RV32Q', fmt: 'R-type', funct5: '11010', fp_fmt: FP_FMT.Q, rs2: '00001', opcode: OPCODE.OP_FP },

  'fcvt.s.q':  { isa: 'RV32Q', fmt: 'R-type', funct5: '01000', fp_fmt: FP_FMT.S, rs2: '000'+FP_FMT.Q, opcode: OPCODE.OP_FP },
  'fcvt.q.s':  { isa: 'RV32Q', fmt: 'R-type', funct5: '01000', fp_fmt: FP_FMT.Q, rs2: '000'+FP_FMT.S, opcode: OPCODE.OP_FP },
  'fcvt.d.q':  { isa: 'RV32Q', fmt: 'R-type', funct5: '01000', fp_fmt: FP_FMT.D, rs2: '000'+FP_FMT.Q, opcode: OPCODE.OP_FP },
  'fcvt.q.d':  { isa: 'RV32Q', fmt: 'R-type', funct5: '01000', fp_fmt: FP_FMT.Q, rs2: '000'+FP_FMT.D, opcode: OPCODE.OP_FP },

  'fclass.q':  { isa: 'RV32Q', fmt: 'R-type', funct5: '11100', fp_fmt: FP_FMT.Q, rs2: '00000', funct3: '001', opcode: OPCODE.OP_FP },

  'fcvt.l.q':  { isa: 'RV64Q', fmt: 'R-type', funct5: '11000', fp_fmt: FP_FMT.Q, rs2: '00010', opcode: OPCODE.OP_FP },
  'fcvt.lu.q': { isa: 'RV64Q', fmt: 'R-type', funct5: '11000', fp_fmt: FP_FMT.Q, rs2: '00011', opcode: OPCODE.OP_FP },
  'fcvt.q.l':  { isa: 'RV64Q', fmt: 'R-type', funct5: '11010', fp_fmt: FP_FMT.Q, rs2: '00010', opcode: OPCODE.OP_FP },
  'fcvt.q.lu': { isa: 'RV64Q', fmt: 'R-type', funct5: '11010', fp_fmt: FP_FMT.Q, rs2: '00011', opcode: OPCODE.OP_FP },

  'fmv.x.q':   { isa: 'RV128Q', fmt: 'R-type', funct5: '11100', fp_fmt: FP_FMT.Q, rs2: '00000', funct3: '000', opcode: OPCODE.OP_FP },
  'fmv.q.x':   { isa: 'RV128Q', fmt: 'R-type', funct5: '11110', fp_fmt: FP_FMT.Q, rs2: '00000', funct3: '000', opcode: OPCODE.OP_FP },

  'fcvt.t.q':  { isa: 'RV128Q', fmt: 'R-type', funct5: '11000', fp_fmt: FP_FMT.Q, rs2: '00100', opcode: OPCODE.OP_FP },
  'fcvt.tu.q': { isa: 'RV128Q', fmt: 'R-type', funct5: '11000', fp_fmt: FP_FMT.Q, rs2: '00101', opcode: OPCODE.OP_FP },
  'fcvt.q.t':  { isa: 'RV128Q', fmt: 'R-type', funct5: '11010', fp_fmt: FP_FMT.Q, rs2: '00100', opcode: OPCODE.OP_FP },
  'fcvt.q.tu': { isa: 'RV128Q', fmt: 'R-type', funct5: '11010', fp_fmt: FP_FMT.Q, rs2: '00101', opcode: OPCODE.OP_FP },
}

// C instruction set
export const ISA_C = {
// Load and Store Instructions
  // Stack-Pointer Based Loads and Stores
  'c.lwsp':   { isa: 'C',  xlens: 0b111, fmt: 'CI-type', funct3: '010', rdRs1Mask: 0b10, rdRs1Excl: [0], uimm: true, immBits: [[5], [[4,2],[7,6]]], opcode: C_OPCODE.C2 },
  'c.ldsp':   { isa: 'C',  xlens: 0b110, fmt: 'CI-type', funct3: '011', rdRs1Mask: 0b10, rdRs1Excl: [0], uimm: true, immBits: [[5], [[4,3],[8,6]]], opcode: C_OPCODE.C2 },
  'c.lqsp':   { isa: 'C',  xlens: 0b100, fmt: 'CI-type', funct3: '001', rdRs1Mask: 0b10, rdRs1Excl: [0], uimm: true, immBits: [[5], [4,[9,6]]],     opcode: C_OPCODE.C2 },
  'c.flwsp':  { isa: 'FC', xlens: 0b001, fmt: 'CI-type', funct3: '011', rdRs1Mask: 0b10,                 uimm: true, immBits: [[5], [[4,2],[7,6]]], opcode: C_OPCODE.C2 },
  'c.fldsp':  { isa: 'DC', xlens: 0b011, fmt: 'CI-type', funct3: '001', rdRs1Mask: 0b10,                 uimm: true, immBits: [[5], [[4,3],[8,6]]], opcode: C_OPCODE.C2 },

  'c.swsp':   { isa: 'C',  xlens: 0b111, fmt: 'CSS-type', funct3: '110', uimm: true, immBits: [[5,2],[7,6]], opcode: C_OPCODE.C2 },
  'c.sdsp':   { isa: 'C',  xlens: 0b110, fmt: 'CSS-type', funct3: '111', uimm: true, immBits: [[5,3],[8,6]], opcode: C_OPCODE.C2 },
  'c.sqsp':   { isa: 'C',  xlens: 0b100, fmt: 'CSS-type', funct3: '101', uimm: true, immBits: [[5,4],[9,6]], opcode: C_OPCODE.C2 },
  'c.fswsp':  { isa: 'FC', xlens: 0b001, fmt: 'CSS-type', funct3: '111', uimm: true, immBits: [[5,2],[7,6]], opcode: C_OPCODE.C2 },
  'c.fsdsp':  { isa: 'DC', xlens: 0b011, fmt: 'CSS-type', funct3: '101', uimm: true, immBits: [[5,3],[8,6]], opcode: C_OPCODE.C2 },

  // Register Based Loads and Stores
  'c.lw':     { isa: 'C',  xlens: 0b111, fmt: 'CL-type', funct3: '010', uimm: true, immBits: [[[5,3]],   [2,6]],   opcode: C_OPCODE.C0 },
  'c.ld':     { isa: 'C',  xlens: 0b110, fmt: 'CL-type', funct3: '011', uimm: true, immBits: [[[5,3]],   [[7,6]]], opcode: C_OPCODE.C0 },
  'c.lq':     { isa: 'C',  xlens: 0b100, fmt: 'CL-type', funct3: '001', uimm: true, immBits: [[[5,4],8], [[7,6]]], opcode: C_OPCODE.C0 },
  'c.flw':    { isa: 'FC', xlens: 0b001, fmt: 'CL-type', funct3: '011', uimm: true, immBits: [[[5,3]],   [2,6]],   opcode: C_OPCODE.C0 },
  'c.fld':    { isa: 'DC', xlens: 0b011, fmt: 'CL-type', funct3: '001', uimm: true, immBits: [[[5,3]],   [[7,6]]], opcode: C_OPCODE.C0 },

  'c.sw':     { isa: 'C',  xlens: 0b111, fmt: 'CS-type', funct3: '110', uimm: true, immBits: [[[5,3]],   [2,6]],   opcode: C_OPCODE.C0 },
  'c.sd':     { isa: 'C',  xlens: 0b110, fmt: 'CS-type', funct3: '111', uimm: true, immBits: [[[5,3]],   [[7,6]]], opcode: C_OPCODE.C0 },
  'c.sq':     { isa: 'C',  xlens: 0b100, fmt: 'CS-type', funct3: '101', uimm: true, immBits: [[[5,4],8], [[7,6]]], opcode: C_OPCODE.C0 },
  'c.fsw':    { isa: 'FC', xlens: 0b001, fmt: 'CS-type', funct3: '111', uimm: true, immBits: [[[5,3]],   [2,6]],   opcode: C_OPCODE.C0 },
  'c.fsd':    { isa: 'DC', xlens: 0b011, fmt: 'CS-type', funct3: '101', uimm: true, immBits: [[[5,3]],   [[7,6]]], opcode: C_OPCODE.C0 },

// Control Transfer Instructions
  'c.j':      { isa: 'C', xlens: 0b101, fmt: 'CJ-type', funct3: '101', immBits: [11,4,[9,8],10,6,7,[3,1],5], opcode: C_OPCODE.C1 },
  'c.jal':    { isa: 'C', xlens: 0b001, fmt: 'CJ-type', funct3: '001', immBits: [11,4,[9,8],10,6,7,[3,1],5], opcode: C_OPCODE.C1 },

  'c.jr':     { isa: 'C', xlens: 0b111, fmt: 'CR-type', funct4: '1000', rdRs1Mask: 0b01, rdRs1Excl: [0], rs2Val: 0, opcode: C_OPCODE.C2 },
  'c.jalr':   { isa: 'C', xlens: 0b111, fmt: 'CR-type', funct4: '1001', rdRs1Mask: 0b01, rdRs1Excl: [0], rs2Val: 0, opcode: C_OPCODE.C2 },

  'c.beqz':   { isa: 'C', xlens: 0b111, fmt: 'CB-type', funct3: '110', immBits: [[8,[4,3]], [[7,6],[2,1],5]], opcode: C_OPCODE.C1 },
  'c.bnez':   { isa: 'C', xlens: 0b111, fmt: 'CB-type', funct3: '111', immBits: [[8,[4,3]], [[7,6],[2,1],5]], opcode: C_OPCODE.C1 },

// Integer Computational Instructions
  // Integer Constant-Generator Instructions
  'c.li':       { isa: 'C', xlens: 0b111, fmt: 'CI-type', funct3: '010', rdRs1Mask: 0b10, rdRs1Excl: [0],                immBits: [[5],  [[4,0]]],   opcode: C_OPCODE.C1 },
  'c.lui':      { isa: 'C', xlens: 0b111, fmt: 'CI-type', funct3: '011', rdRs1Mask: 0b10, rdRs1Excl: [0,2], nzimm: true, immBits: [[17], [[16,12]]], opcode: C_OPCODE.C1 },

  // Integer Register-Immediate Operations
  'c.addi':     { isa: 'C', xlens: 0b111, fmt: 'CI-type', funct3: '000', rdRs1Mask: 0b11, rdRs1Excl: [0], nzimm: true,             immBits: [[5], [[4,0]]],       opcode: C_OPCODE.C1 },
  'c.addiw':    { isa: 'C', xlens: 0b110, fmt: 'CI-type', funct3: '001', rdRs1Mask: 0b11, rdRs1Excl: [0],                          immBits: [[5], [[4,0]]],       opcode: C_OPCODE.C1 },
  'c.addi16sp': { isa: 'C', xlens: 0b111, fmt: 'CI-type', funct3: '011', rdRs1Mask: 0b00, rdRs1Val: 2,    nzimm: true,             immBits: [[9], [4,6,[8,7],5]], opcode: C_OPCODE.C1 },
  'c.slli':     { isa: 'C', xlens: 0b111, fmt: 'CI-type', funct3: '000', rdRs1Mask: 0b11, rdRs1Excl: [0], nzimm: true, uimm: true, immBits: [[5], [[4,0]]],       opcode: C_OPCODE.C2 },
  'c.slli64':   { isa: 'C', xlens: 0b100, fmt: 'CI-type', funct3: '000', rdRs1Mask: 0b11, rdRs1Excl: [0], immVal: 0,               immBits: [[5], [[4,0]]],       opcode: C_OPCODE.C2 },

  'c.addi4spn': { isa: 'C', xlens: 0b111, fmt: 'CIW-type', funct3: '000', uimm: true, nzimm: true, immBits: [[5,4],[9,6],2,3], opcode: C_OPCODE.C0 },

  'c.srli':     { isa: 'C', xlens: 0b111, fmt: 'CB-type', funct3: '100', funct2: '00', nzimm: true, uimm: true, immBits: [[5], [[4,0]]], opcode: C_OPCODE.C1 },
  'c.srli64':   { isa: 'C', xlens: 0b100, fmt: 'CB-type', funct3: '100', funct2: '00', immVal: 0,               immBits: [[5], [[4,0]]], opcode: C_OPCODE.C1 },
  'c.srai':     { isa: 'C', xlens: 0b111, fmt: 'CB-type', funct3: '100', funct2: '01', nzimm: true, uimm: true, immBits: [[5], [[4,0]]], opcode: C_OPCODE.C1 },
  'c.srai64':   { isa: 'C', xlens: 0b100, fmt: 'CB-type', funct3: '100', funct2: '01', immVal: 0,               immBits: [[5], [[4,0]]], opcode: C_OPCODE.C1 },
  'c.andi':     { isa: 'C', xlens: 0b111, fmt: 'CB-type', funct3: '100', funct2: '10',                          immBits: [[5], [[4,0]]], opcode: C_OPCODE.C1 },

  // Integer Register-Register Operations
  'c.mv':     { isa: 'C', xlens: 0b111, fmt: 'CR-type', funct4: '1000', rdRs1Mask: 0b10, rdRs1Excl: [0], rs2Excl: [0], opcode: C_OPCODE.C2 },
  'c.add':    { isa: 'C', xlens: 0b111, fmt: 'CR-type', funct4: '1001', rdRs1Mask: 0b11, rdRs1Excl: [0], rs2Excl: [0], opcode: C_OPCODE.C2 },

  'c.and':    { isa: 'C', xlens: 0b111, fmt: 'CA-type', funct6: '100011', funct2: '11', opcode: C_OPCODE.C1 },
  'c.or':     { isa: 'C', xlens: 0b111, fmt: 'CA-type', funct6: '100011', funct2: '10', opcode: C_OPCODE.C1 },
  'c.xor':    { isa: 'C', xlens: 0b111, fmt: 'CA-type', funct6: '100011', funct2: '01', opcode: C_OPCODE.C1 },
  'c.sub':    { isa: 'C', xlens: 0b111, fmt: 'CA-type', funct6: '100011', funct2: '00', opcode: C_OPCODE.C1 },
  'c.subw':   { isa: 'C', xlens: 0b110, fmt: 'CA-type', funct6: '100111', funct2: '00', opcode: C_OPCODE.C1 },
  'c.addw':   { isa: 'C', xlens: 0b110, fmt: 'CA-type', funct6: '100111', funct2: '01', opcode: C_OPCODE.C1 },

// Other Instructions
  'c.nop':    { isa: 'C', xlens: 0b111, fmt: 'CI-type', funct3: '000', rdRs1Mask: 0b00, rdRs1Val: 0, immVal: 0, immBits: [[5], [[4,0]]], opcode: C_OPCODE.C1 },

  'c.ebreak': { isa: 'C', xlens: 0b111, fmt: 'CR-type', funct4: '1001', rdRs1Mask: 0b00, rdRs1Val: 0, rs2Val: 0, opcode: C_OPCODE.C2 },
}

// ISA per opcode
export const ISA_OP = {
  // RV32I
  [ISA_RV32I['add'].funct7  + ISA_RV32I['add'].funct3]:   'add',
  [ISA_RV32I['sub'].funct7  + ISA_RV32I['sub'].funct3]:   'sub',
  [ISA_RV32I['sll'].funct7  + ISA_RV32I['sll'].funct3]:   'sll',
  [ISA_RV32I['slt'].funct7  + ISA_RV32I['slt'].funct3]:   'slt',
  [ISA_RV32I['sltu'].funct7 + ISA_RV32I['sltu'].funct3]:  'sltu',
  [ISA_RV32I['xor'].funct7  + ISA_RV32I['xor'].funct3]:   'xor',
  [ISA_RV32I['srl'].funct7  + ISA_RV32I['srl'].funct3]:   'srl',
  [ISA_RV32I['sra'].funct7  + ISA_RV32I['sra'].funct3]:   'sra',
  [ISA_RV32I['or'].funct7   + ISA_RV32I['or'].funct3]:    'or',
  [ISA_RV32I['and'].funct7  + ISA_RV32I['and'].funct3]:   'and',
  // RV32M
  [ISA_M['mul'].funct7    + ISA_M['mul'].funct3]:     'mul',
  [ISA_M['mulh'].funct7   + ISA_M['mulh'].funct3]:    'mulh',
  [ISA_M['mulhsu'].funct7 + ISA_M['mulhsu'].funct3]:  'mulhsu',
  [ISA_M['mulhu'].funct7  + ISA_M['mulhu'].funct3]:   'mulhu',
  [ISA_M['div'].funct7    + ISA_M['div'].funct3]:     'div',
  [ISA_M['divu'].funct7   + ISA_M['divu'].funct3]:    'divu',
  [ISA_M['rem'].funct7    + ISA_M['rem'].funct3]:     'rem',
  [ISA_M['remu'].funct7   + ISA_M['remu'].funct3]:    'remu',
}

export const ISA_OP_32 = {
  // RV64I
  [ISA_RV64I['addw'].funct7 + ISA_RV64I['addw'].funct3]: 'addw',
  [ISA_RV64I['subw'].funct7 + ISA_RV64I['subw'].funct3]: 'subw',
  [ISA_RV64I['sllw'].funct7 + ISA_RV64I['sllw'].funct3]: 'sllw',
  [ISA_RV64I['srlw'].funct7 + ISA_RV64I['srlw'].funct3]: 'srlw',
  [ISA_RV64I['sraw'].funct7 + ISA_RV64I['sraw'].funct3]: 'sraw',
  // RV64M
  [ISA_M['mulw'].funct7  + ISA_M['mulw'].funct3]:   'mulw',
  [ISA_M['divw'].funct7  + ISA_M['divw'].funct3]:   'divw',
  [ISA_M['divuw'].funct7 + ISA_M['divuw'].funct3]:  'divuw',
  [ISA_M['remw'].funct7  + ISA_M['remw'].funct3]:   'remw',
  [ISA_M['remuw'].funct7 + ISA_M['remuw'].funct3]:  'remuw',
}

export const ISA_OP_64 = {
  // RV128I
  [ISA_RV128I['addd'].funct7 + ISA_RV128I['addd'].funct3]: 'addd',
  [ISA_RV128I['subd'].funct7 + ISA_RV128I['subd'].funct3]: 'subd',
  [ISA_RV128I['slld'].funct7 + ISA_RV128I['slld'].funct3]: 'slld',
  [ISA_RV128I['srld'].funct7 + ISA_RV128I['srld'].funct3]: 'srld',
  [ISA_RV128I['srad'].funct7 + ISA_RV128I['srad'].funct3]: 'srad',
  // RV128M
  [ISA_M['muld'].funct7  + ISA_M['muld'].funct3]:   'muld',
  [ISA_M['divd'].funct7  + ISA_M['divd'].funct3]:   'divd',
  [ISA_M['divud'].funct7 + ISA_M['divud'].funct3]:  'divud',
  [ISA_M['remd'].funct7  + ISA_M['remd'].funct3]:   'remd',
  [ISA_M['remud'].funct7 + ISA_M['remud'].funct3]:  'remud',
}

export const ISA_LOAD = {
  [ISA_RV32I['lb'].funct3]:   'lb',
  [ISA_RV32I['lh'].funct3]:   'lh',
  [ISA_RV32I['lw'].funct3]:   'lw',
  [ISA_RV64I['ld'].funct3]:   'ld',
  [ISA_RV32I['lbu'].funct3]:  'lbu',
  [ISA_RV32I['lhu'].funct3]:  'lhu',
  [ISA_RV64I['lwu'].funct3]:  'lwu',
  [ISA_RV128I['ldu'].funct3]: 'ldu',
}

export const ISA_STORE = {
  [ISA_RV32I['sb'].funct3]:   'sb',
  [ISA_RV32I['sh'].funct3]:   'sh',
  [ISA_RV32I['sw'].funct3]:   'sw',
  [ISA_RV64I['sd'].funct3]:   'sd',
  [ISA_RV128I['sq'].funct3]:  'sq',
}

export const ISA_OP_IMM = {
  [ISA_RV32I['addi'].funct3]:   'addi',
  [ISA_RV32I['slti'].funct3]:   'slti',
  [ISA_RV32I['sltiu'].funct3]:  'sltiu',
  [ISA_RV32I['xori'].funct3]:   'xori',
  [ISA_RV32I['ori'].funct3]:    'ori',
  [ISA_RV32I['andi'].funct3]:   'andi',

  [ISA_RV32I['slli'].funct3]:   'slli',
  [ISA_RV32I['srli'].funct3]: {
    [ISA_RV32I['srli'].shtyp]:  'srli',
    [ISA_RV32I['srai'].shtyp]:  'srai',
  }
}

export const ISA_OP_IMM_32 = {
  [ISA_RV64I['addiw'].funct3]:  'addiw',

  [ISA_RV64I['slliw'].funct3]:  'slliw',
  [ISA_RV64I['srliw'].funct3]: {
    [ISA_RV64I['srliw'].shtyp]: 'srliw',
    [ISA_RV64I['sraiw'].shtyp]: 'sraiw',
  }
}

export const ISA_OP_IMM_64 = {
  [ISA_RV128I['addid'].funct3]:   'addid',

  [ISA_RV128I['sllid'].funct3]:   'sllid',
  [ISA_RV128I['srlid'].funct3]: {
    [ISA_RV128I['srlid'].shtyp]:  'srlid',
    [ISA_RV128I['sraid'].shtyp]:  'sraid',
  }
}

export const ISA_BRANCH = {
  [ISA_RV32I['beq'].funct3]:  'beq',
  [ISA_RV32I['bne'].funct3]:  'bne',
  [ISA_RV32I['blt'].funct3]:  'blt',
  [ISA_RV32I['bge'].funct3]:  'bge',
  [ISA_RV32I['bltu'].funct3]: 'btlu',
  [ISA_RV32I['bgeu'].funct3]: 'bgeu',
}

export const ISA_MISC_MEM = {
  [ISA_RV32I['fence'].funct3]:      'fence',
  [ISA_Zifencei['fence.i'].funct3]: 'fence.i',
  [ISA_RV128I['lq'].funct3]:        'lq',
}

export const ISA_SYSTEM = {
  [ISA_RV32I['ecall'].funct3]: {
    [ISA_RV32I['ecall'].funct12]:   'ecall',
    [ISA_RV32I['ebreak'].funct12]:  'ebreak',
  },
  [ISA_Zicsr['csrrw'].funct3]:  'csrrw',
  [ISA_Zicsr['csrrs'].funct3]:  'csrrs',
  [ISA_Zicsr['csrrc'].funct3]:  'csrrc',
  [ISA_Zicsr['csrrwi'].funct3]: 'csrrwi',
  [ISA_Zicsr['csrrsi'].funct3]: 'csrrsi',
  [ISA_Zicsr['csrrci'].funct3]: 'csrrci',
}

export const ISA_AMO = {
  [ISA_A['lr.w'].funct5        + ISA_A['lr.w'].funct3]:      'lr.w',
  [ISA_A['sc.w'].funct5        + ISA_A['sc.w'].funct3]:      'sc.w',
  [ISA_A['amoswap.w'].funct5   + ISA_A['amoswap.w'].funct3]: 'amoswap.w',
  [ISA_A['amoadd.w'].funct5    + ISA_A['amoadd.w'].funct3]:  'amoadd.w',
  [ISA_A['amoxor.w'].funct5    + ISA_A['amoxor.w'].funct3]:  'amoxor.w',
  [ISA_A['amoand.w'].funct5    + ISA_A['amoand.w'].funct3]:  'amoand.w',
  [ISA_A['amoor.w'].funct5     + ISA_A['amoor.w'].funct3]:   'amoor.w',
  [ISA_A['amomin.w'].funct5    + ISA_A['amomin.w'].funct3]:  'amomin.w',
  [ISA_A['amomax.w'].funct5    + ISA_A['amomax.w'].funct3]:  'amomax.w',
  [ISA_A['amominu.w'].funct5   + ISA_A['amominu.w'].funct3]: 'amominu.w',
  [ISA_A['amomaxu.w'].funct5   + ISA_A['amomaxu.w'].funct3]: 'amomaxu.w',

  [ISA_A['lr.d'].funct5        + ISA_A['lr.d'].funct3]:      'lr.d',
  [ISA_A['sc.d'].funct5        + ISA_A['sc.d'].funct3]:      'sc.d',
  [ISA_A['amoswap.d'].funct5   + ISA_A['amoswap.d'].funct3]: 'amoswap.d',
  [ISA_A['amoadd.d'].funct5    + ISA_A['amoadd.d'].funct3]:  'amoadd.d',
  [ISA_A['amoxor.d'].funct5    + ISA_A['amoxor.d'].funct3]:  'amoxor.d',
  [ISA_A['amoand.d'].funct5    + ISA_A['amoand.d'].funct3]:  'amoand.d',
  [ISA_A['amoor.d'].funct5     + ISA_A['amoor.d'].funct3]:   'amoor.d',
  [ISA_A['amomin.d'].funct5    + ISA_A['amomin.d'].funct3]:  'amomin.d',
  [ISA_A['amomax.d'].funct5    + ISA_A['amomax.d'].funct3]:  'amomax.d',
  [ISA_A['amominu.d'].funct5   + ISA_A['amominu.d'].funct3]: 'amominu.d',
  [ISA_A['amomaxu.d'].funct5   + ISA_A['amomaxu.d'].funct3]: 'amomaxu.d',

  [ISA_A['lr.q'].funct5        + ISA_A['lr.q'].funct3]:      'lr.q',
  [ISA_A['sc.q'].funct5        + ISA_A['sc.q'].funct3]:      'sc.q',
  [ISA_A['amoswap.q'].funct5   + ISA_A['amoswap.q'].funct3]: 'amoswap.q',
  [ISA_A['amoadd.q'].funct5    + ISA_A['amoadd.q'].funct3]:  'amoadd.q',
  [ISA_A['amoxor.q'].funct5    + ISA_A['amoxor.q'].funct3]:  'amoxor.q',
  [ISA_A['amoand.q'].funct5    + ISA_A['amoand.q'].funct3]:  'amoand.q',
  [ISA_A['amoor.q'].funct5     + ISA_A['amoor.q'].funct3]:   'amoor.q',
  [ISA_A['amomin.q'].funct5    + ISA_A['amomin.q'].funct3]:  'amomin.q',
  [ISA_A['amomax.q'].funct5    + ISA_A['amomax.q'].funct3]:  'amomax.q',
  [ISA_A['amominu.q'].funct5   + ISA_A['amominu.q'].funct3]: 'amominu.q',
  [ISA_A['amomaxu.q'].funct5   + ISA_A['amomaxu.q'].funct3]: 'amomaxu.q',
}

export const ISA_LOAD_FP = {
  [FP_WIDTH.S]: 'flw',
  [FP_WIDTH.D]: 'fld',
  [FP_WIDTH.Q]: 'flq',
}

export const ISA_STORE_FP = {
  [FP_WIDTH.S]: 'fsw',
  [FP_WIDTH.D]: 'fsd',
  [FP_WIDTH.Q]: 'fsq',
}

export const ISA_MADD = {
  [FP_FMT.S]: 'fmadd.s',
  [FP_FMT.D]: 'fmadd.d',
  [FP_FMT.Q]: 'fmadd.q',
}

export const ISA_MSUB = {
  [FP_FMT.S]: 'fmsub.s',
  [FP_FMT.D]: 'fmsub.d',
  [FP_FMT.Q]: 'fmsub.q',
}

export const ISA_NMADD = {
  [FP_FMT.S]: 'fnmadd.s',
  [FP_FMT.D]: 'fnmadd.d',
  [FP_FMT.Q]: 'fnmadd.q',
}

export const ISA_NMSUB = {
  [FP_FMT.S]: 'fnmsub.s',
  [FP_FMT.D]: 'fnmsub.d',
  [FP_FMT.Q]: 'fnmsub.q',
}

export const ISA_OP_FP = {
  [ISA_F['fadd.s'].funct5]: {
    [FP_FMT.S]: 'fadd.s',
    [FP_FMT.D]: 'fadd.d',
    [FP_FMT.Q]: 'fadd.q',
  },
  [ISA_F['fsub.s'].funct5]: {
    [FP_FMT.S]: 'fsub.s',
    [FP_FMT.D]: 'fsub.d',
    [FP_FMT.Q]: 'fsub.q',
  },
  [ISA_F['fmul.s'].funct5]: {
    [FP_FMT.S]: 'fmul.s',
    [FP_FMT.D]: 'fmul.d',
    [FP_FMT.Q]: 'fmul.q',
  },
  [ISA_F['fdiv.s'].funct5]: {
    [FP_FMT.S]: 'fdiv.s',
    [FP_FMT.D]: 'fdiv.d',
    [FP_FMT.Q]: 'fdiv.q',
  },
  [ISA_F['fsqrt.s'].funct5]: {
    [FP_FMT.S]: 'fsqrt.s',
    [FP_FMT.D]: 'fsqrt.d',
    [FP_FMT.Q]: 'fsqrt.q',
  },
  [ISA_F['fmv.w.x'].funct5]: {
    [FP_FMT.S]: 'fmv.w.x',
    [FP_FMT.D]: 'fmv.d.x',
    [FP_FMT.Q]: 'fmv.q.x',
  },
  [ISA_F['fclass.s'].funct5]: {
    [FP_FMT.S]: {
      [ISA_F['fclass.s'].funct3]:   'fclass.s',
      [ISA_F['fmv.x.w'].funct3]:    'fmv.x.w',
    },
    [FP_FMT.D]: {
      [ISA_D['fclass.d'].funct3]:   'fclass.d',
      [ISA_D['fmv.x.d'].funct3]:    'fmv.x.d',
    },
    [FP_FMT.Q]: {
      [ISA_Q['fclass.q'].funct3]:   'fclass.q',
      [ISA_Q['fmv.x.q'].funct3]:    'fmv.x.q',
    },
  },
  [ISA_F['fsgnj.s'].funct5]: {
    [FP_FMT.S]: {
      [ISA_F['fsgnj.s'].funct3]:    'fsgnj.s',
      [ISA_F['fsgnjn.s'].funct3]:   'fsgnjn.s',
      [ISA_F['fsgnjx.s'].funct3]:   'fsgnjx.s',
    },
    [FP_FMT.D]: {
      [ISA_D['fsgnj.d'].funct3]:    'fsgnj.d',
      [ISA_D['fsgnjn.d'].funct3]:   'fsgnjn.d',
      [ISA_D['fsgnjx.d'].funct3]:   'fsgnjx.d',
    },
    [FP_FMT.Q]: {
      [ISA_Q['fsgnj.q'].funct3]:    'fsgnj.q',
      [ISA_Q['fsgnjn.q'].funct3]:   'fsgnjn.q',
      [ISA_Q['fsgnjx.q'].funct3]:   'fsgnjx.q',
    },
  },
  [ISA_F['fmin.s'].funct5]: {
    [FP_FMT.S]: {
      [ISA_F['fmin.s'].funct3]:     'fmin.s',
      [ISA_F['fmax.s'].funct3]:     'fmax.s',
    },
    [FP_FMT.D]: {
      [ISA_D['fmin.d'].funct3]:     'fmin.d',
      [ISA_D['fmax.d'].funct3]:     'fmax.d',
    },
    [FP_FMT.Q]: {
      [ISA_Q['fmin.q'].funct3]:     'fmin.q',
      [ISA_Q['fmax.q'].funct3]:     'fmax.q',
    },
  },
  [ISA_F['feq.s'].funct5]: {
    [FP_FMT.S]: {
      [ISA_F['feq.s'].funct3]:     'feq.s',
      [ISA_F['flt.s'].funct3]:     'flt.s',
      [ISA_F['fle.s'].funct3]:     'fle.s',
    },
    [FP_FMT.D]: {
      [ISA_D['feq.d'].funct3]:     'feq.d',
      [ISA_D['flt.d'].funct3]:     'flt.d',
      [ISA_D['fle.d'].funct3]:     'fle.d',
    },
    [FP_FMT.Q]: {
      [ISA_Q['feq.q'].funct3]:     'feq.q',
      [ISA_Q['flt.q'].funct3]:     'flt.q',
      [ISA_Q['fle.q'].funct3]:     'fle.q',
    },
  },
  [ISA_F['fcvt.w.s'].funct5]: {
    [FP_FMT.S]: {
      [ISA_F['fcvt.w.s'].rs2]:   'fcvt.w.s',
      [ISA_F['fcvt.wu.s'].rs2]:  'fcvt.wu.s',
      [ISA_F['fcvt.l.s'].rs2]:   'fcvt.l.s',
      [ISA_F['fcvt.lu.s'].rs2]:  'fcvt.lu.s',
      [ISA_F['fcvt.t.s'].rs2]:   'fcvt.t.s',
      [ISA_F['fcvt.tu.s'].rs2]:  'fcvt.tu.s',
    },
    [FP_FMT.D]: {
      [ISA_D['fcvt.w.d'].rs2]:   'fcvt.w.d',
      [ISA_D['fcvt.wu.d'].rs2]:  'fcvt.wu.d',
      [ISA_D['fcvt.l.d'].rs2]:   'fcvt.l.d',
      [ISA_D['fcvt.lu.d'].rs2]:  'fcvt.lu.d',
      [ISA_D['fcvt.t.d'].rs2]:   'fcvt.t.d',
      [ISA_D['fcvt.tu.d'].rs2]:  'fcvt.tu.d',
    },
    [FP_FMT.Q]: {
      [ISA_Q['fcvt.w.q'].rs2]:   'fcvt.w.q',
      [ISA_Q['fcvt.wu.q'].rs2]:  'fcvt.wu.q',
      [ISA_Q['fcvt.l.q'].rs2]:   'fcvt.l.q',
      [ISA_Q['fcvt.lu.q'].rs2]:  'fcvt.lu.q',
      [ISA_Q['fcvt.t.q'].rs2]:   'fcvt.t.q',
      [ISA_Q['fcvt.tu.q'].rs2]:  'fcvt.tu.q',
    },
  },
  [ISA_F['fcvt.s.w'].funct5]: {
    [FP_FMT.S]: {
      [ISA_F['fcvt.s.w'].rs2]:   'fcvt.s.w',
      [ISA_F['fcvt.s.wu'].rs2]:  'fcvt.s.wu',
      [ISA_F['fcvt.s.l'].rs2]:   'fcvt.s.l',
      [ISA_F['fcvt.s.lu'].rs2]:  'fcvt.s.lu',
      [ISA_F['fcvt.s.t'].rs2]:   'fcvt.s.t',
      [ISA_F['fcvt.s.tu'].rs2]:  'fcvt.s.tu',
    },
    [FP_FMT.D]: {
      [ISA_D['fcvt.d.w'].rs2]:   'fcvt.d.w',
      [ISA_D['fcvt.d.wu'].rs2]:  'fcvt.d.wu',
      [ISA_D['fcvt.d.l'].rs2]:   'fcvt.d.l',
      [ISA_D['fcvt.d.lu'].rs2]:  'fcvt.d.lu',
      [ISA_D['fcvt.d.t'].rs2]:   'fcvt.d.t',
      [ISA_D['fcvt.d.tu'].rs2]:  'fcvt.d.tu',
    },
    [FP_FMT.Q]: {
      [ISA_Q['fcvt.q.w'].rs2]:   'fcvt.q.w',
      [ISA_Q['fcvt.q.wu'].rs2]:  'fcvt.q.wu',
      [ISA_Q['fcvt.q.l'].rs2]:   'fcvt.q.l',
      [ISA_Q['fcvt.q.lu'].rs2]:  'fcvt.q.lu',
      [ISA_Q['fcvt.q.t'].rs2]:   'fcvt.q.t',
      [ISA_Q['fcvt.q.tu'].rs2]:  'fcvt.q.tu',
    },
  },
  [ISA_D['fcvt.s.d'].funct5]: {
    [FP_FMT.S]: {
      [ISA_D['fcvt.s.d'].rs2]:   'fcvt.s.d',
      [ISA_Q['fcvt.s.q'].rs2]:   'fcvt.s.q',
    },
    [FP_FMT.D]: {
      [ISA_D['fcvt.d.s'].rs2]:   'fcvt.d.s',
      [ISA_Q['fcvt.d.q'].rs2]:   'fcvt.d.q',
    },
    [FP_FMT.Q]: {
      [ISA_Q['fcvt.q.s'].rs2]:   'fcvt.q.s',
      [ISA_Q['fcvt.q.d'].rs2]:   'fcvt.q.d',
    },
  },
}

// ISA_C xlen lookup generator
function xlenLookupGen(...instNames) {
  let lookup = {};
  for (const name of instNames) {
    const inst = ISA_C[name];
    for (let xlen = XLEN_MASK.rv32; xlen <= XLEN_MASK.all; xlen <<= 1) {
      if (inst.xlens & xlen) {
        lookup[xlen] = name;
      }
    }
  }
  return lookup;
}

// C0 Instruction order of lookup
// - funct3
// - xlen
export const ISA_C0 = {
  [ISA_C['c.addi4spn'].funct3]: 'c.addi4spn',
  [ISA_C['c.fld'].funct3]:  xlenLookupGen('c.fld', 'c.lq'),
  [ISA_C['c.lw'].funct3]:   'c.lw',
  [ISA_C['c.flw'].funct3]:  xlenLookupGen('c.flw', 'c.ld'),
  [ISA_C['c.fsd'].funct3]:  xlenLookupGen('c.fsd', 'c.sq'),
  [ISA_C['c.sw'].funct3]:   'c.sw',
  [ISA_C['c.fsw'].funct3]:  xlenLookupGen('c.fsw', 'c.sd'),
}

// C1 Instruction order of lookup
// - funct3
// - xlen
// - rdRs1Val
// - funct2_cb
// - funct6[3]+funct2
export const ISA_C1 = {
  [ISA_C['c.nop'].funct3]: { [XLEN_MASK.all]: {
    [ISA_C['c.nop'].rdRs1Val]:  'c.nop',
                    'default':  'c.addi',
  }},
  [ISA_C['c.jal'].funct3]:      xlenLookupGen('c.jal', 'c.addiw'),
  [ISA_C['c.li'].funct3]:       'c.li',
  [ISA_C['c.addi16sp'].funct3]: { [XLEN_MASK.all]: {
    [ISA_C['c.addi16sp'].rdRs1Val]: 'c.addi16sp',
                         'default': 'c.lui',
  }},
  [ISA_C['c.srli'].funct3]: { [XLEN_MASK.all]: { 'default': {
    [ISA_C['c.srli'].funct2]:   'c.srli',
    [ISA_C['c.srai'].funct2]:   'c.srai',
    [ISA_C['c.andi'].funct2]:   'c.andi',
                        '11': {
      [ISA_C['c.sub'].funct6[3] +ISA_C['c.sub'].funct2]:  'c.sub',
      [ISA_C['c.xor'].funct6[3] +ISA_C['c.xor'].funct2]:  'c.xor',
      [ISA_C['c.or'].funct6[3]  +ISA_C['c.or'].funct2]:   'c.or',
      [ISA_C['c.and'].funct6[3] +ISA_C['c.and'].funct2]:  'c.and',
      [ISA_C['c.subw'].funct6[3]+ISA_C['c.subw'].funct2]: 'c.subw',
      [ISA_C['c.addw'].funct6[3]+ISA_C['c.addw'].funct2]: 'c.addw',
    }
  }}},
  [ISA_C['c.j'].funct3]:        'c.j',
  [ISA_C['c.beqz'].funct3]:     'c.beqz',
  [ISA_C['c.bnez'].funct3]:     'c.bnez',
}

// C2 Instruction order of lookup
// - funct3
// - xlen
// - funct4[3]
// - rs2Val
// - rdRs1Val
export const ISA_C2 = {
  [ISA_C['c.slli'].funct3]:   'c.slli',
  [ISA_C['c.fldsp'].funct3]:  xlenLookupGen('c.fldsp', 'c.lqsp'),
  [ISA_C['c.lwsp'].funct3]:   'c.lwsp',
  [ISA_C['c.flwsp'].funct3]:  xlenLookupGen('c.flwsp', 'c.ldsp'),
  [ISA_C['c.jr'].funct4.substring(0,3)]: { [XLEN_MASK.all]: {
    [ISA_C['c.jr'].funct4[3]]: {
      [ISA_C['c.jr'].rs2Val]:   'c.jr',
                   'default':   'c.mv',
    },
    [ISA_C['c.ebreak'].funct4[3]]: {
      [ISA_C['c.ebreak'].rs2Val]: {
        [ISA_C['c.ebreak'].rdRs1Val]: 'c.ebreak',
                           'default': 'c.jalr',
      },
                       'default':   'c.add',
    },
  }},
  [ISA_C['c.fsdsp'].funct3]:  xlenLookupGen('c.fsdsp', 'c.sqsp'),
  [ISA_C['c.swsp'].funct3]:   'c.swsp',
  [ISA_C['c.fswsp'].funct3]:  xlenLookupGen('c.fswsp', 'c.sdsp'),
}

export const REGISTER = {
  zero: "x0",
  ra:   "x1",
  sp:   "x2",
  gp:   "x3",
  tp:   "x4",
  t0:   "x5",
  t1:   "x6",
  t2:   "x7",
  s0:   "x8",
  s1:   "x9",
  a0:   "x10",
  a1:   "x11",
  a2:   "x12",
  a3:   "x13",
  a4:   "x14",
  a5:   "x15",
  a6:   "x16",
  a7:   "x17",
  s2:   "x18",
  s3:   "x19",
  s4:   "x20",
  s5:   "x21",
  s6:   "x22",
  s7:   "x23",
  s8:   "x24",
  s9:   "x25",
  s10:  "x26",
  s11:  "x27",
  t3:   "x28",
  t4:   "x29",
  t5:   "x30",
  t6:   "x31",
  fp:   "x8",  // at bottom to conserve order for ABI indexing
}

export const FLOAT_REGISTER = {
  ft0:  "f0",
  ft1:  "f1",
  ft2:  "f2",
  ft3:  "f3",
  ft4:  "f4",
  ft5:  "f5",
  ft6:  "f6",
  ft7:  "f7",
  fs0:  "f8",
  fs1:  "f9",
  fa0:  "f10",
  fa1:  "f11",
  fa2:  "f12",
  fa3:  "f13",
  fa4:  "f14",
  fa5:  "f15",
  fa6:  "f16",
  fa7:  "f17",
  fs2:  "f18",
  fs3:  "f19",
  fs4:  "f20",
  fs5:  "f21",
  fs6:  "f22",
  fs7:  "f23",
  fs8:  "f24",
  fs9:  "f25",
  fs10: "f26",
  fs11: "f27",
  ft8:  "f28",
  ft9:  "f29",
  ft10: "f30",
  ft11: "f31",
}

// CSR Encodings
export const CSR = {
  cycle:          0xc00,
  cycleh:         0xc80,
  dcsr:           0x7b0,
  dpc:            0x7b1,
  dscratch0:      0x7b2,
  dscratch1:      0x7b3,
  fcsr:           0x003,
  fflags:         0x001,
  frm:            0x002,
  hcounteren:     0x606,
  hedeleg:        0x602,
  hgatp:          0x680,
  hgeie:          0x607,
  hgeip:          0xe07,
  hideleg:        0x603,
  hie:            0x604,
  hip:            0x644,
  hpmcounter3:    0xc03,
  hpmcounter4:    0xc04,
  hpmcounter5:    0xc05,
  hpmcounter6:    0xc06,
  hpmcounter7:    0xc07,
  hpmcounter8:    0xc08,
  hpmcounter9:    0xc09,
  hpmcounter10:   0xc0a,
  hpmcounter11:   0xc0b,
  hpmcounter12:   0xc0c,
  hpmcounter13:   0xc0d,
  hpmcounter14:   0xc0e,
  hpmcounter15:   0xc0f,
  hpmcounter16:   0xc10,
  hpmcounter17:   0xc11,
  hpmcounter18:   0xc12,
  hpmcounter19:   0xc13,
  hpmcounter20:   0xc14,
  hpmcounter21:   0xc15,
  hpmcounter22:   0xc16,
  hpmcounter23:   0xc17,
  hpmcounter24:   0xc18,
  hpmcounter25:   0xc19,
  hpmcounter26:   0xc1a,
  hpmcounter27:   0xc1b,
  hpmcounter28:   0xc1c,
  hpmcounter29:   0xc1d,
  hpmcounter30:   0xc1e,
  hpmcounter31:   0xc1f,
  hpmcounter3h:   0xc83,
  hpmcounter4h:   0xc84,
  hpmcounter5h:   0xc85,
  hpmcounter6h:   0xc86,
  hpmcounter7h:   0xc87,
  hpmcounter8h:   0xc88,
  hpmcounter9h:   0xc89,
  hpmcounter10h:  0xc8a,
  hpmcounter11h:  0xc8b,
  hpmcounter12h:  0xc8c,
  hpmcounter13h:  0xc8d,
  hpmcounter14h:  0xc8e,
  hpmcounter15h:  0xc8f,
  hpmcounter16h:  0xc90,
  hpmcounter17h:  0xc91,
  hpmcounter18h:  0xc92,
  hpmcounter19h:  0xc93,
  hpmcounter20h:  0xc94,
  hpmcounter21h:  0xc95,
  hpmcounter22h:  0xc96,
  hpmcounter23h:  0xc97,
  hpmcounter24h:  0xc98,
  hpmcounter25h:  0xc99,
  hpmcounter26h:  0xc9a,
  hpmcounter27h:  0xc9b,
  hpmcounter28h:  0xc9c,
  hpmcounter29h:  0xc9d,
  hpmcounter30h:  0xc9e,
  hpmcounter31h:  0xc9f,
  hstatus:        0x600,
  htimedelta:     0x605,
  htimedeltah:    0x615,
  htinst:         0x64a,
  htval:          0x643,
  instret:        0xc02,
  instreth:       0xc82,
  marchid:        0xf12,
  mbase:          0x380,
  mbound:         0x381,
  mcause:         0x342,
  mcounteren:     0x306,
  mcountinhibit:  0x320,
  mcycle:         0xb00,
  mcycleh:        0xb80,
  mdbase:         0x384,
  mdbound:        0x385,
  medeleg:        0x302,
  mepc:           0x341,
  mhartid:        0xf14,
  mhpmcounter3:   0xb03,
  mhpmcounter4:   0xb04,
  mhpmcounter5:   0xb05,
  mhpmcounter6:   0xb06,
  mhpmcounter7:   0xb07,
  mhpmcounter8:   0xb08,
  mhpmcounter9:   0xb09,
  mhpmcounter10:  0xb0a,
  mhpmcounter11:  0xb0b,
  mhpmcounter12:  0xb0c,
  mhpmcounter13:  0xb0d,
  mhpmcounter14:  0xb0e,
  mhpmcounter15:  0xb0f,
  mhpmcounter16:  0xb10,
  mhpmcounter17:  0xb11,
  mhpmcounter18:  0xb12,
  mhpmcounter19:  0xb13,
  mhpmcounter20:  0xb14,
  mhpmcounter21:  0xb15,
  mhpmcounter22:  0xb16,
  mhpmcounter23:  0xb17,
  mhpmcounter24:  0xb18,
  mhpmcounter25:  0xb19,
  mhpmcounter26:  0xb1a,
  mhpmcounter27:  0xb1b,
  mhpmcounter28:  0xb1c,
  mhpmcounter29:  0xb1d,
  mhpmcounter30:  0xb1e,
  mhpmcounter31:  0xb1f,
  mhpmcounter3h:  0xb83,
  mhpmcounter4h:  0xb84,
  mhpmcounter5h:  0xb85,
  mhpmcounter6h:  0xb86,
  mhpmcounter7h:  0xb87,
  mhpmcounter8h:  0xb88,
  mhpmcounter9h:  0xb89,
  mhpmcounter10h: 0xb8a,
  mhpmcounter11h: 0xb8b,
  mhpmcounter12h: 0xb8c,
  mhpmcounter13h: 0xb8d,
  mhpmcounter14h: 0xb8e,
  mhpmcounter15h: 0xb8f,
  mhpmcounter16h: 0xb90,
  mhpmcounter17h: 0xb91,
  mhpmcounter18h: 0xb92,
  mhpmcounter19h: 0xb93,
  mhpmcounter20h: 0xb94,
  mhpmcounter21h: 0xb95,
  mhpmcounter22h: 0xb96,
  mhpmcounter23h: 0xb97,
  mhpmcounter24h: 0xb98,
  mhpmcounter25h: 0xb99,
  mhpmcounter26h: 0xb9a,
  mhpmcounter27h: 0xb9b,
  mhpmcounter28h: 0xb9c,
  mhpmcounter29h: 0xb9d,
  mhpmcounter30h: 0xb9e,
  mhpmcounter31h: 0xb9f,
  mhpmevent3:     0x323,
  mhpmevent4:     0x324,
  mhpmevent5:     0x325,
  mhpmevent6:     0x326,
  mhpmevent7:     0x327,
  mhpmevent8:     0x328,
  mhpmevent9:     0x329,
  mhpmevent10:    0x32a,
  mhpmevent11:    0x32b,
  mhpmevent12:    0x32c,
  mhpmevent13:    0x32d,
  mhpmevent14:    0x32e,
  mhpmevent15:    0x32f,
  mhpmevent16:    0x330,
  mhpmevent17:    0x331,
  mhpmevent18:    0x332,
  mhpmevent19:    0x333,
  mhpmevent20:    0x334,
  mhpmevent21:    0x335,
  mhpmevent22:    0x336,
  mhpmevent23:    0x337,
  mhpmevent24:    0x338,
  mhpmevent25:    0x339,
  mhpmevent26:    0x33a,
  mhpmevent27:    0x33b,
  mhpmevent28:    0x33c,
  mhpmevent29:    0x33d,
  mhpmevent30:    0x33e,
  mhpmevent31:    0x33f,
  mibase:         0x382,
  mibound:        0x383,
  mideleg:        0x303,
  mie:            0x304,
  mimpid:         0xf13,
  minstret:       0xb02,
  minstreth:      0xb82,
  mip:            0x344,
  misa:           0x301,
  mscratch:       0x340,
  mstatus:        0x300,
  mstatush:       0x310,
  mtinst:         0x34a,
  mtval:          0x343,
  mtval2:         0x34b,
  mtvec:          0x305,
  mvendorid:      0xf11,
  pmpaddr0:       0x3b0,
  pmpaddr1:       0x3b1,
  pmpaddr2:       0x3b2,
  pmpaddr3:       0x3b3,
  pmpaddr4:       0x3b4,
  pmpaddr5:       0x3b5,
  pmpaddr6:       0x3b6,
  pmpaddr7:       0x3b7,
  pmpaddr8:       0x3b8,
  pmpaddr9:       0x3b9,
  pmpaddr10:      0x3ba,
  pmpaddr11:      0x3bb,
  pmpaddr12:      0x3bc,
  pmpaddr13:      0x3bd,
  pmpaddr14:      0x3be,
  pmpaddr15:      0x3bf,
  pmpaddr16:      0x3c0,
  pmpaddr17:      0x3c1,
  pmpaddr18:      0x3c2,
  pmpaddr19:      0x3c3,
  pmpaddr20:      0x3c4,
  pmpaddr21:      0x3c5,
  pmpaddr22:      0x3c6,
  pmpaddr23:      0x3c7,
  pmpaddr24:      0x3c8,
  pmpaddr25:      0x3c9,
  pmpaddr26:      0x3ca,
  pmpaddr27:      0x3cb,
  pmpaddr28:      0x3cc,
  pmpaddr29:      0x3cd,
  pmpaddr30:      0x3ce,
  pmpaddr31:      0x3cf,
  pmpaddr32:      0x3d0,
  pmpaddr33:      0x3d1,
  pmpaddr34:      0x3d2,
  pmpaddr35:      0x3d3,
  pmpaddr36:      0x3d4,
  pmpaddr37:      0x3d5,
  pmpaddr38:      0x3d6,
  pmpaddr39:      0x3d7,
  pmpaddr40:      0x3d8,
  pmpaddr41:      0x3d9,
  pmpaddr42:      0x3da,
  pmpaddr43:      0x3db,
  pmpaddr44:      0x3dc,
  pmpaddr45:      0x3dd,
  pmpaddr46:      0x3de,
  pmpaddr47:      0x3df,
  pmpaddr48:      0x3e0,
  pmpaddr49:      0x3e1,
  pmpaddr50:      0x3e2,
  pmpaddr51:      0x3e3,
  pmpaddr52:      0x3e4,
  pmpaddr53:      0x3e5,
  pmpaddr54:      0x3e6,
  pmpaddr55:      0x3e7,
  pmpaddr56:      0x3e8,
  pmpaddr57:      0x3e9,
  pmpaddr58:      0x3ea,
  pmpaddr59:      0x3eb,
  pmpaddr60:      0x3ec,
  pmpaddr61:      0x3ed,
  pmpaddr62:      0x3ee,
  pmpaddr63:      0x3ef,
  pmpcfg0:        0x3a0,
  pmpcfg1:        0x3a1,
  pmpcfg2:        0x3a2,
  pmpcfg3:        0x3a3,
  pmpcfg4:        0x3a4,
  pmpcfg5:        0x3a5,
  pmpcfg6:        0x3a6,
  pmpcfg7:        0x3a7,
  pmpcfg8:        0x3a8,
  pmpcfg9:        0x3a9,
  pmpcfg10:       0x3aa,
  pmpcfg11:       0x3ab,
  pmpcfg12:       0x3ac,
  pmpcfg13:       0x3ad,
  pmpcfg14:       0x3ae,
  pmpcfg15:       0x3af,
  satp:           0x180,
  scause:         0x142,
  scounteren:     0x106,
  sedeleg:        0x102,
  sepc:           0x141,
  sideleg:        0x103,
  sie:            0x104,
  sip:            0x144,
  sscratch:       0x140,
  sstatus:        0x100,
  stval:          0x143,
  stvec:          0x105,
  tdata1:         0x7a1,
  tdata2:         0x7a2,
  tdata3:         0x7a3,
  time:           0xc01,
  timeh:          0xc81,
  tselect:        0x7a0,
  ucause:         0x042,
  uepc:           0x041,
  uie:            0x004,
  uip:            0x044,
  uscratch:       0x040,
  ustatus:        0x000,
  utval:          0x043,
  utvec:          0x005,
  vsatp:          0x280,
  vscause:        0x242,
  vsepc:          0x241,
  vsie:           0x204,
  vsip:           0x244,
  vsscratch:      0x240,
  vsstatus:       0x200,
  vstval:         0x243,
  vstvec:         0x205,
}

// Frag ID
export const FRAG = {
  UNSD: 1, // UNUSED fragments display bits with no significance  
  CSR: 2,
  IMM: 3,
  OPC: 4, // OPCODE includes opcode, funct3/4/5/12, fmt, etc
  PRED: 5,
  RD: 6,
  RS1: 7,
  RS2: 8,
  RS3: 9,
  SUCC: 10,
}

// Entire ISA
export const ISA = Object.assign({},
  ISA_RV32I, ISA_RV64I, ISA_RV128I,
  ISA_Zifencei, ISA_Zicsr,
  ISA_M, ISA_A, ISA_F, ISA_D, ISA_Q, ISA_C);
