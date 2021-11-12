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

export const OPCODE = {
    RTYPE:  '0110011',
    ITYPE:  '0010011',
    JALR:   '1100111',
    LOAD:   '0000011'
}
