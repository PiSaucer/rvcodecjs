// SPDX-License-Identifier: AGPL-3.0-or-later

/*
 * RISC-V Instruction Encoder/Decoder
 *
 * Copyright (c) 2021-2022 LupLab @ UC Davis
 */

// creates an enum object from an array of string names
function makeEnum(names) {
  return Object.freeze(
    names.reduce((o, n) => {
      o[n] = Symbol(n);
      return o;
    }, {})
  );
}

/*
 * Configuration field types
 */
export const CONFIG_TYPE = makeEnum(
  ['BOOL', 'CHOOSE_ONE']
);

/*
 * Configuration options enums
 */
export const COPTS_ISA = makeEnum(
  ['AUTO', 'RV32I', 'RV64I', 'RV128I']
);

/**
 * Configuration options
 * - maps config field name to:
 *   - type: type of the configuration field (see CONFIG_TYPE)
 *   - opts: list of the possible values for the field
 *     - ignored for 'CONFIG_TYPE.BOOL'
 *   - default: default value, inferred as first value in 'opts'
 */
export const configFields = {
  ISA: { name: 'ISA', type: CONFIG_TYPE.CHOOSE_ONE, opts: Object.values(COPTS_ISA) },
  ABI: { name: 'ABI', type: CONFIG_TYPE.BOOL,       default: false },
}

/**
 * Default configuration
 * - if no default defined, then constructed
 *   from the first option in `opts`
 */
export const configDefault = Object.freeze(
  Object.fromEntries(
    Object.entries(configFields).map(
      ([k,v]) => [k, (v.default ?? v.opts[0])]
)));
