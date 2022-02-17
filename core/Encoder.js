import { Fragment, isShift } from './Instruction.js'
import { BASE, OPERATIONS, OPCODE, FIELD_COMMON,
        FIELD_RTYPE, FIELD_ITYPE, FIELD_STYPE } from './Constants.js'

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
            case "ITYPE":
                this.encodeItype();
                this.format = "ITYPE";
                break;
            case "STYPE":
                this.encodeStype();
                this.format = "STYPE";
                break;
            default:
                throw "invalid operation";
        }
    }

    // Parse instruction into tokens
    parseInstruction() {
        this.tokens = this.assembly.split(/[ ,]+/);
    }

    // Parse load or store instruction into tokens
    parseLoadStoreInstruction() {
        this.tokens = this.assembly.split(/[ ,()]+/);
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

    /**
     * Encodes I-type instruction
     */
     encodeItype() {
        // Get funct3 and opcode / high-order imm bits

        var funct3 = OPERATIONS[this.operation].FUNCT3;
        // SRAI/SRLI have the same opcode (use high-order immediate instead)
        if (this.operation in ["srli", "srai"]) {
            this.opcode = OPCODE.ITYPE;
            highImm = OPERATIONS[this.operation].HIGHIMM;
        } else {
            this.opcode = OPERATIONS[this.operation].OPCODE;
        }

        // Check if operation is a shift
        var shift = isShift(this.operation);

        var reg1;
        var destReg;
        var immediate;

        // Get tokens for instruction
        if (this.opcode == OPCODE.LOAD) {
            this.parseLoadStoreInstruction();
            reg1 = this.tokens[3];
            immediate = this.tokens[2];
        } else {
            this.parseInstruction();
            reg1 = this.tokens[2];
            immediate = this.tokens[3];
        }

        // Get rs1 bits
        var rs1 = convertDecRegister(reg1);

        // Get rd bits
        var destReg = this.tokens[1];
        var rd = convertDecRegister(destReg);

        // Create fragments for each field
        this.fragments.push(new Fragment(this.operation, this.opcode,
                                        FIELD_COMMON.OPCODE.START, "opcode"));
        this.fragments.push(new Fragment(this.operation, funct3,
                                        FIELD_COMMON.FUNCT3.START, "funct3"));
        this.fragments.push(new Fragment(reg1, rs1,
                                        FIELD_COMMON.RS1.START, "rs1"));
        this.fragments.push(new Fragment(destReg, rd,
                                        FIELD_COMMON.RD.START, "rd"));

        if (shift) {
            // Get bits for shift amount
            var shamt = parseDec(immediate).padStart(5, '0');

            // Create higher-order immediate fragment
            this.fragments.push(new Fragment(operation, highImm,
                        FIELD_ITYPE.HIGHIMM.START, "higher-order immediate"));
            // Create shamt fragment
            this.fragments.push(new Fragment(shiftAmt, shamt,
                        FIELD_ITYPE.SHAMT.START, "shamt"));

            // Construct binary instruction
            this.binary = highImm + shamt + rs1 + funct3 + rd + this.opcode;

        } else {
            var immLen = (FIELD_ITYPE.IMM11.END + 1) - FIELD_ITYPE.IMM11.START;
            // Get bits for immediate
            var imm = parseDec(immediate).padStart(immLen, '0');
            // Truncate the beginning of the imm if oversized
            if (imm.length > immLen) {
                imm = imm.substring(imm.length - immLen, imm.length);
            }

            // Create immediate fragment
            this.fragments.push(new Fragment(immediate, imm,
                                FIELD_ITYPE.IMM11.START, "imm[11:0]"));

            // Construct binary instruction
            this.binary = imm + rs1 + funct3 + rd + this.opcode;
        }
    }
    
    /**
     * Encodes S-type instruction
     */
    encodeStype() {
        this.opcode = OPCODE.STYPE;

        // Get funct3 bits
        var funct3 = OPERATIONS[this.operation].FUNCT3;

        // Get tokens for instruction
        this.parseLoadStoreInstruction();
        var reg1 = this.tokens[3];
        var reg2 = this.tokens[1];
        var immediate = this.tokens[2];

        // Get rs1 bits
        var rs1 = convertDecRegister(reg1);
        // Get rs2 bits
        var rs2 = convertDecRegister(reg2);

        // Get bits for immediate
        var imm11Len = (FIELD_STYPE.IMM11.END + 1) - FIELD_STYPE.IMM11.START;
        var imm4Len = (FIELD_STYPE.IMM4.END + 1) - FIELD_STYPE.IMM4.START;
        var imm = parseDec(immediate).padStart(imm11Len + imm4Len, '0');
        var imm11_5 = imm.substring(0, imm11Len);
        var imm4_0 = imm.substring(imm11Len, imm11Len + imm4Len);

        // Create fragments for each field
        this.fragments.push(new Fragment(this.operation, this.opcode,
            FIELD_COMMON.OPCODE.START, "opcode"));
        this.fragments.push(new Fragment(this.operation, funct3,
            FIELD_COMMON.FUNCT3.START, "funct3"));
        this.fragments.push(new Fragment(reg1, rs1,
            FIELD_COMMON.RS1.START, "rs1"));
        this.fragments.push(new Fragment(reg2, rs2,
            FIELD_COMMON.RS2.END, "rs2"));
        this.fragments.push(new Fragment(immediate, imm4_0,
            FIELD_STYPE.IMM4.START, "imm[4:0]"));
        this.fragments.push(new Fragment(immediate, imm11_5,
            FIELD_STYPE.IMM11.START, "imm[11:5]"));

        // Constuct binary instruction
        this.binary = imm11_5 + rs2 + rs1 + funct3 + imm4_0 + this.opcode;
    }
}

// Parse given decimal to binary
function parseDec(decimal) {
    // Check if decimal is a negative number
    if (decimal[0] == '-') {
        return (Number(decimal) >>> 0).toString(BASE.BINARY);
    }
    return Number(decimal).toString(BASE.BINARY);
}

function convertDecRegister(reg) {
    // Remove the 'x' character and convert decimal to binary
    return parseDec(reg.substring(1)).padStart(5,'0');
}
