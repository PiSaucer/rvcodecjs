// SPDX-License-Identifier: AGPL-3.0-or-later

/*
 * RISC-V Instruction Encoder/Decoder
 *
 * Copyright (c) 2021-2022 LupLab @ UC Davis
 */

import { BASE, XLEN_MASK, FIELDS, OPCODE, ISA, REGISTER, FLOAT_REGISTER, CSR } from './Constants.js'

import { COPTS_ISA } from './Config.js'

import { convertBase } from './Instruction.js'

export class Encoder {
  /**
   * Binary representation of instruction
   * @type String
   */
  bin;

  /**
   * Value from XLEN_MASK for passing the expected xlen to the decoder
   * - Only matters for C instructions,
   *   set to `XLEN_MASK.all` for all standard 32-bit instructions
   * @type Integer
   */
  xlens;

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
    // Detect C instructions
    const cInst = this.#inst.opcode.length === 2;

    // Determine compatible ISA xlens
    let isa = this.#inst.isa;
    this.xlens = 0;
    if (cInst) {
      this.xlens = this.#inst.xlens;
      // Determine lowest-allowable ISA given instruction xlens
      //   Mainly for error messaging on encoding side
      if ((this.xlens & XLEN_MASK.rv32) !== 0) {
        isa = `RV32${isa}`;
      } else if ((this.xlens & XLEN_MASK.rv64) !== 0) {
        isa = `RV64${isa}`;
      } else if ((this.xlens & XLEN_MASK.rv128) !== 0) {
        isa = `RV128${isa}`;
      }
    } else {
      const isaXlen = parseInt(/^RV(\d+)/.exec(this.#inst.isa)?.[1]);
      switch (isaXlen) {
        // Build up xlens bit-mask to include lowest compatible xlen and all higher ones
        case 32:
          this.xlens |= XLEN_MASK.rv32;
        case 64:
          this.xlens |= XLEN_MASK.rv64;
        case 128:
          this.xlens |= XLEN_MASK.rv128;
          break;
        default:
          // All ISAs that do not have an explicit xlen are inferred to support all xlens
          //   Ex. Zicsr, Zifencei
          this.xlens = XLEN_MASK.all;
      }
    }

    // Detect mismatch between ISA and configuration
    if (this.#config.ISA !== COPTS_ISA.AUTO) {
      if (this.#config.ISA === COPTS_ISA.RV32I && (this.xlens & XLEN_MASK.rv32) === 0) {
        throw `Detected ${isa} instruction incompatible with configuration ISA: RV32I`;
      } else if (this.#config.ISA === COPTS_ISA.RV64I && (this.xlens & XLEN_MASK.rv64) === 0) {
        throw `Detected ${isa} instruction incompatible with configuration ISA: RV64I`;
      } else if (this.#config.ISA === COPTS_ISA.RV128I && (this.xlens & XLEN_MASK.rv128) === 0) {
        throw `Detected ${isa} instruction incompatible with configuration ISA: RV128I`;
      }
    }

    // Encode instruction
    if (cInst) {
      // 16-bit C instructions
      //   Encode according to instruction format
      const fmt = /^([^-]+)-/.exec(this.#inst.fmt)?.[1];
      switch (fmt) {
        case 'CR':
          this.#encodeCR();
          break;
        case 'CI':
          this.#encodeCI();
          break;
        case 'CSS':
          this.#encodeCSS();
          break;
        case 'CIW':
          this.#encodeCIW();
          break;
        case 'CL':
          this.#encodeCL();
          break;
        case 'CS':
          this.#encodeCS();
          break;
        case 'CA':
          this.#encodeCA();
          break;
        case 'CB':
          this.#encodeCB();
          break;
        case 'CJ':
          this.#encodeCJ();
          break;
        default:
          throw `Unsupported C instruction format: ${this.#inst.fmt}`;
      }
    } else {
      // Standard 32-bit instructions
      //   Encode according to opcode
      switch (this.#inst.opcode) {
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
    const rd = encReg(dest);
    // U-type immediate value range requires 32 bits for initial binary representation
    const imm = encImm(immediate, 32);

    // Grab the upper 20 bits of the 32-bit encoded value
    // - Lower 12 bits not encoded, inferred/forced to be 0s
    const imm_31_12 = imm.substring(0, FIELDS.u_imm_31_12.pos[1]);

    // Construct binary instruction
    this.bin = imm_31_12 + rd + this.#inst.opcode;
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
    if (/^lr\./.test(this.#mne)) {
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
   * Encodes R4 instruction
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

  /**
   * Encodes CR-type instruction
   */
  #encodeCR() {
    // Get operands
    const destSrc1 = this.#opr[0], src2 = this.#opr[1];

    // Encode registers, but overwite with static values if present
    const rdRs1 = this.#inst.rdRs1Val !== undefined
      ? encImm(this.#inst.rdRs1Val, FIELDS.c_rd_rs1.pos[1])
      : (destSrc1 === undefined ? '01000' : encReg(destSrc1));
    const rs2 = this.#inst.rs2Val !== undefined
      ? encImm(this.#inst.rs2Val, FIELDS.c_rs2.pos[1])
      : (src2 === undefined ? '01000' : encReg(src2));

    // Validate operands
    if (this.#inst.rdRs1Excl !== undefined) {
      const val = parseInt(rdRs1, BASE.bin);
      for (const excl of this.#inst.rdRs1Excl) {
        if (val === excl) {
          throw `Illegal value "${destSrc1}" in rd/rs1 field for instruction ${this.#mne}`;
        }
      }
    }
    if (this.#inst.rs2Excl !== undefined) {
      const val = parseInt(rs2, BASE.bin);
      for (const excl of this.#inst.rs2Excl) {
        if (val === excl) {
          throw `Illegal value "${src2}" in rs2 field for instruction ${this.#mne}`;
        }
      }
    }

    // Construct binary instruction
    this.bin = this.#inst.funct4 + rdRs1 + rs2 + this.#inst.opcode;
  }

  /**
   * Encodes CI-type instruction
   */
  #encodeCI() {
    // Determine operand order
    const skipRdRs1 = this.#inst.rdRs1Val !== undefined;

    // Get operands
    const destSrc1 = this.#opr[0];
    const immediate = this.#opr[skipRdRs1 ? 0 : 1];

    // Determine if rdRs1 should be float register from mnemonic
    const floatRdRs1 = /^c\.f/.test(this.#mne);

    // Encode operands, but overwite with static values if present
    const rdRs1 = skipRdRs1
      ? encImm(this.#inst.rdRs1Val, FIELDS.c_rd_rs1.pos[1])
      : (destSrc1 === undefined ? '01000' : encReg(destSrc1, floatRdRs1));
    let immVal = this.#inst.immVal ?? Number(immediate);

    // Validate operands
    if (this.#inst.rdRs1Excl !== undefined) {
      const val = parseInt(rdRs1, BASE.bin);
      for (const excl of this.#inst.rdRs1Excl) {
        if (val === excl) {
          throw `Illegal value "${destSrc1}" in rd/rs1 field for instruction ${this.#mne}`;
        }
      }
    }
    if (this.#inst.nzimm && (immVal === 0 || isNaN(immVal))) {
      // If missing immediate, generate lowest non-zero immediate value
      if (immediate === undefined) {
        immVal = minImmFromBits(this.#inst.immBits);
      } else {
        throw `Invalid immediate "${immediate}", ${this.#mne} instruction expects non-zero value`;
      }
    }
    if (this.#inst.uimm && immVal < 0) {
      throw `Invalid immediate "${immediate}", ${this.#mne} instruction expects non-negative value`;
    }

    // Construct immediate fields
    const imm0 = encImmBits(immVal, this.#inst.immBits[0]);
    const imm1 = encImmBits(immVal, this.#inst.immBits[1]);

    // Construct binary instruction
    this.bin = this.#inst.funct3 + imm0 + rdRs1 + imm1 + this.#inst.opcode;
  }

  /**
   * Encodes CSS-type instruction
   */
  #encodeCSS() {
    // Get operands
    const src = this.#opr[0], offset = this.#opr[1];

    // Determine if rs2 should be float register from mnemonic
    const floatRs2 = /^c\.f/.test(this.#mne);

    // Encode operands and parse immediate for validation
    const rs2 = encReg(src, floatRs2);
    let immVal = Number(offset);

    // Validate operands
    if (this.#inst.uimm && immVal < 0) {
      throw `Invalid immediate "${offset}", ${this.#mne} instruction expects non-negative value`;
    }

    // Construct immediate field
    const imm = encImmBits(immVal, this.#inst.immBits);

    // Construct binary instruction
    this.bin = this.#inst.funct3 + imm + rs2 + this.#inst.opcode;
  }

  /**
   * Encodes CIW-type instruction
   */
  #encodeCIW() {
    // Get operands
    const dest = this.#opr[0], immediate = this.#opr[1];

    // Encode operands and parse immediate for validation
    const rdPrime = encRegPrime(dest);
    let immVal = Number(immediate);

    // Validate operands
    if (this.#inst.nzimm && (immVal === 0 || isNaN(immVal))) {
      // If missing immediate, generate lowest non-zero immediate value
      if (immediate === undefined) {
        immVal = minImmFromBits(this.#inst.immBits);
      } else {
        throw `Invalid immediate "${immediate}", ${this.#mne} instruction expects non-zero value`;
      }
    }
    if (this.#inst.uimm && immVal < 0) {
      throw `Invalid immediate "${immediate}", ${this.#mne} instruction expects non-negative value`;
    }

    // Construct immediate field
    const imm = encImmBits(immVal, this.#inst.immBits);

    // Construct binary instruction
    this.bin = this.#inst.funct3 + imm + rdPrime + this.#inst.opcode;
  }

  /**
   * Encodes CL-type instruction
   */
  #encodeCL() {
    // Get operands
    const dest = this.#opr[0], offset = this.#opr[1], base = this.#opr[2];

    // Determine if rd' should be float register from mnemonic
    const floatRd = /^c\.f/.test(this.#mne);

    // Encode operands and parse immediate for validation
    const rdPrime = encRegPrime(dest, floatRd);
    const rs1Prime = encRegPrime(base);
    let immVal = Number(offset);

    // Validate operands
    if (this.#inst.uimm && immVal < 0) {
      throw `Invalid immediate "${offset}", ${this.#mne} instruction expects non-negative value`;
    }

    // Construct immediate fields
    const imm0 = encImmBits(immVal, this.#inst.immBits[0]);
    const imm1 = encImmBits(immVal, this.#inst.immBits[1]);

    // Construct binary instruction
    this.bin = this.#inst.funct3 + imm0 + rs1Prime + imm1 + rdPrime + this.#inst.opcode;
  }

  /**
   * Encodes CS-type instruction
   */
  #encodeCS() {
    // Get operands
    const src = this.#opr[0], immediate = this.#opr[1], base = this.#opr[2];

    // Determine if rd' should be float register from mnemonic
    const floatRs2 = /^c\.f/.test(this.#mne);

    // Encode operands and parse immediate for validation
    const rs2Prime = encRegPrime(src, floatRs2);
    const rs1Prime = encRegPrime(base);
    let immVal = Number(immediate);

    // Validate operands
    if (this.#inst.uimm && immVal < 0) {
      throw `Invalid immediate "${immediate}", ${this.#mne} instruction expects non-negative value`;
    }

    // Construct immediate fields
    const imm0 = encImmBits(immVal, this.#inst.immBits[0]);
    const imm1 = encImmBits(immVal, this.#inst.immBits[1]);

    // Construct binary instruction
    this.bin = this.#inst.funct3 + imm0 + rs1Prime + imm1 + rs2Prime + this.#inst.opcode;
  }

  /**
   * Encodes CA-type instruction
   */
  #encodeCA() {
    // Get operands
    const destSrc1 = this.#opr[0], src2 = this.#opr[1];

    // Encode operands and parse immediate for validation
    const rdRs1Prime = encRegPrime(destSrc1);
    const rs2Prime = encRegPrime(src2);

    // Construct binary instruction
    this.bin = this.#inst.funct6 + rdRs1Prime + this.#inst.funct2 + rs2Prime + this.#inst.opcode;
  }

  /**
   * Encodes CB-type instruction
   */
  #encodeCB() {
    // Get operands
    const destSrc1 = this.#opr[0], immediate = this.#opr[1];

    // Encode operands, but overwite with static values if present
    const rdRs1Prime = encRegPrime(destSrc1);
    let immVal = this.#inst.immVal ?? Number(immediate);

    // Validate operands
    if (this.#inst.nzimm && (immVal === 0 || isNaN(immVal))) {
      // If missing immediate, generate lowest non-zero immediate value
      if (immediate === undefined) {
        immVal = minImmFromBits(this.#inst.immBits);
      } else {
        throw `Invalid immediate "${immediate}", ${this.#mne} instruction expects non-zero value`;
      }
    }
    if (this.#inst.uimm && immVal < 0) {
      throw `Invalid immediate "${immediate}", ${this.#mne} instruction expects non-negative value`;
    }

    // Construct immediate fields
    const imm0 = encImmBits(immVal, this.#inst.immBits[0]);
    const imm1 = encImmBits(immVal, this.#inst.immBits[1]);

    // Conditionally construct funct2 field, if present
    const funct2 = this.#inst.funct2 ?? '';

    // Construct binary instruction
    this.bin = this.#inst.funct3 + imm0 + funct2 + rdRs1Prime + imm1 + this.#inst.opcode;
  }

  /**
   * Encodes CJ-type instruction
   */
  #encodeCJ() {
    // Get operands
    const immediate = this.#opr[0];

    // Construct immediate fields
    const jumpTarget = encImmBits(immediate, this.#inst.immBits);

    // Construct binary instruction
    this.bin = this.#inst.funct3 + jumpTarget + this.#inst.opcode;
  }
}

// Parse given immediate to binary
function encImm(immediate, len) {
  let bin = (Number(immediate) >>> 0).toString(BASE.bin);
  // Extend or reduce binary representation to `len` bits
  return bin.padStart(len, '0').slice(-len);
}

// Encode immediate value using the given immBits configuration
function encImmBits(immediate, immBits) {
  // Full length is 18 as no C instruction immediate will be longer
  const len = 18;
  let binFull = encImm(immediate, len);
  let bin = '';
  for (let b of immBits) {
    // Detect singular bit vs bit span
    if (typeof b === 'number') {
      bin += binFull[len - 1 - b];
    } else {
      bin += binFull.substring(len - 1 - b[0], len - b[1]);
    }
  }
  return bin;
}

// Get the lowest possible non-zero value from an immBits configuration
function minImmFromBits(immBits) {
  // Local recursive function for finding mininum value from arbitrarily nested arrays
  function deepMin(numOrArr) {
    let minVal = Infinity;
    if (typeof numOrArr === 'number') {
      return numOrArr;
    }
    for (let e of numOrArr) {
      minVal = Math.min(minVal, deepMin(e));
    }
    return minVal;
  }
  return Number('0b1' + ''.padStart(deepMin(immBits), '0'));
}

// Convert register numbers to binary
function encReg(reg, floatReg=false) {
  // Attempt to convert from ABI name to x<num> or f<num>, depending on `floatReg`
  reg = (floatReg ? FLOAT_REGISTER[reg] : REGISTER[reg]) ?? reg;
  // Validate using register file prefix determined from `floatReg` parameter
  let regFile = floatReg ? 'f' : 'x';
  if (reg === undefined || reg.length === 0) {
    // Missing operand, helpfully return 'x0' or 'f0' by default
    return '00000';
  } else if (reg[0] !== regFile || !(/^[fx]\d+/.test(reg))) {
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

// Convert compressed register numbers to binary
function encRegPrime(reg, floatReg=false) {
  // Missing operand, use x8 or f8
  if (reg === undefined) {
    return '000';
  }

  // Encode register
  const encoded = encReg(reg, floatReg);
  // Make sure that compressed register belongs to x8-x15/f8-15 range
  // - Full 5-bit encoded register should conform to '01xxx', use the 'xxx' in the encoded instruction
  if (encoded.substring(0, 2) !== '01') {
    const regFile = floatReg ? 'f' : 'x';
    throw `Invalid register "${reg}", rd' field expects compressable register from ${regFile}8 to ${regFile}15`;
  }
  return encoded.substring(2);
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
