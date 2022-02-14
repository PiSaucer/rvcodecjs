export const BASE = {
    BINARY: 2,
    HEX: 16
}

// XLEN: width of an integer register in bits
export const XLEN = {
    RV32: 32
}

// Start and end indices of shared fields
export const FIELD_COMMON = {
    OPCODE: {
        START: 0,
        END: 6
    },

    RD: {
        START: 7,
        END: 11
    },

    FUNCT3: {
        START: 12,
        END: 14
    },

    RS1: {
        START: 15,
        END: 19
    },

    RS2: {
        START: 20,
        END: 24
    }
}

// Start and end indices of R-TYPE fields
export const FIELD_RTYPE = {
    FUNCT7: {
        START: 25,
        END: 31
    }
}

// Start and end indices of I-TYPE fields
export const FIELD_ITYPE = {
    HIGHIMM: {
        START: 25,
        END: 31
    },

    SHAMT: {
        START: 20,
        END: 24
    },

    IMM11: {
        START: 20,
        END: 31
    }
}

// Start and end indices of S-TYPE fields
export const FIELD_STYPE = {
    IMM4: {
        START: 7,
        END: 11
    },

    IMM11: {
        START: 25,
        END: 31
    }
}

// Start and end indices of B-TYPE fields
export const FIELD_BTYPE = {
    IMM4: {
        START: 8,
        END: 11
    },

    IMM11: {
        START: 7,
        END: 7
    },

    IMM10: {
        START: 25,
        END: 30
    },

    IMM12: {
        START: 31,
        END: 31
    }
}

// Start and end indices of U-TYPE fields
export const FIELD_UTYPE = {
    IMM31: {
        START: 12,
        END: 31
    }
}

// Start and end indices of J-TYPE fields
export const FIELD_JTYPE = {
    IMM20: {
        START: 31,
        END: 31
    },

    IMM10: {
        START: 21,
        END: 30
    },

    IMM11: {
        START: 20,
        END: 20
    },

    IMM19: {
        START: 12,
        END: 19
    }
}

export const FIELD_SYSTEM = {
    FUNCT12: {
        START: 20,
        END: 31
    }
}

export const FIELD_FENCE = {
    PRED: {
        START: 24,
        END: 27
    },

    SUCC: {
        START: 20,
        END: 23
    },

    FM: {
        START: 28,
        END: 31
    }
}

export const OPERATIONS = {
    add:    { TYPE: "RTYPE", FUNCT3: "000", FUNCT7: "0000000" },
    sub:    { TYPE: "RTYPE", FUNCT3: "000", FUNCT7: "0100000" },
    sll:    { TYPE: "RTYPE", FUNCT3: "001", FUNCT7: "0000000" },
    slt:    { TYPE: "RTYPE", FUNCT3: "010", FUNCT7: "0000000" },
    sltu:   { TYPE: "RTYPE", FUNCT3: "011", FUNCT7: "0000000" },
    xor:    { TYPE: "RTYPE", FUNCT3: "100", FUNCT7: "0000000" },
    srl:    { TYPE: "RTYPE", FUNCT3: "101", FUNCT7: "0000000" },
    sra:    { TYPE: "RTYPE", FUNCT3: "101", FUNCT7: "0100000" },
    or:     { TYPE: "RTYPE", FUNCT3: "110", FUNCT7: "0000000" },
    and:    { TYPE: "RTYPE", FUNCT3: "111", FUNCT7: "0000000" }
}

export const OPCODE = {
    RTYPE:  '0110011',
    ITYPE:  '0010011',
    JALR:   '1100111',
    LOAD:   '0000011',
    STYPE:  '0100011',
    BTYPE:  '1100011',
    LUI:    '0110111',
    AUIPC:  '0010111',
    JTYPE:  '1101111',
    SYSTEM: '1110011',
    FENCE:  '0001111'
}
