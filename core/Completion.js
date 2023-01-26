// SPDX-License-Identifier: AGPL-3.0-or-later

/*
 * RISC-V Instruction Encoder/Decoder
 *
 * Copyright (c) 2021-2022 LupLab @ UC Davis
 */

import { Trie } from "./Trie.js";
import { ISA, OPCODE, XLEN_MASK } from "./Constants.js";

// Construct ISA Prefix Tries
export const ISA_TRIE = new Trie();
export const ISA_TRIE_RV32 = new Trie();
export const ISA_TRIE_RV64 = new Trie();
export const ISA_TRIE_RV128 = new Trie();
Object.entries(ISA).forEach(([k,v]) => {
  ISA_TRIE.insertString(k);
  // Conditionally add to ISA-specific tries
  if (v.xlens !== undefined) {
    // Compressed 16-bit instructions
    if (v.xlens & XLEN_MASK.rv32) {
      ISA_TRIE_RV32.insertString(k);
    }
    if (v.xlens & XLEN_MASK.rv64) {
      ISA_TRIE_RV64.insertString(k);
    }
    if (v.xlens & XLEN_MASK.rv128) {
      ISA_TRIE_RV128.insertString(k);
    }

  } else {
    // Standard 32-bit instructions
    const isaXlen = /^RV(\d+)/.exec(v.isa)?.[1];
    switch (isaXlen) {
      case '128':
        ISA_TRIE_RV128.insertString(k);
        break;
      case '64':
        ISA_TRIE_RV128.insertString(k);
        ISA_TRIE_RV64.insertString(k);
        break;
      default:
        ISA_TRIE_RV128.insertString(k);
        ISA_TRIE_RV64.insertString(k);
        ISA_TRIE_RV32.insertString(k);
    }
  }
});

// Default Operand Placeholder String by Opcode
export const CANONICAL_OPERANDS_BY_OPCODE = {
  [OPCODE.SYSTEM]:    '',
  [OPCODE.AUIPC]:     'rd, imm',
  [OPCODE.LUI]:       'rd, imm',
  [OPCODE.BRANCH]:    'rs1, rs2, offset',
  [OPCODE.JAL]:       'rd, offset',
  [OPCODE.JALR]:      'rd, rs1, offset',
  [OPCODE.OP]:        'rd, rs1, rs2',
  [OPCODE.OP_32]:     'rd, rs1, rs2',
  [OPCODE.OP_64]:     'rd, rs1, rs2',
  [OPCODE.OP_FP]:     'frd, frs1, frs2',
  [OPCODE.OP_IMM]:    'rd, rs1, imm',
  [OPCODE.OP_IMM_32]: 'rd, rs1, imm',
  [OPCODE.OP_IMM_64]: 'rd, rs1, imm',
  [OPCODE.LOAD]:      'rd, offset(rs1)',
  [OPCODE.LOAD_FP]:   'frd, offset(rs1)',
  [OPCODE.STORE]:     'rs2, offset(rs1)',
  [OPCODE.STORE_FP]:  'frs2, offset(rs1)',
  [OPCODE.MISC_MEM]:  'iorw, iorw',
  [OPCODE.AMO]:       'rd, rs2, (rs1)',
  [OPCODE.MADD]:      'frd, frs1, frs2, frs3',
  [OPCODE.MSUB]:      'frd, frs1, frs2, frs3',
  [OPCODE.NMSUB]:     'frd, frs1, frs2, frs3',
  [OPCODE.NMADD]:     'frd, frs1, frs2, frs3',
}

// Instruction mnemonic regex paird with canonical operand strings
const CANONICAL_OPERANDS_EXCEPTIONS_REGEX = [
  [/^lq$/,                   'rd, offset(rs1)'],
  [/^lr\./,                  'rd, (rs1)'],
  [/^csr/,                   'rd, csr, rs1'],
  [/^fence\.i/,              ''],
  [/^fsqrt\./,               'frd, frs1'],
  [/^fclass\./,              'rd, frs1'],
  [/^fmv\.x/,                'rd, frs1'],
  [/^fmv\.[wdq]/,            'frd, rs1'],
  [/^fcvt\.[wlt]/,           'rd, frs1'],
  [/^fcvt\.[sdq]\.[wlt]/,    'frd, rs1'],
  [/^fcvt\.[sdq]\.[sdq]/,    'frd, frs1'],
];

// C Instruction mnemonics mapped to canonical operand strings
const CANONICAL_OPERANDS_C_INSTRUCTIONS = {
  'c.lwsp':     'rd≠0, uimm',
  'c.ldsp':     'rd≠0, uimm',
  'c.lqsp':     'rd≠0, uimm',
  'c.flwsp':    'frd, uimm',
  'c.fldsp':    'frd, uimm',
  'c.swsp':     'rs2, uimm',
  'c.sdsp':     'rs2, uimm',
  'c.sqsp':     'rs2, uimm',
  'c.fswsp':    'frs2, uimm',
  'c.fsdsp':    'frs2, uimm',
  'c.lw':       'rd\', uimm(rs\')',
  'c.ld':       'rd\', uimm(rs\')',
  'c.lq':       'rd\', uimm(rs\')',
  'c.flw':      'frd\', uimm(rs1\')',
  'c.fld':      'frd\', uimm(rs1\')',
  'c.sw':       'rs2\', uimm(rs1\')',
  'c.sd':       'rs2\', uimm(rs1\')',
  'c.sq':       'rs2\', uimm(rs1\')',
  'c.fsw':      'frs2\', uimm(rs1\')',
  'c.fsd':      'frs2\', uimm(rs1\')',
  'c.j':        'imm',
  'c.jal':      'imm',
  'c.jr':       'rs1',
  'c.jalr':     'rs1',
  'c.beqz':     'rs1\', imm',
  'c.bnez':     'rs1\', imm',
  'c.li':       'rd≠0, nzimm',
  'c.lui':      'rd≠{0,2}, nzimm',
  'c.addi':     'rd/rs1≠0, nzimm',
  'c.addiw':    'rd/rs1≠0, imm',
  'c.addi16sp': 'nzimm',
  'c.slli':     'rd/rs1≠0, nzuimm',
  'c.slli64':   'rd/rs1≠0',
  'c.addi4spn': 'rd\', nzuimm',
  'c.srli':     'rd\'/rs1\', nzuimm',
  'c.srli64':   'rd\'/rs1\'',
  'c.srai':     'rd\'/rs1\', nzuimm',
  'c.srai64':   'rd\'/rs1\'',
  'c.andi':     'rd\'/rs1\', imm',
  'c.mv':       'rd≠0, rs2≠0',
  'c.add':      'rd/rs1≠0, rs2≠0',
  'c.and':      'rd\'/rs1\', rs2\'',
  'c.or':       'rd\'/rs1\', rs2\'',
  'c.xor':      'rd\'/rs1\', rs2\'',
  'c.sub':      'rd\'/rs1\', rs2\'',
  'c.subw':     'rd\'/rs1\', rs2\'',
  'c.addw':     'rd\'/rs1\', rs2\'',
  'c.nop':      '',
  'c.ebreak':   '',
}

// Construct final mapping from mnemonics to canonical operands
export const CANONICAL_OPERANDS = (() => {
  let canonOprs = {};

  const cRegex = /c\./;
  for (const [mne, inst] of Object.entries(ISA)) {
    if (cRegex.test(mne)) {
      // C Instruction, skip and then just combine with dedicated object
      continue;
    }

    // Test mne against exception regexs
    let foundException = false;
    for (const [rgx, oprs] of CANONICAL_OPERANDS_EXCEPTIONS_REGEX) {
      if (rgx.test(mne)) {
        canonOprs[mne] = oprs;
        foundException = true;
        break;
      }
    }

    // No exception, just use opcode
    if (!foundException) {
      canonOprs[mne] = CANONICAL_OPERANDS_BY_OPCODE[inst.opcode];
    }
  }

  // Finally, combin with C instructions
  Object.assign(canonOprs, CANONICAL_OPERANDS_C_INSTRUCTIONS);

  // Return result
  return canonOprs;
})();