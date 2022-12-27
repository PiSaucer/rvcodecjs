// SPDX-License-Identifier: AGPL-3.0-or-later

/*
 * RISC-V Instruction Encoder/Decoder
 *
 * Copyright (c) 2021-2022 LupLab @ UC Davis
 */

import {BASE, FIELDS, OPCODE, ISA, REGISTER, FLOAT_REGISTER, CSR} from './Constants.js'

import { COPTS_ISA } from './Config.js'

import { convertBase } from './Instruction.js'

export class Encoder {
  /**
   * Binary representation of instruction
   * @type String
   */
  bin;

  /* Private members */
  #config;
  #inst;
  #mne;
  #opr;

  /**
   * Creates an Encoder to convert an assembly instruction to binary
   * @param {String} asm
   */
  constructor(asm, config) {
    this.#config = config;

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

    // Detect mismatch between ISA and configuration
    if (this.#config.ISA === COPTS_ISA.RV32I && /^RV(?:64|128)/.test(this.#inst.isa)) {
      throw `Detected ${this.#inst.isa} instruction but configuration ISA set to RV32I`;
    } else if ((this.#config.ISA === COPTS_ISA.RV64I && /^RV128/.test(this.#inst.isa))) {
      throw `Detected ${this.#inst.isa} instruction but configuration ISA set to RV64I`;
    }

    // Encode according to opcode
    switch(this.#inst.opcode) {
        // R-type
      case OPCODE.OP:
      case OPCODE.OP_32:
      case OPCODE.OP_64:
        this.#encodeOP();
        break;
      case OPCODE.OP_FP:
        this.#encodeOP_FP();
        break;
      case OPCODE.AMO:
        this.#encodeAMO();
        break;

        // I-type
      case OPCODE.JALR:
        this.#encodeJALR();
        break;
      case OPCODE.LOAD:
      case OPCODE.LOAD_FP:
        this.#encodeLOAD();
        break;
      case OPCODE.OP_IMM:
      case OPCODE.OP_IMM_32:
      case OPCODE.OP_IMM_64:
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
      case OPCODE.STORE_FP:
        this.#encodeSTORE();
        break;

        // B-type
      case OPCODE.BRANCH:
        this.#encodeBRANCH();
        break;

        // U-type
      case OPCODE.LUI:
      case OPCODE.AUIPC:
        this.#encodeUType();
        break;

        // J-type:
      case OPCODE.JAL:
        this.#encodeJAL();
        break;

        // R4-type
      case OPCODE.MADD:
      case OPCODE.MSUB:
      case OPCODE.NMADD:
      case OPCODE.NMSUB:
        this.#encodeR4();
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
   * Encodes OP-FP instruction
   */
  #encodeOP_FP() {
    // Get operands
    const dest = this.#opr[0], src1 = this.#opr[1], src2 = this.#opr[2];

    // Convert to binary representation
    let floatRd = true;
    let floatRs1 = true;
    if (this.#inst.funct5[0] === '1') {
      // Conditionally encode rd or rs1 as an int register, based on funct7
      if (this.#inst.funct5[3] === '1') {
        floatRs1 = false;
      } else {
        floatRd = false;
      }
    }
    const rd = encReg(dest, floatRd), 
      rs1 = encReg(src1, floatRs1), 
      rs2 = this.#inst.rs2 ?? encReg(src2, true),
      rm = this.#inst.funct3 ?? '111'; // funct3 or dynamic rounding mode

    // Construct binary instruction
    this.bin = this.#inst.funct5 + this.#inst.fp_fmt + rs2 + rs1 + rm + rd +
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
    const floatInst = this.#inst.opcode === OPCODE.LOAD_FP;
    const rd = encReg(dest, floatInst),
      rs1 = encReg(base),
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

    // Shift instruction
    if (/^s[lr][al]i/.test(this.#mne)) {
      // Determine shift-amount width based on opcode or config ISA
      //   For encoding, default to the widest shamt possible with the given parameters
      let shamtWidth;
      if (this.#config.isa === COPTS_ISA.RV32I || this.#inst.opcode === OPCODE.OP_IMM_32) {
        shamtWidth = FIELDS.i_shamt.pos[1];     // 5bit width (RV32I)
      } else if (this.#config.isa === COPTS_ISA.RV64I || this.#inst.opcode === OPCODE.OP_IMM_64) {
        shamtWidth = FIELDS.i_shamt_5_0.pos[1]; // 6bit width (RV64I)
      } else {
        shamtWidth = FIELDS.i_shamt_6_0.pos[1]; // 7bit width (RV128I)
      }

      // Construct immediate field from shift type and shift amount
      if (immediate < 0 || immediate >= (1 << shamtWidth)) {
        throw 'Invalid shamt field (out of range): "' + immediate + '"';
      }
      const imm_11_7 = '0' + this.#inst.shtyp + '000';
      const imm_6_0 = encImm(immediate, FIELDS.i_shamt_6_0.pos[1]);

      imm = imm_11_7 + imm_6_0;

    } else {
      // Non-shift instructions
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

    // Signals when MISC-MEM used as extended encoding space for load operations
    const loadExt = this.#mne === 'lq';

    if (loadExt) {
      // Get operands
      const dest = this.#opr[0], offset = this.#opr[1], base = this.#opr[2];

      // Convert to binary representation
      rd = encReg(dest);
      imm = encImm(offset, FIELDS.i_imm_11_0.pos[1]);
      rs1 = encReg(base);

    } else if (this.#mne === 'fence') {
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
    // Declare operands
    let rs1, rd, imm;

    // Zicsr Instructions
    if (this.#inst.isa == 'Zicsr') {
      // Get operands
      const dest = this.#opr[0], csr = this.#opr[1], src = this.#opr[2];

      // Convert to binary representation
      rd = encReg(dest);
      imm = encCSR(csr);

      // Convert src to register or immediate
      //   based off high bit of funct3 (0:reg, 1:imm)
      rs1 = (this.#inst.funct3[0] === '0')
        ? encReg(src)
        : encImm(src, FIELDS.rs1.pos[1]);
    
    } else {
      // Trap instructions
      rs1 = ''.padStart(FIELDS.rs1.pos[1], '0');
      rd = ''.padStart(FIELDS.rd.pos[1], '0');
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
    const floatInst = this.#inst.opcode === OPCODE.STORE_FP;
    const rs2 = encReg(src, floatInst), 
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

  /**
   * Encodes AMO instruction
   */
  #encodeAMO() {
    // Declare operands
    let dest, addr, src;

    // Get operands, separately for 'lr' instruction  
    if (/^lr\.[wd]$/.test(this.#mne)) {
      dest = this.#opr[0];
      addr = this.#opr[1];
      src  = 'x0'; // converts to '00000'
    }
    else {
      dest = this.#opr[0];
      addr = this.#opr[2];
      src  = this.#opr[1];
    }

    // Convert to binary representation
    const rd = encReg(dest), rs1 = encReg(addr), rs2 = encReg(src),
      aq = '0', rl = '0';

    // Construct binary instruction
    this.bin = this.#inst.funct5 + aq + rl + rs2 + rs1 + 
      this.#inst.funct3 + rd + this.#inst.opcode;
  }

  /**
   * Encodes OP instruction
   */
  #encodeR4() {
    // Get operands
    const dest = this.#opr[0], src1 = this.#opr[1], 
      src2 = this.#opr[2], src3 = this.#opr[3];

    // Convert to binary representation
    const rd = encReg(dest, true), rs1 = encReg(src1, true), 
      rs2 = encReg(src2, true), rs3 = encReg(src3, true),
      fmt = this.#inst.fp_fmt, rm = '111'; // dynamic rounding mode

    // Construct binary instruction
    this.bin = rs3 + fmt + rs2 + rs1 + rm + rd +
      this.#inst.opcode;
  }
}

// Parse given immediate to binary
function encImm(immediate, len) {
  let bin = (Number(immediate) >>> 0).toString(BASE.bin);
  // Extend or reduce binary representation to `len` bits
  return bin.padStart(len, '0').slice(-len);
}

// Convert register numbers to binary
function encReg(reg, floatReg=false) {
  // Attempt to convert from ABI name to x<num> or f<num>, depending on `floatReg`
  reg = (floatReg ? FLOAT_REGISTER[reg] : REGISTER[reg]) ?? reg;
  // Validate using register file prefix determined from `floatReg` parameter
  let regFile = floatReg ? 'f' : 'x';
  if (reg?.[0] !== regFile) {
    throw `Invalid or unknown ${floatReg ? 'float ' : ''}register format: "${reg}"`;
  }
  // Attempt to parse the decimal register address, set to 0 on failed parse
  let dec = parseInt(reg.substring(1));
  if (isNaN(dec)) {
    dec = 0;
  } else if (dec < 0 || dec > 31) {
    throw `Register address out of range: "${reg}"`;
  }
  return convertBase(dec, BASE.dec, BASE.bin, 5);
}

// Convert memory ordering to binary
function encMem(input) {
  let bits = '';

  // I: Device input, O: device output, R: memory reads, W: memory writes
  const access = ['i', 'o', 'r', 'w'];

  let one_count = 0;
  for (let i = 0; i < access.length; i++) {
    if (input.includes(access[i])) {
      bits += '1';
      one_count++;
    } else {
      bits += '0';
    }
  }

  if (one_count !== input.length || bits === '0000') {
    throw `Invalid IO/Mem field '${input}', expected some combination of 'iorw'`
  }

  return bits;
}

// Convert CSR (name or imm) to binary
function encCSR(csr) {
  // Attempt to find CSR value from CSR name map
  let csrVal = CSR[csr];

  // If failed, attempt to parse as immediate
  if (csrVal === undefined) {
    csrVal = Number(csr) >>> 0;

    // If parse failed, neither number nor valid CSR name
    if (csrVal === 0 && csr != 0) {
      throw `Invalid or unknown CSR name: "${csr}"`;
    }
  }

  return encImm(csrVal, FIELDS.i_csr.pos[1]);
}
