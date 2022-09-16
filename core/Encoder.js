// SPDX-License-Identifier: AGPL-3.0-or-later

/*
 * RISC-V Instruction Encoder/Decoder
 *
 * Copyright (c) 2021-2022 LupLab @ UC Davis
 */

import { BASE, FIELDS, OPCODE, ISA } from './Constants.js'

import { convertBase } from './Instruction.js'

export class Encoder {
  /**
   * Binary representation of instruction
   * @type String
   */
  bin;

  /* Private members */
  #inst;
  #mne;
  #opr;

  /**
   * Creates an Encoder to convert an assembly instruction to binary
   * @param {String} asm
   */
  constructor(asm) {
    // Tokenize assembly instruction
    const tokens = asm.toLowerCase().split(/[ ,()]+/);

    // Convert assembly instruction to binary
    this.#convertAsmToBin(tokens);
  }

  /**
   * Convert assembly instruction to binary
   * @param {String[]} tokens
   */
  #convertAsmToBin(tokens) {
    // The first token is necessarily the instruction's mnemonic
    this.#mne = tokens[0];
    // The following tokens are its operands
    this.#opr = tokens.splice(1);

    // Find instruction based on given mnemonic
    this.#inst = ISA[this.#mne];
    if (this.#inst === undefined) {
      throw "Invalid mnemonic: " + this.#mne;
    }

    // Encode according to opcode
    switch(this.#inst.opcode) {
        // R-type
      case OPCODE.OP:
        this.#encodeOP();
        break;

        // I-type
      case OPCODE.JALR:
        this.#encodeJALR();
        break;
      case OPCODE.LOAD:
        this.#encodeLOAD();
        break;
      case OPCODE.OP_IMM:
        this.#encodeOP_IMM();
        break;
      case OPCODE.MISC_MEM:
        this.#encodeMISC_MEM();
        break;
      case OPCODE.SYSTEM:
        this.#encodeSYSTEM();
        break;

        // S-type
      case OPCODE.STORE:
        this.#encodeSTORE();
        break;

        // B-type
      case OPCODE.BRANCH:
        this.#encodeBRANCH();
        break;

        // U-type:
      case OPCODE.LUI:
      case OPCODE.AUIPC:
        this.#encodeUType();
        break;

        // J-type:
      case OPCODE.JAL:
        this.#encodeJAL();
        break;

        // Invalid opcode
      default:
        throw "Unsupported opcode: " + this.#inst.opcode;
    }
  }

  /**
   * Encodes OP instruction
   */
  #encodeOP() {
    // Get operands
    const dest = this.#opr[0], src1 = this.#opr[1], src2 = this.#opr[2];

    // Convert to binary representation
    const rd = encReg(dest), rs1 = encReg(src1), rs2 = encReg(src2);

    // Construct binary instruction
    this.bin = this.#inst.funct7 + rs2 + rs1 + this.#inst.funct3 + rd +
      this.#inst.opcode;
  }

  /**
   * Encodes JALR instruction
   */
  #encodeJALR() {
    // Get operands
    const dest = this.#opr[0], base = this.#opr[1], offset = this.#opr[2];

    // Convert to binary representation
    const rd = encReg(dest), rs1 = encReg(base),
      imm = encImm(offset, FIELDS.i_imm_11_0.pos[1]);

    // Construct binary instruction
    this.bin = imm + rs1 + this.#inst.funct3 + rd + this.#inst.opcode;
  }

  /**
   * Encodes LOAD instruction
   */
  #encodeLOAD() {

    // Get operands
    const dest = this.#opr[0], offset = this.#opr[1], base = this.#opr[2];

    // Convert to binary representation
    const rd = encReg(dest), rs1 = encReg(base),
      imm = encImm(offset, FIELDS.i_imm_11_0.pos[1]);

    // Construct binary instruction
    this.bin = imm + rs1 + this.#inst.funct3 + rd + this.#inst.opcode;
  }

  /**
   * Encodes OP_IMM instruction
   */
  #encodeOP_IMM() {
    // Get fields
    const dest = this.#opr[0], src = this.#opr[1], immediate = this.#opr[2];

    // Convert to binary representation
    const rd = encReg(dest), rs1 = encReg(src);

    let imm = ''.padStart('0', FIELDS.i_imm_11_0.pos[1]);

    if (/^s[lr][al]i$/.test(this.#mne)) {
      // Shift instruction
      if (immediate < 0 || immediate >= (1 << FIELDS.i_shamt.pos[1])) {
        throw 'Incorrect shamt field: "' + immediate + '"';
      }
      const imm_11_5 = '0' + this.#inst.shtyp + '00000';
      const imm_4_0 = encImm(immediate, FIELDS.i_shamt.pos[1]);

      imm = imm_11_5 + imm_4_0;

    } else {
      imm = encImm(immediate, FIELDS.i_imm_11_0.pos[1]);
    }

    // Construct binary instruction
    this.bin = imm + rs1 + this.#inst.funct3 + rd + this.#inst.opcode;
  }

  /**
   * Encodes MISC_MEM instruction
   */
  #encodeMISC_MEM() {
    // Default values
    let rs1 = ''.padStart(FIELDS.rs1.pos[1], '0'),
      rd = ''.padStart(FIELDS.rd.pos[1], '0'),
      imm = ''.padStart(FIELDS.i_imm_11_0.pos[1], '0');

    if (this.#mne === 'fence') {
      // Get operands
      const predecessor = this.#opr[0], successor = this.#opr[1];

      // Convert to binary representation
      const pred = encMem(predecessor), succ = encMem(successor);

      imm = '0000' + pred + succ;
    }

    // Construct binary instruction
    this.bin = imm + rs1 + this.#inst.funct3 + rd + this.#inst.opcode;
  }

  /**
   * Encodes SYSTEM instruction
   */
  #encodeSYSTEM() {
    // Default values
    let rs1 = ''.padStart(FIELDS.rs1.pos[1], '0'),
      rd = ''.padStart(FIELDS.rd.pos[1], '0'),
      imm = ''.padStart(FIELDS.i_imm_11_0.pos[1], '0');

    // Trap instructions
    if (this.#mne === 'ecall' || this.#mne === 'ebreak') {
      imm = this.#inst.funct12;
    }

    // Construct binary instruction
    this.bin = imm + rs1 + this.#inst.funct3 + rd + this.#inst.opcode;
  }

  /**
   * Encodes STORE instruction
   */
  #encodeSTORE() {
    // Get operands
    const src = this.#opr[0], offset = this.#opr[1], base = this.#opr[2];

    // Immediate len
    const len_11_5 = FIELDS.s_imm_11_5.pos[1],
      len_4_0 = FIELDS.s_imm_4_0.pos[1];

    // Convert to binary representation
    const rs2 = encReg(src),
      rs1 = encReg(base),
      imm = encImm(offset, len_11_5 + len_4_0),
      imm_11_5 = imm.substring(0, len_11_5),
      imm_4_0 = imm.substring(len_11_5, len_11_5 + len_4_0);

    // Construct binary instruction
    this.bin = imm_11_5 + rs2 + rs1 + this.#inst.funct3 + imm_4_0 +
      this.#inst.opcode;
  }

  /**
   * Encodes BRANCH instruction
   */
  #encodeBRANCH() {
    // Get operands
    const src1 = this.#opr[0], src2 = this.#opr[1], offset = this.#opr[2];

    // Immediate len
    const len_12 = FIELDS.b_imm_12.pos[1],
      len_11 = FIELDS.b_imm_11.pos[1],
      len_10_5 = FIELDS.b_imm_10_5.pos[1],
      len_4_1 = FIELDS.b_imm_4_1.pos[1];

    // Convert to binary representation
    const rs1 = encReg(src1), rs2 = encReg(src2),
      imm = encImm(offset, len_12 + len_11 + len_10_5 + len_4_1 + 1);

    const imm_12 = imm.substring(0, len_12),
      imm_11 = imm.substring(len_12, len_12 + len_11),
      imm_10_5 = imm.substring(len_12 + len_11, len_12 + len_11 + len_10_5),
      imm_4_1 = imm.substring(len_12 + len_11 + len_10_5,
        len_12 + len_11 + len_10_5 + len_4_1);

    // Construct binary instruction
    this.bin = imm_12 + imm_10_5 + rs2 + rs1 + this.#inst.funct3 +
      imm_4_1 + imm_11 + this.#inst.opcode;
  }

  /**
   * Encodes U-type instruction
   */
  #encodeUType() {
    // Get operands
    const dest = this.#opr[0], immediate = this.#opr[1];

    // Convert to binary representation
    const rd = encReg(dest),
      imm = encImm(immediate, FIELDS.u_imm_31_12.pos[1]);

    // Construct binary instruction
    this.bin = imm + rd + this.#inst.opcode;
  }

  /**
   * Encodes J-type instruction
   */
  #encodeJAL() {
    // Get operands
    const dest = this.#opr[0],
      offset = this.#opr[1];

    // Immediate len
    const len_20 = FIELDS.j_imm_20.pos[1],
      len_10_1 = FIELDS.j_imm_10_1.pos[1],
      len_11 = FIELDS.j_imm_11.pos[1],
      len_19_12 = FIELDS.j_imm_19_12.pos[1];

    // Convert to binary representation
    const rd = encReg(dest),
      imm = encImm(offset, len_20 + len_19_12 + len_11 + len_10_1 + 1);

    const imm_20 = imm.substring(0, len_20),
      imm_19_12 = imm.substring(len_20, len_20 + len_19_12),
      imm_11 = imm.substring(len_20 + len_19_12, len_20 + len_19_12 + len_11),
      imm_10_1 = imm.substring(len_20 + len_19_12 + len_11,
        len_20 + len_19_12 + len_11 + len_10_1);

    // Construct binary instruction
    this.bin = imm_20 + imm_10_1 + imm_11 + imm_19_12 + rd + this.#inst.opcode;
  }
}

// Parse given immediate to binary
function encImm(immediate, len) {
  let bin = (Number(immediate) >>> 0).toString(BASE.bin);
  // Extend or reduce binary representation to `len` bits
  return bin.padStart(len, '0').slice(-len);
}

// Convert register numbers to binary
function encReg(reg) {
  let dec = reg.substring(1);
  if (reg[0] !== 'x' || dec < 0 || dec > 31) {
    throw 'Incorrect register format: "' + reg + '"';
  }
  return convertBase(dec, BASE.dec, BASE.bin, 5);
}

// Convert memory ordering to binary
function encMem(input) {
  let bits = '';

  // I: Device input, O: device output, R: memory reads, W: memory writes
  const access = ['i', 'o', 'r', 'w'];

  for (let i = 0; i < access.length; i++) {
    if (input.includes(access[i])) {
      bits += '1';
    } else {
      bits += '0';
    }
  }

  return bits;
}

