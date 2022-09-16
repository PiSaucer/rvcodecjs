// SPDX-License-Identifier: AGPL-3.0-or-later

/*
 * RISC-V Instruction Encoder/Decoder
 *
 * Copyright (c) 2021-2022 LupLab @ UC Davis
 */

import { BASE,
  FIELDS, OPCODE,
  ISA_OP, ISA_LOAD, ISA_STORE, ISA_OP_IMM, ISA_BRANCH, ISA_MISC_MEM, ISA_SYSTEM,
  ISA,
} from './Constants.js'

import { Frag } from './Instruction.js'

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
  #mne;
  #opcode;


  /**
   * Creates an Decoder to convert a binary instruction to assembly
   * @param {String} bin
   */
  constructor(bin) {
    this.#bin = bin;

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
    this.isa = ISA[this.#mne].isa;
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

    // Find instruction
    this.#mne = ISA_OP[funct7 + funct3];
    if (this.#mne === undefined) {
      throw "Detected OP instruction but invalid funct3/funct7 combination";
    }

    // Convert fields to string representations
    const src1 = decReg(rs1), src2 = decReg(rs2), dest = decReg(rd);

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

    // Construct assembly instruction
    this.asm = renderAsm([this.#mne, dest, src1, src2]);
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
    const base = decReg(rs1), dest = decReg(rd), offset = decImm(imm);

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

    // Construct assembly instruction
    this.asm = renderAsm([this.#mne, dest, base, offset]);
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
    const base = decReg(rs1), dest = decReg(rd), offset = decImm(imm);

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

    // Construct assembly instruction
    this.asm = renderAsm([this.#mne, dest, offset, base], true);
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

    // Find instruction
    this.#mne = ISA_OP_IMM[funct3]
    if (this.#mne === undefined) {
      throw "Detected OP-IMM instruction but invalid funct3 field";
    }

    // Shift instructions
    let shift = (this.#mne === 'slli' || typeof this.#mne === 'object');
    if (typeof this.#mne !== 'string') {
      // Right shift instructions
      this.#mne = this.#mne[fields['shtyp']];
    }

    // Convert fields to string representations
    const src = decReg(rs1), dest = decReg(rd);

    // Create fragments
    const f = {
      opcode: new Frag(this.#mne, this.#opcode, FIELDS.opcode.name),
      funct3: new Frag(this.#mne, funct3, FIELDS.funct3.name),
      rd:     new Frag(dest, rd, FIELDS.rd.name),
      rs1:    new Frag(src, rs1, FIELDS.rs1.name),
    };

    if (shift) {
      const shtyp = fields['shtyp'];
      const imm = fields['shamt'];

      const imm_11_5 = '0' + shtyp + '00000';
      const shamt = decImm(imm, false);

      f['imm'] = new Frag(shamt, imm, FIELDS.i_shamt.name);
      // Upper-immediate is fixed for shift instructions
      f['shift'] = new Frag(this.#mne, imm_11_5, { pos: [31, 7], name: 'shift' });

      // Binary fragments from MSB to LSB
      this.binFrags.push(f['shift'], f['imm'], f['rs1'],
        f['funct3'], f['rd'], f['opcode']);

      // Construct assembly instruction
      this.asm = renderAsm([this.#mne, dest, src, shamt]);

    } else {
      const imm = fields['imm'];
      const immediate = decImm(imm);

      f['imm'] = new Frag(immediate, imm, FIELDS.i_imm_11_0.name);

      // Binary fragments from MSB to LSB
      this.binFrags.push(f['imm'], f['rs1'], f['funct3'], f['rd'], f['opcode']);

      // Construct assembly instruction
      this.asm = renderAsm([this.#mne, dest, src, immediate]);
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

      // Construct assembly instruction
      this.asm = renderAsm([this.#mne, predecessor, successor]);
    } else  {
      // FENCE.I case

      f['imm'] = new Frag(this.#mne, imm, FIELDS.i_imm_11_0.name);

      // Assembly fragments in order of instruction
      this.asmFrags.push(f['opcode']);

      // Binary fragments from MSB to LSB
      this.binFrags.push(f['imm'], f['rs1'], f['funct3'], f['rd'], f['opcode']);

      // Construct assembly instruction
      this.asm = renderAsm([this.#mne]);
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

    // Trap instructions
    if (typeof this.#mne !== 'string') {
      this.#mne = this.#mne[funct12];
      if (this.#mne === undefined) {
        throw "Detected SYSTEM instruction but invalid funct12 field";
      }
      // Check registers
      if (rd !== '00000' || rs1 !== '00000') {
        throw "Registers rd and rs1 should be 0 for mne " + this.#mne;
      }
    }

    // Create fragments
    const f = {
      opcode: new Frag(this.#mne, this.#opcode, FIELDS.opcode.name),
      funct3: new Frag(this.#mne, funct3, FIELDS.funct3.name),
      rd:     new Frag(this.#mne, rd, FIELDS.rd.name),
    };

    // Trap instructions
    if (this.#mne === 'ecall' || this.#mne === 'ebreak') {
      f['rs1'] = new Frag(this.#mne, rs1, FIELDS.rs1.name);
      f['funct12'] = new Frag(this.#mne, funct12, FIELDS.i_funct12.name);

      // Assembly fragments in order of instruction
      this.asmFrags.push(f['opcode']);

      // Binary fragments from MSB to LSB
      this.binFrags.push(f['funct12'], f['rs1'], f['funct3'], f['rd'],
        f['opcode']);

      // Construct assembly instruction
      this.asm = renderAsm([this.#mne]);
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

    // Construct assembly instruction
    this.asm = renderAsm([this.#mne, src, offset, base], true);
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
    const offset = decImm(imm), src2 = decReg(rs2), src1 = decReg(rs1);

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
    this.binFrags.push(f['imm_11_5'], f['rs2'], f['rs1'], f['funct3'],
      f['imm_4_0'], f['opcode']);

    // Construct assembly instruction
    this.asm = renderAsm([this.#mne, src1, src2, offset]);

    return this.#mne;
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

    // Construct assembly instruction
    this.asm = renderAsm([this.#mne, dest, immediate]);

    return this.#mne;
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

    // Construct assembly instruction
    this.asm = renderAsm([this.#mne, dest, offset]);

    return this.#mne;
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

// Get device I/O and memory accesses corresponding to given bits
function decMem(bits) {
  let output = "";

  // I: Device input, O: device output, R: memory reads, W: memory writes
  const access = ['i', 'o', 'r', 'w'];

  // Loop through the access array and binary string
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === 1) {
      output += access[i];
    }
  }

  return output;
}

// Render assembly instruction
function renderAsm(tokens, lsFmt = false) {
  let inst;

  if ((!lsFmt && tokens.length < 1) || (lsFmt && tokens.length !== 4)) {
      throw 'Invalid number of arguments';
  }

  if (!lsFmt) {
    // Regular instruction
    inst = `${tokens[0]} ` + tokens.splice(1).join(', ');
  } else {
    // Load store instruction
    inst = `${tokens[0]} ${tokens[1]}, ${tokens[2]}(${tokens[3]})`
  }

  return inst.trim();
}

