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
  rv32: 32,
  rv64: 64
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
  r_funct7: { pos: [31, 7], name: 'funct7' },

  // I-type
  i_imm_11_0: { pos: [31, 12], name: 'imm[11:0]' },

  // I-type: shift instructions
  i_shtyp_11_6: { pos: [31, 6], name: 'shtyp[11:6]'},
  i_shtyp_11_5: { pos: [31, 7], name: 'shtyp[11:5]'},
  i_shtyp:      { pos: [30, 1], name: 'shtyp' },
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
}


/*
 * Instruction opcodes
 */

// RVG base opcode map (assuming inst[1:0] = '11')
export const OPCODE = {
  LOAD:     '0000011',
  MISC_MEM: '0001111',
  OP_IMM:   '0010011',
  OP_IMM_32:'0011011',
  AUIPC:    '0010111',
  STORE:    '0100011',
  OP:       '0110011',
  OP_32:    '0111011',
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

// ISA per opcode
export const ISA_OP = {
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
}

export const ISA_OP_32 = {
  [ISA_RV64I['addw'].funct7 + ISA_RV64I['addw'].funct3]: 'addw',
  [ISA_RV64I['subw'].funct7 + ISA_RV64I['subw'].funct3]: 'subw',
  [ISA_RV64I['sllw'].funct7 + ISA_RV64I['sllw'].funct3]: 'sllw',
  [ISA_RV64I['srlw'].funct7 + ISA_RV64I['srlw'].funct3]: 'srlw',
  [ISA_RV64I['sraw'].funct7 + ISA_RV64I['sraw'].funct3]: 'sraw',
}

export const ISA_LOAD = {
  [ISA_RV32I['lb'].funct3]:   'lb',
  [ISA_RV32I['lh'].funct3]:   'lh',
  [ISA_RV32I['lw'].funct3]:   'lw',
  [ISA_RV64I['ld'].funct3]:   'ld',
  [ISA_RV32I['lbu'].funct3]:  'lbu',
  [ISA_RV32I['lhu'].funct3]:  'lhu',
  [ISA_RV64I['lwu'].funct3]:  'lwu',
}

export const ISA_STORE = {
  [ISA_RV32I['sb'].funct3]: 'sb',
  [ISA_RV32I['sh'].funct3]: 'sh',
  [ISA_RV32I['sw'].funct3]: 'sw',
  [ISA_RV64I['sd'].funct3]: 'sd',
}

export const ISA_OP_IMM = {
  [ISA_RV32I['addi'].funct3]:   'addi',
  [ISA_RV32I['slti'].funct3]:   'slti',
  [ISA_RV32I['sltiu'].funct3]:  'stliu',
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

// Entire ISA
export const ISA = Object.assign({}, 
  ISA_RV32I, ISA_RV64I, 
  ISA_Zifencei, ISA_Zicsr);
