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
  rv32: 32
}


/*
 * Instruction fields
 */

// Definition of fields shared by most instruction types
export const FIELDS = {
  // Fields common to multiple instruction types
  opcode: { pos: [6, 7], name: 'opcode' },
  rd:     { pos: [11, 5], name: 'rd' },
  funct3: { pos: [14, 3], name: 'funct3' },
  rs1:    { pos: [19, 5], name: 'rs1' },
  rs2:    { pos: [24, 5], name: 'rs2' },

  // R-type
  r_funct7: { pos: [31, 7], name: 'funct7' },

  // I-type
  i_imm_11_0: { pos: [31, 12], name: 'imm[11:0]' },

  // I-type: shift instructions
  i_shtyp:  { pos: [30, 1], name: 'shtyp' },
  i_shamt:  { pos: [24, 5] , name: 'shamt[4:0]' },

  // I-type: system instructions
  i_funct12: { pos: [31, 12], name: 'funct12' },

  // I-type: fence instructions
  i_fm:   { pos: [31, 4], name: 'fm' },
  i_pred: { pos: [27, 4], name: 'pred' },
  i_succ: { pos: [23, 4], name: 'succ' },

  // S-type
  s_imm_4_0:  { pos: [11, 5], name: 'imm[4:0]' },
  s_imm_11_5: { pos: [31, 7], name: 'imm[11:5]' },

  // B-type
  b_imm_4_1:  { pos: [11, 4], name: 'imm[4:1]' },
  b_imm_11:   { pos: [7, 1], name: 'imm[11]' },
  b_imm_10_5: { pos: [30, 6], name: 'imm[10:5]' },
  b_imm_12:   { pos: [31, 1], name: 'imm[12]' },

  // U-type
  u_imm_31_12 : { pos: [31, 20], name: 'imm[31:12]' },

  // J-type
  j_imm_20:     { pos: [31, 1], name: 'imm[20]' },
  j_imm_10_1:   { pos: [30, 10], name: 'imm[10:1]' },
  j_imm_11:     { pos: [20, 1], name: 'imm[11]' },
  j_imm_19_12:  { pos: [19, 8], name: 'imm[19:12]' },
}


/*
 * Instruction opcodes
 */

// RVG base opcode map (assuming inst[1:0] = '11')
export const OPCODE = {
  LOAD:     '0000011',
  MISC_MEM: '0001111',
  OP_IMM:   '0010011',
  AUIPC:    '0010111',
  STORE:    '0100011',
  OP:       '0110011',
  LUI:      '0110111',
  BRANCH:   '1100011',
  JALR:     '1100111',
  JAL:      '1101111',
  SYSTEM:   '1110011',
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

// ISA per opcode
export const ISA_OP = {
  [ISA_RV32I['add'].funct7 + ISA_RV32I['add'].funct3]: 'add',
  [ISA_RV32I['sub'].funct7 + ISA_RV32I['sub'].funct3]: 'sub',
  [ISA_RV32I['sll'].funct7 + ISA_RV32I['sll'].funct3]: 'sll',
  [ISA_RV32I['slt'].funct7 + ISA_RV32I['slt'].funct3]: 'slt',
  [ISA_RV32I['sltu'].funct7 + ISA_RV32I['sltu'].funct3]: 'sltu',
  [ISA_RV32I['xor'].funct7 + ISA_RV32I['xor'].funct3]: 'xor',
  [ISA_RV32I['srl'].funct7 + ISA_RV32I['srl'].funct3]: 'srl',
  [ISA_RV32I['sra'].funct7 + ISA_RV32I['sra'].funct3]: 'sra',
  [ISA_RV32I['or'].funct7 + ISA_RV32I['or'].funct3]: 'or',
  [ISA_RV32I['and'].funct7 + ISA_RV32I['and'].funct3]: 'and',
}

export const ISA_LOAD = {
  [ISA_RV32I['lb'].funct3]: 'lb',
  [ISA_RV32I['lh'].funct3]: 'lh',
  [ISA_RV32I['lw'].funct3]: 'lw',
  [ISA_RV32I['lbu'].funct3]: 'lbu',
  [ISA_RV32I['lhu'].funct3]: 'lhu',
}

export const ISA_STORE = {
  [ISA_RV32I['sb'].funct3]: 'sb',
  [ISA_RV32I['sh'].funct3]: 'sh',
  [ISA_RV32I['sw'].funct3]: 'sw',
}

export const ISA_OP_IMM = {
  [ISA_RV32I['addi'].funct3]: 'addi',
  [ISA_RV32I['slti'].funct3]: 'slti',
  [ISA_RV32I['sltiu'].funct3]: 'stliu',
  [ISA_RV32I['xori'].funct3]: 'xori',
  [ISA_RV32I['ori'].funct3]: 'ori',
  [ISA_RV32I['andi'].funct3]: 'andi',

  [ISA_RV32I['slli'].funct3]: 'slli',
  [ISA_RV32I['srli'].funct3]: {
    [ISA_RV32I['srli'].shtyp]: 'srli',
    [ISA_RV32I['srai'].shtyp]: 'srai',
  }
}

export const ISA_BRANCH = {
  [ISA_RV32I['beq'].funct3]: 'beq',
  [ISA_RV32I['bne'].funct3]: 'bne',
  [ISA_RV32I['blt'].funct3]: 'blt',
  [ISA_RV32I['bge'].funct3]: 'bge',
  [ISA_RV32I['bltu'].funct3]: 'btlu',
  [ISA_RV32I['bgeu'].funct3]: 'bgeu',
}

export const ISA_MISC_MEM = {
  [ISA_RV32I['fence'].funct3]: 'fence',
}

export const ISA_SYSTEM = {
  [ISA_RV32I['ecall'].funct3]: {
    [ISA_RV32I['ecall'].funct12]: 'ecall',
    [ISA_RV32I['ebreak'].funct12]: 'ebreak',
    }
}

// Entire ISA
export const ISA = Object.assign({}, ISA_RV32I);
