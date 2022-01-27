import { Fragment } from './Instruction.js'
import { BASE, OPERATIONS, OPCODE, FIELD_COMMON,
        FIELD_RTYPE } from './Constants.js'

export class Encoder {
    /**
     * Creates an Encoder to convert an assembly instruction to binary
     * @param {String} assembly
     */
    constructor(assembly) {
        this.assembly = assembly;

        // Create an array of fragments
        /** @type {Fragment[]} */
        this.fragments = [];

        // Convert assembly instruction to binary
        this.convertAsmToBin();
    }

    // Convert assembly instruction to binary
    convertAsmToBin() {
        // Set all characters to lower case
        this.assembly = this.assembly.toLowerCase();
        // The first word of the assembly instruction is the opcode
        this.operation = this.assembly.split(" ")[0];

        switch(OPERATIONS[this.operation].TYPE) {
            case "RTYPE":
                this.encodeRtype();
                this.format = "RTYPE";
                break;
            default:
                throw "invalid operation";
        }
    }

    // Parse instruction into tokens
    parseInstruction() {
        this.tokens = this.assembly.split(/[ ,]+/);
    }

    /**
     * Encodes R-type instruction
     */
    encodeRtype() {
        // Get opcode for RTYPE
        this.opcode = OPCODE.RTYPE;

        // Get tokens for instruction
        this.parseInstruction();

        // Get funct3 bits
        var funct3 = OPERATIONS[this.operation].FUNCT3;

        // Get funct7 bits
        var funct7 = OPERATIONS[this.operation].FUNCT7;

        // Get rs1 bits
        var reg1 = this.tokens[2];
        var rs1 = convertDecRegister(reg1);

        // Get rs2 bits
        var reg2 = this.tokens[3];
        var rs2 = convertDecRegister(reg2);

        // Get rd bits
        var destReg = this.tokens[1];
        var rd = convertDecRegister(destReg);

        // Create fragments for each field
        this.fragments.push(new Fragment(this.operation, this.opcode,
                    FIELD_COMMON.OPCODE.START, "opcode"));
        this.fragments.push(new Fragment(this.operation, funct3,
                    FIELD_COMMON.FUNCT3.START, "funct3"));
        this.fragments.push(new Fragment(this.operation, funct7,
                    FIELD_RTYPE.FUNCT7.START, "funct7"));
        this.fragments.push(new Fragment(reg1, rs1,
                    FIELD_COMMON.RS1.START, "rs1"));
        this.fragments.push(new Fragment(reg2, rs2,
                    FIELD_COMMON.RS2.START, "rs2"));
        this.fragments.push(new Fragment(destReg, rd,
                    FIELD_COMMON.RD.START, "rd"));

        // Construct binary instruction
        this.binary = funct7 + rs2 + rs1 + funct3 + rd + this.opcode;
    }
}

// Parse given decimal to binary
function parseDec(decimal) {
    return Number(decimal).toString(BASE.BINARY);
}

function convertDecRegister(reg) {
    // Remove the 'x' character and convert decimal to binary
    return parseDec(reg.substring(1)).padStart(5,'0');
}
