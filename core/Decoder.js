// SPDX-License-Identifier: AGPL-3.0-or-later

/*
 * RISC-V Instruction Encoder/Decoder
 *
 * Copyright (c) 2021-2022 LupLab @ UC Davis
 */

import { BASE, XLEN_MASK,
  FIELDS, OPCODE, C_OPCODE, REGISTER, FLOAT_REGISTER, CSR,
  ISA_OP, ISA_OP_32, ISA_OP_64, ISA_OP_IMM, ISA_OP_IMM_32, ISA_OP_IMM_64,
  ISA_LOAD, ISA_STORE, ISA_BRANCH, ISA_MISC_MEM, ISA_SYSTEM, ISA_AMO,
  ISA_LOAD_FP, ISA_STORE_FP, ISA_OP_FP,
  ISA_MADD, ISA_MSUB, ISA_NMADD, ISA_NMSUB,
  ISA_C0, ISA_C1, ISA_C2,
  ISA, FRAG
} from './Constants.js'

import { COPTS_ISA } from './Config.js'

import { Frag, convertRegToAbi } from './Instruction.js'

export class Decoder {
  /**
   * Assembly representation of instruction
   * @type String
   */
  asm;
  /**
   * ISA of instruction: 'RV32I', 'RV64I', 'EXT_M', 'EXT_A', etc.
   * @type String
   */
  isa;
  /**
   * Format of instruction: 'R-type', 'I-type', etc.
   * @type String
   */
  fmt;
  /**
   * Fragments for binary instruction rendering
   * @type {Frag[]}
   */
  binFrags;
  /**
   * Fragments for assembly instruction rendering
   * @type {Frag[]}
   */
  asmfrags;

  /* Private members */
  #bin;
  #config;
  #mne;
  #opcode;
  #xlens;


  /**
   * Creates an Decoder to convert a binary instruction to assembly
   * @param {String} bin
   */
  constructor(bin, config, xlens = undefined) {
    this.#bin = bin;
    this.#config = config;
    this.#xlens = xlens;

    // Create an array of assembly fragments
    this.binFrags = [];
    this.asmFrags = [];

    // Convert instruction to assembly
    this.#convertBinToAsm();
  }

  // Convert binary instruction to assembly
  #convertBinToAsm() {
    // Use opcode to determine instruction type
    this.#opcode = getBits(this.#bin, FIELDS.opcode.pos);
    // Test for standard 32-bit instruction (i.e., the 2 LSBs of the opcode are '11')
    if (this.#opcode.substring(this.#opcode.length - 2) === '11') {
      switch (this.#opcode) {
          // R-type
        case OPCODE.OP:
        case OPCODE.OP_32:
        case OPCODE.OP_64:
          this.#decodeOP();
          break;
        case OPCODE.OP_FP:
          this.#decodeOP_FP();
          break;
        case OPCODE.AMO:
          this.#decodeAMO();
          break;

          // I-type
        case OPCODE.JALR:
          this.#decodeJALR();
          break;
        case OPCODE.LOAD:
        case OPCODE.LOAD_FP:
          this.#decodeLOAD();
          break;
        case OPCODE.OP_IMM:
        case OPCODE.OP_IMM_32:
        case OPCODE.OP_IMM_64:
          this.#decodeOP_IMM();
          break;
        case OPCODE.MISC_MEM:
          this.#decodeMISC_MEM();
          break;
        case OPCODE.SYSTEM:
          this.#decodeSYSTEM();
          break;

          // S-type
        case OPCODE.STORE:
        case OPCODE.STORE_FP:
          this.#decodeSTORE();
          break;

          // B-type
        case OPCODE.BRANCH:
          this.#decodeBRANCH();
          break;

          // U-type:
        case OPCODE.LUI:
        case OPCODE.AUIPC:
          this.#decodeUType();
          break;

          // J-type:
        case OPCODE.JAL:
          this.#decodeJAL();
          break;

          // R4-type
        case OPCODE.MADD:
        case OPCODE.MSUB:
        case OPCODE.NMADD:
        case OPCODE.NMSUB:
          this.#decodeR4();
          break;

          // Invalid opcode
        default:
          throw "Invalid opcode: " + this.#opcode;
      }

    } else {
      // Otherwise, it's a compressed instruction

      // Get single xlens value for mne lookup
      if (this.#xlens === undefined) {
        // If no xlens value from Encoder, use config to determine
        switch (this.#config.ISA) {
          case COPTS_ISA.RV128I:
            this.#xlens = XLEN_MASK.rv128;
            break;
          case COPTS_ISA.RV64I:
            this.#xlens = XLEN_MASK.rv64;
            break;
          default:
            this.#xlens = XLEN_MASK.rv32;
        }
      } else {
        // Otherwise, reduce xlens to lowest allowed ISA
        for (let b = 1; b < XLEN_MASK.all; b <<= 1) {
          if (b & this.#xlens) {
            this.#xlens = b;
            break;
          }
        }
      }

      // Use opcode to determine C quadrant
      let inst, quadrant;
      this.#opcode = getBits(this.#bin, FIELDS.c_opcode.pos);
      switch (this.#opcode) {
        case C_OPCODE.C0:
          inst = this.#mneLookupC0();
          quadrant = 'C0';
          break;
        case C_OPCODE.C1:
          inst = this.#mneLookupC1();
          quadrant = 'C1';
          break;
        case C_OPCODE.C2:
          inst = this.#mneLookupC2();
          quadrant = 'C2';
          break;
        default:
          throw `Cannot decode binary instruction: ${this.bin}`;
      }
      if (inst === undefined) {
        throw `Detected quadrant ${quadrant} but could not determine instruction, potentially HINT or reserved`;
      }

      // Build ISA string from found instruction
      if (inst.xlens & XLEN_MASK.rv32) {
        this.isa = 'RV32';
      } else if (inst.xlens & XLEN_MASK.rv64) {
        this.isa = 'RV64';
      } else {
        this.isa = 'RV128';
      }
      this.isa += inst.isa;

      // Decode instruction by format
      const fmt = /^([^-]+)-/.exec(inst?.fmt)?.[1];
      switch (fmt) {
        case 'CR':
          this.#decodeCR(inst);
          break;
        case 'CI':
          this.#decodeCI(inst);
          break;
        case 'CSS':
          this.#decodeCSS(inst);
          break;
        case 'CIW':
          this.#decodeCIW(inst);
          break;
        case 'CL':
          this.#decodeCL(inst);
          break;
        case 'CS':
          this.#decodeCS(inst);
          break;
        case 'CA':
          this.#decodeCA(inst);
          break;
        case 'CB':
          this.#decodeCB(inst);
          break;
        case 'CJ':
          this.#decodeCJ(inst);
          break;
        default:
          throw `Internal error: Detected ${this.#mne} in quadrant ${quadrant} but could not match instruction format`;
      }
    }

    if (typeof this.#mne === undefined) {
        throw "Decoder internal error";
    }

    // Set instruction's format and ISA
    this.fmt = ISA[this.#mne].fmt;
    this.isa = this.isa ?? ISA[this.#mne].isa;

    // Detect mismatch between ISA and configuration
    if (this.#config.ISA === COPTS_ISA.RV32I && /^RV(?:64|128)/.test(this.isa)) {
      throw `Detected ${this.isa} instruction but configuration ISA set to RV32I`;
    } else if ((this.#config.ISA === COPTS_ISA.RV64I && /^RV128/.test(this.isa))) {
      throw `Detected ${this.isa} instruction but configuration ISA set to RV64I`;
    }

    // Render ASM insturction string (mainly for testing)
    this.asm = renderAsm(this.asmFrags, this.#config.ABI);
  }

  /**
   * Decodes OP instructions
   */
  #decodeOP() {
    // Get each field
    const fields = extractRFields(this.#bin);
    const funct7 = fields['funct7'],
      funct3 = fields['funct3'],
      rs2 = fields['rs2'],
      rs1 = fields['rs1'],
      rd = fields['rd'];

    // Find instruction - check opcode for RV32I vs RV64I
    let opcodeName;
    if (this.#opcode === OPCODE.OP_64) {
      // RV128I double-word-sized instructions
      this.#mne = ISA_OP_64[funct7 + funct3];
      opcodeName = "OP-64";
    } else if (this.#opcode === OPCODE.OP_32) {
      // RV64I word-sized instructions
      this.#mne = ISA_OP_32[funct7 + funct3];
      opcodeName = "OP-32";
    } else {
      // All other OP instructions
      this.#mne = ISA_OP[funct7 + funct3];
      opcodeName = "OP";
    }
    if (this.#mne === undefined) {
      throw `Detected ${opcodeName} instruction but invalid funct7 and funct3 fields`;
    }

    // Convert fields to string representations
    const src1 = decReg(rs1),
          src2 = decReg(rs2),
          dest = decReg(rd);

    // Create fragments
    const f = {
      opcode: new Frag(FRAG.OPC, this.#mne, this.#opcode, FIELDS.opcode.name),
      funct3: new Frag(FRAG.OPC, this.#mne, funct3, FIELDS.funct3.name),
      funct7: new Frag(FRAG.OPC, this.#mne, funct7, FIELDS.r_funct7.name),
      rd:     new Frag(FRAG.RD, dest, rd, FIELDS.rd.name),
      rs1:    new Frag(FRAG.RS1, src1, rs1, FIELDS.rs1.name),
      rs2:    new Frag(FRAG.RS2, src2, rs2, FIELDS.rs2.name),
    };

    // Assembly fragments in order of instruction
    this.asmFrags.push(f['opcode'], f['rd'], f['rs1'], f['rs2']);

    // Binary fragments from MSB to LSB
    this.binFrags.push(f['funct7'], f['rs2'], f['rs1'], f['funct3'], f['rd'],
      f['opcode']);
  }

  /**
   * Decodes OP-FP instructions
   */
  #decodeOP_FP() {
    // Get each field
    const fields = extractRFields(this.#bin);
    const funct5 = fields['funct5'],
      funct3 = fields['funct3'],
      fmt = fields['fmt'],
      rs2 = fields['rs2'],
      rs1 = fields['rs1'],
      rd = fields['rd'];

    // Find instruction - check opcode for RV32I vs RV64I
    let opcodeName;
    this.#mne = ISA_OP_FP[funct5]?.[fmt];
    if (this.#mne !== undefined && typeof this.#mne !== 'string') {
      if (this.#mne[rs2] !== undefined) {
        // fcvt instructions - use rs2 as lookup
        this.#mne = this.#mne[rs2];
      } else {
        // others - use funct3 as lookup
        this.#mne = this.#mne[funct3];
      }
    }
    if (this.#mne === undefined) {
      throw 'Detected OP-FP instruction but invalid funct and fmt fields';
    }

    // Convert fields to string representations
    const inst = ISA[this.#mne];
    const useRs2 = inst.rs2 === undefined;
    let floatRd = true;
    let floatRs1 = true;
    if (funct5[0] === '1') {
      // Conditionally decode rd or rs1 as an int register, based on funct7
      if (funct5[3] === '1') {
        floatRs1 = false;
      } else {
        floatRd = false;
      }
    }
    const src1 = decReg(rs1, floatRs1),
          src2 = decReg(rs2, true),
          dest = decReg(rd, floatRd);

    // Create fragments
    const useRm = inst.funct3 === undefined;
    const f = {
      opcode: new Frag(FRAG.OPC, this.#mne, this.#opcode, FIELDS.opcode.name),
      funct3: new Frag(FRAG.OPC, this.#mne, funct3, useRm ? 'rm' : FIELDS.funct3.name),
      funct5: new Frag(FRAG.OPC, this.#mne, funct5, FIELDS.r_funct5.name),
      fmt:    new Frag(FRAG.OPC, this.#mne, fmt, FIELDS.r_fp_fmt.name),
      rd:     new Frag(FRAG.RD, dest, rd, FIELDS.rd.name),
      rs1:    new Frag(FRAG.RS1, src1, rs1, FIELDS.rs1.name),
      rs2:    new Frag(FRAG.OPC, src2, rs2, FIELDS.rs2.name),
    };

    // Assembly fragments in order of instruction
    this.asmFrags.push(f['opcode'], f['rd'], f['rs1']);
    if (useRs2) {
      f['rs2'].id = FRAG.RS2;
      this.asmFrags.push(f['rs2']);
    }

    // Binary fragments from MSB to LSB
    this.binFrags.push(f['funct5'], f['fmt'], f['rs2'], f['rs1'], f['funct3'], f['rd'],
      f['opcode']);
  }

  /**
   * Decodes JALR instructions
   */
  #decodeJALR() {
    // Get fields
    const fields = extractIFields(this.#bin);
    const imm = fields['imm'],
      rs1 = fields['rs1'],
      funct3 = fields['funct3'],
      rd = fields['rd'];

    this.#mne = 'jalr';

    // Convert fields to string representations
    const base = decReg(rs1),
          dest = decReg(rd),
          offset = decImm(imm);

    // Create fragments
    const f = {
      opcode: new Frag(FRAG.OPC, this.#mne, this.#opcode, FIELDS.opcode.name),
      funct3: new Frag(FRAG.OPC, this.#mne, funct3, FIELDS.funct3.name),
      rd:     new Frag(FRAG.RD, dest, rd, FIELDS.rd.name),
      rs1:    new Frag(FRAG.RS1, base, rs1, FIELDS.rs1.name),
      imm:    new Frag(FRAG.IMM, offset, imm, FIELDS.i_imm_11_0.name),
    };

    // Assembly fragments in order of instruction
    this.asmFrags.push(f['opcode'], f['rd'], f['rs1'], f['imm']);

    // Binary fragments from MSB to LSB
    this.binFrags.push(f['imm'], f['rs1'], f['funct3'], f['rd'], f['opcode']);
  }

  /**
   * Decodes LOAD instructions
   */
  #decodeLOAD() {
    // Get fields
    const fields = extractIFields(this.#bin);
    const imm = fields['imm'],
      rs1 = fields['rs1'],
      funct3 = fields['funct3'],
      rd = fields['rd'];

    // Find instruction
    const floatInst = this.#opcode === OPCODE.LOAD_FP;
    this.#mne = floatInst ? ISA_LOAD_FP[funct3] : ISA_LOAD[funct3];
    if (this.#mne === undefined) {
      throw `Detected LOAD${floatInst ? '-FP' : ''} `
        + 'instruction but invalid funct3 field';
    }

    // Convert fields to string representations
    const base = decReg(rs1),
          dest = decReg(rd, floatInst),
          offset = decImm(imm);

    // Create fragments
    const f = {
      opcode: new Frag(FRAG.OPC, this.#mne, this.#opcode, FIELDS.opcode.name),
      funct3: new Frag(FRAG.OPC, this.#mne, funct3, FIELDS.funct3.name),
      rd:     new Frag(FRAG.RD, dest, rd, FIELDS.rd.name),
      rs1:    new Frag(FRAG.RS1, base, rs1, FIELDS.rs1.name, true),
      imm:    new Frag(FRAG.IMM, offset, imm, FIELDS.i_imm_11_0.name),
    };

    // Assembly fragments in order of instruction
    this.asmFrags.push(f['opcode'], f['rd'], f['imm'], f['rs1']);

    // Binary fragments from MSB to LSB
    this.binFrags.push(f['imm'], f['rs1'], f['funct3'], f['rd'], f['opcode']);
  }

  /**
   * Decodes OP_IMM instructions
   */
  #decodeOP_IMM() {
    // Get fields
    const fields = extractIFields(this.#bin);
    const imm = fields['imm'],
      rs1 = fields['rs1'],
      funct3 = fields['funct3'],
      rd = fields['rd'];

    // Find instruction - check opcode for RV32I vs RV64I
    let opcodeName;
    const op_imm_32 = this.#opcode === OPCODE.OP_IMM_32;
    const op_imm_64 = this.#opcode === OPCODE.OP_IMM_64;
    if(op_imm_64) {
      // RV128I double-word-sized instructions
      this.#mne = ISA_OP_IMM_64[funct3];
      opcodeName = "OP-IMM-64";
    } else if(op_imm_32) {
      // RV64I word-sized instructions
      this.#mne = ISA_OP_IMM_32[funct3];
      opcodeName = "OP-IMM-32";
    } else {
      // All other OP-IMM instructions
      this.#mne = ISA_OP_IMM[funct3];
      opcodeName = "OP-IMM";
    }
    if (this.#mne === undefined) {
      throw `Detected ${opcodeName} instruction but invalid funct3 field`;
    }

    // Shift instructions
    let shift;
    if (typeof this.#mne !== 'string') {
      // Right shift instructions
      shift = true;
      this.#mne = this.#mne[fields['shtyp']];
    } else {
      // Only other case of immediate shift
      shift = (funct3 === ISA['slli'].funct3);
    }

    // Convert fields to string representations
    const src = decReg(rs1),
          dest = decReg(rd);

    // Create fragments
    const f = {
      opcode: new Frag(FRAG.OPC, this.#mne, this.#opcode, FIELDS.opcode.name),
      funct3: new Frag(FRAG.OPC, this.#mne, funct3, FIELDS.funct3.name),
      rd:     new Frag(FRAG.RD, dest, rd, FIELDS.rd.name),
      rs1:    new Frag(FRAG.RS1, src, rs1, FIELDS.rs1.name),
    };

    if (shift) {
      const shtyp = fields['shtyp'];
      const shamt_6 = fields['shamt_6'];
      const shamt_5 = fields['shamt_5'];
      const shamt_4_0 = fields['shamt'];
      const shamt_5_0 = shamt_5 + shamt_4_0;
      const shamt_6_0 = shamt_6 + shamt_5_0;


      const imm_11_7 = '0' + shtyp + '000';
      const imm_11_6 = imm_11_7 + '0';
      const imm_11_5 = imm_11_6 + '0';

      // Decode shamt
      const shamt = decImm(shamt_6_0, false);

      // Determine shamtWidth (5, 6, or 7 bits) based on opcode, ISA, and value
      // - First, opcode based determination
      // - Then, ISA and value based determination
      let shamtWidth;
      if (op_imm_32) {
        shamtWidth = 5;
      } else if (op_imm_64) {
        shamtWidth = 6;
        this.isa = 'RV128I';  // Set ISA here to avoid assumed ISA of RV64I below
      } else if (this.#config.ISA === COPTS_ISA.RV32I || (shamt_6 === '0' && shamt_5 === '0')) {
        shamtWidth = 5;
      } else if (this.#config.ISA === COPTS_ISA.RV64I || shamt_6 === '0') {
        shamtWidth = 6;
      } else {
        shamtWidth = 7;
      }

      // Detect shamt out of range
      if (shamt >= 32 && shamtWidth === 5) {
        throw `Invalid shamt field: ${shamt} (out of range for opcode or ISA config)`;
      } else if (shamt >= 64 && shamtWidth === 6) {
        throw `Invalid shamt field: ${shamt} (out of range for opcode or ISA config)`;
      }

      // Create frags for shamt and shtyp
      if (shamtWidth === 7) {
        // Create frags for 7bit shamt with shtyp
        const shamt_6_0 = shamt_6 + shamt_5 + shamt_4_0;

        // Create frags for shamt and shtyp
        f['imm'] = new Frag(FRAG.IMM, shamt, shamt_6_0, FIELDS.i_shamt_6_0.name);
        f['shift'] = new Frag(FRAG.OPC, this.#mne, imm_11_7, FIELDS.i_shtyp_11_7.name);

        // Set output ISA to RV64I
        this.isa = 'RV128I';

      } else if (shamtWidth === 6) {
        // Create frags for 6bit shamt with shtyp
        const shamt_5_0 = shamt_5 + shamt_4_0;

        // Create frags for shamt and shtyp
        f['imm'] = new Frag(FRAG.IMM, shamt, shamt_5_0, FIELDS.i_shamt_5_0.name);
        f['shift'] = new Frag(FRAG.OPC, this.#mne, imm_11_6, FIELDS.i_shtyp_11_6.name);

        // Set output ISA to RV64I
        this.isa = this.isa ?? 'RV64I';

      } else {
        // Create frags for 5bit shamt with shtyp
        f['imm'] = new Frag(FRAG.IMM, shamt, shamt_4_0, FIELDS.i_shamt.name);
        f['shift'] = new Frag(FRAG.OPC, this.#mne, imm_11_5, FIELDS.i_shtyp_11_5.name);
      }

      // Validate upper bits of immediate field to ensure
      //   they match expected value for shift type
      if((shamtWidth === 5 && imm_11_5 !== imm.substring(0,7))
          || (shamtWidth === 6 && imm_11_6 !== imm.substring(0,6))
          || (shamtWidth === 7 && imm_11_7 !== imm.substring(0,5))) {
        throw `Detected ${this.isa} shift immediate instruction but invalid shtyp field`;
      }

      // Binary fragments from MSB to LSB
      this.binFrags.push(f['shift'], f['imm'], f['rs1'],
        f['funct3'], f['rd'], f['opcode']);

    } else {
      const imm = fields['imm'];
      const immediate = decImm(imm);

      f['imm'] = new Frag(FRAG.IMM, immediate, imm, FIELDS.i_imm_11_0.name);

      // Binary fragments from MSB to LSB
      this.binFrags.push(f['imm'], f['rs1'], f['funct3'], f['rd'], f['opcode']);
    }

    // Assembly fragments in order of instruction
    this.asmFrags.push(f['opcode'], f['rd'], f['rs1'], f['imm']);
  }

  /**
   * Decode MISC_MEM instructions
   */
  #decodeMISC_MEM() {
    // Get fields
    const fields = extractIFields(this.#bin);
    const imm = fields['imm'],
      fm = fields['fm'],
      pred = fields['pred'],
      succ = fields['succ'],
      rs1 = fields['rs1'],
      funct3 = fields['funct3'],
      rd = fields['rd'];

    // Find instruction
    this.#mne = ISA_MISC_MEM[funct3];
    if (this.#mne === undefined) {
      throw "Detected MISC-MEM instruction but invalid funct3 field";
    }
    // Signals when MISC-MEM used as extended encoding space for load operations
    let loadExt = this.#mne === 'lq';

    // Check registers
    if (!loadExt && (rd !== '00000' || rs1 !== '00000')) {
      throw "Registers rd and rs1 should be 0";
    }

    // Create common fragments
    const f = {
      opcode: new Frag(FRAG.OPC, this.#mne, this.#opcode, FIELDS.opcode.name),
      funct3: new Frag(FRAG.OPC, this.#mne, funct3, FIELDS.funct3.name),
    };

    // Create specific fragments
    if (loadExt) {
      // Load extension instructions

      // Convert fields to string representations
      const offset = decImm(imm),
            base = decReg(rs1),
            dest = decReg(rd);


      f['imm'] = new Frag(FRAG.IMM, offset, imm, FIELDS.i_imm_11_0.name);
      f['rs1'] = new Frag(FRAG.RS1, base, rs1, FIELDS.rs1.name, true);
      f['rd']  = new Frag(FRAG.RD, dest, rd, FIELDS.rd.name);

      // Assembly fragments in order of instruction
      this.asmFrags.push(f['opcode'], f['rd'], f['imm'], f['rs1']);

      // Binary fragments from MSB to LSB
      this.binFrags.push(f['imm'], f['rs1'], f['funct3'], f['rd'], f['opcode']);

    } else if (this.#mne === 'fence') {
      // FENCE instruction

      // Convert fields to string representations
      let predecessor = decMem(pred);
      let successor = decMem(succ);

      f['fm']   = new Frag(FRAG.OPC, this.#mne, fm, FIELDS.i_fm.name);
      f['pred'] = new Frag(FRAG.PRED, predecessor, pred, FIELDS.i_pred.name);
      f['succ'] = new Frag(FRAG.SUCC, successor, succ, FIELDS.i_succ.name);
      f['rd']  = new Frag(FRAG.OPC, this.#mne, rd, FIELDS.rd.name);
      f['rs1'] = new Frag(FRAG.OPC, this.#mne, rs1, FIELDS.rs1.name, loadExt);

      // Assembly fragments in order of instruction
      this.asmFrags.push(f['opcode'], f['pred'], f['succ']);

      // Binary fragments from MSB to LSB
      this.binFrags.push(f['fm'], f['pred'], f['succ'], f['rs1'], f['funct3'],
        f['rd'], f['opcode']);

    } else if (this.#mne === 'fence.i') {
      // FENCE.I instruction

      f['imm'] = new Frag(FRAG.UNSD, this.#mne, imm, FIELDS.i_imm_11_0.name);
      f['rs1'] = new Frag(FRAG.UNSD, this.#mne, rs1, FIELDS.rs1.name);
      f['rd']  = new Frag(FRAG.UNSD, this.#mne, rd, FIELDS.rd.name);

      // Assembly fragments in order of instruction
      this.asmFrags.push(f['opcode']);

      // Binary fragments from MSB to LSB
      this.binFrags.push(f['imm'], f['rs1'], f['funct3'], f['rd'], f['opcode']);
    }
  }

  /**
   * Decode SYSTEM instructions
   */
  #decodeSYSTEM() {
    // Get fields
    const fields = extractIFields(this.#bin);
    const funct12 = fields['imm'],
      rs1 = fields['rs1'],
      funct3 = fields['funct3'],
      rd = fields['rd'];

    // Find instruction
    this.#mne = ISA_SYSTEM[funct3];
    if (this.#mne === undefined) {
      throw "Detected SYSTEM instruction but invalid funct3 field";
    }

    // Trap instructions - determine mnemonic from funct12
    let trap = (typeof this.#mne !== 'string');
    if (trap) {
      this.#mne = this.#mne[funct12];
      if (this.#mne === undefined) {
        throw "Detected SYSTEM instruction but invalid funct12 field";
      }
      // Check registers
      if (rd !== '00000' || rs1 !== '00000') {
        throw "Registers rd and rs1 should be 0 for mne " + this.#mne;
      }
    }

    // Create common fragments
    const f = {
      opcode: new Frag(FRAG.OPC, this.#mne, this.#opcode, FIELDS.opcode.name),
      funct3: new Frag(FRAG.OPC, this.#mne, funct3, FIELDS.funct3.name),
    };

    // Trap instructions - create specific fragments and render
    if (trap) {
      // Create remaining fragments
      f['rd'] = new Frag(FRAG.OPC, this.#mne, rd, FIELDS.rd.name);
      f['rs1'] = new Frag(FRAG.OPC, this.#mne, rs1, FIELDS.rs1.name);
      f['funct12'] = new Frag(FRAG.OPC, this.#mne, funct12, FIELDS.i_funct12.name);

      // Assembly fragments in order of instruction
      this.asmFrags.push(f['opcode']);

      // Binary fragments from MSB to LSB
      this.binFrags.push(f['funct12'], f['rs1'], f['funct3'], f['rd'],
        f['opcode']);

    } else {
      // Zicsr instructions

      // Alias already extracted field for clarity
      const csrBin = funct12;

      // Convert fields to string types
      const dest = decReg(rd),
            csr = decCSR(csrBin);

      // Convert rs1 to register or immediate
      //   based off high bit of funct3 (0:reg, 1:imm)
      let src, srcFieldName;
      if (funct3[0] === '0') {
        src = decReg(rs1);
        srcFieldName = FIELDS.rs1.name;
      } else {
        src = decImm(rs1, false);
        srcFieldName = FIELDS.i_imm_4_0.name;
      }

      // Create remaining fragments
      f['rd'] = new Frag(FRAG.RD, dest, rd, FIELDS.rd.name);
      f['csr'] = new Frag(FRAG.CSR, csr, csrBin, FIELDS.i_csr.name);
      f['rs1'] = new Frag(FRAG.RS1, src, rs1, srcFieldName);

      // Assembly fragments in order of instruction
      this.asmFrags.push(f['opcode'], f['rd'], f['csr'], f['rs1']);

      // Binary fragments from MSB to LSB
      this.binFrags.push(f['csr'], f['rs1'], f['funct3'], f['rd'],
        f['opcode']);
    }
  }

  /**
   * Decodes STORE instruction
   */
  #decodeSTORE() {
    // Get fields
    const fields = extractSFields(this.#bin);
    const imm_11_5 = fields['imm_11_5'],
      rs2 = fields['rs2'],
      rs1 = fields['rs1'],
      funct3 = fields['funct3'],
      imm_4_0 = fields['imm_4_0'],
      imm = imm_11_5 + imm_4_0;

    // Find instruction
    const floatInst = this.#opcode === OPCODE.STORE_FP;
    this.#mne = floatInst ? ISA_STORE_FP[funct3] : ISA_STORE[funct3];
    if (this.#mne === undefined) {
      throw `Detected STORE${floatInst ? '-FP' : ''} `
        + 'instruction but invalid funct3 field';
    }

    // Convert fields to string representations
    const offset = decImm(imm);
    const base = decReg(rs1);
    const src = decReg(rs2, floatInst);

    // Create common fragments
    const f = {
      opcode:   new Frag(FRAG.OPC, this.#mne, this.#opcode, FIELDS.opcode.name),
      funct3:   new Frag(FRAG.OPC, this.#mne, funct3, FIELDS.funct3.name),
      rs1:      new Frag(FRAG.RS1, base, rs1, FIELDS.rs1.name, true),
      rs2:      new Frag(FRAG.RS2, src, rs2, FIELDS.rs2.name),
      imm_4_0:  new Frag(FRAG.IMM, offset, imm_4_0, FIELDS.s_imm_4_0.name),
      imm_11_5: new Frag(FRAG.IMM, offset, imm_11_5, FIELDS.s_imm_11_5.name),
      imm:      new Frag(FRAG.IMM, offset, imm, 'imm'),
    };

    // Assembly fragments in order of instruction
    this.asmFrags.push(f['opcode'], f['rs2'], f['imm'], f['rs1']);

    // Binary fragments from MSB to LSB
    this.binFrags.push(f['imm_11_5'], f['rs2'], f['rs1'], f['funct3'],
      f['imm_4_0'], f['opcode']);
  }

  /**
   * Decodes BRANCH instruction
   */
  #decodeBRANCH() {
    // Get fields
    const fields = extractBFields(this.#bin);
    const imm_12 = fields['imm_12'],
      imm_10_5 = fields['imm_10_5'],
      rs2 = fields['rs2'],
      rs1 = fields['rs1'],
      funct3 = fields['funct3'],
      imm_4_1 = fields['imm_4_1'],
      imm_11 = fields['imm_11'];

    // Reconstitute immediate
    const imm = imm_12 + imm_11 + imm_10_5 + imm_4_1 + '0';

    // Find instruction
    this.#mne = ISA_BRANCH[funct3];
    if (this.#mne === undefined) {
      throw "Detected BRANCH instruction but invalid funct3 field";
    }

    // Convert fields to string representations
    const offset = decImm(imm),
          src2 = decReg(rs2),
          src1 = decReg(rs1);

    // Create fragments
    const f = {
      opcode:   new Frag(FRAG.OPC, this.#mne, this.#opcode, FIELDS.opcode.name),
      funct3:   new Frag(FRAG.OPC, this.#mne, funct3, FIELDS.funct3.name),
      rs1:      new Frag(FRAG.RS1, src1, rs1, FIELDS.rs1.name),
      rs2:      new Frag(FRAG.RS2, src2, rs2, FIELDS.rs2.name),
      imm_12:   new Frag(FRAG.IMM, offset, imm_12, FIELDS.b_imm_12.name),
      imm_11:   new Frag(FRAG.IMM, offset, imm_11, FIELDS.b_imm_11.name),
      imm_10_5: new Frag(FRAG.IMM, offset, imm_10_5, FIELDS.b_imm_10_5.name),
      imm_4_1:  new Frag(FRAG.IMM, offset, imm_4_1, FIELDS.b_imm_4_1.name),
      imm:      new Frag(FRAG.IMM, offset, imm, 'imm'),
    };

    // Assembly fragments in order of instruction
    this.asmFrags.push(f['opcode'], f['rs1'], f['rs2'], f['imm']);

    // Binary fragments from MSB to LSB
    this.binFrags.push(f['imm_12'], f['imm_10_5'], f['rs2'], f['rs1'],
      f['funct3'], f['imm_4_1'], f['imm_11'], f['opcode']);
  }

  /**
   * Decodes U-type instruction
   */
  #decodeUType() {
    // Get fields
    const imm_31_12 = getBits(this.#bin, FIELDS.u_imm_31_12.pos);
    const rd = getBits(this.#bin, FIELDS.rd.pos);

    // Construct full 32-bit immediate value
    // - Upper 20 bits of encoded as immediate field in instruction
    // - Lower 12 bits set to 0
    const imm = imm_31_12 + ''.padStart(12, '0');

    // Convert fields to string representations
    const immediate = decImm(imm), dest = decReg(rd);

    // Determine operation
    this.#mne = (this.#opcode === OPCODE.AUIPC) ? 'auipc' : 'lui';

    // Create fragments
    const f = {
      opcode:     new Frag(FRAG.OPC, this.#mne, this.#opcode, FIELDS.opcode.name),
      rd:         new Frag(FRAG.RD, dest, rd, FIELDS.rd.name),
      imm_31_12:  new Frag(FRAG.IMM, immediate, imm_31_12, FIELDS.u_imm_31_12.name),
      imm:        new Frag(FRAG.IMM, immediate, imm, FIELDS.u_imm_31_12.name),
    };

    // Assembly fragments in order of instruction
    this.asmFrags.push(f['opcode'], f['rd'], f['imm']);

    // Binary fragments from MSB to LSB
    this.binFrags.push(f['imm_31_12'], f['rd'], f['opcode']);
  }

  /**
   * Decodes JAL instruction
   */
  #decodeJAL() {
    // Get fields
    const imm_20 = getBits(this.#bin, FIELDS.j_imm_20.pos);
    const imm_10_1 = getBits(this.#bin, FIELDS.j_imm_10_1.pos);
    const imm_11 = getBits(this.#bin, FIELDS.j_imm_11.pos);
    const imm_19_12 = getBits(this.#bin, FIELDS.j_imm_19_12.pos);
    const rd = getBits(this.#bin, FIELDS.rd.pos);

    // Reconstitute immediate
    const imm = imm_20 + imm_19_12 + imm_11 + imm_10_1 + '0';

    this.#mne = 'jal';

    // Convert fields to string representations
    const offset = decImm(imm);
    const dest = decReg(rd);

    // Create fragments
    const f = {
      opcode:     new Frag(FRAG.OPC, this.#mne, this.#opcode, FIELDS.opcode.name),
      rd:         new Frag(FRAG.RD, dest, rd, FIELDS.rd.name),
      imm_20:     new Frag(FRAG.IMM, offset, imm_20, FIELDS.j_imm_20.name),
      imm_10_1:   new Frag(FRAG.IMM, offset, imm_10_1, FIELDS.j_imm_10_1.name),
      imm_11:     new Frag(FRAG.IMM, offset, imm_11, FIELDS.j_imm_11.name),
      imm_19_12:  new Frag(FRAG.IMM, offset, imm_19_12, FIELDS.j_imm_19_12.name),
      imm:        new Frag(FRAG.IMM, offset, imm, 'imm'),
    };

    // Assembly fragments in order of instruction
    this.asmFrags.push(f['opcode'], f['rd'], f['imm']);

    // Binary fragments from MSB to LSB
    this.binFrags.push(f['imm_20'], f['imm_10_1'], f['imm_11'], f['imm_19_12'],
      f['rd'], f['opcode']);
  }

  /**
   * Decodes AMO instruction
   */
  #decodeAMO() {
    // Get fields
    const fields = extractRFields(this.#bin);
    const funct5 = fields['funct5'],
      aq = fields['aq'],
      rl = fields['rl'],
      rs2 = fields['rs2'],
      rs1 = fields['rs1'],
      funct3 = fields['funct3'],
      rd = fields['rd'];

    // Find instruction
    this.#mne = ISA_AMO[funct5+funct3];
    if (this.#mne === undefined) {
      throw "Detected AMO instruction but invalid funct5 and funct3 fields";
    }

    // Check if 'lr' instruction
    const lr = /^lr\./.test(this.#mne);

    // Convert fields to string representations
    const dest = decReg(rd);
    const addr = decReg(rs1);
    const src  = lr ? 'n/a' : decReg(rs2);

    // Create fragments
    const f = {
      opcode:   new Frag(FRAG.OPC, this.#mne, this.#opcode, FIELDS.opcode.name),
      rd:       new Frag(FRAG.RD, dest, rd, FIELDS.rd.name),
      funct3:   new Frag(FRAG.OPC, this.#mne, funct3, FIELDS.funct3.name),
      rs1:      new Frag(FRAG.RS1, addr, rs1, FIELDS.rs1.name, true),
      rs2:      new Frag(FRAG.OPC, src, rs2, FIELDS.rs2.name),
      rl:       new Frag(FRAG.OPC, this.#mne, rl, FIELDS.r_rl.name),
      aq:       new Frag(FRAG.OPC, this.#mne, aq, FIELDS.r_aq.name),
      funct5:   new Frag(FRAG.OPC, this.#mne, funct5, FIELDS.r_funct5.name),
    };

    // Assembly fragments in order of instruction
    this.asmFrags.push(f['opcode'], f['rd']);
    if (!lr) {
      f['rs2'].id = FRAG.RS2;
      this.asmFrags.push(f['rs2']);
    }
    this.asmFrags.push(f['rs1']);

    // Binary fragments from MSB to LSB
    this.binFrags.push(f['funct5'], f['aq'], f['rl'], f['rs2'],
      f['rs1'], f['funct3'], f['rd'], f['opcode']);
  }

  /**
   * Decodes R4 instructions
   */
  #decodeR4() {
    // Get each field
    const fields = extractRFields(this.#bin);
    const rs3 = fields['funct5'],
      fmt = fields['fmt'],
      rs2 = fields['rs2'],
      rs1 = fields['rs1'],
      rm = fields['funct3'],
      rd = fields['rd'];

    // Find instruction
    switch (this.#opcode) {
      case OPCODE.MADD:
        this.#mne = ISA_MADD[fmt];
        break;
      case OPCODE.MSUB:
        this.#mne = ISA_MSUB[fmt];
        break;
      case OPCODE.NMADD:
        this.#mne = ISA_NMADD[fmt];
        break;
      case OPCODE.NMSUB:
        this.#mne = ISA_NMSUB[fmt];
        break;
    }
    if (this.#mne === undefined) {
      throw `Detected fused multiply-add instruction but invalid fmt field`;
    }

    // Convert fields to string representations
    const src1 = decReg(rs1, true),
          src2 = decReg(rs2, true),
          src3 = decReg(rs3, true),
          dest = decReg(rd, true);

    // Create fragments
    const f = {
      opcode: new Frag(FRAG.OPC, this.#mne, this.#opcode, FIELDS.opcode.name),
      fmt:    new Frag(FRAG.OPC, this.#mne, fmt, FIELDS.r_fp_fmt.name),
      rm:     new Frag(FRAG.OPC, this.#mne, rm, 'rm'),
      rd:     new Frag(FRAG.RD, dest, rd, FIELDS.rd.name),
      rs1:    new Frag(FRAG.RS1, src1, rs1, FIELDS.rs1.name),
      rs2:    new Frag(FRAG.RS2, src2, rs2, FIELDS.rs2.name),
      rs3:    new Frag(FRAG.RS3, src3, rs3, 'rs3'),
    };

    // Assembly fragments in order of instruction
    this.asmFrags.push(f['opcode'], f['rd'], f['rs1'], f['rs2'], f['rs3']);

    // Binary fragments from MSB to LSB
    this.binFrags.push(f['rs3'], f['fmt'], f['rs2'], f['rs1'], f['rm'], f['rd'],
      f['opcode']);
  }

  /**
   * Looks up C0 instruction mnemonics
   */
  #mneLookupC0() {
    // Get fields required for mne lookup
    const fields = extractCLookupFields(this.#bin);

    // C0 Instruction order of lookup
    // - funct3
    // - xlen
    this.#mne = ISA_C0[fields['funct3']];
    if (typeof this.#mne === 'object') {
      this.#mne = this.#mne[this.#xlens] ?? this.#mne[XLEN_MASK.all];
    }

    // Find and return instruction
    return ISA[this.#mne];
  }

  /**
   * Looks up C1 instruction mnemonics
   */
  #mneLookupC1() {
    // Get fields required for mne lookup
    const fields = extractCLookupFields(this.#bin);

    // C1 Instruction order of lookup
    // - funct3
    // - xlen
    // - rdRs1Val
    // - funct2_cb
    // - funct6[3]+funct2
    this.#mne = ISA_C1[fields['funct3']];
    if (typeof this.#mne === 'object') {
      this.#mne = this.#mne[this.#xlens] ?? this.#mne[XLEN_MASK.all];
      if (typeof this.#mne === 'object') {
        const rdRs1Val = decImm(fields['rd_rs1'], false);
        this.#mne = this.#mne[rdRs1Val] ?? this.#mne['default'];
        if (typeof this.#mne === 'object') {
          this.#mne = this.#mne[fields['funct2_cb']];
          if (typeof this.#mne === 'object') {
            this.#mne = this.#mne[fields['funct6'][3] + fields['funct2']];
          }
        }
      }
    }

    // Find and return instruction
    return ISA[this.#mne];
  }

  /**
   * Looks up C2 instruction mnemonics
   */
  #mneLookupC2() {
    // Get fields required for mne lookup
    const fields = extractCLookupFields(this.#bin);

    // C2 Instruction order of lookup
    // - funct3
    // - xlen
    // - funct4[3]
    // - rs2Val
    // - rdRs1Val
    this.#mne = ISA_C2[fields['funct3']];
    if (typeof this.#mne === 'object') {
      this.#mne = this.#mne[this.#xlens] ?? this.#mne[XLEN_MASK.all];
      if (typeof this.#mne === 'object') {
        this.#mne = this.#mne[fields['funct4'][3]];
        if (typeof this.#mne === 'object') {
          const rs2Val = decImm(fields['rs2'], false);
          this.#mne = this.#mne[rs2Val] ?? this.#mne['default'];
          if (typeof this.#mne === 'object') {
            const rdRs1Val = decImm(fields['rd_rs1'], false);
            this.#mne = this.#mne[rdRs1Val] ?? this.#mne['default'];
          }
        }
      }
    }

    // Find and return instruction
    return ISA[this.#mne];
  }

  /**
   * Decodes CR-type instruction
   */
  #decodeCR(inst) {
    // Get fields
    const funct4 = getBits(this.#bin, FIELDS.c_funct4.pos);
    const rdRs1  = getBits(this.#bin, FIELDS.c_rd_rs1.pos);
    const rs2    = getBits(this.#bin, FIELDS.c_rs2.pos);
    const opcode = getBits(this.#bin, FIELDS.c_opcode.pos);

    // Convert fields to string representations
    const destSrc1 = decReg(rdRs1);
    const src2     = decReg(rs2);

    // Validate operands
    const destSrc1Val = decImm(rdRs1, false);
    if (inst.rdRs1Excl?.includes(destSrc1Val)) {
      throw `Detected ${this.#mne} instruction, but illegal value "${destSrc1}" in rd/rs1 field`;
    }
    const src2Val = decImm(rs2, false);
    if (inst.rs2Excl?.includes(src2Val)) {
      throw `Detected ${this.#mne} instruction, but illegal value "${src2}" in rs2 field`;
    }

    // Determine name for destSrc1
    let destSrc1Name;
    switch (inst.rdRs1Mask) {
      case 0b01:
        destSrc1Name = FIELDS.c_rs1.name;
        break;
      case 0b10:
        destSrc1Name = FIELDS.c_rd.name;
        break;
      default:
        destSrc1Name = FIELDS.c_rd_rs1.name;
    }
    if (inst.rdRs1Excl !== undefined) {
      destSrc1Name += '≠' + regExclToString(inst.rdRs1Excl);
    }

    // Determine name for src2
    let src2Name = FIELDS.c_rs2.name;
    if (inst.rs2Excl !== undefined) {
      src2Name += '≠' + regExclToString(inst.rs2Excl);
    }

    // Create fragments
    const f = {
      opcode: new Frag(FRAG.OPC, this.#mne, this.#opcode, FIELDS.c_opcode.name),
      funct4: new Frag(FRAG.OPC, this.#mne, funct4, FIELDS.c_funct4.name),
    };

    // Create custom fragments
    const dynamicRdRs1 = inst.rdRs1Val === undefined;
    if (dynamicRdRs1) {
      f['rd_rs1'] = new Frag(FRAG.RD, destSrc1, rdRs1, destSrc1Name);
    } else {
      f['rd_rs1'] = new Frag(FRAG.OPC, this.#mne, rdRs1, 'static-' + destSrc1Name);
    }
    const dynamicRs2 = inst.rs2Val === undefined;
    if (dynamicRs2) {
      f['rs2'] = new Frag(FRAG.RS2, src2, rs2, src2Name);
    } else {
      f['rs2'] = new Frag(FRAG.OPC, this.#mne, rs2, 'static-' + src2Name);
    }

    // Assembly fragments in order of instruction
    this.asmFrags.push(f['opcode']);
    if (dynamicRdRs1) {
      this.asmFrags.push(f['rd_rs1']);
      if (dynamicRs2) {
        this.asmFrags.push(f['rs2']);
      }
    }

    // Binary fragments from MSB to LSB
    this.binFrags.push(f['funct4'], f['rd_rs1'], f['rs2'], f['opcode']);
  }

  /**
   * Decodes CI-type instruction
   */
  #decodeCI(inst) {
    // Get fields
    const funct3 = getBits(this.#bin, FIELDS.c_funct3.pos);
    const imm0   = getBits(this.#bin, FIELDS.c_imm_ci_0.pos);
    const rdRs1  = getBits(this.#bin, FIELDS.c_rd_rs1.pos);
    const imm1   = getBits(this.#bin, FIELDS.c_imm_ci_1.pos);
    const opcode = getBits(this.#bin, FIELDS.c_opcode.pos);

    // Determine instruction type, for special cases
    const shiftInst = /^c\.slli/.test(this.#mne);

    // Check if floating-point load instruction
    const floatRdRs1 = /^c\.fl/.test(this.#mne);

    // Convert fields to string representations
    const destSrc1 = decReg(rdRs1, floatRdRs1);
    const immVal = decImmBits([imm0, imm1], inst.immBits, inst.uimm);

    // Perform shift-specific special cases
    if (shiftInst) {
      if (immVal === 0) {
        // Determine if shift is a shift64 function
        this.#mne += '64';
        inst = ISA[this.#mne];
        if (inst === undefined) {
          throw `Internal error when converting shift-immediate instruction into ${this.#mne}`;
        }
        // Overwrite ISA
        this.isa = 'RV128' + inst.isa;

      } else if (imm0 === '1' && /^RV32/.test(this.isa)) {
        // Force RV32C -> RV64C isa if imm[5] is set (shamt > 31)
        this.isa = 'RV64' + inst.isa;
      }
    }

    // Validate operand values
    const destSrc1Val = decImm(rdRs1, false);
    if (inst.rdRs1Excl?.includes(destSrc1Val)) {
      throw `Detected ${this.#mne} instruction, but illegal value "${destSrc1}" in rd/rs1 field`;
    }
    if (inst.nzimm && immVal === 0) {
      throw `Detected ${this.#mne}, but instruction expects non-zero immediate value (encoding reserved)`
    }

    // Determine name for destSrc1
    let destSrc1Name;
    switch (inst.rdRs1Mask) {
      case 0b01:
        destSrc1Name = FIELDS.c_rs1.name;
        break;
      case 0b10:
        destSrc1Name = FIELDS.c_rd.name;
        break;
      default:
        destSrc1Name = FIELDS.c_rd_rs1.name;
    }
    if (inst.rdRs1Excl !== undefined) {
      destSrc1Name += '≠' + regExclToString(inst.rdRs1Excl);
    }

    // Determine name for immediate
    let immName = '';
    if (!shiftInst) {
      if (inst.nzimm) {
        immName += 'nz';
      }
      if (inst.uimm) {
        immName += 'u';
      }
    }
    immName += shiftInst
      ? FIELDS.c_shamt_0.name
      : FIELDS.c_imm_ci_0.name;

    // Create common fragments
    const f = {
      opcode: new Frag(FRAG.OPC, this.#mne, this.#opcode, FIELDS.c_opcode.name),
      funct3: new Frag(FRAG.OPC, this.#mne, funct3, FIELDS.c_funct3.name),
    };

    // Create and append custom fragments
    const dynamicRdRs1 = inst.rdRs1Val === undefined;
    const dynamicImm = inst.immVal === undefined;
    if (dynamicRdRs1) {
      f['rd_rs1'] = new Frag(FRAG.RD, destSrc1, rdRs1, destSrc1Name);
    } else {
      f['rd_rs1'] = new Frag(FRAG.OPC, this.#mne, rdRs1, 'static-' + destSrc1Name);
    }
    if (dynamicImm) {
      f['imm0'] = new Frag(FRAG.IMM, immVal, imm0, immName + immBitsToString(inst.immBits[0]));
      f['imm1'] = new Frag(FRAG.IMM, immVal, imm1, immName + immBitsToString(inst.immBits[1]));
    } else {
      f['imm0'] = new Frag(FRAG.OPC, this.#mne, imm0, 'static-' + immName + immBitsToString(inst.immBits[0]));
      f['imm1'] = new Frag(FRAG.OPC, this.#mne, imm1, 'static-' + immName + immBitsToString(inst.immBits[1]));
    }

    // Assembly fragments in order of instruction
    this.asmFrags.push(f['opcode']);
    if (dynamicRdRs1) {
      this.asmFrags.push(f['rd_rs1']);
    }
    if (dynamicImm) {
      this.asmFrags.push(f['imm0']);
    }

    // Binary fragments from MSB to LSB
    this.binFrags.push(f['funct3'], f['imm0'], f['rd_rs1'], f['imm1'], f['opcode']);
  }

  /**
   * Decodes CSS-type instruction
   */
  #decodeCSS(inst) {
    // Get fields
    const funct3 = getBits(this.#bin, FIELDS.c_funct3.pos);
    const imm    = getBits(this.#bin, FIELDS.c_imm_css.pos);
    const rs2    = getBits(this.#bin, FIELDS.c_rs2.pos);

    // Determine name for immediate
    let immName = '';
    if (inst.uimm) {
      immName += 'u';
    }
    immName += FIELDS.c_imm_css.name;

    // Check if floating-point load instruction
    const floatRs2 = /^c\.f/.test(this.#mne);

    // Convert fields to string representations
    const offset = decImmBits(imm, inst.immBits, inst.uimm);
    const src = decReg(rs2, floatRs2);

    // Create fragments
    const f = {
      opcode: new Frag(FRAG.OPC, this.#mne, this.#opcode, FIELDS.c_opcode.name),
      funct3: new Frag(FRAG.OPC, this.#mne, funct3, FIELDS.c_funct3.name),
      rs2:    new Frag(FRAG.RS2, src, rs2, FIELDS.c_rs2.name),
      imm: new Frag(FRAG.IMM, offset, imm, immName + immBitsToString(inst.immBits)),
    };

    // Assembly fragments in order of instruction
    this.asmFrags.push(f['opcode'], f['rs2'], f['imm']);

    // Binary fragments from MSB to LSB
    this.binFrags.push(f['funct3'], f['imm'], f['rs2'], f['opcode']);
  }

  /**
   * Decodes CIW-type instruction
   */
  #decodeCIW(inst) {
    // Get fields
    const funct3   = getBits(this.#bin, FIELDS.c_funct3.pos);
    const imm      = getBits(this.#bin, FIELDS.c_imm_ciw.pos);
    const rdPrime  = getBits(this.#bin, FIELDS.c_rd_prime.pos);
    const opcode   = getBits(this.#bin, FIELDS.c_opcode.pos);

    // Determine name for immediate
    let immName = '';
    if (inst.nzimm) {
      immName += 'nz';
    }
    if (inst.uimm) {
      immName += 'u';
    }
    immName += FIELDS.c_imm_ciw.name;

    // Prepend bits to compressed register fields
    const rd  = '01' + rdPrime;

    // Convert fields to string representations
    const dest   = decReg(rd);
    const immVal = decImmBits(imm, inst.immBits, inst.uimm);

    // Validate operand values
    if (inst.nzimm && immVal === 0) {
      throw `Detected ${this.#mne}, but instruction expects non-zero immediate value (encoding reserved)`
    }

    // Create fragments
    const f = {
      opcode:   new Frag(FRAG.OPC, this.#mne, this.#opcode, FIELDS.c_opcode.name),
      funct3:   new Frag(FRAG.OPC, this.#mne, funct3, FIELDS.c_funct3.name),
      rd_prime: new Frag(FRAG.RD, dest, rdPrime, FIELDS.c_rd_prime.name),
      imm: new Frag(FRAG.IMM, immVal, imm, immName + immBitsToString(inst.immBits)),
    };

    // Assembly fragments in order of instruction
    this.asmFrags.push(f['opcode'], f['rd_prime'], f['imm']);

    // Binary fragments from MSB to LSB
    this.binFrags.push(f['funct3'], f['imm'], f['rd_prime'], f['opcode']);
  }

  /**
   * Decodes CL-type instruction
   */
  #decodeCL(inst) {
    // Get fields
    const funct3   = getBits(this.#bin, FIELDS.c_funct3.pos);
    const imm0     = getBits(this.#bin, FIELDS.c_imm_cl_0.pos);
    const rs1Prime = getBits(this.#bin, FIELDS.c_rs1_prime.pos);
    const imm1     = getBits(this.#bin, FIELDS.c_imm_cl_1.pos);
    const rdPrime  = getBits(this.#bin, FIELDS.c_rd_prime.pos);
    const opcode   = getBits(this.#bin, FIELDS.c_opcode.pos);

    // Determine name for immediate
    let immName = '';
    if (inst.uimm) {
      immName += 'u';
    }
    immName += FIELDS.c_imm_cl_0.name;

    // Check if floating-point load instruction
    const floatRd = /^c\.f/.test(this.#mne);

    // Prepend bits to compressed register fields
    const rs1 = '01' + rs1Prime;
    const rd  = '01' + rdPrime;

    // Convert fields to string representations
    const dest   = decReg(rd, floatRd);
    const offset = decImmBits([imm0, imm1], inst.immBits, inst.uimm);
    const base   = decReg(rs1);

    // Create fragments
    const f = {
      opcode:    new Frag(FRAG.OPC, this.#mne, this.#opcode, FIELDS.c_opcode.name),
      funct3:    new Frag(FRAG.OPC, this.#mne, funct3, FIELDS.c_funct3.name),
      rd_prime:  new Frag(FRAG.RD, dest, rdPrime, FIELDS.c_rd_prime.name),
      rs1_prime: new Frag(FRAG.RS1, base, rs1Prime, FIELDS.c_rs1_prime.name, true),
      imm0: new Frag(FRAG.IMM, offset, imm0, immName + immBitsToString(inst.immBits[0])),
      imm1: new Frag(FRAG.IMM, offset, imm1, immName + immBitsToString(inst.immBits[1])),
    };

    // Assembly fragments in order of instruction
    this.asmFrags.push(f['opcode'], f['rd_prime'], f['imm0'], f['rs1_prime']);

    // Binary fragments from MSB to LSB
    this.binFrags.push(f['funct3'], f['imm0'], f['rs1_prime'],
      f['imm1'], f['rd_prime'], f['opcode']);
  }

  /**
   * Decodes CS-type instruction
   */
  #decodeCS(inst) {
    // Get fields
    const funct3   = getBits(this.#bin, FIELDS.c_funct3.pos);
    const imm0     = getBits(this.#bin, FIELDS.c_imm_cl_0.pos);
    const rs1Prime = getBits(this.#bin, FIELDS.c_rs1_prime.pos);
    const imm1     = getBits(this.#bin, FIELDS.c_imm_cl_1.pos);
    const rs2Prime = getBits(this.#bin, FIELDS.c_rs2_prime.pos);
    const opcode   = getBits(this.#bin, FIELDS.c_opcode.pos);

    // Determine name for immediate
    let immName = '';
    if (inst.uimm) {
      immName += 'u';
    }
    immName += FIELDS.c_imm_cs_0.name;

    // Check if floating-point load instruction
    const floatRs2 = /^c\.f/.test(this.#mne);

    // Prepend bits to compressed register fields
    const rs1 = '01' + rs1Prime;
    const rs2 = '01' + rs2Prime;

    // Convert fields to string representations
    const src    = decReg(rs2, floatRs2);
    const offset = decImmBits([imm0, imm1], inst.immBits, inst.uimm);
    const base   = decReg(rs1);

    // Create fragments
    const f = {
      opcode:    new Frag(FRAG.OPC, this.#mne, this.#opcode, FIELDS.c_opcode.name),
      funct3:    new Frag(FRAG.OPC, this.#mne, funct3, FIELDS.c_funct3.name),
      rs2_prime: new Frag(FRAG.RS2, src, rs2Prime, FIELDS.c_rs2_prime.name),
      rs1_prime: new Frag(FRAG.RS1, base, rs1Prime, FIELDS.c_rs1_prime.name, true),
      imm0: new Frag(FRAG.IMM, offset, imm0, immName + immBitsToString(inst.immBits[0])),
      imm1: new Frag(FRAG.IMM, offset, imm1, immName + immBitsToString(inst.immBits[1])),
    };

    // Assembly fragments in order of instruction
    this.asmFrags.push(f['opcode'], f['rs2_prime'], f['imm0'], f['rs1_prime']);

    // Binary fragments from MSB to LSB
    this.binFrags.push(f['funct3'], f['imm0'], f['rs1_prime'],
      f['imm1'], f['rs2_prime'], f['opcode']);
  }

  /**
   * Decodes CA-type instruction
   */
  #decodeCA() {
    // Get fields
    const funct6     = getBits(this.#bin, FIELDS.c_funct6.pos);
    const rdRs1Prime = getBits(this.#bin, FIELDS.c_rd_rs1_prime.pos);
    const funct2     = getBits(this.#bin, FIELDS.c_funct2.pos);
    const rs2Prime   = getBits(this.#bin, FIELDS.c_rs2_prime.pos);
    const opcode     = getBits(this.#bin, FIELDS.c_opcode.pos);

    // Prepend bits to compressed register fields
    const rdRs1 = '01' + rdRs1Prime;
    const rs2   = '01' + rs2Prime;

    // Convert fields to string representations
    const destSrc1 = decReg(rdRs1);
    const src2     = decReg(rs2);

    // Create fragments
    const f = {
      opcode:       new Frag(FRAG.OPC, this.#mne, this.#opcode, FIELDS.c_opcode.name),
      funct6:       new Frag(FRAG.OPC, this.#mne, funct6, FIELDS.c_funct6.name),
      funct2:       new Frag(FRAG.OPC, this.#mne, funct2, FIELDS.c_funct2.name),
      rd_rs1_prime: new Frag(FRAG.RD, destSrc1, rdRs1Prime, FIELDS.c_rs2_prime.name),
      rs2_prime:    new Frag(FRAG.RS2, src2, rs2Prime, FIELDS.c_rs1_prime.name),
    };

    // Assembly fragments in order of instruction
    this.asmFrags.push(f['opcode'], f['rd_rs1_prime'], f['rs2_prime']);

    // Binary fragments from MSB to LSB
    this.binFrags.push(f['funct6'], f['rd_rs1_prime'],
      f['funct2'], f['rs2_prime'], f['opcode']);
  }

  /**
   * Decodes CB-type instruction
   */
  #decodeCB(inst) {
    // Get fields
    const funct3     = getBits(this.#bin, FIELDS.c_funct3.pos);
    const imm0       = getBits(this.#bin, FIELDS.c_imm_cb_0.pos);
    const shamt0     = getBits(this.#bin, FIELDS.c_shamt_0.pos);
    const funct2     = getBits(this.#bin, FIELDS.c_funct2_cb.pos);
    const rdRs1Prime = getBits(this.#bin, FIELDS.c_rd_rs1_prime.pos);
    const imm1       = getBits(this.#bin, FIELDS.c_imm_cb_1.pos);
    const shamt1     = getBits(this.#bin, FIELDS.c_shamt_1.pos);
    const opcode     = getBits(this.#bin, FIELDS.c_opcode.pos);

    // Determine instruction type, for special cases
    const branchInst = /^c\.b/.test(this.#mne);
    const shiftInst = /^c\.sr[la]i/.test(this.#mne);

    // Prepend bits to compressed register fields
    const rdRs1 = '01' + rdRs1Prime;

    // Convert fields to string representations
    const destSrc1 = decReg(rdRs1);
    const immVal = decImmBits([imm0, imm1], inst.immBits, inst.uimm);

    // Perform shift-specific special cases
    if (shiftInst) {
      if (immVal === 0) {
        // Determine if shift is a shift64 function
        this.#mne += '64';
        inst = ISA[this.#mne];
        if (inst === undefined) {
          throw `Internal error when converting shift-immediate instruction into ${this.#mne}`;
        }
        // Overwrite ISA
        this.isa = 'RV128' + inst.isa;

      } else if (shamt0 === '1' && /^RV32/.test(this.isa)) {
        // Force RV32C -> RV64C isa if imm[5] is set (shamt > 31)
        this.isa = 'RV64' + inst.isa;
      }
    }

    // Validate operand values
    if (inst.nzimm && immVal === 0) {
      throw `Detected ${this.#mne}, but instruction expects non-zero immediate value (encoding reserved)`
    }

    // Determine name for immediate
    let immName = '';
    if (!shiftInst) {
      if (inst.nzimm) {
        immName += 'nz';
      }
      if (inst.uimm) {
        immName += 'u';
      }
    }
    immName += shiftInst
      ? FIELDS.c_shamt_0.name
      : (branchInst ? FIELDS.c_imm_cb_0.name : FIELDS.c_imm_ci_0.name);

    // Create common fragments
    const f = {
      opcode:       new Frag(FRAG.OPC, this.#mne, this.#opcode, FIELDS.c_opcode.name),
      funct3:       new Frag(FRAG.OPC, this.#mne, funct3, FIELDS.c_funct3.name),
      funct2:       new Frag(FRAG.OPC, this.#mne, funct2, FIELDS.c_funct2.name),
      rd_rs1_prime: new Frag(FRAG.RD, destSrc1, rdRs1Prime, FIELDS.c_rs2_prime.name),
    };

    // Create custom fragments and build fragment arrays
    if (branchInst) {
      // Shift instruction, use shamt and funct2
      f['imm0'] = new Frag(FRAG.IMM, immVal, imm0, immName + immBitsToString(inst.immBits[0]));
      f['imm1'] = new Frag(FRAG.IMM, immVal, imm1, immName + immBitsToString(inst.immBits[1]));

      // Assembly fragments in order of instruction
      this.asmFrags.push(f['opcode'], f['rd_rs1_prime'], f['imm0']);
      // Binary fragments from MSB to LSB
      this.binFrags.push(f['funct3'], f['imm0'], f['rd_rs1_prime'], f['imm1'], f['opcode']);

    } else {
      // Shift instruction and `c.andi`, use shamt and funct2
      const dynamicImm = inst.immVal === undefined;
      if (dynamicImm) {
        f['imm0'] = new Frag(FRAG.IMM, immVal, shamt0, immName + immBitsToString(inst.immBits[0]));
        f['imm1'] = new Frag(FRAG.IMM, immVal, shamt1, immName + immBitsToString(inst.immBits[1]));
      } else {
        f['imm0'] = new Frag(FRAG.OPC, this.#mne, shamt0, 'static-' + immName + immBitsToString(inst.immBits[0]));
        f['imm1'] = new Frag(FRAG.OPC, this.#mne, shamt1, 'static-' + immName + immBitsToString(inst.immBits[1]));
      }

      // Assembly fragments in order of instruction
      this.asmFrags.push(f['opcode'], f['rd_rs1_prime']);
      if (dynamicImm) {
        this.asmFrags.push(f['imm0']);
      }
      // Binary fragments from MSB to LSB
      this.binFrags.push(f['funct3'], f['imm0'], f['funct2'], f['rd_rs1_prime'], f['imm1'], f['opcode']);
    }
  }

  /**
   * Decodes CJ-type instruction
   */
  #decodeCJ(inst) {
    // Get fields
    const funct3 = getBits(this.#bin, FIELDS.c_funct3.pos);
    const imm    = getBits(this.#bin, FIELDS.c_imm_cj.pos);
    const opcode = getBits(this.#bin, FIELDS.c_opcode.pos);

    // Convert fields to string representations
    const jumpTarget = decImmBits(imm, inst.immBits);

    // Create fragments
    const f = {
      opcode:   new Frag(FRAG.OPC, this.#mne, this.#opcode, FIELDS.c_opcode.name),
      funct3:   new Frag(FRAG.OPC, this.#mne, funct3, FIELDS.c_funct3.name),
      imm: new Frag(FRAG.IMM, jumpTarget, imm, FIELDS.c_imm_cj.name + immBitsToString(inst.immBits)),
    };

    // Assembly fragments in order of instruction
    this.asmFrags.push(f['opcode'], f['imm']);

    // Binary fragments from MSB to LSB
    this.binFrags.push(f['funct3'], f['imm'], f['opcode']);
  }
}

// Extract R-types fields from instruction
function extractRFields(binary) {
  return {
    'rs2': getBits(binary, FIELDS.rs2.pos),
    'rs1': getBits(binary, FIELDS.rs1.pos),
    'funct3': getBits(binary, FIELDS.funct3.pos),
    'rd': getBits(binary, FIELDS.rd.pos),
    'funct5': getBits(binary, FIELDS.r_funct5.pos),
    'funct7': getBits(binary, FIELDS.r_funct7.pos),
    'aq': getBits(binary, FIELDS.r_aq.pos),
    'rl': getBits(binary, FIELDS.r_rl.pos),
    'fmt': getBits(binary, FIELDS.r_fp_fmt.pos),
  };
}

// Extract I-types fields from instruction
function extractIFields(binary) {
  return {
    'imm': getBits(binary, FIELDS.i_imm_11_0.pos),
    'rs1': getBits(binary, FIELDS.rs1.pos),
    'funct3': getBits(binary, FIELDS.funct3.pos),
    'rd': getBits(binary, FIELDS.rd.pos),

    /* Shift instructions */
    'shtyp': getBits(binary, FIELDS.i_shtyp.pos),
    'shamt': getBits(binary, FIELDS.i_shamt.pos),
    'shamt_5': getBits(binary, FIELDS.i_shamt_5.pos),
    'shamt_6': getBits(binary, FIELDS.i_shamt_6.pos),
    /* System instructions */
    'funct12': getBits(binary, FIELDS.i_funct12.pos),
    /* Fence insructions */
    'fm': getBits(binary, FIELDS.i_fm.pos),
    'pred': getBits(binary, FIELDS.i_pred.pos),
    'succ': getBits(binary, FIELDS.i_succ.pos),
  };
}

// Extract S-types fields from instruction
function extractSFields(binary) {
  return {
    'imm_11_5': getBits(binary, FIELDS.s_imm_11_5.pos),
    'rs2': getBits(binary, FIELDS.rs2.pos),
    'rs1': getBits(binary, FIELDS.rs1.pos),
    'funct3': getBits(binary, FIELDS.funct3.pos),
    'imm_4_0': getBits(binary, FIELDS.s_imm_4_0.pos),
  };
}

// Extract B-types fields from instruction
function extractBFields(binary) {
  return {
    'imm_12': getBits(binary, FIELDS.b_imm_12.pos),
    'imm_10_5': getBits(binary, FIELDS.b_imm_10_5.pos),
    'rs2': getBits(binary, FIELDS.rs2.pos),
    'rs1': getBits(binary, FIELDS.rs1.pos),
    'funct3': getBits(binary, FIELDS.funct3.pos),
    'imm_4_1': getBits(binary, FIELDS.b_imm_4_1.pos),
    'imm_11': getBits(binary, FIELDS.b_imm_11.pos),
  };
}

// Extract C-instruction fields for mnemonic lookup
function extractCLookupFields(binary) {
  return {
    'funct6': getBits(binary, FIELDS.c_funct6.pos),
    'funct4': getBits(binary, FIELDS.c_funct4.pos),
    'funct3': getBits(binary, FIELDS.c_funct3.pos),
    'funct2': getBits(binary, FIELDS.c_funct2.pos),
    'funct2_cb': getBits(binary, FIELDS.c_funct2_cb.pos),
    'rd_rs1': getBits(binary, FIELDS.c_rd_rs1.pos),
    'rs2': getBits(binary, FIELDS.c_rs2.pos),
  };
}

// Get bits out of binary instruction
function getBits(binary, pos) {
  if (!Array.isArray(pos)) {
    throw getBits.name + ": position should be an array";
  }

  let end = pos[0] + 1;
  let start = end - pos[1];

  if (start > end || binary.length < end) {
    throw getBits.name + ": position error";
  }

  return binary.substring(binary.length - end, binary.length - start);
}

// Parse given immediate to decimal
function decImm(immediate, signExtend = true) {
  // Sign extension requested and sign bit set
  if (signExtend && immediate[0] === '1') {
    return parseInt(immediate, BASE.bin) - Number('0b1' + ''.padStart(immediate.length, '0'));
  }
  return parseInt(immediate, BASE.bin);
}

// Decode immediate value using the given immBits configuration
function decImmBits(immFields, immBits, uimm = false) {
  // Construct full immediate binary to decode
  // - Start with 18 as length since that supports the widest compressed immediate value
  //     Specifically, `c.lui` provides imm[17:12], so there's 6 encoded bits in the upper-portion,
  //     While the 12 LSBs are assumed to be 0, for a total of 18 bits (hence, len = 18)
  const len = 18;
  let binArray = ''.padStart(len, '0').split('');
  let maxBit = 0;

  // Create singleton arrays if only one immediate field present
  if (typeof immFields === 'string') {
    immFields = [immFields];
    immBits = [immBits];
  }

  // Iterate over fields, if multiple
  for (let i = 0; i < immFields.length; i++) {
    const fieldBin = immFields[i];
    const fieldBits = immBits[i];

    // Iterate over bits configuration
    let k = 0; // Iterator for fieldBin
    for (let j = 0; j < fieldBits.length; j++) {
      let bit = fieldBits[j];
      // Check for highest bit
      maxBit = Math.max(maxBit, bit?.[0] ?? bit);

      // Check for single bit vs bit span
      if (typeof bit === 'number') {
        // Single bit
        binArray[len - 1 - bit] = fieldBin[k];
        k++;
      } else {
        // Bit span
        const bitStart = bit[0];
        const bitSpan = bitStart - bit[1] + 1;
        for (let l = 0; l < bitSpan; l++, k++) {
          binArray[len - 1 - bitStart + l] = fieldBin[k];
        }
      }
    }
  }

  // Join bit array
  let bin = binArray.join('');

  // If sign extending, truncate leading 0s to only include up to max bit
  const signExtend = !uimm;
  if (signExtend) {
    bin = bin.substring(len - maxBit - 1);
  }

  // Decode as coherent binary value
  return decImm(bin, signExtend);
}

// Convert register numbers from binary to string
function decReg(reg, floatReg=false) {
  return (floatReg ? 'f' : 'x') + parseInt(reg, BASE.bin);
}

// Convert register numbers from binary to ABI name string
export function decRegAbi(regDec, floatReg=false) {
  return Object.keys(
      (floatReg ? FLOAT_REGISTER : REGISTER)
    )[parseInt(regDec, BASE.dec)];
}

// Get device I/O and memory accesses corresponding to given bits
function decMem(bits) {
  let output = "";

  // I: Device input, O: device output, R: memory reads, W: memory writes
  const access = ['i', 'o', 'r', 'w'];

  // Loop through the access array and binary string
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === '1') {
      output += access[i];
    }
  }

  if (output === "") {
    throw `Invalid IO/Mem field`;
  }

  return output;
}

// Search for CSR name from the given binary string
function decCSR(binStr) {
  // Decode binary string into numerical value
  const val = parseInt(binStr, BASE.bin);

  // Attempt to search for entry in CSR object with matching value
  const entry = Object.entries(CSR).find(e => e[1] === val);

  // Get CSR name if it exists,
  //   otherwise construct an immediate hex string
  let csr = entry
    ? entry[0]
    : ('0x' + val.toString(16).padStart(3, '0'));

  return csr;
}

// Convert C instruction immediate bit configurations
//   To a string for binFrag name information
function immBitsToString(immBits) {
  let out = '[';
  let addPipe = false;
  for (const e of immBits) {
    if (!addPipe) {
      addPipe = true;
    } else {
      out += '|';
    }
    if (e instanceof Array) {
      out += e[0] + ':' + e[1];
    } else {
      out += e;
    }
  }
  return out + ']';
}

// Convert C instruction immediate bit configurations
//   To a string for binFrag name information
function regExclToString(excl) {
  if (excl.length === 1)
    return excl[0].toString();
  let out = '{';
  let addComma = false;
  for (const e of excl) {
    if (!addComma) {
      addComma = true;
    } else {
      out += ',';
    }
    out += e;
  }
  return out + '}';
}

// Render assembly instruction
function renderAsm(asmFrags, abi = false) {
  // Extract assembly tokens and build instruction
  let inst = asmFrags[0].asm;
  for (let i = 1; i < asmFrags.length; i++) {
    // Conditionally use ABI names for registers
    let asm = abi ? convertRegToAbi(asmFrags[i].asm) : asmFrags[i].asm;

    // Append delimeter
    if (i === 1) {
      inst += ' ';
    }
    else if (!asmFrags[i].mem || !/^(?:nz)?(?:u)?imm/.test(asmFrags[i-1].field)) {
      inst += ', ';
    }

    // Append assembly fragment
    if (asmFrags[i].mem) {
      inst += '(' + asm + ')';
    } else {
      inst += asm;
    }
  }

  return inst.trim();
}
