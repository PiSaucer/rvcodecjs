// SPDX-License-Identifier: AGPL-3.0-or-later

/*
 * RISC-V Instruction Encoder/Decoder
 *
 * Copyright (c) 2021-2022 LupLab @ UC Davis
 */

import { BASE,
  FIELDS, OPCODE, REGISTER, CSR,
  ISA_OP, ISA_OP_32, ISA_LOAD, ISA_STORE, ISA_OP_IMM, ISA_OP_IMM_32, 
  ISA_BRANCH, ISA_MISC_MEM, ISA_SYSTEM,
  ISA,
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


  /**
   * Creates an Decoder to convert a binary instruction to assembly
   * @param {String} bin
   */
  constructor(bin, config) {
    this.#bin = bin;
    this.#config = config;

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

    switch (this.#opcode) {
        // R-type
      case OPCODE.OP:
      case OPCODE.OP_32:
        this.#decodeOP();
        break;

        // I-type
      case OPCODE.JALR:
        this.#decodeJALR();
        break;
      case OPCODE.LOAD:
        this.#decodeLOAD();
        break;
      case OPCODE.OP_IMM:
      case OPCODE.OP_IMM_32:
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

        // Invalid opcode
      default:
        throw "Invalid opcode: " + this.#opcode;
    }

    if (typeof this.#mne === undefined) {
        throw "Decoder internal error";
    }

    // Set instruction's format and ISA
    this.fmt = ISA[this.#mne].fmt;
    this.isa = this.isa ?? ISA[this.#mne].isa;
    
    // Detect mismatch between ISA and configuration
    if (this.#config.ISA === COPTS_ISA.RV32I && /^RV64.$/.test(this.isa)) {
      throw `Detected ${this.isa} instruction but configuration ISA set to RV32I`;
    }

    // Render ASM insturction string (mainly for testing)
    let mem_inst = this.#opcode === OPCODE.LOAD || this.#opcode === OPCODE.STORE;
    this.asm = renderAsm(this.asmFrags, mem_inst, this.#config.ABI);
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
    let op_32 = this.#opcode === OPCODE.OP_32;
    if(op_32) {
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
      opcode: new Frag(this.#mne, this.#opcode, FIELDS.opcode.name),
      funct3: new Frag(this.#mne, funct3, FIELDS.funct3.name),
      funct7: new Frag(this.#mne, funct7, FIELDS.r_funct7.name),
      rd:     new Frag(dest, rd, FIELDS.rd.name),
      rs1:    new Frag(src1, rs1, FIELDS.rs1.name),
      rs2:    new Frag(src2, rs2, FIELDS.rs2.name),
    };

    // Assembly fragments in order of instruction
    this.asmFrags.push(f['opcode'], f['rd'], f['rs1'], f['rs2']);

    // Binary fragments from MSB to LSB
    this.binFrags.push(f['funct7'], f['rs2'], f['rs1'], f['funct3'], f['rd'],
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
      opcode: new Frag(this.#mne, this.#opcode, FIELDS.opcode.name),
      funct3: new Frag(this.#mne, funct3, FIELDS.funct3.name),
      rd:     new Frag(dest, rd, FIELDS.rd.name),
      rs1:    new Frag(base, rs1, FIELDS.rs1.name),
      imm:    new Frag(offset, imm, FIELDS.i_imm_11_0.name),
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
    this.#mne = ISA_LOAD[funct3];
    if (this.#mne === undefined) {
      throw "Detected LOAD instruction but invalid funct3 field";
    }

    // Convert fields to string representations
    const base = decReg(rs1),
          dest = decReg(rd),
          offset = decImm(imm);

    // Create fragments
    const f = {
      opcode: new Frag(this.#mne, this.#opcode, FIELDS.opcode.name),
      funct3: new Frag(this.#mne, funct3, FIELDS.funct3.name),
      rd:     new Frag(dest, rd, FIELDS.rd.name),
      rs1:    new Frag(base, rs1, FIELDS.rs1.name),
      imm:    new Frag(offset, imm, FIELDS.i_imm_11_0.name),
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
    let op_imm_32 = this.#opcode === OPCODE.OP_IMM_32;
    if(op_imm_32) {
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
      opcode: new Frag(this.#mne, this.#opcode, FIELDS.opcode.name),
      funct3: new Frag(this.#mne, funct3, FIELDS.funct3.name),
      rd:     new Frag(dest, rd, FIELDS.rd.name),
      rs1:    new Frag(src, rs1, FIELDS.rs1.name),
    };

    if (shift) {
      const shtyp = fields['shtyp'];
      const shamt_4_0 = fields['shamt'];
      const shamt_5 = fields['shamt_5'];

      const imm_11_6 = '0' + shtyp + '0000';
      const imm_11_5 = imm_11_6 + '0';

      // Decode shamt and shtyp
      // - 5bit (RV32I) or 6bit (RV64I) shamt based on opcode, config, and value
      let shamt;
      let shamt_64 = !op_imm_32 && (this.#config.ISA === COPTS_ISA.RV64I || shamt_5 === '1');
      if (shamt_64) {
        // Decode 6bit shamt
        const shamt_5_0 = shamt_5 + shamt_4_0;
        shamt = decImm(shamt_5_0, false);

        // Detect config ISA mismatch
        if (this.#config.ISA === COPTS_ISA.RV32I) {
          throw `Detected ${opcodeName} but invalid shamt field for RV32I (out of range): ${shamt}`;
        }

        // Create frags for shamt and shtyp
        f['imm'] = new Frag(shamt, shamt_5_0, FIELDS.i_shamt_5_0.name);
        f['shift'] = new Frag(this.#mne, imm_11_6, FIELDS.i_shtyp_11_6.name);

        // Set output ISA to RV64I 
        this.isa = 'RV64I';
      } else {
        // Decode and frag 5bit shamt and shtyp
        shamt = decImm(shamt_4_0, false);
        f['imm'] = new Frag(shamt, shamt_4_0, FIELDS.i_shamt.name);
        f['shift'] = new Frag(this.#mne, imm_11_5, FIELDS.i_shtyp_11_5.name);
      }

      // Validate upper bits of immediate field to ensure
      //   they match expected value for shift type
      if((!shamt_64 && imm_11_5 !== imm.substring(0,7))
          || (shamt_64 && imm_11_6 !== imm.substring(0,6))) {
        throw `Detected ${opcodeName} shift instruction but invalid shtyp field`;
      }

      // Binary fragments from MSB to LSB
      this.binFrags.push(f['shift'], f['imm'], f['rs1'],
        f['funct3'], f['rd'], f['opcode']);

    } else {
      const imm = fields['imm'];
      const immediate = decImm(imm);

      f['imm'] = new Frag(immediate, imm, FIELDS.i_imm_11_0.name);

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
      throw "Detected LOAD instruction but invalid funct3 field";
    }

    // Check registers
    if (rd !== '00000' || rs1 !== '00000') {
      throw "Registers rd and rs1 should be 0";
    }

    // Create fragments
    const f = {
      opcode: new Frag(this.#mne, this.#opcode, FIELDS.opcode.name),
      funct3: new Frag(this.#mne, funct3, FIELDS.funct3.name),
      rd:     new Frag(this.#mne, rd, FIELDS.rd.name),
      rs1:    new Frag(this.#mne, rs1, FIELDS.rs1.name),
    };

    if (this.#mne === 'fence') {
      let predecessor = decMem(pred);
      let successor = decMem(succ);

      f['fm'] = new Frag(this.#mne, fm, FIELDS.i_fm.name);
      f['pred'] =  new Frag(predecessor, pred, FIELDS.i_pred.name);
      f['succ'] = new Frag(successor, succ, FIELDS.i_succ.name);

      // Assembly fragments in order of instruction
      this.asmFrags.push(f['opcode'], f['pred'], f['succ']);

      // Binary fragments from MSB to LSB
      this.binFrags.push(f['fm'], f['pred'], f['succ'], f['rs1'], f['funct3'],
        f['rd'], f['opcode']);

    } else  {
      // FENCE.I case

      f['imm'] = new Frag(this.#mne, imm, FIELDS.i_imm_11_0.name);

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
      opcode: new Frag(this.#mne, this.#opcode, FIELDS.opcode.name),
      funct3: new Frag(this.#mne, funct3, FIELDS.funct3.name),
    };

    // Trap instructions - create specific fragments and render  
    if (trap) {
      // Create remaining fragments
      f['rd'] = new Frag(this.#mne, rd, FIELDS.rd.name);
      f['rs1'] = new Frag(this.#mne, rs1, FIELDS.rs1.name);
      f['funct12'] = new Frag(this.#mne, funct12, FIELDS.i_funct12.name);

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
      f['rd'] = new Frag(dest, rd, FIELDS.rd.name);
      f['csr'] = new Frag(csr, csrBin, FIELDS.i_csr.name);
      f['rs1'] = new Frag(src, rs1, srcFieldName);

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
    this.#mne = ISA_STORE[funct3];
    if (this.#mne === undefined) {
      throw "Detected STORE instruction but invalid funct3 field";
    }

    // Convert fields to string representations
    const offset = decImm(imm);
    const base = decReg(rs1);
    const src = decReg(rs2);

    // Create fragments
    const f = {
      opcode:   new Frag(this.#mne, this.#opcode, FIELDS.opcode.name),
      funct3:   new Frag(this.#mne, funct3, FIELDS.funct3.name),
      rs1:      new Frag(base, rs1, FIELDS.rs1.name),
      rs2:      new Frag(src, rs2, FIELDS.rs2.name),
      imm_4_0:  new Frag(offset, imm_4_0, FIELDS.s_imm_4_0.name),
      imm_11_5: new Frag(offset, imm_11_5, FIELDS.s_imm_11_5.name),
      imm:      new Frag(offset, imm, 'imm'),
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
      opcode:   new Frag(this.#mne, this.#opcode, FIELDS.opcode.name),
      funct3:   new Frag(this.#mne, funct3, FIELDS.funct3.name),
      rs1:      new Frag(src1, rs1, FIELDS.rs1.name),
      rs2:      new Frag(src2, rs2, FIELDS.rs2.name),
      imm_12:   new Frag(offset, imm_12, FIELDS.b_imm_12.name),
      imm_11:   new Frag(offset, imm_11, FIELDS.b_imm_11.name),
      imm_10_5: new Frag(offset, imm_10_5, FIELDS.b_imm_10_5.name),
      imm_4_1:  new Frag(offset, imm_4_1, FIELDS.b_imm_4_1.name),
      imm:      new Frag(offset, imm, 'imm'),
    };

    // Assembly fragments in order of instruction
    this.asmFrags.push(f['opcode'], f['rs1'], f['rs2'], f['imm']);

    // Binary fragments from MSB to LSB
    this.binFrags.push(f['imm_10_5'], f['rs2'], f['rs1'], f['funct3'],
      f['imm_4_1'], f['opcode']);
  }

  /**
   * Decodes U-type instruction
   */
  #decodeUType() {
    // Get fields
    const imm = getBits(this.#bin, FIELDS.u_imm_31_12.pos);
    const rd = getBits(this.#bin, FIELDS.rd.pos);

    // Convert fields to string representations
    const immediate = decImm(imm), dest = decReg(rd);

    // Determine operation
    this.#mne = (this.#opcode === OPCODE.AUIPC) ? 'auipc' : 'lui';

    // Create fragments
    const f = {
      opcode: new Frag(this.#mne, this.#opcode, FIELDS.opcode.name),
      imm:    new Frag(immediate, imm, FIELDS.u_imm_31_12.name),
      rd:     new Frag(dest, rd, FIELDS.rd.name),
    };

    // Assembly fragments in order of instruction
    this.asmFrags.push(f['opcode'], f['rd'], f['imm']);

    // Binary fragments from MSB to LSB
    this.binFrags.push(f['imm'], f['rd'], f['opcode']);
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
      opcode:     new Frag(this.#mne, this.#opcode, FIELDS.opcode.name),
      rd:         new Frag(dest, rd, FIELDS.rd.name),
      imm_20:     new Frag(offset, imm_20, FIELDS.j_imm_20.name),
      imm_10_1:   new Frag(offset, imm_10_1, FIELDS.j_imm_10_1.name),
      imm_11:     new Frag(offset, imm_11, FIELDS.j_imm_11.name),
      imm_19_12:  new Frag(offset, imm_19_12, FIELDS.j_imm_19_12.name),
      imm:        new Frag(offset, imm, 'imm'),
    };

    // Assembly fragments in order of instruction
    this.asmFrags.push(f['opcode'], f['rd'], f['imm']);

    // Binary fragments from MSB to LSB
    this.binFrags.push(f['imm_20'], f['imm_10_1'], f['imm_11'], f['imm_19_12'],
      f['rd'], f['opcode']);
  }

}

// Extract R-types fields from instruction
function extractRFields(binary) {
  return {
    'rs2': getBits(binary, FIELDS.rs2.pos),
    'rs1': getBits(binary, FIELDS.rs1.pos),
    'funct3': getBits(binary, FIELDS.funct3.pos),
    'rd': getBits(binary, FIELDS.rd.pos),
    'funct7': getBits(binary, FIELDS.r_funct7.pos),
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
    return parseInt(immediate, BASE.bin) - parseInt('1' << immediate.length);
  }
  return parseInt(immediate, BASE.bin);
}

// Convert register numbers from binary to string
function decReg(reg) {
  return "x" + parseInt(reg, BASE.bin);
}

// Convert register numbers from binary to ABI name string
export function decRegAbi(reg, base=BASE.dec) {
  return Object.keys(REGISTER)[parseInt(reg, base)];
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

// Render assembly instruction
function renderAsm(asmFrags, memFmt = false, abi = false) {
  // Validate assembly arguments
  if ((!memFmt && asmFrags.length < 1) || (memFmt && asmFrags.length !== 4)) {
      throw 'Invalid number of arguments';
  }

  // Extract assembly tokens and build instruction
  let inst;
  const tokens = [...asmFrags].map(
    (f) => abi ? convertRegToAbi(f.asm) : f.asm
  );
  if (!memFmt) {
    // Regular instruction
    inst = `${tokens[0]} ` + tokens.splice(1).join(', ');
  } else {
    // Load store instruction
    inst = `${tokens[0]} ${tokens[1]}, ${tokens[2]}(${tokens[3]})`
  }

  return inst.trim();
}
