// SPDX-License-Identifier: AGPL-3.0-or-later

/*
 * RISC-V Instruction Encoder/Decoder
 *
 * Copyright (c) 2021-2022 LupLab @ UC Davis
 */

import { BASE, ISA } from './Constants.js';
import { configDefault } from './Config.js';

import { Decoder, decRegAbi } from './Decoder.js';
import { Encoder } from './Encoder.js';

/**
 * Represents an instruction
 * @class
 */
export class Instruction {
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
   * Length of instruction: 16 or 32 bits
   * @type Number
   */
  len;
  /**
   * Assembly representation of instruction
   * @type String
   */
  asm;
  /**
   * Binary representation of instruction
   * @type String
   */
  bin;
  /**
   * Hexadecimal representation of instruction
   * @type String
   */
  hex;
  /**
   * Fragments for assembly instruction rendering, ordered by token position
   * @type Array
   */
  asmFrags;
  /**
   * Fragments for binary instruction rendering, ordered by bit position
   * @type Array
   */
  binFrags;

  /* Private members */
  #config;
  #xlens;

  /**
   * Creates an instruction represented in multiple formats
   * @param {String} instruction
   * @param {Object} configuration
   */
  constructor(instruction, config={}) {
    this.#config = Object.assign({}, configDefault, config);
    this.#convertInstruction(instruction.trim());
  }

  #convertInstruction(instruction) {
    // Regular expression for up to 32 binary bits
    const binRegEx = /^(0b)?[01]{1,32}$/;

    // Regular expression for up to 8 hexadecimal digits
    const hexRegEx = /^(0x)?[0-9a-fA-F]{1,8}$/;

    // Regular expression for alphabetic character (first letter of opcode)
    const asmRegEx = /^[a-zA-Z]$/;

    // Test for valid mnemonic input before interpreting as value
    const validMne = instruction.trimStart().split(' ')[0] in ISA;
    if (validMne) {
      // Shortcircuit to assembly instruction when valid mnemonic detected
      this.#encodeBin(instruction);
    } else if (binRegEx.test(instruction)) {
      // Binary instruction
      this.bin = convertBase(instruction, BASE.bin, BASE.bin, 32);
    } else if (hexRegEx.test(instruction)) {
      // Hexadecimal instruction
      this.bin = convertBase(instruction, BASE.hex, BASE.bin, 32);
    } else if (asmRegEx.test(instruction[0])) {
      // Assembly instruction (first character is a letter)
      this.#encodeBin(instruction);
    }

    else {
      throw 'Invalid instruction (not in binary, hexadecimal, nor assembly)';
    }

    // Decode binary instruction into assembly
    this.#decodeAsm();

    // Determine hex string length (default to 8)
    let hexLength = 8;
    // Compressed instructions - represent them with 4 hex digits
    if (this.asm.startsWith('c.')) {
      hexLength = 4;
    }

    // Perform bin to hex conversion
    this.hex = convertBase(this.bin, BASE.bin, BASE.hex, hexLength);
  }

  // Decode instruction from binary to assembly
  #decodeAsm() {
    // Create a Decoder for the instruction
    let decoder = new Decoder(this.bin, this.#config, this.#xlens);

    // Get assembly representation
    this.asm = decoder.asm;

    // Get fragments
    this.asmFrags = decoder.asmFrags;
    this.binFrags = decoder.binFrags;

    // Get instruction characteristics
    this.fmt = decoder.fmt;
    this.isa = decoder.isa;
  }

  // Encode instruction from assembly to binary
  #encodeBin(instruction) {
    // Create an Encoder for the instruction
    let encoder = new Encoder(instruction, this.#config);

    // Get binary representation
    this.bin = encoder.bin;

    // Get instruction xlen
    this.#xlens = encoder.xlens;
  }

}

// Convert between bases and pads
export function convertBase(val, baseSrc, baseDst, Pad) {
  return parseInt(val, baseSrc).toString(baseDst).padStart(Pad, '0');
}

// Convert register names to ABI names
export function convertRegToAbi(reg) {
  const match = /^[xf](\d+)$/.exec(reg);
  if(match !== null) {
    const floatReg = reg[0] === 'f';
    const regDec = match[1];
    reg = decRegAbi(regDec, floatReg);
  }
  return reg;
}

/**
 * Represents a fragment of the instruction
 * @class
 */
export class Frag {
  constructor(id, asm, bits, field, mem = false) {
    /** Fragment ID (e.g. FRAG.OPC, FRAG.RS1, etc.)
     * @type {Number}
     */
    this.id = id;
    /** Assembly fragment (e.g., 'addi', 'x5', etc.)
     * @type {String}
     */
    this.asm = asm;
    /** Bits fragment (e.g., '00101')
     * @type {String}
     */
    this.bits = bits;
    /** Name of field (e.g., 'opcode', 'rs1', etc.)
     * @type {String}
     */
    this.field = field;
    /** Signals fragment is a memory address
     * @type {Boolean}
     */
    this.mem = mem;
  }
}
